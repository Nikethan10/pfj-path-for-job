# context/

| File | Purpose |
|------|---------|
| `AuthContext.tsx` | Holds the authenticated user and a `loading` flag, rehydrated from `localStorage`. Exposes `loginUser(user, firebaseToken)` and `logoutUser()`, plus the `useAuth()` hook used by route guards and the sidebar. |

Token refresh on expiry is handled in `services/api.ts` (via the Firebase SDK), not here.
