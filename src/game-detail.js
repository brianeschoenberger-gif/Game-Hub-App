import { findGame, formatDate, loadGames } from './data.js';
import { emptyState } from './ui.js';

async function renderDetail() {
  const root = document.querySelector('#game-detail');
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!slug) {
    root.innerHTML = emptyState('No game slug was provided.');
    return;
  }

  const games = await loadGames();
  const game = findGame(games, slug);
  if (!game) {
    root.innerHTML = emptyState('Game not found in library metadata.');
    return;
  }

  root.innerHTML = `
    <article class="details-layout">
      <p class="meta">${formatDate(game.releaseDate)} · ${game.durationEstimate} · ${game.newsTopic}</p>
      <h1>${game.title}</h1>
      <p>${game.description}</p>
      <p>${game.tags.map((tag) => `<span class="tag">${tag}</span>`).join(' ')}</p>
      <div>
        <a class="btn-primary" href="/play.html?slug=${encodeURIComponent(game.slug)}">Play now</a>
        <a class="btn-secondary" href="/archive.html">Browse archive</a>
      </div>
    </article>
  `;
}

renderDetail();
