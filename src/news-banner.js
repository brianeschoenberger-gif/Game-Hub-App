const FALLBACK_STORIES = [
  {
    title: 'Open Google News top stories',
    url: 'https://news.google.com/topstories?hl=en-US&gl=US&ceid=US:en'
  }
];

const GOOGLE_NEWS_TOP_STORIES_RSS = 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en';

const RSS_PROXY_SOURCES = [
  `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(GOOGLE_NEWS_TOP_STORIES_RSS)}`,
  `https://api.allorigins.win/get?url=${encodeURIComponent(GOOGLE_NEWS_TOP_STORIES_RSS)}`
];

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
  const xmlText = await loadFeedXml();
  const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
  if (xml.querySelector('parsererror')) {
    throw new Error('Google News feed could not be parsed');
  }

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

async function loadFeedXml() {
  const errors = [];

  for (const url of RSS_PROXY_SOURCES) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        errors.push(`${response.status}`);
        continue;
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        const payload = await response.json();
        if (typeof payload?.contents === 'string' && payload.contents.trim()) {
          return payload.contents;
        }

        if (Array.isArray(payload?.items) && payload.items.length) {
          return buildFeedXmlFromItems(payload.items);
        }

        errors.push('Empty JSON payload');
        continue;
      }

      const xmlText = await response.text();
      if (xmlText.trim()) {
        return xmlText;
      }

      errors.push('Empty response body');
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Network error');
    }
  }

  throw new Error(`News lookup failed (${errors.join(', ')})`);
}

function buildFeedXmlFromItems(items) {
  const escapeXml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const itemXml = items
    .map((item) => {
      const title = escapeXml(item?.title ?? '');
      const link = escapeXml(item?.link ?? item?.guid ?? '');
      const pubDate = escapeXml(item?.pubDate ?? item?.published ?? '');
      return `<item><title>${title}</title><link>${link}</link><pubDate>${pubDate}</pubDate></item>`;
    })
    .join('');

  return `<rss><channel>${itemXml}</channel></rss>`;
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
    renderStories(root, FALLBACK_STORIES, 'Could not load Google News right now.');
  }
}
