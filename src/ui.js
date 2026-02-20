import { formatDate } from './data.js';
import { gameUrl, playUrl } from './paths.js';

export function gameCard(game) {
  const tags = game.tags.slice(0, 2).map((tag) => `<span class="tag">${tag}</span>`).join('');
  return `
    <a class="game-card" href="${gameUrl(game.slug)}" aria-label="View details for ${game.title}">
      <div class="game-thumb" aria-hidden="true"></div>
      <div class="card-content">
        <h3>${game.title}</h3>
        <p>${game.description}</p>
        <p>${tags}</p>
      </div>
    </a>
  `;
}

export function hero(game) {
  return `
    <div>
      <p class="meta">Today - ${formatDate(game.releaseDate)} - ${game.durationEstimate}</p>
      <h1>${game.title}</h1>
      <p>${game.description}</p>
      <p>${game.newsTopic}</p>
      <a class="btn-primary" href="${playUrl(game.slug)}">Play now</a>
      <a class="btn-secondary" href="${gameUrl(game.slug)}">View details</a>
    </div>
  `;
}

export function emptyState(message) {
  return `<div class="empty-state" role="status">${message}</div>`;
}
