# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (localhost:5173)
npm run build    # production build → dist/index.html (single inlined file)
npm run lint     # ESLint across src/
```

There are no tests. The build output is a **single self-contained `dist/index.html`** (via `vite-plugin-singlefile`) — all JS and CSS are inlined. This is what gets deployed to GitHub Pages on every push to `main`.

## Architecture

**Aura** is a browser new-tab dashboard. It is a pure client-side React + Vite SPA with no backend.

### State management

All settings live in a single React context (`src/context/SettingsContext.jsx`) backed by `localStorage`. The context is provided at the root in `main.jsx` and consumed via the `useSettings()` hook (`src/context/useSettings.js`). The shape is defined in `src/context/settingsConstants.js` (themes, fonts).

Large binary backgrounds (GIF/video/image) are stored in **IndexedDB** (`dashDB` / object store `s` / key `'bg'`) because `localStorage` can't hold binary data. On boot, `SettingsContext` reads from IndexedDB and creates a blob URL; cleanup (`URL.revokeObjectURL`) is handled in a paired `useEffect`.

### Persistence keys

All `localStorage` keys are prefixed `dash_`. Widget visibility keys follow the pattern `dash_show_<widget>` and default to `true` (checked with `!== 'false'`). The anime schedule cache uses a versioned key (`dash_anime_schedule_v2`) to avoid stale format issues.

### Component layout

`App.jsx` composes the layout: a full-screen background (video element or CSS `background-image`), an idle-fade system (2-minute inactivity dims UI to 20% opacity via CSS variable `--ui-opacity`), and three regions:

- **Top-right**: `WeatherWidget` (absolute positioned)
- **Center-left**: `.container` — `Greeting`, `Clock`, `Quote`, `SearchBox`, `SpeedDial`, `AnimeSchedule` (top-5 inline mode)
- **Bottom-left**: `SettingsPanel` toggle + panel; `LofiPlayer` (centered bottom)
- **Right edge**: `AnimeSchedule` sidebar (portal into `#mainUi`)

### External APIs

| Feature | API | Caching |
|---|---|---|
| Weather | open-meteo.com (free, no key) | `localStorage` coords for 1 h |
| IP geolocation fallback | ipapi.co (HTTPS, free) | same coords cache |
| Anime schedule | Jikan v4 (`api.jikan.moe/v4/schedules`) | `localStorage` per-day for 1 h |
| MAL watching list | MAL JSON endpoint via allorigins/codetabs/Jikan (race) | `localStorage dash_anime_watching` |
| Search suggestions | Google JSONP (`suggestqueries.google.com`) | none |
| Lofi titles | noembed.com | none |
| Lofi/trailer playback | YouTube IFrame API (postMessage) | n/a |

Weather location priority: GPS → IP geolocation → manual fallback city (settings).

### Theming

CSS custom properties `--accent-color` and `--accent-glow` drive the color theme. The `aurora` theme mutates them on a 1-minute interval based on hour-of-day. Other themes set them statically. Font changes inject a `<link>` into `<head>` and update `--font-family`.

### Key patterns

- All components are wrapped in `React.memo` (imported as `memo`).
- Modern JSX transform is active — no `import React` needed, use named imports only.
- `AnimeSchedule` renders in two modes controlled by settings: inline top-5 list (inside `.container`) and a full sidebar (portaled into `#mainUi`). Both modes can be active simultaneously.
- The `SettingsPanel` uses two separate file input refs: `bgFileInputRef` (accepts GIF/video/image) and `importFileInputRef` (accepts `.json` settings backup). Keep them separate — they have different `accept` attributes and `onChange` handlers.
- WMO weather codes are used throughout (`WeatherWidget` for icons, `Greeting` for text modifiers). Full code range: 0=clear, 1–3=cloudy, 45–48=fog, 51–57=drizzle/freezing, 61–67=rain/freezing, 71–77=snow, 80–82=showers, 85–86=snow showers, 95=thunderstorm, 96–99=thunderstorm+hail.
