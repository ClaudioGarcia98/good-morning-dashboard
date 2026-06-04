# Test Coverage Manifest & Checklist

This file contains a manifest of all components, utilities, hooks, and services that lack direct test coverage files in the repository.

## Components
- [x] `src/App.jsx` (Core orchestrator component; test file at `src/__tests__/App.test.jsx`)
- [x] `src/components/AnimeSchedule/AnimeCard.jsx` (Sub-component of AnimeSchedule; test file at `src/components/AnimeSchedule/__tests__/AnimeCard.test.jsx`)
- [x] `src/components/AnimeSchedule/Sidebar.jsx` (Sub-component of AnimeSchedule; test file at `src/components/AnimeSchedule/__tests__/Sidebar.test.jsx`)
- [x] `src/components/AnimeSchedule/TrailerPreview.jsx` (Sub-component of AnimeSchedule; test file at `src/components/AnimeSchedule/__tests__/TrailerPreview.test.jsx`)

## Hooks
- [x] `src/hooks/useBackgroundLoader.js` (Loads background assets from IndexedDB; test file at `src/hooks/__tests__/useBackgroundLoader.test.js`)
- [x] `src/hooks/useFontEffect.js` (Applies dynamic font styles/links to document head; test file at `src/hooks/__tests__/useFontEffect.test.js`)
- [x] `src/hooks/useThemeEffect.js` (Applies time-based and static theme variables; test file at `src/hooks/__tests__/useThemeEffect.test.js`)

## Stores & Contexts
- [x] `src/stores/useSettingsStore.js` (Zustand settings store; dedicated test file at `src/stores/__tests__/useSettingsStore.test.js`)
- [x] `src/context/settingsConstants.js` (Theme and font definitions constants; test file at `src/context/__tests__/settingsConstants.test.js`)

## Entry Point
- [x] `src/main.jsx` (Application bootstrap and DOM mounting entry point; test file at `src/__tests__/main.test.jsx`)
