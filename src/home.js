import { loadGames } from './data.js';
import { emptyState, gameCard, hero } from './ui.js';
import { mountNewsBanner } from './news-banner.js';

mountNewsBanner();

async function renderHome() {
  const featuredNode = document.querySelector('#featured-hero');
  try {
    const games = await loadGames();
    if (!games.length) {
      featuredNode.innerHTML = emptyState('No published games yet. Add your first game entry to data/games.json.');
      return;
    }

    const featured = games.find((game) => game.featured) ?? games[0];
    const todays = [featured];
    const newThisWeek = games.filter((game) => game.slug !== featured.slug).slice(0, 4);

    featuredNode.innerHTML = hero(featured);
    document.querySelector('#today-row').innerHTML = todays.map(gameCard).join('');
    document.querySelector('#new-row').innerHTML = newThisWeek.map(gameCard).join('');
    document.querySelector('#archive-row').innerHTML = games.map(gameCard).join('');
  } catch (error) {
    featuredNode.innerHTML = emptyState(error.message);
  }
}

renderHome();
