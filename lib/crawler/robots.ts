import robotsParser from 'robots-parser';
import type { RobotsLoader } from './types';

export type RobotsChecker = {
  isAllowed: (url: string) => boolean;
  sitemap: string[];
};

const NOOP_CHECKER: RobotsChecker = {
  isAllowed: () => true,
  sitemap: [],
};

export async function loadRobots(
  origin: string,
  userAgent: string,
  loader: RobotsLoader
): Promise<RobotsChecker> {
  const txt = await loader(origin);
  if (txt === null) return NOOP_CHECKER;

  const robotsUrl = new URL('/robots.txt', origin).toString();
  const parser = robotsParser(robotsUrl, txt);

  return {
    isAllowed: (url: string) => parser.isAllowed(url, userAgent) ?? true,
    sitemap: parser.getSitemaps(),
  };
}
