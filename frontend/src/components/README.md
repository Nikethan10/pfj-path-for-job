# components/

Reusable UI shared across pages.

| Component | Purpose |
|-----------|---------|
| `Logo.tsx` | Brand mark (route-line "P" + pin), optionally with the "PFJ" wordmark. |
| `Sidebar.jsx` | Collapsible dashboard navigation (expands on hover). |
| `DashboardLayout` *(in `layouts/`)* | Wraps protected pages with the sidebar + assistant. |
| `Footer.tsx` | Site footer with product/company/legal links. |
| `PublicPage.tsx` | Header + content + footer shell for public/legal pages. |
| `BotAssistant.jsx` | Floating AI chat copilot (talks to `/api/assistant/chat` via the shared API client). |
| `Loader.tsx`/`Loader.jsx` | Spinner used during async loads. |
