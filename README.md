# Personal Time Tracker

A minimalistic, local-first productivity dashboard for tracking study sessions, breaks, sleep, habits, achievements, and daily progress. It includes a timeline, analytics, and a review queue for keeping activity records up to date.

## Run it locally

You need **Git**, **Node.js 20.19 or newer**, and npm. From a terminal, run:

```sh
git clone https://github.com/xpro-shell/Personal-Time-Tracker.git
cd Personal-Time-Tracker
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser. To stop the development server, press **Ctrl+C** in the terminal.

The repository allows the `esbuild` install script because Vite needs it to install its platform binary. Other dependency install scripts are not automatically approved. If npm reports blocked scripts, review the package names and approve only the scripts you trust.

## Features

- Track study against a 6-hour daily target and breaks against a 2-hour quota.
- Log sleep and custom habits, including music practice.
- Review daily activity in a timeline and visual analytics.
- Track achievements, reconcile missed time, and manage carry-forward or archived study debt.
- Use the review queue to resolve untracked or uncertain time.
- Use the app offline; activity and settings are stored in the browser on that device.
- Install as a Progressive Web App in supported browsers.

## Recent updates

### November 16, 2026

- Added more visual design and color choices, including background options such as Studio Light, to suit different preferences.
- Added a quick way to start logging activities beyond study, such as watching television, using a shortcut available by swiping from the left on mobile or hovering at the left edge on desktop.
- Removed outdated files and the WhatsApp importer, and refreshed the review queue so it starts blank and is ready for items that need attention.
- Added hourly prompts to record what you did. Untracked hours can be sent to the review queue, where users can choose how to handle them.
- Fixed the introduction flow so the app waits for the user to tap before continuing when prompted to “Tap anywhere to continue.”

### v2.0 "Level Up" (18 Nov 2026)

**✨ New**
- **Pause button:** every timer now has a Pause button.
- **Growth Chatbot (Beta):** a small circle button in Progress and Graphs. Ask it things like "How much did I grow this week?" or "What's my all-time progress?". It's still in testing, so answers may not be perfect yet.
- **Active Desk Time tracking:** your desk time is now tracked and shows in Progress and Graphs.
- **What's New popup:** after you update, you'll see what changed the first time you open the app.

**🎨 Better Look**
- Studio Light colours now change smoothly.
- More stylish and royal fonts in the Studio Light bundle.
- Cleaner headings: "Desk Center", day names, dates and other text now have the right size and importance.

**📊 New Progress and Graphs**
- The old timeline and heatmap are removed because they were too complicated.
- The new Progress section is simple and easy to read.
- Every activity on the Home page has a small button to see its progress by week, month or year.
- New templates in the Progress section, like Studio Light, so you can pick the look you like.
- Hourly progress is easier to see.

**🛠 Fixes and Improvements**
- **Vault** now shows This Week's lost time by default. You can switch to Total or Past time.
- **Sleep logging fixed:** you can now log sleep at any time, like 1 AM to 10 AM. Before, it only worked if you slept before 12 AM and woke up after.
## Optional configuration

Most local tracking features do not require a `.env` file. Some AI Studio or Gemini-powered functionality may need a Gemini API key and deployment-specific configuration. See [`.env.example`](.env.example) for available settings.

## Developer commands

```sh
npm run build   # Build for production
npm run preview # Preview the production build locally
npm run lint    # Check TypeScript
```

This repository currently does not list a software license. Ask the owner before redistributing it.
