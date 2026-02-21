# Product Brief: Multi-Genre "Mega Man Bass" Inspired Game

## Vision
Build a staged, playable game experience inspired by classic Mega Man pacing, starting with a tight **2D action-platformer** MVP and expanding over time into:
1. **2D RPG-style progression layer** (town/dialogue/quests/light stats), then
2. **First-person perspective chapters** for later game phases.

The goal is to ship in small, playable milestones where each phase is fun on its own and reuses as much code/content as possible.

---

## Milestone Roadmap (High Level)

### Milestone 1 (Now): 2D Platformer Playable Demo (MVP)
A short, polished "feel test" demo focused on movement + cannon shooting.

### Milestone 2: 2D RPG Layer
Add hub areas, NPC dialogue, mission flow, and persistent unlocks tied to platformer progression.

### Milestone 3: First-Person Sections
Introduce first-person maps/combat/exploration as a mode transition and late-game expansion.

---

## Milestone 1: Reasonably Doable MVP Scope

### Core Player Experience
- Side-scrolling 2D level with camera follow.
- Character can:
  - move left/right,
  - jump (with gravity and grounded detection),
  - fire a small cannon shot ("power ball") with a short cooldown.
- Cannon shots travel horizontally, despawn on timeout or collision.
- At least one basic enemy type with simple patrol behavior.
- Enemy takes hit(s), shows feedback, and is removed on defeat.
- Basic player health + damage on enemy contact.
- Start point and goal point (finish marker/door) to complete the demo.

### Level/Content Scope
- 1 short level (about 1–3 minutes for first-time clear).
- 2–3 platforming challenge moments (gap jump, elevated platform, enemy placement).
- 1 simple checkpoint or restart-at-beginning flow (choose one for MVP).

### UX & Presentation (MVP-appropriate)
- Simple HUD: health and maybe shot cooldown indicator.
- Keyboard controls display on pause/start overlay.
- Temporary placeholder art/sfx allowed, but readability must be strong.

### Technical Scope
- Browser-based, static-host friendly build compatible with this repo architecture.
- No backend required.
- Keep code modular enough to extend for Milestone 2.

---

## Milestone 1 Non-Goals (to avoid over-scoping)
- No RPG inventory/equipment systems yet.
- No dialogue trees yet.
- No first-person camera yet.
- No large multi-level campaign yet.
- No advanced boss AI (optional stretch only).

---

## Suggested MVP Acceptance Criteria
- Player can complete the level from start to finish without errors.
- Controls feel responsive (movement/jump/shoot all reliable).
- Cannon cooldown prevents spamming but still feels fun.
- At least one enemy can be defeated with cannon shots.
- Death/restart flow works consistently.
- Game is launchable from the hub like other entries in this repo.

---

## Proposed Delivery Sequence for Milestone 1
1. **Game loop foundation**: scene, physics, tile/platform collisions, player controller.
2. **Combat basics**: projectile system, cooldown, enemy hit logic.
3. **Level completion + fail state**: goal, health, restart.
4. **Polish pass**: tuning jump arc, movement speed, shot feel, HUD clarity.
5. **Hub integration**: thumbnail + metadata entry + published status when ready.

---

## Questions Before Implementation
1. Do you want this first demo built in **vanilla HTML5 Canvas** (lightweight, no external engine) or with a framework (for example Phaser)?
2. Should the protagonist be visually close to Mega Man Bass style, or should we make a **legally safer original character** with a similar gameplay feel?
3. For MVP controls, are you good with:
   - `A/D` or arrow keys = move,
   - `Space` = jump,
   - `J` (or `K`) = shoot?
4. Cannon behavior preference:
   - single shot on-screen at once (classic feel), or
   - multiple shots allowed with cooldown?
5. Difficulty target for MVP:
   - easy showcase,
   - medium challenge,
   - hard/retro challenge?
6. Should we include one **mini-boss encounter** in Milestone 1, or keep it strictly to basic enemies?
7. Do you want keyboard-only for now, or should we also include gamepad support in MVP?

Once you answer these, I can move straight into implementation with a concrete Milestone 1 build plan and task breakdown.
