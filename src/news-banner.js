const FALLBACK_STORIES = [
  {
    title: 'Open Google News top stories',
    url: 'https://news.google.com/topstories?hl=en-US&gl=US&ceid=US:en'
  }
];

const GOOGLE_NEWS_TOP_STORIES_RSS = 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en';

function getTodayLabel() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(new Date());
}

function normalizeStory(story) {
  return {
    title: typeof story?.title === 'string' ? story.title.trim() : '',
    url: typeof story?.url === 'string' ? story.url.trim() : '',
    createdAt: typeof story?.createdAt === 'number' ? story.createdAt : NaN
  };
}

async function loadTopStories() {
  const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(GOOGLE_NEWS_TOP_STORIES_RSS)}`;
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`News lookup failed (${response.status})`);
  }

  const xmlText = await response.text();
  const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
  const stories = Array.from(xml.querySelectorAll('item'))
    .map((item) => {
      const title = item.querySelector('title')?.textContent ?? '';
      const link = item.querySelector('link')?.textContent ?? '';
      const pubDate = item.querySelector('pubDate')?.textContent ?? '';

      return {
        title: title.trim(),
        url: link.trim(),
        publishedAt: new Date(pubDate).getTime()
      };
    })
    .filter((story) => story.title && story.url)
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, 1)
    .map((story) => normalizeStory({ title: story.title, url: story.url, createdAt: story.publishedAt / 1000 }));

  return stories;
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
  label.textContent = `Top story · ${getTodayLabel()}`;
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
  renderStories(root, FALLBACK_STORIES, 'Loading top story…');

  try {
    const stories = await loadTopStories();
    if (stories.length) {
      renderStories(root, stories);
    } else {
      renderStories(root, FALLBACK_STORIES, 'Could not load Google News right now.');
    }
  } catch {
    // Keep fallback content visible when live headlines are unavailable.
  }
}
