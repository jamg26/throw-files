// Drop-in replacement for the socketio-file-upload library.
// Exposes the same addEventListener/removeEventListener/submitFiles API so
// home/index.tsx requires only import changes, not logic changes.
//
// File chunk binary protocol (same as worker/channel.ts):
//   [uint32 big-endian: header byte length][header JSON][chunk bytes]

import type { ThrowSocket } from "./throw-socket";

interface FileDescriptor {
  id: string;
  name: string;
  size: number;
  type: string;
  meta: {
    channel: string;
    type: string;
    size: number;
    id: string;
    compressed: boolean;
  };
}

// Files passed to submitFiles may carry a custom meta property (set in handleFiles
// for zip bundles).
type CustomFile = File & {
  meta?: { compressed?: boolean; channel?: string };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandler = (event: any) => void;

/**
 * Generate a cryptographically secure file ID using Web Crypto API.
 * Replaces Math.random() which is predictable and can produce collisions.
 */
function generateFileId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map((b) => b.toString(36).padStart(2, "0")).join("");
}

class ThrowFileUpload {
  socket: ThrowSocket;
  maxFileSize = 0; // 0 = unlimited; set by component (e.g. 5 GB)
  chunkSize = 1024 * 1024; // default 1 MB; overridden per-file by startHandler

  private listeners: Map<string, AnyHandler[]> = new Map();

  // Tracks cleanup timers for partially-received files (sender disconnect)
  private staleBuffers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(socket: ThrowSocket) {
    this.socket = socket;
  }

  // The component wires up its own onChange/paste handlers, so this is a no-op.
  listenOnInput(_input: HTMLElement | null): void {}

  addEventListener(type: string, handler: AnyHandler): void {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type)!.push(handler);
  }

  removeEventListener(type: string, handler: AnyHandler): void {
    const list = this.listeners.get(type);
    if (list) this.listeners.set(type, list.filter((h) => h !== handler));
  }

  private dispatch(type: string, payload: object): void {
    (this.listeners.get(type) ?? []).forEach((h) => h(payload));
  }

  submitFiles(files: File[] | FileList): void {
    Array.from(files as FileList).forEach((f) =>
      this.uploadFile(f as CustomFile),
    );
  }

  private setStaleCleanup(fileId: string): void {
    // If sender disconnects mid-transfer, clean up the buffer after 60 s
    const existing = this.staleBuffers.get(fileId);
    if (existing !== undefined) clearTimeout(existing);
    const timer = setTimeout(() => {
      // Note: buffersRef is on the component side; we just log here
      console.warn(`[ThrowFileUpload] file ${fileId} timed out — no file-done received`);
      this.staleBuffers.delete(fileId);
    }, 60_000);
    this.staleBuffers.set(fileId, timer);
  }

  private clearStaleCleanup(fileId: string): void {
    const timer = this.staleBuffers.get(fileId);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.staleBuffers.delete(fileId);
    }
  }

  private async uploadFile(file: CustomFile): Promise<void> {
    // File size check (code 1 matches the siofu error code the component handles)
    if (this.maxFileSize > 0 && file.size > this.maxFileSize) {
      this.dispatch("error", { code: 1 });
      return;
    }

    const id = generateFileId();
    // Arm stale-cleanup timer (cancelled when file-done or complete fires)
    this.setStaleCleanup(id);

    const descriptor: FileDescriptor = {
      id,
      name: file.name,
      size: file.size,
      type: file.type,
      meta: {
        channel: file.meta?.channel ?? "",
        type: file.type,
        size: file.size,
        id,
        compressed: file.meta?.compressed ?? false,
      },
    };

    // Fire "start" — the handler in home/index.tsx mutates descriptor.meta.channel
    // and sets this.chunkSize. Both are read AFTER dispatch() returns (synchronous).
    this.dispatch("start", { file: descriptor });

    // Notify server and channel peers that a file transfer is beginning.
    this.socket.emit("file-start", {
      id: descriptor.id,
      name: descriptor.name,
      fileType: descriptor.type,
      size: descriptor.size,
      compressed: descriptor.meta.compressed,
    });

    // Stream chunks
    let offset = 0;
    while (offset < file.size) {
      const slice = file.slice(offset, offset + this.chunkSize);
      let chunkBuffer: ArrayBuffer;
      try {
        chunkBuffer = await this.readAsArrayBuffer(slice);
      } catch (err) {
        console.error("[ThrowFileUpload] failed to read chunk:", err);
        return;
      }

      const headerJson = JSON.stringify({
        type: "file-chunk",
        id: descriptor.id,
        channel: descriptor.meta.channel,
        name: descriptor.name,
        fileType: descriptor.type,
        size: descriptor.size,
        compressed: descriptor.meta.compressed,
      });
      const headerBytes = new TextEncoder().encode(headerJson);

      // [4 bytes header length][header bytes][chunk bytes]
      const frame = new ArrayBuffer(
        4 + headerBytes.byteLength + chunkBuffer.byteLength,
      );
      new DataView(frame).setUint32(0, headerBytes.byteLength, false);
      new Uint8Array(frame, 4, headerBytes.byteLength).set(headerBytes);
      new Uint8Array(frame, 4 + headerBytes.byteLength).set(
        new Uint8Array(chunkBuffer),
      );

      // Back-pressure: wait for the WebSocket send buffer to drain before
      // queuing the next chunk.  Prevents memory blow-up on slow / mobile
      // connections where the sender can produce data faster than the network
      // can consume it.
      const MAX_BUFFERED = 4 * 1024 * 1024; // 4 MB
      while (this.socket.bufferedAmount > MAX_BUFFERED) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      this.socket.sendBinary(frame);

      offset += chunkBuffer.byteLength;

      this.dispatch("progress", {
        bytesLoaded: offset,
        file: { id: descriptor.id, size: file.size },
      });
    }

    // Signal end-of-file to server and all receivers.
    this.socket.emit("file-done", {
      id: descriptor.id,
      name: descriptor.name,
      fileType: descriptor.type,
    });

    this.clearStaleCleanup(id);
    this.dispatch("complete", { file: descriptor });
  }

  private readAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target!.result as ArrayBuffer);
      reader.onerror = (e) => {
        console.error("[ThrowFileUpload] FileReader error:", e);
        reject(e);
      };
      reader.readAsArrayBuffer(blob);
    });
  }
}

export default ThrowFileUpload;