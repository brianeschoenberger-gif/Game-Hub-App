import { metadataUrl } from './paths.js';

function parseReleaseTimestamp(dateValue) {
  const ts = Date.parse(dateValue);
  return Number.isFinite(ts) ? ts : 0;
}

export async function loadGames() {
  const response = await fetch(metadataUrl(), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to load game metadata.');
  }
  const games = await response.json();
  if (!Array.isArray(games)) {
    throw new Error('Game metadata format is invalid.');
  }

  return games
    .filter((game) => game && game.status === 'published')
    .sort((a, b) => parseReleaseTimestamp(b.releaseDate) - parseReleaseTimestamp(a.releaseDate));
}

export function formatDate(dateValue) {
  return new Date(dateValue).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function findGame(games, slug) {
  return games.find((game) => game.slug === slug);
}
