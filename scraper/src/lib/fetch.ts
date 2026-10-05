const USER_AGENT = 'NextRaceScraper/0.1 (Romanian race calendar; manual review of every entry)';
const DELAY_MS = 1500;

let lastRequestAt = 0;
const robotsCache = new Map<string, string[]>();

/** Fetches a page politely: identifies itself, honours robots.txt and waits between requests. */
export async function fetchPage(url: string): Promise<string> {
  if (!(await isAllowed(url))) throw new Error(`robots.txt disallows ${url}`);
  return fetchText(url);
}

async function fetchText(url: string): Promise<string> {
  const wait = lastRequestAt + DELAY_MS - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequestAt = Date.now();

  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`GET ${url} → ${response.status}`);
  return response.text();
}

async function isAllowed(url: string): Promise<boolean> {
  const { origin, pathname } = new URL(url);
  let disallowed = robotsCache.get(origin);
  if (!disallowed) {
    disallowed = await fetchText(`${origin}/robots.txt`).then(parseRobots, () => []);
    robotsCache.set(origin, disallowed);
  }
  return !disallowed.some((prefix) => pathname.startsWith(prefix));
}

/** Returns the Disallow prefixes that apply to all user agents (`User-agent: *`). */
function parseRobots(text: string): string[] {
  const disallowed: string[] = [];
  let appliesToUs = false;
  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/#.*/, '').trim();
    const [field, ...valueParts] = line.split(':');
    const value = valueParts.join(':').trim();
    if (/^user-agent$/i.test(field)) appliesToUs = value === '*';
    else if (appliesToUs && /^disallow$/i.test(field) && value) disallowed.push(value);
  }
  return disallowed;
}
