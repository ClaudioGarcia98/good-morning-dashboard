# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server at localhost:5173
npm run build    # production build → dist/index.html (single inlined file)
npm run preview  # preview the production build locally
npm run lint     # ESLint across src/
```

No test suite exists. The build output is a **single self-contained `dist/index.html`** (via `vite-plugin-singlefile` — all JS and CSS inlined). This is deployed to GitHub Pages automatically on every push to `main`.

## Architecture

**Aura** is a browser new-tab dashboard — a pure client-side React + Vite SPA with no backend.

### State & persistence

All settings live in a single React context (`src/context/SettingsContext.jsx`) backed by `localStorage`, consumed everywhere via `useSettings()` (`src/context/useSettings.js`). Theme and font definitions are in `src/context/settingsConstants.js`.

- All `localStorage` keys are prefixed `dash_`. Widget visibility keys use `dash_show_<widget>` and default to `true` (read with `!== 'false'`).
- Binary backgrounds (GIF/video/image) are stored in **IndexedDB** (`dashDB`, object store `s`, key `'bg'`) because `localStorage` can't hold binaries. On boot `SettingsContext` reads it and creates a blob URL; a paired `useEffect` calls `URL.revokeObjectURL` on cleanup.
- The anime schedule cache uses a versioned key (`dash_anime_schedule_v2`).

### Layout

`App.jsx` composes four regions:

- **Full-screen background** — `<video>` element (video files) or CSS `background-image` (images). Controlled by `backgroundIsVideo` flag.
- **Top-right** — `WeatherWidget` (absolute positioned, portals its detail panel inline)
- **Center-left** — `.container` div holding `Greeting`, `Clock`, `Quote`, `SearchBox`, `SpeedDial`, and optionally `AnimeSchedule` in inline top-5 mode
- **Bottom** — `SettingsPanel` (bottom-left toggle + panel) and `LofiPlayer` (centered)
- **Right edge** — `AnimeSchedule` sidebar, portaled into `#mainUi`

An idle system in `App.jsx` dims the UI to 20% opacity (CSS var `--ui-opacity`) after 2 minutes of inactivity and dispatches an `app-idle` window event that components listen to for self-closing.

### AnimeSchedule dual-mode

`AnimeSchedule` renders in two independent modes simultaneously based on settings: an inline top-5 list (inside `.container`) and a slide-in sidebar (portaled into `#mainUi`). Both share the same component instance and state.

### External APIs

| Feature | API | Notes |
|---|---|---|
| Weather | `api.open-meteo.com` | Free, no key. Coords cached in `localStorage` for 1 h. |
| IP geolocation fallback | `ipapi.co` | HTTPS, free. Used when GPS is denied. |
| Anime schedule | `api.jikan.moe/v4/schedules` | Per-day cache for 1 h. |
| MAL watching list | MAL JSON endpoint | Fetched via allorigins → codetabs → Jikan (parallel race with 1.5 s timeout). |
| Search suggestions | `suggestqueries.google.com` | JSONP (dynamic `<script>` injection). |
| Lofi/trailer playback | YouTube IFrame API | Controlled via `postMessage`. |

Weather location priority: GPS → IP geolocation → manual fallback city (from settings).

### Theming

`--accent-color` and `--accent-glow` CSS custom properties drive the color theme. The `aurora` theme updates them on a 1-minute interval by hour-of-day; all others set them statically. Font changes inject a `<link>` into `<head>` and update `--font-family`.

### Key patterns

- All components use `memo` (named import) — no `import React` anywhere except `main.jsx` (`React.StrictMode`).
- `SettingsPanel` has **two separate file input refs**: `bgFileInputRef` (accepts GIF/video/image) and `importFileInputRef` (accepts `.json`). They must stay separate — same ref was a critical bug.
- WMO weather codes appear in both `WeatherWidget` (icons) and `Greeting` (text modifiers): 0=clear, 1–3=cloudy, 45–48=fog, 51–57=drizzle, 61–67=rain, 71–77=snow, 80–82=showers, 85–86=snow showers, 95=thunderstorm, 96–99=thunderstorm+hail.
