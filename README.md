# Personal Time Tracker

A Minimilistic local-first productivity dashboard for tracking study sessions, breaks, sleep, habits, achievements, and daily progress. It also includes a timeline, WhatsApp import tools, a review queue, and the Vault of Lost Time.

## Run it locally

You need **Git**, **Node.js 20.19 or newer**, and npm. From a terminal, run:

```sh
git clone https://github.com/xpro-shell/Personal-Time-Tracker.git
cd Personal-Time-Tracker
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser. To stop the development server, press **Ctrl+C** in the terminal.

The repository allows the `esbuild` install script because Vite needs it to install its platform binary. Other dependency install scripts are not automatically approved. If npm reports blocked scripts for other packages, they are not necessarily needed to run the app.

## Features

- Track study against a 6-hour daily target and breaks against a 2-hour quota.
- Log sleep and custom habits, including music practice.
- Review daily activity in a timeline and visual analytics.
- Track achievements, reconcile missed time, and manage carry-forward or archived study debt.
- Import WhatsApp activity logs and review uncertain entries or gaps.
- Use the app offline; activity and settings are stored in the browser on that device.
- Install as a Progressive Web App in supported browsers.

## Optional configuration

Most local tracking features do not require a `.env` file. Some AI Studio or Gemini-powered functionality may need a Gemini API key and deployment-specific configuration. See [`.env.example`](.env.example); do not commit private API keys.

## Developer commands

```sh
npm run build  # Build for production
npm run preview # Preview the production build locally
npm run lint   # Check TypeScript
```

This repository currently does not list a software license. Ask the owner before redistributing it.
