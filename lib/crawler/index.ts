import { defaultRobotsLoader, undiciFetcher } from './fetch';
import { parseHtml } from './parse';
import { loadRobots } from './robots';
import { classifyUrl, normalizeUrl } from './safety';
import type { CrawlOptions, CrawlResult, CrawledPage, Fetcher, SiteFileProbe } from './types';

const DEFAULT_USER_AGENT = 'SeoAuditBot/0.1 (+contact@novera)';
const DEFAULT_MAX_DEPTH = 3;
const DEFAULT_MAX_PAGES = 50;
const DEFAULT_RATE_LIMIT_MS = 200;

export async function crawl(opts: CrawlOptions): Promise<CrawlResult> {
  const startedAt = new Date();
  const userAgent = opts.userAgent ?? DEFAULT_USER_AGENT;
  const maxDepth = opts.maxDepth ?? DEFAULT_MAX_DEPTH;
  const maxPages = opts.maxPages ?? DEFAULT_MAX_PAGES;
  const rateLimitMs = opts.rateLimitMs ?? DEFAULT_RATE_LIMIT_MS;
  const respectRobots = opts.respectRobots ?? true;
  const fetcher: Fetcher = opts.fetcher ?? undiciFetcher;

  const seedVerdict = classifyUrl(opts.domain);
  if (!seedVerdict.ok) {
    return {
      pages: [],
      startedAt,
      finishedAt: new Date(),
      skippedByRobots: [],
      sitemap: { url: '', status: null },
      robots: { url: '', status: null },
    };
  }
  const seedUrl = seedVerdict.url;
  const origin = seedUrl.origin;

  const sitemap = await probeSiteFile(origin, '/sitemap.xml', fetcher, userAgent);
  const robotsProbe = await probeSiteFile(origin, '/robots.txt', fetcher, userAgent);

  const robots = respectRobots
    ? await loadRobots(origin, userAgent, opts.robotsLoader ?? defaultRobotsLoader)
    : null;

  const pages: CrawledPage[] = [];
  const skippedByRobots: string[] = [];
  const visited = new Set<string>();
  const queue: Array<{ url: string; depth: number }> = [
    { url: normalizeUrl(seedUrl), depth: 0 },
  ];

  while (queue.length > 0 && pages.length < maxPages) {
    const next = queue.shift();
    if (!next) break;
    const { url, depth } = next;

    if (visited.has(url)) continue;
    visited.add(url);

    if (robots && !robots.isAllowed(url)) {
      skippedByRobots.push(url);
      continue;
    }

    const verdict = classifyUrl(url);
    if (!verdict.ok) continue;

    if (pages.length > 0) {
      await sleep(rateLimitMs);
    }

    const page = await fetchOne(url, fetcher, userAgent);
    pages.push(page);

    if (page.parsed && depth < maxDepth) {
      for (const link of page.parsed.internalLinks) {
        if (!visited.has(link)) {
          queue.push({ url: link, depth: depth + 1 });
        }
      }
    }
  }

  return {
    pages,
    startedAt,
    finishedAt: new Date(),
    skippedByRobots,
    sitemap,
    robots: robotsProbe,
  };
}

async function probeSiteFile(
  origin: string,
  path: string,
  fetcher: Fetcher,
  userAgent: string
): Promise<SiteFileProbe> {
  const url = new URL(path, origin).toString();
  try {
    const res = await fetcher(url, { headers: { 'user-agent': userAgent } });
    return { url, status: res.status };
  } catch {
    return { url, status: null };
  }
}

async function fetchOne(url: string, fetcher: Fetcher, userAgent: string): Promise<CrawledPage> {
  const fetchedAt = new Date();
  try {
    const res = await fetcher(url, {
      headers: { 'user-agent': userAgent, accept: 'text/html,application/xhtml+xml' },
    });
    const contentType = res.headers['content-type'] ?? null;
    const isHtml = contentType !== null && /text\/html|application\/xhtml/i.test(contentType);

    if (res.status !== 200 || !isHtml) {
      return {
        url,
        finalUrl: res.finalUrl,
        statusCode: res.status,
        fetchedAt,
        contentType,
        parsed: null,
        error: res.status !== 200 ? `HTTP ${res.status}` : 'non-HTML content-type',
      };
    }

    const parsed = parseHtml(res.body, res.finalUrl, res.headers);
    return {
      url,
      finalUrl: res.finalUrl,
      statusCode: res.status,
      fetchedAt,
      contentType,
      parsed,
    };
  } catch (err) {
    return {
      url,
      finalUrl: url,
      statusCode: 0,
      fetchedAt,
      contentType: null,
      parsed: null,
      error: err instanceof Error ? err.message : 'unknown fetch error',
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type { CrawlOptions, CrawlResult, CrawledPage, SiteFileProbe } from './types';
