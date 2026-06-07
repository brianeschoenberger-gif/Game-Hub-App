import { expect, test } from '@playwright/test';

test('The Goblin Road boots, exposes state, and can complete the key-gate-win loop', async ({ page }) => {
  await page.goto('/games/The-Goblin-Road/dist/index.html');
  await expect(page.locator('canvas')).toBeVisible();

  await page.mouse.click(640, 570);
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');

  const initial = await page.evaluate(() => JSON.parse(window.render_game_to_text!()));
  expect(initial.mode).toBe('playing');
  expect(initial.objective).toContain('Sunstone Key');

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowRight');

  const moved = await page.evaluate(() => JSON.parse(window.render_game_to_text!()));
  expect(moved.player.x).toBeGreaterThan(initial.player.x);
  expect(moved.player.stamina).toBeGreaterThan(0);

  const blocked = await page.evaluate(async () => {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const game = window.goblinRoadGame!;
    const scene = game.scene.getScene('GameScene') as any;
    const enemy = scene.enemies.getChildren()[0];
    scene.playerHp = 6;
    scene.stamina = 100;
    scene.blocking = true;
    scene.pointerBlocking = true;
    scene.facing.set(1, 0);
    scene.player.setPosition(enemy.x - 28, enemy.y);
    scene.player.body.reset(enemy.x - 28, enemy.y);
    scene.damagePlayer(enemy);
    await sleep(120);
    return JSON.parse(window.render_game_to_text!());
  });

  expect(blocked.player.hp).toBe(6);
  expect(blocked.player.stamina).toBeLessThan(100);
  expect(blocked.player.blocking).toBe(true);

  const completed = await page.evaluate(async () => {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const game = window.goblinRoadGame!;
    const scene = game.scene.getScene('GameScene') as any;
    const setPlayer = (x: number, y: number) => {
      scene.player.setPosition(x, y);
      scene.player.body.reset(x, y);
    };
    const captain = scene.enemies.getChildren().find((enemy: any) => enemy.enemyName === 'Goblin Captain');

    for (let i = 0; i < 5; i += 1) {
      captain.setPosition(1165, 685);
      captain.body.reset(1165, 685);
      setPlayer(1120, 685);
      scene.facing.set(1, 0);
      scene.attacking = false;
      scene.lastAttackAt = -9999;
      scene.attack(scene.time.now + 1000 + i * 500);
      await sleep(190);
    }

    const key = scene.pickups.getChildren().find((pickup: any) => pickup.active && pickup.kind === 'key');
    setPlayer(key.x, key.y);
    await sleep(220);
    setPlayer(1640, 585);
    await sleep(320);
    setPlayer(2185, 650);
    await sleep(320);
    return JSON.parse(window.render_game_to_text!());
  });

  expect(completed.player.hasKey).toBe(true);
  expect(completed.gate.open).toBe(true);
  expect(completed.mode).toBe('ended');
  expect(completed.objective).toBe('Enter the Sunken Watchtower.');

  await page.waitForFunction(() => {
    const state = JSON.parse(window.render_game_to_text!());
    return state.level === 'The Sunken Watchtower';
  });
});

