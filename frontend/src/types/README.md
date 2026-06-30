# types/

Shared TypeScript interfaces used by the service layer and components.

| File | Purpose |
|------|---------|
| `index.ts` | Domain types — `AuthUser`, `Skill`, `Badge`/`BadgesResponse`, `Readiness`, and related shapes. |

Add API response/request types here and import them where data crosses the network boundary, so the service
layer stays strongly typed as the migration progresses.
