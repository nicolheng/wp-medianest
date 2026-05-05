# Architectural Audit and Performance Strategy

## 1. Architectural "Mess" Summary

The current `wp-entertainment` frontend is a vanilla JavaScript Multi-Page Application (MPA) built with Vite, suffering from a tightly coupled "Big Ball of Mud" architecture. Key issues include:

- **God Files:** Files like `api.js`, `details.js`, and `profile.js` are bloated (10KB+), mixing API communication, state management (caching), UI rendering logic, and event handling into single modules. 
- **Global State Contamination:** State is heavily reliant on the `window` object (`window.currentUser`, `window.userLibrary`, `window.addToWatchlist`, etc.). This breaks encapsulation and makes state mutations unpredictable and difficult to trace.
- **Tight Coupling:** The logic in `library.js` and `api.js` is tightly coupled to specific DOM elements. For example, `refreshUI()` contains hardcoded checks like `if (document.getElementById("libraryTabContent"))`.
- **Lack of Componentization:** UI rendering is handled imperatively via string interpolation (e.g., `renderRail`), leading to duplicated markup and poor maintainability.

## 2. Proposed Modular Directory Structure

To separate concerns (Business Logic, UI Components, API, and State), we should refactor the `src` directory into a feature-based and layered architecture:

```text
src/
├── api/                  # Pure API call definitions (No UI/DOM logic)
│   ├── config.js         # Tokens and base URLs
│   ├── tmdb.js           # Movie/TV endpoints
│   ├── library.js        # Backend user library interactions
│   └── music.js          # Last.fm endpoints
├── components/           # Reusable UI generation functions/classes
│   ├── ui/               # Generic UI (Buttons, Modals, Loaders)
│   ├── ItemCard.js       # Media item cards
│   └── Rail.js           # Horizontal scrolling lists
├── core/                 # Business logic and global state
│   ├── auth.js           # Authentication flows
│   ├── store.js          # Centralized state (replaces window.currentUser)
│   └── cache.js          # In-memory itemCache management
├── pages/                # Page-specific controllers
│   ├── home/             # main.js equivalent
│   ├── library/          # library.js equivalent
│   ├── details/          # details.js equivalent
│   └── search/           # search.js equivalent
├── utils/                # Pure helper functions
│   ├── dom.js            # DOM manipulation helpers
│   └── formatters.js     # Date/String formatters
├── styles/               # SCSS files (formerly scss/)
└── *.html                # Entry points
```

## 3. UI Performance Optimization Strategy (`refreshUI`)

The current `refreshUI` function is a significant performance bottleneck. When a user modifies their library, the app re-fetches the entire library, iterates through every item, resolves missing data via `Promise.allSettled`, and forcefully completely re-renders large DOM trees.

### Step-by-Step Optimization Strategy:

**Step 1: Eliminate the Global `refreshUI` Check-All Function**
Remove the global DOM presence checks (`if (document.getElementById(...))`). Instead, pages should subscribe to data changes and handle their own isolated updates. 

**Step 2: Targeted DOM Manipulation (Partial Updates)**
Currently, adding an item to the watchlist recreates the entire HTML string for the rail and replaces it via `innerHTML`. 
- **Fix:** When adding or removing a single item, use targeted DOM methods (`appendChild`, `remove()`, or `insertAdjacentHTML`) to modify only the specific `div` of the affected card, leaving the rest of the rail untouched.

**Step 3: Optimistic UI Updates**
Instead of waiting for `fetchFullLibrary()` to resolve before updating the UI:
- **Fix:** Update the DOM immediately when the user clicks "Add to Watchlist". Send the API request in the background. If the request fails, revert the DOM change and show a toast error.

**Step 4: Centralized State Observers**
Stop assigning variables to the `window` object. 
- **Fix:** Create a basic Pub/Sub or observable `Store`. When `store.addWatchlist(item)` is called, it emits an event. Only the specific UI components listening for that event will trigger a micro-render.

**Step 5: Decouple Caching from Rendering**
The `itemCache` in `api.js` helps prevent duplicate network calls, but `getSafeData()` still heavily processes data on every refresh.
- **Fix:** Store fully constructed UI models in the state upon initial load. Updates should append to this local state array rather than re-mapping and re-evaluating the entire watchlist.

## User Review Required

> [!IMPORTANT]
> The proposed architecture keeps the vanilla JS + Vite setup but structures it cleanly. Would you like to proceed with this vanilla JS refactoring plan, or were you considering migrating to a framework like React/Next.js to handle state and components more natively? Please let me know your preference before we execute any changes!
