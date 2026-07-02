# PATH Frontend

Welcome to the frontend application for **PATH (Placement And Talent Hub)**. 
Built using React, Vite, and TailwindCSS, this Single Page Application (SPA) delivers a sleek, responsive, and highly interactive user experience.

## Architecture

The application is structured to decouple UI components from state management and API services, allowing for easy testing and rapid iteration.

### Directory Structure

- **`src/`**
  - **`assets/`**: Static media (images, icons, etc.) not handled by the public directory.
  - **`components/`**: Reusable UI elements (Buttons, Layouts, Navigation, Modals). These components should ideally be "dumb" (presentation-only) where possible.
  - **`context/`**: React Context providers for global state (e.g., Theme, Config).
  - **`pages/`**: View-level components mapping directly to routing (e.g., `Landing.jsx`, `Dashboard.jsx`).
  - **`services/`**: API integration layers. Uses Axios to communicate with the FastAPI backend. All network requests and error parsing logic live here.
  - **`firebase.ts`**: Firebase SDK configuration and initialization.

## Design System

The platform uses a custom **TailwindCSS** configuration (`tailwind.config.js`) to enforce brand consistency.
- **Brand Colors:** Primary (`#0a66c2` Blue), Backgrounds (White & `#f8fafc` Gray), Typography (`#111111` Black).
- **Typography:** The `Inter` font is used globally for a clean, modern aesthetic.
- **Global Styles:** Handled in `index.css`, heavily relying on Tailwind `@layer components` to create reusable utility classes like `.btn-primary` and `.input-field`.

## Deployment

The application is configured to deploy seamlessly to **Vercel**.
Routing is handled client-side via React Router. The `vercel.json` file ensures that all server requests are rewritten to `index.html` to prevent 404 errors on deep-links.

## Getting Started

1. **Environment Setup:** Copy `.env.example` to `.env.local` and add your Firebase configurations.
2. **Install Dependencies:** `npm install`
3. **Run Development Server:** `npm run dev`
