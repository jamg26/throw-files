// Native WebSocket wrapper.
//
// One connection per channel: the channel code travels in the upgrade URL, so
// the server knows which Durable Object to route to and membership exists the
// instant the socket opens. Switching channels reconnects.
//
// Binary frames carry file chunks with a length-prefixed JSON header:
//   [uint32 big-endian: header byte length][header JSON][chunk bytes]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventHandler = (data?: any) => void;

type OutboundEvent = "file-start" | "file-done" | "file-abort";

export type ConnectionState =
  | "idle"
  | "connecting"
  | "open"
  | "reconnecting"
  | "failed";

const BACKEND_URL: string =
  (window as { ENV?: { REACT_APP_BACKEND_URL?: string } }).ENV
    ?.REACT_APP_BACKEND_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8787"
    : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`);

const WS_BASE = BACKEND_URL.replace(/^http/, "ws").replace(/\/$/, "");

const PING_INTERVAL_MS = 25_000;
const MAX_RECONNECT_ATTEMPTS = 10;

export class ThrowSocket {
  private ws: WebSocket | null = null;
  private channel: string | null = null;
  private handlers: Map<string, EventHandler[]> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private intentionallyClosed = false;
  /** Control messages only — file data is never queued (see sendBinary). */
  private controlQueue: string[] = [];
  private reconnectAttempts = 0;
  private state: ConnectionState = "idle";

  get connectionState(): ConnectionState {
    return this.state;
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get currentChannel(): string | null {
    return this.channel;
  }

  /** Bytes sitting in the underlying send buffer (upload back-pressure). */
  get bufferedAmount(): number {
    return this.ws?.bufferedAmount ?? 0;
  }

  /** Connect to `channel`, or switch to it if already connected elsewhere. */
  setChannel(channel: string): void {
    if (this.channel === channel && this.ws) return;
    this.channel = channel;
    this.reconnectAttempts = 0;
    this.teardown();
    this.connect();
  }

  disconnect(): void {
    this.intentionallyClosed = true;
    this.teardown();
    this.setState("idle");
  }

  private teardown(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    this.controlQueue = [];
    const ws = this.ws;
    this.ws = null;
    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onclose = null;
      ws.onerror = null;
      try {
        ws.close(1000, "client closing");
      } catch {
        /* already closed */
      }
    }
  }

  private setState(state: ConnectionState): void {
    if (this.state === state) return;
    this.state = state;
    this.fire("state", state);
  }

  private connect(): void {
    if (!this.channel) return;
    this.intentionallyClosed = false;
    this.setState(this.reconnectAttempts > 0 ? "reconnecting" : "connecting");

    const ws = new WebSocket(
      `${WS_BASE}/?channel=${encodeURIComponent(this.channel)}`,
    );
    ws.binaryType = "arraybuffer";
    this.ws = ws;

    ws.onopen = () => {
      if (this.ws !== ws) return;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      this.reconnectAttempts = 0;
      this.setState("open");

      // Announce ourselves so the DO can greet us and publish the member count.
      // It cannot do that during the upgrade, because a send() issued before the
      // 101 is returned is not guaranteed to be delivered.
      ws.send(JSON.stringify({ type: "hello" }));

      const queued = this.controlQueue;
      this.controlQueue = [];
      queued.forEach((msg) => ws.send(msg));

      // Keeps intermediaries from reaping an idle socket. The Durable Object
      // auto-responds to "ping" without waking, so this is close to free.
      this.pingTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send("ping");
      }, PING_INTERVAL_MS);
    };

    ws.onmessage = (event: MessageEvent) => {
      if (event.data === "pong") return;
      if (event.data instanceof ArrayBuffer) {
        this.handleBinary(event.data);
        return;
      }
      try {
        this.dispatchMsg(
          JSON.parse(event.data as string) as {
            type: string;
            [k: string]: unknown;
          },
        );
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      if (this.ws !== ws) return;
      if (this.pingTimer) {
        clearInterval(this.pingTimer);
        this.pingTimer = null;
      }
      this.ws = null;

      // Anything mid-flight is now unrecoverable — the receiver's byte offset
      // no longer lines up with ours. Tell the app so it can fail the transfer
      // loudly instead of producing a truncated download.
      this.fire("disconnected");

      if (this.intentionallyClosed) return;

      if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        this.setState("failed");
        return;
      }
      this.reconnectAttempts++;
      this.setState("reconnecting");
      const backoff = Math.min(
        1000 * Math.pow(2, this.reconnectAttempts - 1),
        30_000,
      );
      // Jitter avoids a synchronised reconnect stampede.
      this.reconnectTimer = setTimeout(
        () => this.connect(),
        backoff + Math.random() * 1000,
      );
    };

    ws.onerror = () => {
      try {
        ws.close();
      } catch {
        /* already closing */
      }
    };
  }

  private handleBinary(data: ArrayBuffer): void {
    try {
      if (data.byteLength < 4) return;

      const headerLen = new DataView(data).getUint32(0, false);
      if (headerLen === 0 || headerLen > data.byteLength - 4) {
        console.error("Binary frame header length out of range");
        return;
      }

      const header = JSON.parse(
        new TextDecoder().decode(data.slice(4, 4 + headerLen)),
      ) as {
        channel: string;
        id: string;
        name: string;
        fileType: string;
        size: number;
        compressed: boolean;
      };

      if (!header.id || header.channel !== this.channel) return;

      this.fire("chunk", {
        id: header.id,
        name: header.name,
        type: header.fileType,
        size: header.size,
        compressed: header.compressed,
        file: data.slice(4 + headerLen),
      });
    } catch (error) {
      console.error("Failed to handle binary message:", error);
    }
  }

  private dispatchMsg(msg: { type: string; [k: string]: unknown }): void {
    switch (msg.type) {
      case "channel-joined":
        this.fire("joined", msg.message);
        break;
      case "user-joined":
        this.fire("peer-joined");
        break;
      case "connections":
        this.fire("connections", msg.count);
        break;
      case "file-incoming":
        this.fire("file-incoming", {
          id: msg.id,
          name: msg.name,
          size: msg.size,
        });
        break;
      case "file-done":
        this.fire("file-done", {
          id: msg.id,
          name: msg.name,
          type: msg.fileType,
          size: msg.size,
        });
        break;
      case "file-abort":
        this.fire("file-abort", { id: msg.id, name: msg.name });
        break;
    }
  }

  private fire(event: string, data?: unknown): void {
    // Copy first: a handler may unsubscribe during iteration.
    [...(this.handlers.get(event) ?? [])].forEach((h) => h(data));
  }

  on(event: string, handler: EventHandler): void {
    if (!this.handlers.has(event)) this.handlers.set(event, []);
    this.handlers.get(event)!.push(handler);
  }

  off(event: string, handler?: EventHandler): void {
    if (!handler) {
      this.handlers.delete(event);
      return;
    }
    const list = this.handlers.get(event);
    if (list) {
      this.handlers.set(
        event,
        list.filter((h) => h !== handler),
      );
    }
  }

  emit(event: OutboundEvent, data?: Record<string, unknown>): void {
    const msg = JSON.stringify({ type: event, ...(data ?? {}) });
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(msg);
    } else {
      this.controlQueue.push(msg);
    }
  }

  /**
   * Send a file chunk. Returns false if it could not go out right now.
   *
   * Chunks are deliberately never queued: a frame buffered across a reconnect
   * arrives at a receiver whose byte offset has moved on, which is exactly how
   * silently corrupt downloads used to happen.
   */
  sendBinary(data: ArrayBuffer): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) return false;
    try {
      this.ws.send(data);
      return true;
    } catch (error) {
      console.error("Failed to send binary data:", error);
      return false;
    }
  }
}

// Module-level singleton. Idle until the app calls setChannel(), so visiting
// /privacy-policy no longer opens a pointless socket.
export const socket = new ThrowSocket();
