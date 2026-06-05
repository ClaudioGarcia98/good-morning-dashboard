# CSS Split Plan - Modularizing index.css

This document outlines the plan to split the monolithic `src/index.css` (1.7k lines) into component-specific CSS files for better maintainability and code organization.

## 1. Global Styles (Remaining in `src/index.css`)
Global shell styles, theme variables, resets, layout structures, and page animations will remain in the root `src/index.css`:
* **Reset**: CSS resets and global `:root` CSS variables.
* **Load Animations & Accessibility**: Global screen-reader classes and entry animations.
* **Body & UI Layer**: Standard layouts for main elements.
* **Main Container**: Outer shell styles for the dashboard container.
* **Boot Screen**: Loading shell logo and entry text.

---

## 2. Component-Specific Extractions

Below are the new CSS files that will be created and imported into their respective JSX components:

| Component | Target CSS File | Sections Extracted |
| :--- | :--- | :--- |
| `Greeting.jsx` | `src/components/Greeting.css` | greeting styles |
| `Clock.jsx` | `src/components/Clock.css` | clock row, digital/analog face styling |
| `SearchBox.jsx` | `src/components/SearchBox.css` | search inputs, shortcuts, typing indicator, suggestions dropdown |
| `SpeedDial.jsx` | `src/components/SpeedDial.css` | circular speed-dial action menus, items, hover tags |
| `Quote.jsx` | `src/components/Quote.css` | quote typography, refresh animations |
| `WeatherWidget.jsx` | `src/components/WeatherWidget.css` | weather status layout, SVG icons, floating weather keyframe animations |
| `SettingsPanel/index.jsx` | `src/components/SettingsPanel/SettingsPanel.css` | sidebar slider menu, toggles, font/theme pill pickers, file upload box |
| `AnimeSchedule/index.jsx` | `src/components/AnimeSchedule/AnimeSchedule.css` | "Today's Launch" schedule cards, details drawer, synopsis expander |
| `LofiPlayer.jsx` | `src/components/LofiPlayer.css` | audio playback controls, volume slider, visualizer bar |

---

## 3. How to Import

Inside each `.jsx` file, the corresponding CSS will be imported directly:
```javascript
import './[ComponentName].css';
```
Since Vite bundles CSS automatically, this modular structure will compile into a single optimized CSS asset during build time.
