import { expect, test } from '@playwright/test';

test('Bloom Bastion places, upgrades, fights, pauses, and reports state', async ({ page }) => {
  await page.goto('/games/Bloom-Bastion/index.html');
  const canvas = page.locator('#game');
  await expect(canvas).toBeVisible();

  await canvas.click({ position: { x: 570, y: 440 } });
  await canvas.click({ position: { x: 960, y: 95 } });
  await canvas.click({ position: { x: 280, y: 215 } });
  await canvas.click({ position: { x: 280, y: 215 } });
  await canvas.click({ position: { x: 1010, y: 450 } });

  let state = await page.evaluate(() => JSON.parse((window as any).render_game_to_text()));
  expect(state.mode).toBe('playing');
  expect(state.towers).toHaveLength(1);
  expect(state.towers[0]).toMatchObject({ type: 'thorn', level: 2 });
  expect(state.resources.sunlight).toBe(195);

  await page.keyboard.press('Space');
  await page.evaluate(() => (window as any).advanceTime(4500));
  state = await page.evaluate(() => JSON.parse((window as any).render_game_to_text()));
  expect(state.wave.number).toBe(1);
  expect(state.resources.kills).toBeGreaterThan(0);
  expect(state.resources.sunlight).toBeGreaterThan(195);

  await page.keyboard.press('p');
  await page.keyboard.press('+');
  state = await page.evaluate(() => JSON.parse((window as any).render_game_to_text()));
  expect(state.paused).toBe(true);
  expect(state.speed).toBe(2);
});
