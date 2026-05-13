// Anti-SSRF — bloque les URLs vers localhost, IPs privées, .local.
// Voir SECURITY.md §Crawler anti-SSRF.

const PRIVATE_HOST_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /\.local$/i,
  /\.localhost$/i,
];

const PRIVATE_IPV4_PATTERNS: RegExp[] = [
  /^127\./, // loopback
  /^10\./, // private class A
  /^192\.168\./, // private class C
  /^172\.(1[6-9]|2\d|3[01])\./, // private class B
  /^169\.254\./, // link-local
  /^0\./, // current network
  /^224\./, // multicast
];

const PRIVATE_IPV6_PATTERNS: RegExp[] = [
  /^::1$/i, // loopback
  /^fc/i, // unique local
  /^fd/i, // unique local
  /^fe80:/i, // link-local
];

export type SafetyVerdict =
  | { ok: true; url: URL }
  | { ok: false; reason: string };

export function classifyUrl(input: string): SafetyVerdict {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, reason: 'invalid URL' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: `unsupported protocol: ${url.protocol}` };
  }

  // Node conserve les brackets pour les hostnames IPv6, on les strip pour le matching.
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!host) return { ok: false, reason: 'empty host' };

  for (const pattern of PRIVATE_HOST_PATTERNS) {
    if (pattern.test(host)) return { ok: false, reason: `private host: ${host}` };
  }

  // IPv4 literal ?
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    for (const pattern of PRIVATE_IPV4_PATTERNS) {
      if (pattern.test(host)) return { ok: false, reason: `private IPv4: ${host}` };
    }
  }

  // IPv6 literal ?
  if (host.includes(':')) {
    for (const pattern of PRIVATE_IPV6_PATTERNS) {
      if (pattern.test(host)) return { ok: false, reason: `private IPv6: ${host}` };
    }
  }

  return { ok: true, url };
}

export function isSameOrigin(a: URL, b: URL): boolean {
  return a.protocol === b.protocol && a.host === b.host;
}

/** Normalise une URL pour dédup : drop le fragment, sort query params. */
export function normalizeUrl(input: string | URL): string {
  const url = typeof input === 'string' ? new URL(input) : new URL(input.toString());
  url.hash = '';
  const params = Array.from(url.searchParams.entries()).sort(([a], [b]) => a.localeCompare(b));
  url.search = '';
  for (const [k, v] of params) url.searchParams.append(k, v);
  // Strip trailing slash sauf à la racine
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }
  return url.toString();
}
