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
const RSS_FEEDS = [
  'https://feeds.bbci.co.uk/news/world/rss.xml',
  'https://www.reutersagency.com/feed/?best-topics=world&post_type=best',
  'https://apnews.com/hub/ap-top-news?output=rss'
];

function getTodayLabel() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(new Date());
}

function isPublishedToday(dateValue) {
  const publishedDate = new Date(dateValue);
  if (Number.isNaN(publishedDate.getTime())) {
    return false;
  }

  const now = new Date();
  return (
    publishedDate.getFullYear() === now.getFullYear() &&
    publishedDate.getMonth() === now.getMonth() &&
    publishedDate.getDate() === now.getDate()
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
  const feedResults = await Promise.allSettled(
    RSS_FEEDS.map(async (feedUrl) => {
      const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`News lookup failed (${response.status})`);
      }

      const xmlText = await response.text();
      const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
      return Array.from(xml.querySelectorAll('item')).map((item) => {
        const title = item.querySelector('title')?.textContent ?? '';
        const link = item.querySelector('link')?.textContent ?? '';
        const pubDate = item.querySelector('pubDate')?.textContent ?? '';

        return {
          title: title.trim(),
          url: link.trim(),
          publishedAt: new Date(pubDate).getTime()
        };
      });
    })
  );

  const seenTitles = new Set();
  const stories = feedResults
    .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
    .filter((story) => story.title && story.url && isPublishedToday(story.publishedAt))
    .filter((story) => {
      const key = story.title.toLowerCase();
      if (seenTitles.has(key)) {
        return false;
      }

      seenTitles.add(key);
      return true;
    })
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, MAX_STORIES)
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
