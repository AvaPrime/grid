# GRID

DJ library OS — crates, hot cues, Camelot mixing, a local REST API, and a plugin sandbox.

## Features

- **Library** — 48 prepared tracks across eight albums with BPM, Camelot key, energy, ratings, and cue points
- **Player** — generated-in-key preview grooves (no copyrighted audio). Space toggles; keys 1–8 jump hot cues
- **Mix** — Camelot wheel plus harmonic matches within ±8 BPM
- **Plugins** — sandboxed JavaScript actions against `_library`
- **REST API** — same-origin `/api/v1` for tracks, search, playlists, and cue writes
- **Accounts** — sign in to clone the demo crate onto your own library

## Develop

```bash
npm install
npm run dev
```

```bash
npm run build
npm run typecheck
```

## Stack

React 19, TanStack Start, Tailwind v4, Postgres (Neon / PGLite), Better Auth.
