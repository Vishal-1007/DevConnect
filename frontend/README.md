# DevConnect Frontend

React + TypeScript + Tailwind CSS + Redux Toolkit, wired to the **API gateway** (`http://localhost:8080`).

## Prerequisites

- Node.js 20+
- Backend: gateway + services running (see repo root `README.md`)

## Development

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Vite proxies `/api` and `/ws` to the gateway on port **8080** — no CORS setup needed locally.

## Environment

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | API origin for production builds. Leave empty in dev (uses proxy). |

Copy `.env.example` to `.env` for custom values.

## Scripts

- `npm run dev` — dev server with HMR
- `npm run build` — production build to `dist/`
- `npm run preview` — preview production build

## Features

- **Dashboard UI** matching the DevConnect mockup (sidebar, top nav, Find Match + chat panel)
- Register / login (JWT stored in `localStorage`, refresh on 401)
- Find Match page: video panels, quick join rooms, top mentors, chat sidebar
- Profile editor (syncs skills to matching index)
- Mentor list & mentor profile setup
- Placeholder pages for upcoming features (video rooms, pair programming, etc.)

## Production build

```bash
VITE_API_BASE_URL=https://api.yourdomain.com npm run build
```

Serve `dist/` behind nginx/CDN; ensure the gateway allows your frontend origin in `APP_CORS_ALLOWED_ORIGINS`.
