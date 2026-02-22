# TechSpec.md

## Tech Stack
- Engine/Framework: Babylon.js
- Bundler/Dev Server: Vite
- Language: JavaScript (ES modules)
- Assets: Placeholder meshes initially (primitive geometry), later GLB/GLTF
- Target Platform: Desktop web first (mobile optional later)
- Rendering Goal: Browser-friendly, smooth performance

## Project Goals
- Fast iteration in VS Code with Codex
- Clean modular architecture
- Keep systems simple and extendable
- Prioritize gameplay feel and performance over feature count

## Folder Structure

```text
src/
  core/
    game.js                 # bootstrap, engine, render loop
    app.js                  # app entry / top-level wiring
  config/
    gameConfig.js           # movement, camera, tuning values
  scenes/
    monasteryScene.js       # level creation and setup
  entities/
    player/
      playerController.js
      playerInput.js
      playerFactory.js
  systems/
    cameraSystem.js
    uiSystem.js
    triggerSystem.js
    interactionSystem.js    # optional later
  assets/
    assetManifest.js        # future-proofing for loaded assets
  utils/
    math.js                 # optional helpers
    debug.js                # optional debug toggles
  main.js                   # Vite entry
```

## Core Technical Requirements

### 1) Rendering and Performance
- Keep geometry and materials lightweight
- Use simple placeholder meshes initially
- Avoid expensive post-processing in the prototype
- Target smooth desktop browser performance
- Keep draw calls and object count reasonable

### 2) Player Movement
- WASD movement
- Shift sprint
- Space jump
- Smooth acceleration/deceleration
- Player rotates smoothly toward movement direction
- Tunable values in config (not hardcoded in logic)

### 3) Camera
- Third-person follow camera
- Mouse orbit/look
- Tunable distance/height/smoothing
- Basic obstacle avoidance if feasible
- Camera should support future lock-on expansion

### 4) Level
- Small monastery layout with:
  - sleeping cell
  - hallway/courtyard
  - shrine area
- Static colliders for walls/obstacles
- Lighting supports warm morning atmosphere

### 5) UI
- Start screen with Play button
- Objective text display
- Story event text display
- Keep UI minimal and clean (HTML/CSS overlay or Babylon GUI)

## Code Quality Rules
- ES modules only
- Keep functions and files focused
- Avoid giant single-file implementations
- Use clear naming (no vague names like `thing`, `obj2`)
- Add comments only for non-obvious logic
- Prefer config-driven tuning values over scattered magic numbers

## Non-Goals
- No networking
- No save system
- No full physics simulation
- No complex animation controller in the prototype
- No art pipeline dependencies required to run

## Build and Hosting Notes
- Local dev:
  - `npm run dev`
- Production build:
  - `npm run build`
- Vite base/path for static hosting under `games/Monk/` must be configured explicitly in `vite.config.*`.
- All runtime asset references must resolve correctly when served from a nested path, not only from domain root.

## Browser Support
- Desktop support first (Chrome/Edge priority)
- Mobile support is optional and can degrade gracefully

## Milestone 0 Acceptance Targets
- Average frame rate >= 55 FPS during normal traversal
- No recurring frame spikes > 50 ms
- Scene loads and reaches playable state in <= 3 seconds on typical desktop hardware
- Shrine trigger event runs reliably once per run

## Future Technical Extensions
- Replace placeholder player mesh with GLB monk character
- Add animation state machine
- Add trigger/event framework for story beats
- Add audio manager
- Add scene transitions/level streaming
