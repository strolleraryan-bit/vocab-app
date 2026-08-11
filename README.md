# Vocab by Aryan — Installable App Package

This folder is a complete PWA (Progressive Web App). Once deployed to any
static host, it can be **installed like a native app** on Android, iOS,
Windows, macOS, and Linux — with an app icon, offline launch, and no browser
address bar.

## What's inside

```
vocab-pwa/
├── index.html                     → the app itself
├── manifest.json                  → app name, icons, theme colors (what makes it "installable")
├── sw.js                          → service worker (enables offline app-shell + icon caching)
├── netlify.toml                   → tells Netlify where the serverless function lives
├── netlify/functions/lookup.js    → serverless function that calls the Anthropic API (keeps your key private)
└── icons/                         → app icons in all required sizes (incl. Android maskable)
```

## 1. Deploy it to Netlify

The word-lookup feature needs a **serverless function** to call the Anthropic
API (this keeps your API key off the public internet). Plain drag-and-drop
deploys don't reliably build functions, so use one of these instead:

### Option A — Netlify CLI (fastest)
1. `npm i -g netlify-cli`
2. Inside the `vocab-pwa` folder, run `netlify deploy --prod`
3. Follow the prompts to create/link a site

### Option B — Git-based deploy (recommended for updates)
1. Push this folder's contents to a GitHub repo
2. In Netlify: **Add new site → Import an existing project** → pick the repo
3. Build settings can stay blank (there's no build step) — Netlify auto-detects
   `netlify/functions` from `netlify.toml`

### After deploying — set your API key
1. In the Netlify dashboard, go to **Site configuration → Environment variables**
2. Add a variable: `ANTHROPIC_API_KEY` = your key (from https://console.anthropic.com)
3. Redeploy the site (Deploys → Trigger deploy) so the function picks it up

Without this env var set, the "Add word" lookup will fail with a clear error
message telling you the key is missing — everything else in the app still
works.

## 2. Install it on your device

Once the deployed link is open in a browser:

- **Android (Chrome):** Tap the **⤓ Install** button in the app header, or
  tap the browser menu (⋮) → "Install app" / "Add to Home screen"
- **iPhone/iPad (Safari):** Tap the Share icon → "Add to Home Screen"
- **Windows/Mac/Linux (Chrome or Edge):** Look for the install icon (⊕ / monitor
  icon) in the address bar, or use the **⤓ Install** button in the app

After installing, the app opens full-screen from your home screen / app
drawer / start menu — no browser UI, with its own icon, exactly like a native app.

## Notes

- The word-lookup feature (Hindi meaning, definitions, usage examples) calls
  the Anthropic API through the `lookup` serverless function and **requires
  an internet connection** plus the `ANTHROPIC_API_KEY` env var (see above).
  Already-added words, editing, backup, and restore all work fully offline
  once the app has been opened at least once.
- Your word list is stored locally on your device (`localStorage`). Use the
  **Backup** button regularly to export a JSON copy, and **Restore** to bring
  it back on a new device or after clearing browser data.
- To update the app later, just re-deploy the changed `index.html` — the
  service worker will automatically fetch and cache the new version on next
  load.
