export { ThrowFilesChannel } from "./channel";

const ALLOWED_ORIGINS = new Set([
  "https://throwmyfile.com",
  "https://www.throwmyfile.com",
]);

// Channel codes are fixed-length; see client/src/utils/channel.ts.
const CHANNEL_CODE = /^[A-Z0-9]{6}$/;

interface Env {
  THROW_FILES_CHANNEL: DurableObjectNamespace;
}

/**
 * WebSocket upgrades are not subject to CORS, so the Origin header is the only
 * thing standing between us and cross-site socket hijacking: without this any
 * page could open a socket, guess a channel and receive someone's files.
 *
 * Loopback origins stay allowed for local development. That is not a hole a
 * remote site can walk through — a page can only send `Origin: localhost` if it
 * is genuinely served from the user's own machine.
 */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "http:" && protocol !== "https:") return false;
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin");
  const requested = request.headers.get("Access-Control-Request-Headers");
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin)
      ? (origin as string)
      : [...ALLOWED_ORIGINS][0],
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": requested ?? "Content-Type",
    Vary: "Origin",
    "X-Content-Type-Options": "nosniff",
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight — handled at the edge, no DO wakeup needed.
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    if (request.headers.get("Upgrade")?.toLowerCase() === "websocket") {
      if (!isAllowedOrigin(request.headers.get("Origin"))) {
        return new Response("Forbidden origin", { status: 403 });
      }

      const channel = url.searchParams.get("channel") ?? "";
      if (!CHANNEL_CODE.test(channel)) {
        return new Response("Invalid channel code", { status: 400 });
      }

      // One Durable Object per channel. Previously every connection on the
      // planet shared `idFromName("main")`, which made each relayed chunk walk
      // the full global socket list and capped the whole product at the
      // throughput of a single-threaded DO.
      const id = env.THROW_FILES_CHANNEL.idFromName(`channel:${channel}`);
      return env.THROW_FILES_CHANNEL.get(id).fetch(request);
    }

    if (url.pathname === "/health") {
      return new Response("ok", {
        headers: { ...corsHeaders(request), "Content-Type": "text/plain" },
      });
    }

    // Nothing else touches a Durable Object.
    return new Response("Not found", {
      status: 404,
      headers: corsHeaders(request),
    });
  },
};
