import { request } from 'undici';
import type { DataForSeoCredentials, Fetcher } from './types';

export const DATAFORSEO_BASE_URL = 'https://api.dataforseo.com/v3';
export const DEFAULT_TIMEOUT_MS = 15_000;

/** Fetcher par défaut basé sur undici. Pour les tests, injecter un mock. */
export const undiciFetcher: Fetcher = async (url, init) => {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const res = await request(url, {
      method: init.method,
      headers: init.headers,
      body: init.body,
      signal: init.signal ?? ctrl.signal,
    });
    const text = await res.body.text();
    return { status: res.statusCode, body: text };
  } finally {
    clearTimeout(timeout);
  }
};

/** Encode `login:password` en Basic auth header. */
export function buildAuthHeader(creds: DataForSeoCredentials): string {
  const token = Buffer.from(`${creds.login}:${creds.password}`, 'utf-8').toString('base64');
  return `Basic ${token}`;
}

export type DataForSeoClient = {
  /** GET sur un endpoint DataForSEO. Concat avec la base URL. */
  get: (path: string) => Promise<{ status: number; body: string }>;
  /** POST avec body JSON sur un endpoint DataForSEO. */
  post: (path: string, body: unknown) => Promise<{ status: number; body: string }>;
};

export function createDataForSeoClient(
  creds: DataForSeoCredentials,
  fetcher: Fetcher = undiciFetcher
): DataForSeoClient {
  const authHeader = buildAuthHeader(creds);

  const headersBase: Record<string, string> = {
    authorization: authHeader,
    accept: 'application/json',
  };

  return {
    async get(path) {
      return fetcher(`${DATAFORSEO_BASE_URL}${path}`, {
        method: 'GET',
        headers: headersBase,
      });
    },
    async post(path, body) {
      return fetcher(`${DATAFORSEO_BASE_URL}${path}`, {
        method: 'POST',
        headers: { ...headersBase, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    },
  };
}
