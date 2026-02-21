import { findGame, formatDate, loadGames } from './data.js';
import { archiveUrl, playUrl } from './paths.js';
import { escapeHtml } from './sanitize.js';
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

    const pageTitle = String(game.title ?? '');
    const safeTitle = escapeHtml(game.title);
    const safeDescription = escapeHtml(game.description);
    const safeReleaseDate = escapeHtml(formatDate(game.releaseDate));
    const safeDuration = escapeHtml(game.durationEstimate);
    const safeTopic = escapeHtml(game.newsTopic);
    const safeTags = game.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join(' ');

    document.title = `${pageTitle} - Daily Arcade`;
    root.innerHTML = `
      <article class="details-layout">
        <p class="meta">${safeReleaseDate} - ${safeDuration} - ${safeTopic}</p>
        <h1>${safeTitle}</h1>
        <p>${safeDescription}</p>
        <p>${safeTags}</p>
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
