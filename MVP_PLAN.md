# MVP Plan: Daily Arcade Vertical Slice

## Objective
Ship a deployment-ready vertical slice that demonstrates the core Daily Arcade loop: browse → inspect details → play instantly.

## Scope of This Slice
1. **Metadata-driven library** backed by `data/games.json`.
2. **Netflix-style home page** with hero and multiple rows.
3. **Game detail page** with core metadata and launch action.
4. **Embedded player page** for instant in-browser play.
5. **Archive page** for replaying older games.
6. **One playable integration** (`Headline Dodge`) + placeholders for additional titles.

## Implementation Milestones
1. Create app shell routes/pages (`/`, `/game.html`, `/play.html`, `/archive.html`).
2. Add reusable data/UI modules for loading metadata and rendering cards.
3. Implement responsive dark premium styling.
4. Integrate first playable mini-game under `/games/headline-dodge/`.
5. Seed metadata with 3 sample entries for realistic browse density.
6. Validate route flow, subpath-safe linking, and player embedding locally.

## Creator Workflow (Add a New Game)
1. Add game build/page under `games/<slug>/index.html` (or external URL).
2. Add metadata object in `data/games.json`.
3. Set `status: "published"` and optionally `featured: true`.
4. Refresh app; game appears automatically in rows and archive.

## Acceptance Criteria
- Home page displays featured item and multiple rows from metadata.
- Clicking card opens detail page for that slug.
- Play action launches embedded game iframe.
- Archive shows all published games sorted by newest.
- New metadata entry appears without UI code changes.
- App routes and metadata loading work on static-host subpaths (not only domain root).
