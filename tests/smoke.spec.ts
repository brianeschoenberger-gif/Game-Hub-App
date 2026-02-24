import { expect, test, type APIRequestContext } from '@playwright/test';

type Game = {
  slug: string;
  title: string;
  status: string;
  releaseDate?: string;
  featured?: boolean;
};

async function getPublishedGames(request: APIRequestContext): Promise<Game[]> {
  const res = await request.get('/data/games.json');
  expect(res.ok()).toBeTruthy();
  const games = (await res.json()) as Game[];
  return games
    .filter((g) => g.status === 'published')
    .sort((a, b) => Date.parse(b.releaseDate ?? '') - Date.parse(a.releaseDate ?? ''));
}

test('home renders published games and hero play link', async ({ page, request }) => {
  const published = await getPublishedGames(request);
  expect(published.length).toBeGreaterThan(0);

  const featured = published.find((g) => g.featured) ?? published[0];

  await page.goto('/index.html');

  await expect(page.locator('#featured-hero h1')).toHaveText(featured.title);
  await expect(page.locator('#archive-row .game-card')).toHaveCount(published.length);

  const playHref = await page.locator('#featured-hero .btn-primary').getAttribute('href');
  expect(playHref).toContain(`play.html?slug=${encodeURIComponent(featured.slug)}`);
});

test('hero Play now opens player and mounts iframe', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#featured-hero .btn-primary').click();

  await expect(page).toHaveURL(/\/play\.html\?slug=/);
  await expect(page.locator('#player-page h1')).toContainText('Now Playing:');
  await expect(page.locator('.player-frame')).toBeVisible();
  await expect(page.locator('.player-frame[src*="?v="]')).toHaveCount(1);
});

test('player shows safe empty states for missing/invalid slug', async ({ page }) => {
  await page.goto('/play.html');
  await expect(page.locator('.empty-state')).toContainText('No game slug was provided.');

  await page.goto('/play.html?slug=does-not-exist');
  await expect(page.locator('.empty-state')).toContainText('Game not found.');
});
