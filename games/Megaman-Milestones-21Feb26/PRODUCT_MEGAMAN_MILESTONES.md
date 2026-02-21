# Product Brief: Robot Cannon Platformer (Milestone-Driven)

## Product Direction
Create a multi-phase action game that starts as a polished **2D platformer**, then evolves into a **2D RPG-style progression layer**, and eventually includes **first-person gameplay sections**.

For visual identity, the hero should be an **original robot-style character** (not a direct Mega Man clone) with a **large laser cannon arm**.

---

## Confirmed Design Decisions (From Your Feedback)

- Character style: robot protagonist with a large laser cannon arm.
- Milestone 1 includes a **mini-boss at the end of Level 1**.
- Weapon progression starts immediately:
  - base weapon starts with **single-shot or double-shot with cooldown**,
  - defeating the Milestone 1 mini-boss unlocks **rapid shot**,
  - later milestones continue adding new cannon abilities.

---

## Milestone Roadmap

### Milestone 1 (Current): 2D Platformer MVP
Deliver a complete, short demo that proves movement + shooting + progression reward loop.

### Milestone 2: 2D RPG Layer
Add traversal hubs, NPC dialogue, mission flow, and persistent progression systems.

### Milestone 3: First-Person Expansion
Introduce first-person maps/combat to represent later-game mode shifts.

### Milestone 4: Boss Attack Pattern Suite
Expand boss encounters with clear telegraphs, multi-phase behavior, and signature attack variety.

### Milestone 5: Mobility Upgrade - Air Dash
Add air dash traversal/combat utility and design level beats that require and reward dash mastery.

### Milestone 6: Dynamic Stage Hazards
Introduce interactive/timed hazards that create rhythm-based platforming and combat pressure.

---

## Build-Ready Milestones (Say: "Build Milestone X")

Use this section as execution shorthand. If you say **"Build Milestone 4"**, etc., implementation can follow the exact scope below without additional planning.

### Build Milestone 4 - Boss Attack Pattern Suite

#### Objective
Upgrade bosses from "single loop" behavior into memorable fights with readable attacks and escalating pressure.

#### Scope
- Add a **boss state machine** for each major boss with at least 3 states:
  - `idle/reposition`,
  - `telegraph`,
  - `attack`.
- Implement **3 attack archetypes** minimum:
  1. **Spread Burst** (projectile fan with dodge lanes),
  2. **Dash Slam** (rapid reposition + contact/splash threat),
  3. **Area Denial** (lingering zones or timed hazard volleys).
- Add **phase transitions** at HP thresholds (example: 70% and 35%) that modify cadence/speed/pattern mix.
- Add **clear telegraphs** (animation cue, flash color, and/or sound cue) with a consistent reaction window.
- Ensure each boss has one short **vulnerability window** after a major attack to reward timing.

#### Integration Notes
- Keep attack params data-driven in level/boss config where possible.
- Reuse existing projectile and feedback systems (sparks, flashes, camera shake) before adding new systems.

#### Acceptance Criteria
- Every boss can execute all assigned attack patterns without runtime errors.
- Telegraphs are readable enough that a first-time player can learn patterns after a few attempts.
- Phase transitions trigger reliably at configured HP thresholds.

#### Done Means
- "Build Milestone 4" is complete when boss fights feel mechanically distinct, not just higher HP variants.

---

### Build Milestone 5 - Mobility Upgrade: Air Dash

#### Objective
Add a high-skill movement option that improves traversal flow and opens new combat expression.

#### Scope
- Add **Air Dash** ability with parameters:
  - dash speed,
  - dash duration,
  - cooldown,
  - charges (start with 1 midair charge).
- Input design:
  - dedicated key/button OR directional + dash key,
  - supports left/right in 2D,
  - optional forward burst behavior in FPS mode (if enabled in this milestone).
- Movement rules:
  - temporary gravity dampening during dash,
  - invulnerability optional (default off),
  - resets on ground touch and/or wall checkpoint rule.
- Combat coupling:
  - allow dash-cancel into shot,
  - optional small damage bonus on dash-canceled charged shot.
- Level updates:
  - add at least 3 traversal beats requiring smart dash timing,
  - add at least 1 optional shortcut or secret pickup gated by dash mastery.

