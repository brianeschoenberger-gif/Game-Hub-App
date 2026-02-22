# Agents.md

## Purpose
Instructions for Codex and other coding agents working in `games/Monk`.

This project is a web-first third-person game prototype built with Babylon.js + Vite + ES modules.

Current goal: a small, polished, one-level exploration prototype ("Monk Awakening"), not a full game.

## Working Principles
1. Keep scope tight
- Do not add features outside the requested milestone.
- Prioritize polish and feel over complexity.

2. Modular code only
- Do not build giant files.
- Organize code into the existing folder structure.
- Prefer focused systems and entities.

3. Preserve architecture
- Follow `games/Monk/Monk.md`, `games/Monk/TechSpec.md`, and `games/Monk/Task.md`.
- Do not rewrite project structure unless explicitly asked.

4. Make tuning easy
- Put gameplay constants in config files.
- Avoid hardcoded numbers in gameplay logic.

5. Browser performance matters
- Keep meshes/materials lightweight in prototype.
- Avoid unnecessary expensive rendering features.

## Tech Rules
- Use ES modules
- Use Babylon.js
- Use Vite
- JavaScript only unless explicitly asked to convert to TypeScript
- Keep code browser-safe and simple to run locally

## File and Code Conventions
### Naming
- Use descriptive names (`playerController`, `cameraSystem`, `triggerZone`)
- Avoid vague names (`temp`, `thing`, `data2`)

### Comments
- Add comments only when logic is non-obvious
- Do not over-comment trivial code

### Functions
- Keep functions focused and short
- Prefer small helper functions over long nested logic

### State
- Keep state localized where possible
- Avoid global mutable state unless clearly intentional

## What to Avoid
- Do not add combat, inventory, enemies, quests, or large systems unless requested
- Do not add external art dependencies if placeholders are sufficient
- Do not refactor unrelated files while implementing a task
- Do not introduce new libraries unless clearly justified

## Task Execution Expectations
When implementing a task:
1. Make only the requested changes
2. Keep code style consistent with the repo
3. Ensure the game still runs
4. Summarize what changed
5. Provide manual test steps

## Preferred Workflow for Codex Tasks
- Read relevant files first
- Implement one milestone task (or a small subset)
- Keep changes scoped
- Return:
  - files changed
  - what was implemented
  - manual test steps
  - any known issues

## Manual Test Step Format
- Run `npm install` (first time only)
- Run `npm run dev`
- Open local browser URL
- Click Play
- Test movement: WASD
- Test sprint: Shift
- Test jump: Space
- Walk to shrine and confirm story text appears

## Current Priority
Milestone 0: Playable Exploration Vertical Slice
- Third-person movement
- Camera
- Monastery level blockout
- Shrine trigger
- Minimal UI
- Polished feel

Do not build beyond this without explicit instruction.
