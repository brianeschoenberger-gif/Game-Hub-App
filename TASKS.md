# Daily Arcade MVP Tasks

## Phase 1: Foundation
- [x] Create static route shell (`/`, `/game`, `/play`, `/archive`).
- [x] Add shared dark theme and responsive layout primitives.
- [x] Add top-level nav and page containers.

## Phase 2: Metadata System
- [x] Define `data/games.json` with MVP content model fields.
- [x] Implement metadata loader/filter/sort helpers.
- [x] Implement reusable game card and hero renderers.

## Phase 3: Core Experience
- [x] Render featured "Today" hero on home page.
- [x] Render home rows (Today, New This Week, Archive).
- [x] Render game detail route by slug.
- [x] Render player route with embedded iframe.
- [x] Render archive grid from metadata.

## Phase 4: Initial Content
- [x] Integrate one playable mini-game (`Headline Dodge`).
- [x] Seed additional placeholder titles for row depth.

## Phase 5: Validation + Deployment Readiness
- [x] Add smoke checks for metadata and JS syntax.
- [x] Verify responsive behavior with browser screenshot.
- [x] Ensure subpath-safe links and metadata fetches for static hosting.
- [x] Add hosting-specific CI deploy workflow (optional post-MVP).