test('The Sunken Watchtower dungeon has keys, boss key, boss defeat, and completion', async ({ page }) => {
  await page.goto('/games/The-Goblin-Road/dist/index.html');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  await page.mouse.click(640, 570);
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');

  const completed = await page.evaluate(async () => {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const game = window.goblinRoadGame!;
    game.scene.start('DungeonScene');
    await sleep(500);
    const scene = game.scene.getScene('DungeonScene') as any;
    const setPlayer = (x: number, y: number) => {
      scene.player.setPosition(x, y);
      scene.player.body.reset(x, y);
    };
    const killRoom = async (room: string) => {
      for (const enemy of scene.enemies.getChildren().filter((e: any) => e.active && e.room === room)) {
        enemy.hp = 1;
        setPlayer(enemy.x - 40, enemy.y);
        scene.facing.set(1, 0);
        scene.attacking = false;
        scene.lastAttackAt = -9999;
        scene.attack(scene.time.now + 1000);
        await sleep(120);
      }
    };
    const openChest = async (id: string) => {
      const chest = scene.chests.getChildren().find((c: any) => c.id === id);
      setPlayer(chest.x, chest.y);
      scene.tryChest(chest);
      await sleep(120);
    };

    await killRoom('guard');
    await openChest('guard-key');
    scene.solved.puzzle = true;
    scene.smallKeys = Math.max(scene.smallKeys, 1);
    await killRoom('chapel');
    await openChest('chapel-boss-key');
    const boss = scene.enemies.getChildren().find((e: any) => e.kind === 'boss');
    boss.hp = 1;
    setPlayer(boss.x - 40, boss.y);
    scene.currentRoom = 'boss';
    scene.facing.set(1, 0);
    scene.attacking = false;
    scene.lastAttackAt = -9999;
    scene.attack(scene.time.now + 2000);
    await sleep(180);
    setPlayer(2240, 320);
    await sleep(220);
    return JSON.parse(window.render_game_to_text!());
  });

  expect(completed.level).toBe('The Sunken Watchtower');
  expect(completed.player.bossKey).toBe(true);
  expect(completed.solved.boss).toBe(true);
  expect(completed.mode).toBe('ended');
});

test('The Sunken Watchtower entrance side door can be entered by walking into it', async ({ page }) => {
  await page.goto('/games/The-Goblin-Road/dist/index.html');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  await page.mouse.click(640, 570);
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');

  await page.evaluate(async () => {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const game = window.goblinRoadGame!;
    game.scene.start('DungeonScene');
    await sleep(500);
    const scene = game.scene.getScene('DungeonScene') as any;
    scene.player.setPosition(1208, 210);
    scene.player.body.reset(1208, 210);
    scene.hp = 8;
    scene.completed = false;
    scene.currentRoom = 'entrance';
  });

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(220);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(180);

  const state = await page.evaluate(() => JSON.parse(window.render_game_to_text!()));
  expect(state.room).toBe('guard');
  expect(state.player.hp).toBeGreaterThan(0);
  expect(state.objective).toContain('guard goblins');
});

test('The Sunken Watchtower waterwheel plate opens the lower gate', async ({ page }) => {
  await page.goto('/games/The-Goblin-Road/dist/index.html');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  await page.mouse.click(640, 570);
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');

  const state = await page.evaluate(async () => {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const game = window.goblinRoadGame!;
    game.scene.start('DungeonScene');
    await sleep(500);
    const scene = game.scene.getScene('DungeonScene') as any;
    scene.currentRoom = 'puzzle';
    scene.solved.puzzle = false;
    scene.player.setPosition(1095, 640);
    scene.player.body.reset(1095, 640);
    scene.updatePuzzle();
    await sleep(150);
    return JSON.parse(window.render_game_to_text!());
  });

  expect(state.room).toBe('puzzle');
  expect(state.solved.puzzle).toBe(true);
  expect(state.objective).toContain('water gate opened');
});

test('The Sunken Watchtower supports dash and explains the Flooded Corridor', async ({ page }) => {
  await page.goto('/games/The-Goblin-Road/dist/index.html');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  await page.mouse.click(640, 570);
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');

  const before = await page.evaluate(async () => {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const game = window.goblinRoadGame!;
    game.scene.start('DungeonScene');
    await sleep(500);
    const scene = game.scene.getScene('DungeonScene') as any;
    scene.currentRoom = 'flooded';
    scene.player.setPosition(960, 930);
    scene.player.body.reset(960, 930);
    scene.stamina = 100;
    scene.doorCooldownUntil = Number.POSITIVE_INFINITY;
    await sleep(160);
    return JSON.parse(window.render_game_to_text!());
  });

  await page.keyboard.down('ArrowRight');
  await page.keyboard.down('Shift');
  await page.waitForTimeout(90);
  await page.keyboard.up('Shift');
  await page.waitForTimeout(160);
  await page.keyboard.up('ArrowRight');

  const after = await page.evaluate(() => JSON.parse(window.render_game_to_text!()));
  expect(before.room).toBe('flooded');
  expect(before.hint).toContain('Shift dash');
  expect(after.player.x).toBeGreaterThan(before.player.x + 20);
  expect(after.player.stamina).toBeLessThan(before.player.stamina);
  expect(after.visitedRooms).toContain('flooded');
});
