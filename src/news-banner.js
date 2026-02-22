const MAX_STORIES = 8;

function getTodayLabel() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(new Date());
}

function getTodayUnixRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  return {
    start: Math.floor(start.getTime() / 1000),
    end: Math.floor(end.getTime() / 1000)
  };
}

function normalizeStory(story) {
  return {
    title: typeof story?.title === 'string' ? story.title.trim() : '',
    url: typeof story?.url === 'string' ? story.url.trim() : '',
    points: Number.isFinite(story?.points) ? story.points : 0,
    comments: Number.isFinite(story?.comments) ? story.comments : 0
  };
}

async function loadTopStoriesFromToday() {
  const { start, end } = getTodayUnixRange();
  const endpoint = new URL('https://hn.algolia.com/api/v1/search');
  endpoint.searchParams.set('tags', 'story');
  endpoint.searchParams.set('hitsPerPage', '50');
  endpoint.searchParams.set('numericFilters', `created_at_i>=${start},created_at_i<${end}`);

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`News lookup failed (${response.status})`);
  }

  const data = await response.json();
  return (data?.hits ?? [])
    .map((hit) => normalizeStory({
      title: hit.title,
      url: hit.url ?? hit.story_url,
      points: hit.points,
      comments: hit.num_comments
    }))
    .filter((story) => story.title && story.url)
    .sort((a, b) => b.points + b.comments - (a.points + a.comments))
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

function renderStories(root, stories, statusMessage = '') {
  root.textContent = '';

  const label = document.createElement('span');
  label.className = 'news-banner__label';
  label.textContent = `Top stories today · ${getTodayLabel()}`;
  root.appendChild(label);

  const ticker = document.createElement('div');
  ticker.className = 'news-banner__ticker';
  stories.forEach((story) => ticker.appendChild(buildStoryLink(story)));
  root.appendChild(ticker);

  if (statusMessage) {
    const note = document.createElement('span');
    note.className = 'news-banner__status';
    note.textContent = statusMessage;
    root.appendChild(note);
  }
}

export async function mountNewsBanner(selector = '#news-banner') {
  const root = document.querySelector(selector);
  if (!root) {
    return;
  }

  root.setAttribute('aria-live', 'polite');
  renderStories(root, [], 'Loading stories…');

  try {
    const stories = await loadTopStoriesFromToday();
    if (stories.length) {
      renderStories(root, stories);
      return;
    }

    renderStories(root, [], 'No story links found for today yet.');
  } catch {
    renderStories(root, [], 'Unable to load today\'s stories right now.');
  }
}
