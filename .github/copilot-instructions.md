# ThrowMyFile – Copilot Instructions

## What this project is

A privacy-first P2P file-sharing SPA at [throwmyfile.com](https://throwmyfile.com). Files are relayed directly between browsers via WebSocket chunking — nothing is stored on the server. The backend is a Cloudflare Worker + Durable Object; the frontend is React 18 built with Rsbuild.

## Commands

```bash
# Root
npm run dev          # Start frontend dev server (delegates to client/)
npm run build        # Install client deps + build client
npx wrangler deploy  # Deploy worker to Cloudflare

# Inside client/
npm run dev          # Rsbuild dev server
npm run build        # Production build → client/build/
npm run preview      # Preview production build locally
```

There are no test or lint scripts configured.

## Architecture

```
worker/         Cloudflare Worker (backend)
client/src/     React 18 SPA (frontend)
design-system/  Archived design variants (not deployed)
```

### Worker (Cloudflare Workers + Durable Objects)

- **`worker/index.ts`** — Entry point. Handles CORS (only allows `throwmyfile.com`) and forwards all requests to the single `ThrowFilesChannel` Durable Object via `THROW_FILES_CHANNEL` binding.
- **`worker/channel.ts`** — `ThrowFilesChannel` Durable Object. Manages all WebSocket connections using CF's **WebSocket Hibernation API** (DO sleeps between messages to reduce billing). State per socket is stored as serialized attachments `{ channel: string | null }` — there is no other persistent state.

**Message types the DO handles:**
| Type | Direction | Purpose |
|------|-----------|---------|
| `channel-join` | client → DO | Join a named channel |
| `channel-change` | client → DO | Move to a different channel |
| `file-start` | client → DO | Notify recipients a transfer is starting |
| `file-done` | client → DO | Notify transfer complete |
| Binary frame | client → DO → clients | File chunk relay |

**Binary frame format:** `[uint32 header_length][JSON header bytes][chunk bytes]`

### Client (`client/src/`)

**`utils/throw-socket.ts`** — Native WebSocket wrapper with a socket.io-compatible event API. Handles reconnection and a send-queue for messages sent before connection is established.

**`utils/throw-file-upload.ts`** — Custom chunked file sender (replaces the old `socketio-file-upload` lib). Default chunk size is 1 MB. Emits progress events. Multi-file transfers are automatically ZIP-compressed client-side using JSZip before chunking.

**`pages/home/index.tsx`** — The entire file transfer UI (~1800 lines). Channel management, connection state, upload/download progress, and UI are all here.

**`App.tsx`** — React Router v5. Two routes: `/` (Home) and `/privacy-policy`.

## Key Conventions

### Styling

- **Styled Components** (v5) for all React component styles — every component file defines its styled elements inline.
- **LESS** (`App.less`) for global/utility styles.
- No Tailwind, no CSS modules.

### TypeScript

- Strict mode everywhere. Root `tsconfig.json` covers `worker/`; `client/tsconfig.json` covers the frontend.
- The root `@cloudflare/workers-types` package provides CF Worker/DO types for the worker.
- Client path alias: `@/*` → `./src/*`.

### Environment variables

- Runtime env vars are injected into `window.ENV` — access them from client code as `window.ENV.VARIABLE_NAME`.

### Durable Object state

- Do **not** use `this.state.storage` for per-connection data — use WebSocket attachments (`ws.deserializeAttachment()` / `ws.serializeAttachment()`).

### Cloudflare deployment

- Worker: `npx wrangler deploy`
- Frontend: deployed to Cloudflare Pages (`throwmyfile-frontend` project) via CI
- CI/CD: `.github/workflows/deploy.yml` triggers on push to `master` or manual dispatch