#### Integration Notes
- Expose dash unlocked state via profile progression and HUD status.
- Keep behavior deterministic with existing death/restart and mission reset flows.

#### Acceptance Criteria
- Air dash feels responsive and does not break collision/grounded logic.
- Player can complete required dash traversal beats consistently.
- Cooldown/charges are readable in HUD feedback.

#### Done Means
- "Build Milestone 5" is complete when dash changes how levels are played, not just movement speed.

---

### Build Milestone 6 - Dynamic Stage Hazards

#### Objective
Turn static stages into reactive environments with timing-based challenge and encounter variety.

#### Scope
- Implement hazard framework supporting:
  - `on/off` timed hazards,
  - moving hazard actors,
  - trigger-activated hazards.
- Add at least **3 hazard types**:
  1. **Laser Gate** (periodic beam with warning flash),
  2. **Conveyor + Crusher** or moving press pattern,
  3. **Falling Debris/Arc Turret Zone** tied to player position/progress.
- Add per-hazard config values:
  - cycle time,
  - warning duration,
  - damage,
  - active region bounds.
- Ensure hazards interact with:
  - player damage/invulnerability rules,
  - enemy navigation/combat space where applicable,
  - camera readability (no off-screen unavoidable damage).
- Add at least one **hazard + enemy combo encounter** to force priority decisions.

#### Integration Notes
- Prefer data-driven hazard placement in level config.
- Reuse existing visual FX for warnings/impacts before creating new asset-heavy effects.

#### Acceptance Criteria
- Hazards run deterministically on repeated plays/restarts.
- Damage sources are readable and fair (warning before activation).
- Stage pacing improves through varied challenge beats, not random unavoidable hits.

#### Done Means
- "Build Milestone 6" is complete when environmental danger is a core gameplay pillar in at least one full stage.

---

## Milestone 1 MVP Scope (Implementation-Ready)

### Core Gameplay
- Side-scrolling 2D platformer level with camera follow.
- Robot player can:
  - move left/right,
  - jump with tuned gravity and grounded checks,
  - fire cannon shots with cooldown-based cadence.
- Cannon system includes upgrade-ready architecture:
  - `single_shot` (default) OR tuned `double_shot` starter,
  - timed cooldown gate,
  - projectile hit, despawn, and collision rules.

### Enemies and Combat
- Basic enemy type(s) with simple patrol/approach behavior.
- Enemies take projectile damage and show hit feedback.
- Contact with enemies damages the player.

### Mini-Boss (End of Level 1)
- One mini-boss arena encounter at end of level.
- Mini-boss has more health than regular enemies and at least one recognizable attack pattern.
- On mini-boss defeat:
  - show clear victory feedback,
  - grant **Rapid Shot unlock** (first progression milestone),
  - mark level completion.

### Player State / UX
- Player health system.
- Simple HUD:
  - health,
  - current cannon mode,
  - cooldown/readiness indicator.
- Start, death, and restart flow is deterministic and stable.

### Level Content
- One short level (1–3 minutes on first clear).
- Includes light platforming challenge beats before boss arena.
- Finish gate transitions into boss encounter cleanly.

### Technical Constraints
- Must run as a static-hosted web game in this repo.
- No backend required.
- Keep code modular so cannon progression tiers can expand in Milestone 2+.

---

## Milestone 1 Non-Goals
- No full RPG inventory/equipment yet.
- No quest tree or branching dialogue yet.
- No first-person mode yet.
- No multi-level campaign structure yet.

---

## Milestone 1 Acceptance Criteria
- Player can complete level start-to-mini-boss without runtime errors.
- Shooting cadence feels intentional (cooldown readable, not spammy).
- Mini-boss is defeatable and reliably grants **Rapid Shot** unlock.
- Death/restart loop works every run.
- Demo is playable via Game Hub integration and static paths resolve correctly.

---

## Cannon Progression Plan (Forward-Compatible)

1. **Tier 0 (M1 Start):** Single Shot (or Double Shot if tuned best for feel).
2. **Tier 1 (M1 Reward):** Rapid Shot unlocked by mini-boss defeat.
3. **Tier 2+ (Later Milestones):** Additional cannon behaviors (charge burst, spread, piercing, elemental variants, etc.).

This keeps Milestone 1 focused while preserving a clear ability-growth roadmap for the larger game vision.
