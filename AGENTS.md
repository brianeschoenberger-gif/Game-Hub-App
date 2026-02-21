# AGENTS.md

This file captures practical guidance for working in `Game-Hub-App`.

## Why This File Exists

Good idea. This repo now has enough moving parts (hub shell, metadata-driven routing, many embedded games, GitHub Pages deployment) that small mistakes can break production behavior. This file is a guardrail.

## Repo Truths

- The hub is static HTML/CSS/ES modules. No bundler for hub pages.
- Game discovery is metadata-driven from `data/games.json`.
- Only games with `"status": "published"` appear in Home/Archive.
- GitHub Pages deploy is automated from `.github/workflows/static.yml`.

## Lessons Learned

1. Cache can make fixes look "not working"
- Browsers aggressively cache module scripts.
- We now use `src/app-version.js` and dynamic import versioning in:
  - `index.html`
  - `archive.html`
- If UI/module changes appear stale, bump `APP_VERSION`.

2. Never copy full external repos into `games/` as-is
- Remove non-runtime artifacts before commit:
  - `.git`, `.github`, `node_modules`, `dist` (unless using dist-only runtime), build configs, README, local scripts.
- Keep only files required to run in static hosting.

3. Static-host path correctness matters
- Use relative or module-resolved paths.
- Absolute root assumptions often fail on nested/static hosts.

4. Metadata hygiene is critical
- A wrong `status` hides games unexpectedly.
- `gamePath` and `thumbnailUrl` must exist on disk for published entries.
- `releaseDate` should be valid ISO-like dates (`YYYY-MM-DD`).

5. Embedded games need safety boundaries
- Player iframe now uses sandbox + explicit allow list in `src/player.js`.
- Do not remove these attributes unless intentionally broadening trust.

6. Avoid injecting raw metadata into `innerHTML`
- Hub rendering now escapes metadata via `src/sanitize.js`.
- Keep using escaped output for any user/content-driven fields.

7. Runtime dependencies should be local when possible
- `Get-Muduro` now vendors Three.js locally.
- Prefer local pinned assets over CDN runtime dependencies.

## Publishing a New Game (Checklist)

1. Place runtime-ready game in `games/<Slug-Date>/`.
2. Ensure `index.html` launches correctly from static hosting.
3. Remove unnecessary repo/build/dev files.
4. Add thumbnail to `assets/thumbnails/`.
5. Add metadata entry in `data/games.json`:
   - unique `id`
   - `slug`
   - valid `releaseDate`
   - `thumbnailUrl`
   - `gamePath`
   - `status: "published"` (or `draft` to hide)
6. Validate:
   - metadata JSON parses
   - published `gamePath` files exist
   - published thumbnails exist
7. If module changes are not reflected in production, bump `APP_VERSION`.

## Review Focus (When Asked for "Review")

Prioritize:
- behavioral regressions
- metadata integrity
- static-host path safety
- iframe safety/sandboxing
- deployment artifact scope
- missing validation/tests

## Operational Notes

- Keep commits focused and small.
- Avoid destructive git commands.
- Do not revert unrelated user changes.
