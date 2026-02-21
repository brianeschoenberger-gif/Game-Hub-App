import { findGame, loadGames } from './data.js';
import { resolveGamePath } from './paths.js';
import { escapeHtml } from './sanitize.js';
import { emptyState } from './ui.js';
import { APP_VERSION } from './app-version.js';

function withVersion(url, enabled = true) {
  if (!enabled) {
    return url;
  }
  const parsed = new URL(url);
  parsed.searchParams.set('v', APP_VERSION);
  return parsed.toString();
}

async function renderPlayer() {
  const root = document.querySelector('#player-page');
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!slug) {
    root.innerHTML = emptyState('No game slug was provided.');
    return;
  }

  try {
    const games = await loadGames();
    const game = findGame(games, slug);
    if (!game) {
      root.innerHTML = emptyState('Game not found.');
      return;
    }

    const pageTitle = String(game.title ?? '');
    const safeTitle = escapeHtml(game.title);
    const safeTopic = escapeHtml(game.newsTopic);
    const safeGameUrl = withVersion(resolveGamePath(game.gamePath), !/^https?:\/\//i.test(game.gamePath));

    document.title = `Play ${pageTitle} - Daily Arcade`;
    root.innerHTML = `
      <section class="player-layout">
        <h1>Now Playing: ${safeTitle}</h1>
        <p class="meta">${safeTopic}</p>
        <iframe class="player-frame" src="${safeGameUrl}" title="${safeTitle}" loading="eager" allow="fullscreen; autoplay; gamepad; pointer-lock" sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups allow-downloads" referrerpolicy="no-referrer" allowfullscreen></iframe>
      </section>
    `;
  } catch (error) {
    root.innerHTML = emptyState(error.message);
  }
}

renderPlayer();
