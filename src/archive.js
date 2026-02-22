import { mountNewsBanner } from './news-banner.js';
import { loadGames } from './data.js';
import { emptyState, gameCard } from './ui.js';

mountNewsBanner();

async function renderArchive() {
  const root = document.querySelector('#archive-page');

  try {
    const games = await loadGames();
    if (!games.length) {
      root.innerHTML = emptyState('No published games available in archive.');
      return;
    }

    root.innerHTML = `
      <section>
        <h1>Archive</h1>
        <p class="meta">Newest first. Add metadata entries to keep this list growing daily.</p>
        <div class="card-row">${games.map(gameCard).join('')}</div>
      </section>
    `;
  } catch (error) {
    root.innerHTML = emptyState(error.message);
  }
}

renderArchive();
