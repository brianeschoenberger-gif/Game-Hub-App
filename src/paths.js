export function metadataUrl() {
  return new URL('../data/games.json', import.meta.url).toString();
}

export function gameUrl(slug) {
  return `game.html?slug=${encodeURIComponent(slug)}`;
}

export function playUrl(slug) {
  return `play.html?slug=${encodeURIComponent(slug)}`;
}

export function archiveUrl() {
  return 'archive.html';
}

export function resolveGamePath(gamePath) {
  if (gamePath.startsWith('http://') || gamePath.startsWith('https://')) {
    return gamePath;
  }
  return new URL(`..${gamePath.startsWith('/') ? gamePath : `/${gamePath}`}`, import.meta.url).toString();
}
