# Architectural Blueprint & Specifications

## Overview
This blueprint outlines the planned architectural improvements and modifications for the "Good Morning Dashboard" (`aura`). After reviewing the current codebase, it is clear that the project has grown organically but currently suffers from several architectural flaws that limit scalability, maintainability, and cross-device synchronization.

## Identified Architectural Flaws
1. **Monolithic Components:** Files like `AnimeSchedule.jsx` (876 lines) and `SettingsPanel.jsx` (800+ lines) are excessively large. They mix API fetching, complex UI state (hover timers, expansion), local storage caching, and DOM portals.
2. **God Context (`SettingsContext.jsx`):** A single context provider is managing over 25 individual state variables and syncing them to `localStorage`. A single change (e.g., volume slider) triggers a re-render of any component consuming the context.
3. **Lack of Cross-Device Sync (Database):** All user preferences, including the background video (stored in `IndexedDB`) and UI toggles (stored in `localStorage`), are locked to the local browser.
4. **Scattered API Logic:** External API calls (e.g., Jikan API, AllOrigins proxies) are defined directly inside React `useEffect` hooks rather than in dedicated service files.

---

## Required Modifications

### 1. Database & Backend Integration
To resolve the lack of cross-device sync while ensuring a **100% free architecture**, we will migrate from `localStorage` to **Firebase**. We will utilize Firebase's Spark Plan which provides generous free limits. 

- **Database Modifications (Hybrid Approach):**
  - **Firebase Firestore:** Create a `users` collection and a `user_settings` collection referencing the `uid`.
  - **Lightweight Sync:** Migrate all existing text/boolean fields (`dash_theme`, `dash_font`, `dash_clock`, widget visibility, etc.) into a JSON schema in Firestore. This allows instant cross-device sync.
  - **Heavy Assets:** To prevent exceeding Firebase's 5GB free Cloud Storage limit, large background video blobs will *continue* to be stored locally in `IndexedDB`. If a user uploads a video, it stays on their device. Alternatively, we can allow users to provide public video URLs (e.g., Imgur) which *will* sync across devices since URLs are lightweight text.

### 2. Logic Changes (State Management)
- **Decouple SettingsContext:** Split `SettingsContext` into smaller, focused contexts (e.g., `ThemeContext`, `WidgetVisibilityContext`, `UserPreferencesContext`) or migrate to a global state manager like Zustand or Redux. This will drastically reduce unnecessary re-renders.
- **Service Layer for APIs:** Extract all `fetch()` logic out of components and into a new `src/services/` directory. For example, create an `animeService.js` to handle Jikan API calls, fallbacks, and caching.
- **Custom Hooks:** Move the complex logic for tracking idle state, trailer previews, and volume syncing into custom hooks (e.g., `useIdleTimer`, `useTrailerPreview`).

### 3. File Additions & Refactoring
- **[NEW] `src/services/api.js`**: Base API configuration.
- **[NEW] `src/services/animeService.js`**: Dedicated file for MyAnimeList and Jikan data fetching.
- **[NEW] `src/services/dbService.js`**: Abstraction layer for interacting with the new cloud database.
- **[NEW] `src/hooks/useAnimeSchedule.js`**: Extracted data-fetching hook for `AnimeSchedule.jsx`.
- **[NEW] `src/components/AnimeSchedule/`**: Move `AnimeSchedule.jsx` into a dedicated folder and split it into smaller components:
  - `AnimeSchedule/index.jsx`
  - `AnimeSchedule/AnimeCard.jsx`
  - `AnimeSchedule/Sidebar.jsx`
  - `AnimeSchedule/TrailerPreview.jsx`
- **[MODIFY] `src/context/SettingsContext.jsx`**: Refactor to rely on `dbService.js` for fetching initial state rather than `localStorage`.

## Next Steps
This blueprint is open for debate. Some decisions (such as the exact database provider and the scope of the backend migration) require your input. 
