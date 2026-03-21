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

interface Env {
  THROW_FILES_CONTAINER: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const container = getContainer(env.THROW_FILES_CONTAINER, "main");
    return container.fetch(request);
  },
};
