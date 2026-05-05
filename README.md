# Pomodoro to Google Calendar

A minimal **Pomodoro** and **open-ended timer** in the browser. Sign in with Google to sync session history to **Google Drive** (app data folder) and optionally push completed sessions to **Google Calendar**.

## Disclaimer (hosted / live build)

The **public web deployment** is wired to **my Google OAuth credentials** for cost and billing reasons, so **Google sign-in and Drive/Calendar sync on that live site only work with my Gmail account**. Everyone else can still use the timers in the browser; cloud sync needs your own setup.

To get **full sync with your Google account**, run the app **locally** (or deploy your own instance): **fork this repo**, add your own `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `NEXTAUTH_*` values as described below, then `npm run dev` or host it yourself.

## What it does

- **Focus / break timer** — presets plus a custom duration; work and break phases with optional sound when a block ends.
- **Stopwatch** — count-up timer for open-ended tasks; save elapsed time into the same history list.
- **Session history** — stored locally in the UI; with Google login, lists sync to a small JSON file in Drive so they follow you across devices.
- **Calendar (optional)** — in settings, enable sync to create calendar events from completed sessions.
- **Tab title** — while a timer runs, the browser tab shows `Focus-MM:SS`, `Break-MM:SS`, or `Stopwatch-MM:SS` so you can glance at the time without focusing the tab.

Timers use wall-clock timing so background tabs stay accurate when the browser throttles `setInterval`.

## Tech

Next.js (App Router), React, NextAuth (JWT) with Google OAuth, Google Drive API (`drive.appdata`) and Calendar API.

## Run locally

1. Create `.env.local` with:

   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — OAuth Web client from Google Cloud  
   - `NEXTAUTH_URL` — e.g. `http://localhost:3000`  
   - `NEXTAUTH_SECRET` — random string (e.g. `openssl rand -base64 32`)

2. In Google Cloud Console → **Credentials** → your OAuth client:

   - **Authorized JavaScript origins**: `http://localhost:3000`  
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`

3. Install and start:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Login** for Google; logout clears the client session only (Drive data stays in your account).

## Scripts

| Command       | Description        |
| ------------- | ------------------ |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint             |
