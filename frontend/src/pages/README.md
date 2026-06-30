# pages/

One component per route (routes are declared in `src/App.tsx`).

**Public:** `Landing`, `Login`, `Signup`, `About`, `Contact`, `Terms`, `Privacy`, `NotFound`.

**Dashboard (protected, inside `DashboardLayout`):** `Dashboard`, `Skills`, `Roadmap`, `Certifications`,
`Projects`, `Analytics`, `Resume`, `CareerCompare`, `Badges`, `Settings`, `Interview`, `Challenges`, `Jobs`.

Notes:
- New pages (`Badges`, `About`, `Contact`, `Terms`, `Privacy`, `NotFound`) are TypeScript (`.tsx`); several
  feature pages are still `.jsx` pending incremental conversion.
- Public info pages use the shared `components/PublicPage` shell (header + footer).
- Data flows through `src/services/*`; never call `fetch`/`axios` to a hardcoded URL from a page.
