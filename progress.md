Original prompt: Build a playable browser game prototype inspired by classic top-down Zelda-like adventure games using TypeScript, Phaser 3, Vite, HTML/CSS. Create "The Goblin Road" with player movement, melee combat, patrolling/chasing enemies, health, coins/hearts/key pickups, locked gate, objective HUD, sound hooks, title screen/stretch features if time allows, and a compact village-to-watchtower first level.

## 2026-06-04

- Started implementation as a self-contained game under `games/The-Goblin-Road/` to fit the static hub structure.
- Chosen approach: Phaser 3 + Vite + TypeScript with procedural sprites and map objects, so real assets can be swapped in later without changing gameplay systems.
- Implemented the first playable level, metadata draft entry, and thumbnail.
- Build passed after installing dependencies. In-app browser visual check rendered the level correctly; headless WebGL screenshots were black, so Phaser was switched to the Canvas renderer for more reliable automated screenshots.
- Verified with the develop-web-game Playwright client: title start, movement burst, attack input, state hook, and screenshot capture.
- Verified targeted mechanics in the browser: coin pickup, captain defeat, Sunstone Key spawn/collection, ruin gate opening, and watchtower victory message.
- Completed a larger polish pass: combat telegraphs, captain charge behavior, hit pause, stronger knockback, player invulnerability flashing, arena lock/unlock, proximity tutorial dialogue, mute control, richer ground detail, more props/pickups, restart-after-win, asset manifest, hub publishing metadata, Pages build workflow, and Playwright coverage.
- Verified after polish with `npm.cmd run build`, `node scripts/validate-site.mjs`, `npm.cmd run test:e2e`, and the develop-web-game Playwright client against the built static `dist/index.html`.
- TODO: Consider code-splitting Phaser or tuning Vite chunk warnings before the project grows much larger.
- Second improvement pass added stamina-driven dash, shield/block with stamina cost, enemy health bars, boss health bar, zone/location text, objective direction arrow, wider HUD, and test coverage for block behavior.
- Verified again with `npm.cmd run build:goblin-road`, `npm.cmd run validate`, `npm.cmd run test:e2e`, and a built-game screenshot/state check through the develop-web-game client.
- Integrated downloaded top-down RPG and Village Top Down assets into `games/The-Goblin-Road/public/external-assets`.
- Reworked the presentation toward a pixel-art 2.5D look: tiled grass/water, asset-based houses, bridge, cliffs, farms, trees, fences, darker vignette, bottom-origin depth layering, pixel rendering, and a portrait/hearts/stamina HUD.
- Verified after asset integration with `npm.cmd run build:goblin-road`, `npm.cmd run validate`, `npm.cmd run test:e2e`, and a built-game screenshot/state check.
- Added second level `DungeonScene`: The Sunken Watchtower, entered after the overworld watchtower.
- Dungeon includes 11 rooms/zones, scrolling camera, room graph, small keys, boss key, chests, locked doors, push-block pressure plate, flooded corridor slowdown, secret cracked wall, chapel ambush, boss room with Goblin Bellkeeper and summoned minions, final summit completion.
- Added Playwright coverage for overworld-to-dungeon transition and dungeon key/boss/completion progression.
- Completed a dungeon visual pass: stone floor tiling, room shadow bands, doorway frames, banners, rune circles, torches, cracked walls, rubble, barrels, shelves, water channels, spikes, statues, bell props, and clearer room-specific set dressing.
- Tuned dungeon camera/HUD framing so objective text remains readable while the larger 2.5D room layout stays visible.
- Verified the final pass with `npm.cmd run build:goblin-road`, `npm.cmd run validate`, `npm.cmd run test:e2e`, and an in-browser canvas screenshot/state check against the built static game.
- Added clearer Sunken Watchtower first-room guidance: objective/hint HUD text now explains that the Small Key is in the east Guard Room chest, visible room plaques point to the Guard Room and locked lower door, and the Guard Room hint updates after entry.
- Bumped the hub cache version so GitHub Pages iframe URLs refresh to the hint-enabled build.
