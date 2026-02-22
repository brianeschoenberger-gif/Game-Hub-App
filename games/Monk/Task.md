# Task.md

## Project Task List
This file tracks milestone-based implementation for the Monk Awakening prototype.

## Milestone 0 - Playable Exploration Vertical Slice (Current Goal)

### M0.1 Project Setup
- [x] Create Vite project
- [x] Install Babylon.js
- [x] Set up ES module structure
- [x] Create base folder structure (`core`, `systems`, `entities`, `scenes`, `config`)
- [x] Add README with run instructions

### M0.2 Core App Bootstrap
- [x] Create Babylon engine + canvas bootstrap
- [x] Create main render loop
- [x] Add window resize handling
- [x] Add scene initialization flow

### M0.3 Monastery Prototype Level
- [x] Create sleeping cell area
- [x] Create hallway and courtyard area
- [x] Create shrine and altar area
- [x] Add collidable walls and obstacles
- [x] Add basic ground and floor meshes
- [x] Add placeholder materials (stone/wood/cloth colors)

### M0.4 Player Controller
- [x] Add WASD movement
- [x] Add sprint (Shift)
- [x] Add jump (Space)
- [x] Add smooth acceleration/deceleration
- [x] Add smooth player rotation toward movement direction
- [x] Add gravity and grounded checks

### M0.5 Third-Person Camera
- [x] Add follow camera
- [x] Add mouse orbit/look
- [x] Tune distance/height
- [x] Add smoothing
- [x] Add basic camera obstruction handling (if feasible in M0)

### M0.6 UI and Flow
- [x] Add start screen with Play button
- [x] Add objective text ("Explore the monastery")
- [x] Add story message UI box
- [x] Add subtle fade-in when gameplay starts

### M0.7 Shrine Trigger (Prototype Moment)
- [x] Add trigger zone at shrine
- [x] Fire story event when player enters trigger
- [x] Show text: "A distant bell rings. Something calls you beyond the monastery."
- [x] Mark prototype objective complete

### M0.8 Polish and Cleanup
- [x] Tune movement feel
- [x] Tune camera feel
- [x] Improve lighting atmosphere (warm dawn)
- [x] Remove obvious bugs
- [x] Confirm code organization is clean

### Milestone 0 Acceptance Checklist
- [ ] Average frame rate >= 55 FPS in desktop Chrome/Edge
- [ ] No recurring frame spikes > 50 ms during traversal
- [ ] Camera clipping is rare and short
- [ ] Shrine trigger fires exactly once per run
- [ ] New player can complete prototype in <= 5 minutes

## Milestone 1 - Feel Polish (Next)
- [ ] Refine movement tuning (responsive but grounded)
- [ ] Improve jump arc and landing feel
- [ ] Improve camera collision and obstacle behavior
- [ ] Add subtle camera lag and rotation smoothing
- [ ] Add simple ambient particles (dust/light motes)
- [ ] Add basic ambient audio and bell SFX

## Milestone 2 - Character and Animation
- [ ] Replace placeholder player with monk character model (GLB)
- [ ] Add idle/run/jump animations
- [ ] Add animation blending
- [ ] Align movement/camera with animation pacing

## Milestone 3 - Prototype Expansion
- [ ] Add one more story trigger
- [ ] Add monastery gate and exterior tease
- [ ] Add interactable object (scroll, bell, candle, etc.)
- [ ] Add simple checkpoint/reset flow (session-only, no save system)

## Notes for Codex
- Work milestone by milestone
- Do not build future systems early
- Prioritize feel and clarity over extra features
