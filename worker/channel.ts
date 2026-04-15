interface Attachment {
  channel: string | null;
}

interface ChunkHeader {
  type: "file-chunk";
  id: string;
  channel: string;
  name: string;
  fileType: string;
  size: number;
  compressed: boolean;
}

// Durable Object that manages all WebSocket connections across all channels.
// Uses the WebSocket Hibernation API so the DO can sleep between messages,
// eliminating the per-second billing of a persistent container.
//
// All channel state is ephemeral — user counts are derived from live WebSocket
// attachments, so nothing needs to be written to storage.
export class ThrowFilesChannel {
  private ctx: DurableObjectState;

  // 5 GB max file size
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024;
  // Valid channel: 4–8 uppercase alphanumeric chars
  private static readonly CHANNEL_RE = /^[A-Z0-9]{4,8}$/;

  constructor(ctx: DurableObjectState) {
    this.ctx = ctx;
    // Auto-respond to "ping" keepalives without waking the DO.
    this.ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair("ping", "pong"),
    );
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket upgrade", { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ channel: null } satisfies Attachment);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(
    ws: WebSocket,
    message: string | ArrayBuffer,
  ): Promise<void> {
    if (message instanceof ArrayBuffer) {
      // Binary frame = file chunk. Format: [uint32 header_len][header JSON][chunk].
      // Read the channel from the sender's attachment and relay as-is.
      const { channel } = (ws.deserializeAttachment() as Attachment) ?? {};
      if (!channel) return;

      // Bounds check: header len must fit within the frame
      if (4 + headerLen > message.byteLength) return;

      // Validate the frame header channel matches the sender's channel
      try {
        const view = new DataView(message);
        const headerLen = view.getUint32(0, false);
        const header = JSON.parse(
          new TextDecoder().decode(message.slice(4, 4 + headerLen)),
        ) as ChunkHeader;
        if (header.channel !== channel) return;
        // Enforce file size limit
        if (header.size > ThrowFilesChannel.MAX_FILE_SIZE) return;
      } catch {
        return;
      }

      this.relayBinary(channel, message, ws);
      return;
    }

    let msg: { type: string; [key: string]: unknown };
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }

    switch (msg.type) {
      case "channel-join":
        this.handleChannelJoin(ws, msg.channel as string);
        break;
      case "channel-change":
        this.handleChannelChange(
          ws,
          msg.previousChannel as string,
          msg.newChannel as string,
        );
        break;
      case "file-start":
        this.handleFileStart(ws, msg as unknown as { id: string; name: string });
        break;
      case "file-done":
        this.handleFileDone(
          ws,
          msg as unknown as { id: string; name: string; fileType: string },
        );
        break;
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const { channel } = (ws.deserializeAttachment() as Attachment) ?? {};
    if (channel) this.broadcastConnections(channel);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    const { channel } = (ws.deserializeAttachment() as Attachment) ?? {};
    if (channel) this.broadcastConnections(channel);
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  private handleChannelJoin(ws: WebSocket, channel: string): void {
    if (!ThrowFilesChannel.CHANNEL_RE.test(channel)) return;
    ws.serializeAttachment({ channel } satisfies Attachment);
    this.broadcast(channel, { type: "user-joined", channel }, ws);
    ws.send(
      JSON.stringify({
        type: "channel-joined",
        channel,
        message: "Successfully connected.",
      }),
    );
    this.broadcastConnections(channel);
  }

  private handleChannelChange(
    ws: WebSocket,
    previousChannel: string,
    newChannel: string,
  ): void {
    ws.serializeAttachment({ channel: newChannel } satisfies Attachment);
    if (previousChannel) this.broadcastConnections(previousChannel);
    this.broadcast(newChannel, { type: "user-joined", channel: newChannel }, ws);
    ws.send(
      JSON.stringify({
        type: "channel-joined",
        channel: newChannel,
        message: "Successfully connected.",
      }),
    );
    this.broadcastConnections(newChannel);
  }

  private handleFileStart(
    ws: WebSocket,
    data: { id: string; name: string },
  ): void {
    const { channel } = (ws.deserializeAttachment() as Attachment) ?? {};
    if (!channel) return;
    this.broadcast(
      channel,
      { type: "file-incoming", channel, id: data.id, name: data.name },
      ws,
    );
  }

  private handleFileDone(
    ws: WebSocket,
    data: { id: string; name: string; fileType: string },
  ): void {
    const { channel } = (ws.deserializeAttachment() as Attachment) ?? {};
    if (!channel) return;
    this.broadcast(
      channel,
      {
        type: "file-done",
        channel,
        id: data.id,
        name: data.name,
        fileType: data.fileType,
      },
      ws,
    );
  }

  // ── Broadcast helpers ─────────────────────────────────────────────────────

  private channelSockets(channel: string, exclude?: WebSocket): WebSocket[] {
    return this.ctx.getWebSockets().filter((client) => {
      if (client === exclude) return false;
      const att = client.deserializeAttachment() as Attachment;
      return att?.channel === channel;
    });
  }

  private broadcast(
    channel: string,
    payload: object,
    exclude?: WebSocket,
  ): void {
    const msg = JSON.stringify(payload);
    for (const client of this.channelSockets(channel, exclude)) {
      try {
        client.send(msg);
      } catch {}
    }
  }

  private relayBinary(
    channel: string,
    data: ArrayBuffer,
    exclude?: WebSocket,
  ): void {
    for (const client of this.channelSockets(channel, exclude)) {
      try {
        client.send(data);
      } catch {}
    }
  }

  private broadcastConnections(channel: string): void {
    const count = this.ctx
      .getWebSockets()
      .filter((ws) => (ws.deserializeAttachment() as Attachment)?.channel === channel)
      .length;
    const msg = JSON.stringify({ type: "connections", channel, count });
    for (const client of this.ctx.getWebSockets()) {
      const att = client.deserializeAttachment() as Attachment;
      if (att?.channel === channel) {
        try {
          client.send(msg);
        } catch {}
      }
    }
  }
}
