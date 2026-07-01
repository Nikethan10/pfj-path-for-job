# PFJ — Deployment guide

This project is fully built and committed locally on branch `main`. Follow these steps to put it on
GitHub and host it. Frontend → **Vercel**, backend → **Render** (Docker), data/auth → **Firebase**.

> The super-admin is bootstrapped to **nikethantirumala@gmail.com** (via `SUPER_ADMIN_EMAILS`). Sign in
> with that Google account, then visit `/admin`.

---

## 1. Push to GitHub (private repo under `Nikethan10`)

The local repo already has a remote set to `https://github.com/Nikethan10/pfj-path-for-job.git`.

**Option A — GitHub CLI (interactive, easiest):**
```bash
winget install --id GitHub.cli -e            # if gh isn't installed
gh auth login                                 # choose GitHub.com → HTTPS → log in as Nikethan10
gh repo create Nikethan10/pfj-path-for-job --private --source=. --remote=origin --push
```

**Option B — Personal Access Token (no gh):**
1. As **Nikethan10**, create a fine-grained PAT (Settings → Developer settings → Fine-grained tokens)
   with **Administration: Read/Write** (to create the repo) and **Contents: Read/Write** (to push).
2. Create the repo + push:
   ```bash
   curl -X POST -H "Authorization: Bearer <TOKEN>" https://api.github.com/user/repos \
        -d '{"name":"pfj-path-for-job","private":true}'
   git push https://<TOKEN>@github.com/Nikethan10/pfj-path-for-job.git main
   ```
3. Revoke the token afterwards (or keep it stored securely).

---

## 2. Backend → Render (Dockerized FastAPI)

1. Render dashboard → **New → Blueprint** → connect the GitHub repo (it reads `backend/render.yaml`).
2. Set environment variables (dashboard → the service → Environment):
   - `ENV = production`
   - `ALLOWED_ORIGINS = https://<your-vercel-domain>.vercel.app`
   - `GROQ_API_KEY`, `GEMINI_API_KEY` (and `GITHUB_TOKEN` if used) — your existing keys.
   - `FIREBASE_DATABASE_URL = https://pathforjob0-default-rtdb.firebaseio.com`
   - `SUPER_ADMIN_EMAILS = nikethantirumala@gmail.com`
   - `FIREBASE_CREDENTIALS_PATH = /etc/secrets/firebase-service-account.json`
3. Add a **Secret File**: name `firebase-service-account.json`, mount path `/etc/secrets/`, paste the
   service-account JSON contents.
4. Deploy. Health check: `https://<render-service>.onrender.com/api/health`.

---

## 3. Frontend → Vercel (React + Vite)

1. Vercel → **Add New → Project** → import the GitHub repo.
2. **Root Directory = `frontend`** (important — it's a monorepo). Framework auto-detects as Vite.
   `frontend/vercel.json` already handles SPA routing.
3. Environment variables:
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
     `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
     (from Firebase console → Project settings → your web app).
   - `VITE_API_BASE_URL = https://<render-service>.onrender.com`
4. Deploy. Then go back to Render and set `ALLOWED_ORIGINS` to the Vercel domain; redeploy the backend.

---

## 4. Firebase console

- **Authentication** → enable **Email/Password** and **Google** providers.
- Add your Vercel domain under Authentication → Settings → **Authorized domains**.
- **Firestore** → create the database and set security rules so each user only touches their own data:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{db}/documents {
      match /users/{uid}/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
      match /skills/{doc} { allow read: if request.auth != null; }
      match /site_config/{doc} { allow read: if true; allow write: if false; } // writes go through the admin API
      match /admins/{doc} { allow read, write: if false; }                     // server-only
      match /audit_logs/{doc} { allow read, write: if false; }                 // server-only
    }
  }
  ```

---

## 5. After it's live

- Rotate the Firebase service-account key, Gemini key, Groq key, and Firebase RTDB secret (they were
  previously committed). Update the values in Render.
- Sign in as **nikethantirumala@gmail.com**, open `/admin`, and set the site content, theme, logo, and
  feature flags.
