import { metadataUrl } from './paths.js';

export async function loadGames() {
  const response = await fetch(metadataUrl(), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to load game metadata.');
  }
  const games = await response.json();
  return games
    .filter((game) => game.status === 'published')
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
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
