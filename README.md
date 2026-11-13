# Personal Time Tracker

A minimalist productivity and self-accountability dashboard for tracking study time, breaks, sleep, habits, and long-term personal progress. The app is designed around a strong daily workflow: stay on the desk, keep the study quota honest, protect recovery time, and review missed work without losing momentum.

This project is built with React, Vite, TypeScript, and Tailwind CSS, and stores user data locally in the browser for a lightweight, offline-friendly experience.

## What the app does

The interface is organized around a desk-style workflow with multiple tracking modules:

- Focus quota tracking with a 6-hour study target
- Break bank with a 2-hour daily quota and alert states
- Restorative sleep tracking
- Habit tracking for routines such as Riyaz, reading, exercise, and custom tasks
- Date-based timeline and visual analytics
- Achievement tracking and a live ticker
- Review queue for gaps and unlogged time
- Vault of Lost Time for carrying forward or archiving missed study debt
- WhatsApp import support to ingest chat data and convert it into tracked entries
- Offline status awareness and local persistence

## Key features

### 1. Desk session controls
Users can start and stop study, break, sleep, and content sessions. The app tracks active duration in real time and persists session data between reloads.

### 2. Study and break quotas
The app monitors:

- total study minutes for the selected date
- study deficit or carry-forward minutes
- break usage and surplus minutes
- daily accountability checks when the day closes

### 3. Habit tracker
Custom habits can be added and tracked with default durations and shortcut-based interactions. The app supports routine-based progress tracking across the day.

### 4. WhatsApp importer
A WhatsApp import tool parses chat entries and classifies valid activity blocks, review items, and gap warnings. This is useful for users who keep their recording history in chat transcripts.

### 5. Timeline and analytics
The app includes heatmap and timeline-style visualizations to review recorded sessions over time. This makes productivity patterns easier to understand.

### 6. Vault and review system
Missed or unfinished study periods can be:

- carried forward,
- archived into a Vault of Lost Time,
- or reviewed in a queue for reconciliation.

This gives the system a personal accounting layer rather than a purely raw stopwatch experience.

## Tech stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- PWA support via vite-plugin-pwa
- Local persistence through IndexedDB and LocalStorage
- Optional Gemini API integration via environment variables

## Project structure

```text
.
├── public/
├── scripts/
├── src/
├── .env.example
├── firebase-applet-config.json
├── firestore.rules
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── bun.lock
└── README.md
```

## Prerequisites

Before running the project locally, install:

- Node.js (18+ recommended)
- npm

## Installation

```bash
git clone https://github.com/xpro-shell/Personal-Time-Tracker.git
cd Personal-Time-Tracker
npm install
```

## Environment variables

A sample environment file is included as `.env.example`.

```bash
cp .env.example .env
```

Then fill in any required values, especially:

- `GEMINI_API_KEY`
- `APP_URL`

The repository comments note that these values may be injected automatically in AI Studio or cloud environments, so they may not all be required in every deployment context.

## Running locally

Start the dev server:

```bash
npm run dev
```

This app is configured to run on port 3000.

Open the app in a browser at:

```text
http://localhost:3000
```

## Production build

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Linting

```bash
npm run lint
```

## Notes

- This is a local-first productivity app and is designed to work well as a browser-based personal tool.
- It uses browser storage for persistence, so data stays on the device unless explicitly synced elsewhere.
- The project includes Firebase-related config files, suggesting it may be intended for deployment in a richer app environment or AI Studio context.
- Some features may require runtime configuration or deployment-specific secrets depending on how you run it.

## Recommended use

This app works best as a focused daily desk companion for:

- study and deep work tracking,
- habit consistency,
- sleep and recovery checks,
- weekly accountability review,
- and personal productivity reflection.

## License

This project does not currently declare a license in the repository metadata. If you plan to share or distribute it publicly, it is recommended to add one explicitly.

## Future improvements

Potential follow-up areas for this project include:

- export/import of personal time records,
- real backend sync or cloud backup,
- more polished charts and reports,
- deployment documentation for a hosted production URL,
- and clearer public onboarding for non-technical users.

