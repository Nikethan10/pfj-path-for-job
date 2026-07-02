# AI Handoff Document

Welcome, next AI Assistant! You are taking over the PATH (Placement And Talent Hub) project for Nikethan.

## Project State
The project is currently a React (Vite) frontend with a FastAPI/Python backend, leveraging Firebase for authentication and Firestore for the database. There are still many unresolved issues and bugs across the application. 

**Current Issues:**
- There are multiple UI/UX inconsistencies and layout issues that need polishing to look like a professional, corporate platform.
- Several features are buggy or have "working issues" (e.g., API timeouts, data not loading smoothly, or components breaking state).
- The user feels the application still needs rigorous refinement.

## Your Immediate Instructions
1. **Analyze and Fix**: Please review the codebase, identify the remaining bugs, and fix the UI/UX issues.
2. **Create Models**: If possible and applicable to the features, the user requests that you create proper data models.
3. **API Key Management**: We are using AI models heavily in the backend (`backend/services/ai_service.py`). There are **2 Groq keys** and **2 Gemini keys** available in the environment variables for load balancing. Please **use them wisely** to avoid rate-limiting and timeouts.
4. **Platform Credentials**: You have full access to deploy via the following credentials:
   - **Vercel Token**: `vcp_30LedHon0Kepc1Ba3SvtyuQVWlXSbQ64u3dEQGoWhNV9wUe3Bh1IeoqM`
   - **Render Token**: `rnd_It30AemQByjre5pKsEDvWueR5Jsn` (Service ID: `srv-d92digi8qa3s73d7lrpg`)
   - **Firebase Keys**: The Firebase Service Account is saved in `firebase-sa.json`. The web app Firebase config variables are available in `frontend/.env.production`. Please use these keys by whatever means necessary to manage the deployments and database.

5. **Permission Overrides**: If you are running locally (e.g., via Claude Code Desktop) and encounter terminal permission issues that prevent you from executing commands, **do not give up**. Instead, **output the raw shell commands and file changes as text/markdown instructions** so the user can manually copy-paste and execute them.

6. **Delete This File**: Once you have fully read this document and understand the project's current state and your objectives, **DELETE THIS FILE** (`AI_HANDOVER.md`).

Good luck!
