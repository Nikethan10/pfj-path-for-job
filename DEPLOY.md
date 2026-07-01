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

## 2. Backend → Koyeb (free, **no credit card**) — builds the Dockerfile from GitHub

> Render's Blueprint now requires a card. Koyeb (below) and Hugging Face Spaces are free and need **no
> card**. The backend reads its Firebase key from an env var (`FIREBASE_SERVICE_ACCOUNT`), so no secret
> file is required on the host.

1. Sign in to **koyeb.com** with GitHub (as Nikethan10).
2. **Create Web Service → GitHub →** pick `pfj-path-for-job`.
3. Builder = **Dockerfile**; **Work directory = `backend`** (Dockerfile path `backend/Dockerfile`).
4. Instance = **Free (nano)**; **Port = 8000**.
5. Environment variables:
   - `ENV = production`
   - `ALLOWED_ORIGINS = https://<your-vercel-domain>.vercel.app`
   - `GROQ_API_KEY`, `GEMINI_API_KEY` (your existing keys)
   - `FIREBASE_DATABASE_URL = https://pathforjob0-default-rtdb.firebaseio.com`
   - `SUPER_ADMIN_EMAILS = nikethantirumala@gmail.com`
   - `FIREBASE_SERVICE_ACCOUNT = <paste the ENTIRE service-account JSON, one line>`  *(mark as secret)*
6. Deploy. Health check: `https://<app>.koyeb.app/api/health`.

### Alternative — Hugging Face Spaces (Docker, free, no card)
1. huggingface.co → **New Space → SDK: Docker**.
2. Push the `backend/` contents to the Space (it has its own git repo) and set the Space README metadata
   `app_port: 8000`.
3. Under **Settings → Variables and secrets**, add the same variables as above (put `FIREBASE_SERVICE_ACCOUNT`,
   `GROQ_API_KEY`, `GEMINI_API_KEY` as **secrets**).
4. It builds the Dockerfile and serves at `https://<user>-<space>.hf.space`.

*(A `backend/render.yaml` is still included if you ever add a card to Render — but it's not needed for Koyeb/HF.)*

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
