export { ThrowFilesChannel } from "./channel";

const FRONTEND_ORIGIN = "https://throwmyfile.com";

interface Env {
  THROW_FILES_CHANNEL: DurableObjectNamespace;
}

function corsHeaders(request: Request): Record<string, string> {
  const requested = request.headers.get("Access-Control-Request-Headers");
  return {
    "Access-Control-Allow-Origin": FRONTEND_ORIGIN,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    ...(requested
      ? { "Access-Control-Allow-Headers": requested }
      : { "Access-Control-Allow-Headers": "Content-Type" }),
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight — handle at worker edge, no DO wakeup needed.
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const id = env.THROW_FILES_CHANNEL.idFromName("main");
    const stub = env.THROW_FILES_CHANNEL.get(id);
    const response = await stub.fetch(request);

    // WebSocket 101 must be returned as-is — wrapping it breaks the upgrade.
    if (response.status === 101) return response;

    // Inject CORS headers into all other responses.
    const newHeaders = new Headers(response.headers);
    for (const [k, v] of Object.entries(corsHeaders(request))) {
      newHeaders.set(k, v);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
