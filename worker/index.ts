import { Container, getContainer } from "@cloudflare/containers";

// Container class wraps the Node.js/Socket.IO backend running on port 5000.
// A single named instance ("main") is used so all Socket.IO clients share
// the same in-memory channel state.
export class ThrowFilesContainer extends Container {
  defaultPort = 5000;
  // Keep the container alive for 30 minutes after the last request
  sleepAfter = "30m";
  envVars = {
    NODE_ENV: "production",
    FE_URL: "https://throwmyfile.com",
  };
}

const FRONTEND_ORIGIN = "https://throwmyfile.com";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": FRONTEND_ORIGIN,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface Env {
  THROW_FILES_CONTAINER: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") || FRONTEND_ORIGIN;

    // Build CORS headers, echoing back whatever headers the client requests.
    // This handles browser extensions or proxies that inject extra headers
    // (e.g. bypass-tunnel-reminder) without needing to whitelist them manually.
    const requestedHeaders = request.headers.get("Access-Control-Request-Headers");
    const corsHeaders: Record<string, string> = {
      ...CORS_HEADERS,
      "Access-Control-Allow-Origin": origin,
      ...(requestedHeaders ? { "Access-Control-Allow-Headers": requestedHeaders } : {}),
    };

    // Handle CORS preflight at the Worker level — ensures CORS headers are
    // always present even if the container is cold-starting or returns an error.
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const container = getContainer(env.THROW_FILES_CONTAINER, "main");
    const response = await container.fetch(request);

    // Inject CORS headers into every response so that error responses
    // (500/503 during cold-start) don't appear to the browser as CORS failures.
    const newHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      newHeaders.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
