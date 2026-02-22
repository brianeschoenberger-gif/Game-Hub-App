# Task.md

## Project Task List
This file tracks milestone-based implementation for the Monk Awakening prototype.

## Milestone 0 - Playable Exploration Vertical Slice (Current Goal)

### M0.1 Project Setup
- [ ] Create Vite project
- [ ] Install Babylon.js
- [ ] Set up ES module structure
- [ ] Create base folder structure (`core`, `systems`, `entities`, `scenes`, `config`)
- [ ] Add README with run instructions

### M0.2 Core App Bootstrap
- [ ] Create Babylon engine + canvas bootstrap
- [ ] Create main render loop
- [ ] Add window resize handling
- [ ] Add scene initialization flow

### M0.3 Monastery Prototype Level
- [ ] Create sleeping cell area
- [ ] Create hallway and courtyard area
- [ ] Create shrine and altar area
- [ ] Add collidable walls and obstacles
- [ ] Add basic ground and floor meshes
- [ ] Add placeholder materials (stone/wood/cloth colors)

### M0.4 Player Controller
- [ ] Add WASD movement
- [ ] Add sprint (Shift)
- [ ] Add jump (Space)
- [ ] Add smooth acceleration/deceleration
- [ ] Add smooth player rotation toward movement direction
- [ ] Add gravity and grounded checks

### M0.5 Third-Person Camera
- [ ] Add follow camera
- [ ] Add mouse orbit/look
- [ ] Tune distance/height
- [ ] Add smoothing
- [ ] Add basic camera obstruction handling (if feasible in M0)

### M0.6 UI and Flow
- [ ] Add start screen with Play button
- [ ] Add objective text ("Explore the monastery")
- [ ] Add story message UI box
- [ ] Add subtle fade-in when gameplay starts

### M0.7 Shrine Trigger (Prototype Moment)
- [ ] Add trigger zone at shrine
- [ ] Fire story event when player enters trigger
- [ ] Show text: "A distant bell rings. Something calls you beyond the monastery."
- [ ] Mark prototype objective complete

### M0.8 Polish and Cleanup
- [ ] Tune movement feel
- [ ] Tune camera feel
- [ ] Improve lighting atmosphere (warm dawn)
- [ ] Remove obvious bugs
- [ ] Confirm code organization is clean

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
