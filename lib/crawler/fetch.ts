import { request } from 'undici';
import type { Fetcher, RobotsLoader } from './types';

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5 MB plafond
const MAX_REDIRECTS = 5;

export const undiciFetcher: Fetcher = async (url, init) => {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), DEFAULT_TIMEOUT_MS);
  let currentUrl = url;

  try {
    for (let i = 0; i <= MAX_REDIRECTS; i++) {
      const res = await request(currentUrl, {
        method: 'GET',
        headers: init.headers,
        signal: init.signal ?? ctrl.signal,
      });

      const headers = normalizeHeaders(res.headers);

      const isRedirect = res.statusCode >= 300 && res.statusCode < 400 && headers['location'];
      if (isRedirect && i < MAX_REDIRECTS) {
        // Consomme et jette le body pour libérer le socket
        await res.body.dump();
        const location = headers['location']!;
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      const body = await readBodyCapped(res.body, MAX_BODY_BYTES);
      return { status: res.statusCode, headers, body, finalUrl: currentUrl };
    }

    return {
      status: 0,
      headers: {},
      body: '',
      finalUrl: currentUrl,
    };
  } finally {
    clearTimeout(timeout);
  }
};

function normalizeHeaders(
  raw: Record<string, string | string[] | undefined>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === undefined) continue;
    out[k.toLowerCase()] = Array.isArray(v) ? v.join(', ') : v;
  }
  return out;
}

async function readBodyCapped(
  stream: NodeJS.ReadableStream,
  maxBytes: number
): Promise<string> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of stream) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.byteLength;
    if (total > maxBytes) {
      const remaining = Math.max(0, maxBytes - (total - buf.byteLength));
      chunks.push(buf.subarray(0, remaining));
      break;
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

export const defaultRobotsLoader: RobotsLoader = async (origin) => {
  const url = new URL('/robots.txt', origin).toString();
  try {
    const res = await undiciFetcher(url, {
      headers: { 'user-agent': 'SeoAuditBot/0.1 (+contact@novera)' },
    });
    if (res.status !== 200) return null;
    return res.body;
  } catch {
    return null;
  }
};
