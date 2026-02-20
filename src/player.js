import { findGame, loadGames } from './data.js';
import { resolveGamePath } from './paths.js';
import { emptyState } from './ui.js';

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

    document.title = `Play ${game.title} · Daily Arcade`;
    root.innerHTML = `
      <section class="player-layout">
        <h1>Now Playing: ${game.title}</h1>
        <p class="meta">${game.newsTopic}</p>
        <iframe class="player-frame" src="${resolveGamePath(game.gamePath)}" title="${game.title}" loading="eager" allowfullscreen></iframe>
      </section>
    `;
  } catch (error) {
    root.innerHTML = emptyState(error.message);
  }
}

renderPlayer();
