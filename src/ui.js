import { formatDate } from './data.js';
import { gameUrl, playUrl, resolveGamePath } from './paths.js';
import { escapeHtml } from './sanitize.js';

export function gameCard(game) {
  const safeTitle = escapeHtml(game.title);
  const safeDescription = escapeHtml(game.description);
  const tags = game.tags
    .slice(0, 2)
    .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join('');
  const thumbnailSrc = game.thumbnailUrl ? resolveGamePath(game.thumbnailUrl) : '';
  const createdDate = escapeHtml(formatDate(game.releaseDate));
  return `
    <a class="game-card" href="${gameUrl(game.slug)}" aria-label="View details for ${safeTitle}">
      <div class="game-thumb">
        ${thumbnailSrc ? `<img src="${thumbnailSrc}" alt="${safeTitle} gameplay preview" loading="lazy" decoding="async">` : ''}
      </div>
      <div class="card-content">
        <h3>${safeTitle}</h3>
        <p class="card-created">Created ${createdDate}</p>
        <p>${safeDescription}</p>
        <p>${tags}</p>
      </div>
    </a>
  `;
}

export function hero(game) {
  const safeTitle = escapeHtml(game.title);
  const safeDescription = escapeHtml(game.description);
  const safeTopic = escapeHtml(game.newsTopic);
  const safeReleaseDate = escapeHtml(formatDate(game.releaseDate));
  const safeDuration = escapeHtml(game.durationEstimate);
  return `
    <div>
      <p class="meta">Today - ${safeReleaseDate} - ${safeDuration}</p>
      <h1>${safeTitle}</h1>
      <p>${safeDescription}</p>
      <p>${safeTopic}</p>
      <a class="btn-primary" href="${playUrl(game.slug)}">Play now</a>
      <a class="btn-secondary" href="${gameUrl(game.slug)}">View details</a>
    </div>
  `;
}

export function emptyState(message) {
  return `<div class="empty-state" role="status">${escapeHtml(message)}</div>`;
}
