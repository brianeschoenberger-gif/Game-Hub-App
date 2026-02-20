import { loadGames } from './data.js';
import { emptyState, gameCard } from './ui.js';

async function renderArchive() {
  const root = document.querySelector('#archive-page');
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
}

renderArchive();
