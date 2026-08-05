# ThrowMyFile Client

React 18 frontend, built with [Rsbuild](https://rsbuild.dev/).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on [localhost:3000](http://localhost:3000) |
| `npm run build` | Production build → `build/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run typecheck` | `tsc --noEmit` |

The Worker backend runs separately — `npm run dev:worker` from the repo root
starts it on `:8787`, which is what `.env.development` points at.

## Layout

```
src/
  components/   Shared UI primitives (Button, Input, Modal, Tooltip, Card, Text)
  contexts/     Theme provider
  pages/
    home/       index.tsx (logic) + styles.ts (styled-components)
    privacy-policy/
    not-found/
  utils/
    channel.ts            Channel code rules            (tested)
    transfer.ts           Size limits + integrity        (tested)
    format.ts             Byte/filename formatting       (tested)
    throw-socket.ts       WebSocket wrapper
    throw-file-upload.ts  Chunked sender
  App.less      Global styles and CSS custom properties
```

## Environment variables

`REACT_APP_BACKEND_URL` and `REACT_APP_FRONTEND_URL` come from
`.env.development` / `.env.production` and are substituted into the bundle at
**build** time by the `define` plugin in `rsbuild.config.js`. They are not
runtime lookups — changing one requires a rebuild.

## Conventions

- Text colours must clear WCAG AA (4.5:1). See the comments on `--text-muted`
  and `--text-tertiary` in `App.less`.
- Every animation is covered by the `prefers-reduced-motion` block in `App.less`.
- No remote CSS, font, or script sources — the app makes no third-party requests.
