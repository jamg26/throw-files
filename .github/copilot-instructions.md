# ThrowMyFile – Copilot Instructions

## What this project is

A file-sharing SPA at [throwmyfile.com](https://throwmyfile.com). Files are
chunked in the browser and **relayed** between clients through a Cloudflare
Worker + Durable Object — nothing is stored, but this is not WebRTC and not
end-to-end encrypted. Say "relay", not "P2P"; the traffic is decrypted at the
Worker in order to be forwarded. The frontend is React 18 built with Rsbuild.

## Commands

```bash
# Root
npm run dev          # Frontend dev server (delegates to client/)
npm run dev:worker   # Worker locally on :8787
npm run build        # Install client deps + build client
npm test             # vitest (client)
npm run typecheck    # tsc for worker + client
npx wrangler deploy  # Deploy worker
```

## Architecture

```
worker/         Cloudflare Worker (relay)
client/src/     React 18 SPA
```

### Worker

- **`worker/index.ts`** — Entry point. Validates the `Origin` header and the
  `?channel=` code on WebSocket upgrades, then routes to **one Durable Object per
  channel** via `idFromName("channel:" + code)`. Non-WebSocket requests never
  touch a DO.
- **`worker/channel.ts`** — `ThrowFilesChannel`. One instance per channel, using
  the **WebSocket Hibernation API**. Because the DO is per-channel,
  `getWebSockets()` already returns exactly that channel's members — do not
  reintroduce per-chunk attachment filtering on the relay path.

**Connecting is joining.** Membership is established from the upgrade URL before
any frame can arrive; there is no `channel-join` handshake message.

**Message types:**
| Type | Direction | Purpose |
|------|-----------|---------|
| `file-start` | client → DO | Announce a transfer |
| `file-done` | client → DO | Transfer finished |
| `file-abort` | client → DO | Sender cancelled or failed |
| Binary frame | client → DO → clients | File chunk relay |
| `ping` | client → DO | Keepalive, auto-answered without waking the DO |

**Binary frame:** `[uint32 header_length][JSON header][chunk bytes]`

### Client

- **`utils/channel.ts`** — Channel code rules. Codes are **exactly 6** chars
  `[A-Z0-9]`. Anything accepting user or URL input must go through
  `normalizeChannelCode` and `isValidChannelCode`. Unit-tested.
- **`utils/transfer.ts`** — Size limits and integrity checks. Cloudflare rejects
  WebSocket messages over **1 MiB**, so `MAX_CHUNK_BYTES` is 512 KiB and
  `pickChunkSize` must never exceed it. `isTransferComplete` gates every
  download — never hand the user bytes without it. Unit-tested.
- **`utils/format.ts`** — `formatFileSize`, `trimFileName`. Unit-tested.
- **`utils/throw-socket.ts`** — WebSocket wrapper. One connection per channel;
  `setChannel()` reconnects. File chunks are **never queued** across a reconnect
  (the receiver's byte offset would no longer match). Exposes a `state` event.
- **`utils/throw-file-upload.ts`** — Chunked sender. Uploads run **sequentially**.
  The channel is passed to `submitFiles(files, channel)`; do not resurrect the
  old pattern of mutating a descriptor from inside an event handler.
- **`pages/home/index.tsx`** — Transfer UI logic. **`pages/home/styles.ts`** —
  its styled-components. Keep them separate.
- **`App.tsx`** — React Router v5: `/`, `/privacy-policy`, and a catch-all 404.

## Key Conventions

### Product claims

The privacy policy, the README and the on-page badges must describe the relay
architecture accurately. Do not add "P2P" or "end-to-end encrypted" copy unless
the code actually implements it.

### Received files

Never auto-download. Completed transfers land in a "ready to save" list and wait
for an explicit click.

### Channel joins

Joining is an explicit action (button, Enter, generate, or a valid `?channel=` on
load). Never join from a keystroke handler, and use `history.replaceState` for
the URL — `pushState` traps the Back button.

### Styling

- **styled-components** (v5) for components; **LESS** (`App.less`) for globals
  and CSS variables.
- No remote CSS or font imports — a privacy-first app must not call out to a CDN.
- Text colours must clear WCAG AA 4.5:1. `--text-muted` and `--text-tertiary`
  were retuned for this; check before darkening them again.
- Every animation must be covered by the `prefers-reduced-motion` block in
  `App.less`.

### TypeScript

Strict everywhere. Root `tsconfig.json` covers `worker/`; `client/tsconfig.json`
covers the frontend. Client path alias: `@/*` → `./src/*`.

### Environment variables

`window.ENV.*` is a **build-time** substitution performed by the `define` plugin
in `rsbuild.config.js` — not a runtime lookup. Values come from
`client/.env.<mode>` and require a rebuild to change.

### Cloudflare deployment

- Frontend → Cloudflare Pages (`throwmyfile-frontend`) at `throwmyfile.com`.
- Worker → `npx wrangler deploy`, at `api.throwmyfile.com`, attached as a Custom
  Domain **in the dashboard** (not in `wrangler.toml`). Never point the apex at
  the Worker.
- CI: `.github/workflows/deploy.yml` — typecheck + test gate, then deploy on
  push to `master`.
