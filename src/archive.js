import { mountNewsBanner } from './news-banner.js';
import { loadGames } from './data.js';
import { emptyState, gameCard } from './ui.js';

mountNewsBanner();

const PAGE_SIZE = 12;

function parsePageParam() {
  const params = new URLSearchParams(window.location.search);
  const rawPage = Number(params.get('page'));
  if (!Number.isFinite(rawPage) || rawPage < 1) {
    return 1;
  }
  return Math.floor(rawPage);
}

function buildPageUrl(page) {
  const params = new URLSearchParams(window.location.search);
  if (page <= 1) {
    params.delete('page');
  } else {
    params.set('page', String(page));
  }
  const query = params.toString();
  return query ? `archive.html?${query}` : 'archive.html';
}

function paginationControls(currentPage, totalPages) {
  if (totalPages <= 1) {
    return '';
  }

  const previousPage = currentPage - 1;
  const nextPage = currentPage + 1;

  return `
    <nav class="archive-pagination" aria-label="Archive pages">
      ${currentPage > 1
    ? `<a class="pagination-btn" href="${buildPageUrl(previousPage)}" aria-label="Previous archive page">← Newer</a>`
    : '<span class="pagination-btn is-disabled" aria-disabled="true">← Newer</span>'}
      <p class="pagination-status">Page ${currentPage} of ${totalPages}</p>
      ${currentPage < totalPages
    ? `<a class="pagination-btn" href="${buildPageUrl(nextPage)}" aria-label="Next archive page">Older →</a>`
    : '<span class="pagination-btn is-disabled" aria-disabled="true">Older →</span>'}
    </nav>
  `;
}

async function renderArchive() {
  const root = document.querySelector('#archive-page');

  try {
    const games = await loadGames();
    if (!games.length) {
      root.innerHTML = emptyState('No published games available in archive.');
      return;
    }

    const totalPages = Math.max(1, Math.ceil(games.length / PAGE_SIZE));
    const requestedPage = parsePageParam();
    const currentPage = Math.min(requestedPage, totalPages);
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const pagedGames = games.slice(startIndex, startIndex + PAGE_SIZE);

    root.innerHTML = `
      <section>
        <h1>Archive</h1>
        <p class="meta">Newest first. Showing ${pagedGames.length} of ${games.length} published games.</p>
        ${paginationControls(currentPage, totalPages)}
        <div class="card-row">${pagedGames.map(gameCard).join('')}</div>
        ${paginationControls(currentPage, totalPages)}
      </section>
    `;

    if (requestedPage !== currentPage) {
      window.history.replaceState({}, '', buildPageUrl(currentPage));
    }
  } catch (error) {
    root.innerHTML = emptyState(error.message);
  }
}

renderArchive();
