export type CrawlOptions = {
  domain: string;
  maxDepth?: number;
  maxPages?: number;
  respectRobots?: boolean;
  rateLimitMs?: number;
  userAgent?: string;
  /** Pour tests : injecter un fetch custom (sinon undici). */
  fetcher?: Fetcher;
  /** Pour tests : injecter un loader de robots.txt. */
  robotsLoader?: RobotsLoader;
};

export type Fetcher = (
  url: string,
  init: { headers: Record<string, string>; signal?: AbortSignal }
) => Promise<FetchResponse>;

export type FetchResponse = {
  status: number;
  finalUrl: string;
  headers: Record<string, string>;
  body: string;
};

export type RobotsLoader = (origin: string) => Promise<string | null>;

export type ParsedPage = {
  title: string | null;
  metaDescription: string | null;
  h1Count: number;
  canonical: string | null;
  /** false si <meta name="robots" content="noindex"> ou X-Robots-Tag: noindex */
  indexable: boolean;
  noindexSource: 'meta' | 'header' | null;
  jsonLd: JsonLdBlock[];
  /** Liens internes (mêmes origine) extraits du <body>, normalisés et dédupliqués. */
  internalLinks: string[];
};

export type JsonLdBlock = {
  raw: string;
  parsed: unknown;
  types: string[];
};

export type CrawledPage = {
  url: string;
  finalUrl: string;
  statusCode: number;
  fetchedAt: Date;
  contentType: string | null;
  parsed: ParsedPage | null;
  /** Page non parsée (statusCode !== 200 ou content-type non HTML, ou erreur réseau). */
  error?: string;
};

export type SiteFileProbe = {
  url: string;
  /** null si non probé. */
  status: number | null;
};

export type CrawlResult = {
  pages: CrawledPage[];
  startedAt: Date;
  finishedAt: Date;
  skippedByRobots: string[];
  sitemap: SiteFileProbe;
  robots: SiteFileProbe;
};
