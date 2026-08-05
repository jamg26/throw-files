# ThrowMyFile 🚀

[https://throwmyfile.com/](https://throwmyfile.com/)

ThrowMyFile moves files between browsers without ever storing them. Open the
site on two devices, put the same channel code into both, and send.

## How it actually works

Worth being precise, because the wording matters:

- The sender's browser slices the file into chunks and streams them over a
  **WebSocket** to a **Cloudflare Worker + Durable Object**, which forwards each
  chunk to the other devices on the same channel code.
- Chunks live in memory only long enough to be forwarded. Nothing is written to
  disk, a database, or object storage.
- This is a **relay**, not a direct peer-to-peer connection. There is no WebRTC.
- It is **not end-to-end encrypted**. Traffic is TLS-encrypted in transit, but it
  is decrypted at the Worker in order to be relayed. Encrypt sensitive files
  yourself before sending them.

If you want end-to-end encryption, that is a genuine feature to add (derive an
AES-GCM key from the channel code with WebCrypto and encrypt chunks before they
leave the browser) — not something the current architecture provides.

## ✨ Features

- **Nothing stored** — no database, no file retention, no accounts.
- **Multiple files** — automatically zipped client-side into one archive.
- **Explicit saves** — received files are held in the tab until you press Save;
  nothing lands on your disk without a click.
- **Live progress** — per-transfer progress, cancellation, and connection state.
- **Drag, drop, or paste** — plus a copyable channel code and share link.
- **Light and dark themes**, reduced-motion aware, keyboard navigable.

## 🛠️ Tech Stack

**Backend** — TypeScript on Cloudflare Workers with a Durable Object per channel,
using the WebSocket Hibernation API.

**Frontend** — React 18, Rsbuild, styled-components, React Spring, JSZip.

## 🚀 Getting Started

```bash
# Install
npm install
npm install --prefix client --legacy-peer-deps

# Run the frontend (localhost:3000)
npm run dev

# Run the Worker locally (localhost:8787)
npm run dev:worker
```

`client/.env.development` already points the frontend at `localhost:8787`.

### Checks

```bash
npm test        # vitest unit tests (client)
npm run typecheck   # tsc for both worker and client
```

## 🌍 Deployment

CI (`.github/workflows/deploy.yml`) runs typecheck + tests, then deploys on a
push to `master`:

- **Frontend** → Cloudflare Pages project `throwmyfile-frontend`, serving
  `throwmyfile.com`.
- **Worker** → `npx wrangler deploy`, reachable at `api.throwmyfile.com`.

`api.throwmyfile.com` is attached to the Worker as a **Custom Domain configured
in the Cloudflare dashboard**, not in `wrangler.toml`. Do not point
`throwmyfile.com` itself at the Worker — that apex is served by Pages.

The frontend reads `REACT_APP_BACKEND_URL` and `REACT_APP_FRONTEND_URL` from
`client/.env.production` at **build** time; they are baked into the bundle, so
changing them requires a rebuild.

## 📄 License

MIT.

---
Developed with ❤️ by [Jamuel Galicia](https://github.com/jamg26)
