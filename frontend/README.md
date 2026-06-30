# PFJ Frontend (React + Vite + TypeScript)

Single-page app for PFJ. Tailwind for styling, Firebase client SDK for auth, axios for API calls,
framer-motion for animation, recharts/reactflow/Monaco for the richer pages.

## Run locally

```bash
npm install
cp .env.example .env.local      # Firebase web config + VITE_API_BASE_URL
npm run dev                      # http://localhost:5173
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite dev server. |
| `npm run build` | Type-check (`tsc`) then build the production bundle. |
| `npm run preview` | Preview the production build locally. |
| `npm run typecheck` | Type-check only. |

## Folder map

| Folder | Purpose |
|--------|---------|
| `src/components/` | Reusable UI (Logo, Sidebar, Footer, Loader, BotAssistant, PublicPage). |
| `src/context/` | `AuthContext` (auth state + login/logout). |
| `src/layouts/` | `DashboardLayout` (sidebar + assistant shell for protected routes). |
| `src/pages/` | One component per route (public + dashboard pages). |
| `src/services/` | `api.ts` (axios client with token refresh) + per-domain service calls. |
| `src/data/` | Static front-end datasets (e.g. certifications). |
| `src/types/` | Shared TypeScript interfaces. |

## Conventions

- **TypeScript:** new and shell code is `.tsx`/`.ts`. The migration is incremental — some feature pages are
  still `.jsx` and compile via `allowJs` (not type-checked) until converted. Prefer `.tsx` for new work.
- **API base URL** comes from `VITE_API_BASE_URL` (defaults to `http://localhost:8000`). Never hardcode it.
- **Auth tokens:** the axios client attaches the Firebase ID token and silently refreshes it on a 401 before
  signing the user out.
- **Styling:** Tailwind utility classes plus shared component classes in `src/index.css`
  (`glass-card`, `btn-primary`, `badge-*`, `input-field`, ...). Reskin via these tokens, not per-page.

## Deploy (Vercel)

Set the project root to `frontend/`, add the `VITE_*` env vars, and let `vercel.json` handle SPA routing.
