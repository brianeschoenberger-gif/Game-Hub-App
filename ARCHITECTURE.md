# Daily Arcade Architecture (MVP)

## High-Level Approach
A static, metadata-driven web hub built with vanilla HTML/CSS/ES modules to keep deployment and daily shipping friction low.

## Directory Layout
- `index.html`: home browse experience.
- `game.html`: game details route.
- `play.html`: embedded player route.
- `archive.html`: full game library.
- `data/games.json`: source of truth for game metadata.
- `src/data.js`: metadata loading, sorting, and lookup helpers.
- `src/ui.js`: reusable renderers (hero, card, empty state).
- `src/*.js`: per-page orchestration logic.
- `games/`: playable game artifacts.

## Data Model
Each game entry includes:
- `id`, `slug`, `title`, `releaseDate`
- `description`, `newsTopic`, `tags`
- `thumbnailUrl`, `bannerUrl`
- `gamePath`, `featured`, `status`, `durationEstimate`

`loadGames()` filters to published games and sorts newest-first.

## Route/Flow Model
1. **Home** fetches metadata and builds hero + browse rows.
2. **Detail** receives slug query parameter and renders full metadata.
3. **Play** receives slug query parameter and embeds `gamePath` in an iframe.
4. **Archive** shows all published entries in one grid.

## Why This Architecture
- **Fast iteration:** no build step required for basic content updates.
- **Consistent shell:** cards, hero, and nav patterns reused across routes.
- **Flexible embedding:** games can be local pages or hosted elsewhere via URL.
- **Static hosting ready:** works on Netlify/Vercel/GitHub Pages-style environments.

## Scale Notes (Post-MVP)
- Move from static JSON to lightweight CMS/source generation.
- Add lazy loading for thumbnails and pagination for archive growth.
- Introduce analytics and a normalization layer for mixed game runtimes.
