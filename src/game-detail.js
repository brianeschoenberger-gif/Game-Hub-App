import { findGame, formatDate, loadGames } from './data.js';
import { archiveUrl, playUrl } from './paths.js';
import { emptyState } from './ui.js';

async function renderDetail() {
  const root = document.querySelector('#game-detail');
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
      root.innerHTML = emptyState('Game not found in library metadata.');
      return;
    }

    document.title = `${game.title} - Daily Arcade`;
    root.innerHTML = `
      <article class="details-layout">
        <p class="meta">${formatDate(game.releaseDate)} - ${game.durationEstimate} - ${game.newsTopic}</p>
        <h1>${game.title}</h1>
        <p>${game.description}</p>
        <p>${game.tags.map((tag) => `<span class="tag">${tag}</span>`).join(' ')}</p>
        <div>
          <a class="btn-primary" href="${playUrl(game.slug)}">Play now</a>
          <a class="btn-secondary" href="${archiveUrl()}">Browse archive</a>
        </div>
      </article>
    `;
  } catch (error) {
    root.innerHTML = emptyState(error.message);
  }
}

renderDetail();
