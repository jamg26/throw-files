// Native WebSocket wrapper that replaces socket.io-client.
// Provides the same on/off/emit API used in home/index.tsx and maps
// the server's JSON message types to the existing socket event names
// (e.g. "connections-ABC123", "done-ABC123", etc.).
//
// Binary frames carry file chunks and use a length-prefixed JSON header:
//   [uint32 big-endian: header byte length][header JSON][chunk bytes]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventHandler = (data?: any) => void;

const BACKEND_URL: string =
  (window as { ENV?: { REACT_APP_BACKEND_URL?: string } }).ENV
    ?.REACT_APP_BACKEND_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  "http://localhost:5000";

const WS_URL = BACKEND_URL.replace(/^http/, "ws");

export class ThrowSocket {
  private ws: WebSocket | null = null;
  private handlers: Map<string, EventHandler[]> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private alive = true;
  private sendQueue: (string | ArrayBuffer)[] = [];

  constructor() {
    this.connect();
  }

  private connect(): void {
    const ws = new WebSocket(WS_URL);
    ws.binaryType = "arraybuffer";
    this.ws = ws;

    ws.onopen = () => {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      // Flush any messages that were emitted before the connection opened.
      this.sendQueue.forEach((msg) => ws.send(msg));
      this.sendQueue = [];
      // Let the component know so it can re-join the channel after a reconnect.
      this.fire("connect");
    };

    ws.onmessage = (event: MessageEvent) => {
      if (event.data instanceof ArrayBuffer) {
        this.handleBinary(event.data);
      } else {
        try {
          const msg = JSON.parse(event.data as string) as {
            type: string;
            channel?: string;
            [k: string]: unknown;
          };
          this.dispatchMsg(msg);
        } catch {}
      }
    };

    ws.onclose = () => {
      if (this.alive) {
        this.reconnectTimer = setTimeout(() => this.connect(), 2000);
      }
    };

    ws.onerror = () => ws.close();
  }

  // Binary file chunk — relay to the registered channel handler.
  private handleBinary(data: ArrayBuffer): void {
    try {
      const view = new DataView(data);
      const headerLen = view.getUint32(0, false);
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
      const chunkBytes = data.slice(4 + headerLen);

      // Fires the event named after the channel (matches socket.on(channel, handler))
      this.fire(header.channel, {
        id: header.id,
        name: header.name,
        type: header.fileType,
        size: header.size,
        compressed: header.compressed,
        file: chunkBytes,
      });
    } catch {}
  }

  // Map server message types → existing socket event names.
  private dispatchMsg(msg: {
    type: string;
    channel?: string;
    [k: string]: unknown;
  }): void {
    const ch = (msg.channel as string) || "";
    switch (msg.type) {
      case "channel-joined":
        this.fire(`channel-join-${ch}`, msg.message);
        break;
      case "user-joined":
        this.fire(`join-${ch}`, "true");
        break;
      case "connections":
        this.fire(`connections-${ch}`, msg.count);
        break;
      case "file-incoming":
        this.fire(`receiving-${ch}`, { name: msg.name });
        break;
      case "file-done":
        this.fire(`done-${ch}`, {
          file_id: msg.id,
          file_name: msg.name,
          type: msg.fileType,
        });
        break;
    }
  }

  private fire(event: string, data?: unknown): void {
    (this.handlers.get(event) ?? []).forEach((h) => h(data));
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
    if (list) this.handlers.set(event, list.filter((h) => h !== handler));
  }

  // Mirrors socket.emit(event, data) — maps to the JSON protocol.
  emit(event: string, data?: unknown): void {
    let payload: object;
    if (event === "channel-join") {
      payload = { type: "channel-join", channel: data };
    } else if (event === "channel-change") {
      payload = { type: "channel-change", ...(data as object) };
    } else {
      payload = {
        type: event,
        ...(data && typeof data === "object" ? data : {}),
      };
    }
    const msg = JSON.stringify(payload);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(msg);
    } else {
      // Queue the message — flushed in onopen once the connection is established.
      this.sendQueue.push(msg);
    }
  }

  // Send a raw binary frame (file chunk).
  sendBinary(data: ArrayBuffer): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      this.sendQueue.push(data);
    }
  }

  disconnect(): void {
    this.alive = false;
    this.ws?.close();
  }
}

// Module-level singleton — matches the existing `const socket = io(...)` pattern.
export const socket = new ThrowSocket();
