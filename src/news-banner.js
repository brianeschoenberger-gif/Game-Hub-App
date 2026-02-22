const FALLBACK_STORIES = [
  {
    title: 'Global markets react to central bank signals.',
    url: 'https://www.reuters.com/world/'
  },
  {
    title: 'Major climate summit opens with new emissions pledges.',
    url: 'https://apnews.com/hub/climate-and-environment'
  },
  {
    title: 'Breakthrough AI policy debate reaches national legislatures.',
    url: 'https://www.bbc.com/news/technology'
  }
];

const MAX_STORIES = 5;

function getTodayLabel() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(new Date());
}

function isCreatedToday(createdAtEpochSeconds) {
  if (typeof createdAtEpochSeconds !== 'number' || Number.isNaN(createdAtEpochSeconds)) {
    return false;
  }

  const createdDate = new Date(createdAtEpochSeconds * 1000);
  const now = new Date();

  return (
    createdDate.getFullYear() === now.getFullYear() &&
    createdDate.getMonth() === now.getMonth() &&
    createdDate.getDate() === now.getDate()
  );
}

function normalizeStory(story) {
  return {
    title: typeof story?.title === 'string' ? story.title.trim() : '',
    url: typeof story?.url === 'string' ? story.url.trim() : '',
    createdAt: typeof story?.createdAt === 'number' ? story.createdAt : NaN
  };
}

async function loadTopStories() {
  const response = await fetch('https://hn.algolia.com/api/v1/search?tags=front_page');
  if (!response.ok) {
    throw new Error(`News lookup failed (${response.status})`);
  }

  const data = await response.json();
  return (data?.hits ?? [])
    .map((hit) => normalizeStory({ title: hit.title, url: hit.url ?? hit.story_url, createdAt: hit.created_at_i }))
    .filter((story) => story.title && story.url && isCreatedToday(story.createdAt))
    .slice(0, MAX_STORIES);
}

function buildStoryLink(story) {
  const link = document.createElement('a');
  link.className = 'news-banner__item';
  link.href = story.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = story.title;
  return link;
}

function renderStories(root, stories, statusText = '') {
  root.textContent = '';

  const label = document.createElement('span');
  label.className = 'news-banner__label';
  label.textContent = `Top stories · ${getTodayLabel()}`;
  root.appendChild(label);

  const ticker = document.createElement('div');
  ticker.className = 'news-banner__ticker';
  stories.forEach((story) => ticker.appendChild(buildStoryLink(story)));
  root.appendChild(ticker);

  if (statusText) {
    const note = document.createElement('span');
    note.className = 'news-banner__status';
    note.textContent = statusText;
    root.appendChild(note);
  }
}

export async function mountNewsBanner(selector = '#news-banner') {
  const root = document.querySelector(selector);
  if (!root) {
    return;
  }

  root.setAttribute('aria-live', 'polite');
  renderStories(root, FALLBACK_STORIES, 'Showing backup headlines.');

  try {
    const stories = await loadTopStories();
    if (stories.length) {
      renderStories(root, stories);
    } else {
      renderStories(root, FALLBACK_STORIES, 'No new stories yet today.');
    }
  } catch {
    // Keep fallback content visible when live headlines are unavailable.
  }
}
