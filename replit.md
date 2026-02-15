# AI Detective — Interrogation Room

## Overview
A browser-based detective game built with vanilla JavaScript and Vite. Players investigate "Case #2847: Murder at the Grand Meridian Hotel" by interrogating suspects in a noir-themed interrogation room.

## Project Architecture
- **Frontend only** — static site served by Vite dev server
- **Build tool**: Vite 6
- **Language**: Vanilla JavaScript (ES modules)
- **Styling**: Plain CSS (`style.css`)

## Key Files
- `index.html` — Main HTML structure (game UI, overlays, HUD)
- `main.js` — Game logic (suspect lineup, interrogation, mouth animation, demo responses)
- `style.css` — All styling
- `vite.config.js` — Vite config (host 0.0.0.0, port 5000, allowedHosts)
- `public/assets/characters/` — Character sprite images (mouth_open/mouth_closed PNGs)

## Character Pool
8 characters with mouth-open/mouth-closed PNG sprites. 5 are randomly selected per game session.

## Running
- Dev: `npm run dev` (Vite on port 5000)
- Build: `npm run build` (outputs to `dist/`)
- Deployment: Static site from `dist/` directory
