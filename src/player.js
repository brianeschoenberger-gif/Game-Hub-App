import { findGame, loadGames } from './data.js';
import { emptyState } from './ui.js';

async function renderPlayer() {
  const root = document.querySelector('#player-page');
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!slug) {
    root.innerHTML = emptyState('No game slug was provided.');
    return;
  }

  const games = await loadGames();
  const game = findGame(games, slug);
  if (!game) {
    root.innerHTML = emptyState('Game not found.');
    return;
  }

  root.innerHTML = `
    <section class="player-layout">
      <h1>Now Playing: ${game.title}</h1>
      <p class="meta">${game.newsTopic}</p>
      <iframe class="player-frame" src="${game.gamePath}" title="${game.title}" loading="eager" allowfullscreen></iframe>
    </section>
  `;
}

renderPlayer();
