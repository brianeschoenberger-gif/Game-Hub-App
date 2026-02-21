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
