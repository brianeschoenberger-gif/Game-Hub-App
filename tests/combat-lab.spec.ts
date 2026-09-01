import { expect, test, type Page } from '@playwright/test';

type CombatLabState = {
  mode: string;
  pointerLocked: boolean;
  player: { position: { x: number; y: number; z: number }; health: number } | null;
  enemies: Array<{ enabled: boolean; health: number | null }>;
  actions: { light: number; block: number; jump: number };
};

async function readCombatLabState(page: Page): Promise<CombatLabState | null> {
  const frame = page.frames().find((candidate) => candidate.url().includes('/games/Combat-Lab/index.html'));
  if (!frame) return null;

  return frame.evaluate(() => {
    const renderState = (window as any).render_game_to_text;
    return typeof renderState === 'function' ? JSON.parse(renderState()) : null;
  });
}

test('Combat Lab loads and responds to movement and combat controls in the Game Hub', async ({ page }) => {
  test.setTimeout(120_000);

  await page.goto('/play.html?slug=combat-lab');
  await expect(page.locator('#player-page h1')).toContainText('Now Playing: Combat Lab', { timeout: 15_000 });

  const iframe = page.locator('iframe.player-frame');
  await expect(iframe).toHaveAttribute('src', /\/games\/Combat-Lab\/index\.html\?v=/);

  const canvas = page.frameLocator('iframe.player-frame').locator('#application-canvas');
  await expect(canvas).toBeVisible({ timeout: 90_000 });
  await expect.poll(async () => (await readCombatLabState(page))?.mode, { timeout: 90_000 }).toBe('playing');

  const initial = (await readCombatLabState(page))!;
  expect(initial.player?.health).toBe(100);
  expect(initial.enemies.filter((enemy) => enemy.enabled)).toHaveLength(2);

  await canvas.click();
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(750);
  await page.keyboard.up('ArrowUp');
  await canvas.click();
  await page.keyboard.press('b');
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  const after = (await readCombatLabState(page))!;
  expect(after.pointerLocked).toBe(true);
  expect(Math.abs(after.player!.position.z - initial.player!.position.z)).toBeGreaterThan(0.05);
  expect(after.actions.light).toBeGreaterThan(initial.actions.light);
  expect(after.actions.block).toBeGreaterThan(initial.actions.block);
  expect(after.actions.jump).toBeGreaterThan(initial.actions.jump);
});
