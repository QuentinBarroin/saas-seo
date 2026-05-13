import { describe, expect, it } from 'vitest';
import { classifyUrl, isSameOrigin, normalizeUrl } from '@/lib/crawler/safety';

describe('crawler/safety · classifyUrl', () => {
  it('accepte une URL HTTPS publique', () => {
    const v = classifyUrl('https://example.com/foo');
    expect(v.ok).toBe(true);
  });

  it('refuse une URL invalide', () => {
    expect(classifyUrl('not-a-url')).toEqual({ ok: false, reason: 'invalid URL' });
  });

  it('refuse un protocole non HTTP(S)', () => {
    const v = classifyUrl('ftp://example.com/');
    expect(v.ok).toBe(false);
  });

  it.each([
    ['http://localhost/', 'private host'],
    ['http://127.0.0.1/', 'private IPv4'],
    ['http://10.0.0.1/', 'private IPv4'],
    ['http://192.168.1.1/', 'private IPv4'],
    ['http://172.16.0.1/', 'private IPv4'],
    ['http://172.31.255.255/', 'private IPv4'],
    ['http://169.254.0.1/', 'private IPv4'],
    ['http://[::1]/', 'private IPv6'],
    ['http://[fe80::1]/', 'private IPv6'],
    ['http://my-server.local/', 'private host'],
  ])('refuse %s (SSRF)', (url, expectedSubstr) => {
    const v = classifyUrl(url);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toContain(expectedSubstr);
  });

  it('accepte une IPv4 publique (8.8.8.8)', () => {
    expect(classifyUrl('http://8.8.8.8/').ok).toBe(true);
  });

  it("accepte une IP juste hors plage privée (172.32.0.1)", () => {
    expect(classifyUrl('http://172.32.0.1/').ok).toBe(true);
    expect(classifyUrl('http://172.15.0.1/').ok).toBe(true);
  });
});

describe('crawler/safety · isSameOrigin', () => {
  it('même protocole + même host', () => {
    expect(isSameOrigin(new URL('https://a.com/x'), new URL('https://a.com/y'))).toBe(true);
  });
  it('host différent', () => {
    expect(isSameOrigin(new URL('https://a.com/x'), new URL('https://b.com/y'))).toBe(false);
  });
  it('protocole différent', () => {
    expect(isSameOrigin(new URL('http://a.com/x'), new URL('https://a.com/y'))).toBe(false);
  });
  it('sous-domaine compte comme origine différente', () => {
    expect(isSameOrigin(new URL('https://a.com/'), new URL('https://www.a.com/'))).toBe(false);
  });
});

describe('crawler/safety · normalizeUrl', () => {
  it('drop le fragment', () => {
    expect(normalizeUrl('https://a.com/foo#section')).toBe('https://a.com/foo');
  });
  it('sort les query params', () => {
    expect(normalizeUrl('https://a.com/foo?z=1&a=2')).toBe('https://a.com/foo?a=2&z=1');
  });
  it('strip le trailing slash sauf à la racine', () => {
    expect(normalizeUrl('https://a.com/')).toBe('https://a.com/');
    expect(normalizeUrl('https://a.com/foo/')).toBe('https://a.com/foo');
  });
  it('est idempotent', () => {
    const url = 'https://a.com/foo?b=1#x';
    expect(normalizeUrl(normalizeUrl(url))).toBe(normalizeUrl(url));
  });
});
