var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/channel.ts
var ThrowFilesChannel = class {
  static {
    __name(this, "ThrowFilesChannel");
  }
  ctx;
  constructor(ctx) {
    this.ctx = ctx;
    this.ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair("ping", "pong")
    );
  }
  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket upgrade", { status: 426 });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ channel: null });
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(ws, message) {
    if (message instanceof ArrayBuffer) {
      const { channel } = ws.deserializeAttachment() ?? {};
      if (!channel) return;
      try {
        const view = new DataView(message);
        const headerLen = view.getUint32(0, false);
        const header = JSON.parse(
          new TextDecoder().decode(message.slice(4, 4 + headerLen))
        );
        if (header.channel !== channel) return;
      } catch {
        return;
      }
      this.relayBinary(channel, message, ws);
      return;
    }
    let msg;
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }
    switch (msg.type) {
      case "channel-join":
        this.handleChannelJoin(ws, msg.channel);
        break;
      case "channel-change":
        this.handleChannelChange(
          ws,
          msg.previousChannel,
          msg.newChannel
        );
        break;
      case "file-start":
        this.handleFileStart(ws, msg);
        break;
      case "file-done":
        this.handleFileDone(
          ws,
          msg
        );
        break;
    }
  }
  async webSocketClose(ws) {
    const { channel } = ws.deserializeAttachment() ?? {};
    if (channel) this.broadcastConnections(channel);
  }
  async webSocketError(ws) {
    const { channel } = ws.deserializeAttachment() ?? {};
    if (channel) this.broadcastConnections(channel);
  }
  // ── Handlers ──────────────────────────────────────────────────────────────
  handleChannelJoin(ws, channel) {
    ws.serializeAttachment({ channel });
    this.broadcast(channel, { type: "user-joined", channel }, ws);
    ws.send(
      JSON.stringify({
        type: "channel-joined",
        channel,
        message: "Successfully connected."
      })
    );
    this.broadcastConnections(channel);
  }
  handleChannelChange(ws, previousChannel, newChannel) {
    ws.serializeAttachment({ channel: newChannel });
    if (previousChannel) this.broadcastConnections(previousChannel);
    this.broadcast(newChannel, { type: "user-joined", channel: newChannel }, ws);
    ws.send(
      JSON.stringify({
        type: "channel-joined",
        channel: newChannel,
        message: "Successfully connected."
      })
    );
    this.broadcastConnections(newChannel);
  }
  handleFileStart(ws, data) {
    const { channel } = ws.deserializeAttachment() ?? {};
    if (!channel) return;
    this.broadcast(
      channel,
      { type: "file-incoming", channel, id: data.id, name: data.name },
      ws
    );
  }
  handleFileDone(ws, data) {
    const { channel } = ws.deserializeAttachment() ?? {};
    if (!channel) return;
    this.broadcast(
      channel,
      {
        type: "file-done",
        channel,
        id: data.id,
        name: data.name,
        fileType: data.fileType
      },
      ws
    );
  }
  // ── Broadcast helpers ─────────────────────────────────────────────────────
  channelSockets(channel, exclude) {
    return this.ctx.getWebSockets().filter((client) => {
      if (client === exclude) return false;
      const att = client.deserializeAttachment();
      return att?.channel === channel;
    });
  }
  broadcast(channel, payload, exclude) {
    const msg = JSON.stringify(payload);
    for (const client of this.channelSockets(channel, exclude)) {
      try {
        client.send(msg);
      } catch {
      }
    }
  }
  relayBinary(channel, data, exclude) {
    for (const client of this.channelSockets(channel, exclude)) {
      try {
        client.send(data);
      } catch {
      }
    }
  }
  broadcastConnections(channel) {
    const count = this.ctx.getWebSockets().filter((ws) => ws.deserializeAttachment()?.channel === channel).length;
    const msg = JSON.stringify({ type: "connections", channel, count });
    for (const client of this.ctx.getWebSockets()) {
      const att = client.deserializeAttachment();
      if (att?.channel === channel) {
        try {
          client.send(msg);
        } catch {
        }
      }
    }
  }
};

// worker/index.ts
var FRONTEND_ORIGIN = "https://throwmyfile.com";
function corsHeaders(request) {
  const requested = request.headers.get("Access-Control-Request-Headers");
  return {
    "Access-Control-Allow-Origin": FRONTEND_ORIGIN,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    ...requested ? { "Access-Control-Allow-Headers": requested } : { "Access-Control-Allow-Headers": "Content-Type" }
  };
}
__name(corsHeaders, "corsHeaders");
var worker_default = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }
    const id = env.THROW_FILES_CHANNEL.idFromName("main");
    const stub = env.THROW_FILES_CHANNEL.get(id);
    const response = await stub.fetch(request);
    if (response.status === 101) return response;
    const newHeaders = new Headers(response.headers);
    for (const [k, v] of Object.entries(corsHeaders(request))) {
      newHeaders.set(k, v);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
};

// ../.nvm/versions/node/v22.22.0/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../.nvm/versions/node/v22.22.0/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-zNiWKF/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../.nvm/versions/node/v22.22.0/lib/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-zNiWKF/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  ThrowFilesChannel,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
