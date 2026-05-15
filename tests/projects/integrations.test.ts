import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import {
  serializeIntegrations,
  deserializeIntegrations,
} from '@/lib/projects/integrations';

const KEY_A = randomBytes(32).toString('hex');
const KEY_B = randomBytes(32).toString('hex');

let originalKey: string | undefined;

beforeEach(() => {
  originalKey = process.env.ENCRYPTION_KEY;
  process.env.ENCRYPTION_KEY = KEY_A;
});

afterEach(() => {
  if (originalKey === undefined) delete process.env.ENCRYPTION_KEY;
  else process.env.ENCRYPTION_KEY = originalKey;
});

describe('integrations · serialize/deserialize round-trip', () => {
  it('chiffre + déchiffre un bloc DataForSEO sans perte', () => {
    const input = {
      dataforseo: { login: 'user@example.com', password: 'sup3r-secret!' },
    };
    const buf = serializeIntegrations(input);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(0);

    const restored = deserializeIntegrations(buf);
    expect(restored).toEqual(input);
  });

  it('bloc vide → Buffer non-vide mais cohérent', () => {
    const buf = serializeIntegrations({});
    expect(deserializeIntegrations(buf)).toEqual({});
  });

  it('rejette un payload Zod invalide à la sérialisation', () => {
    expect(() =>
      serializeIntegrations({
        dataforseo: { login: '', password: 'x' },
      } as never)
    ).toThrow(/Login DataForSEO requis/);
  });

  it('deserialize avec une clé différente → renvoie {} (defensive)', () => {
    const buf = serializeIntegrations({
      dataforseo: { login: 'u', password: 'p' },
    });
    process.env.ENCRYPTION_KEY = KEY_B;
    expect(deserializeIntegrations(buf)).toEqual({});
  });

  it('deserialize sur Buffer aléatoire (pas un chiffré) → {} sans throw', () => {
    const noise = Buffer.from(randomBytes(64));
    expect(deserializeIntegrations(noise)).toEqual({});
  });

  it('plusieurs sérialisations du même payload donnent des Buffer différents (IV aléatoire)', () => {
    const payload = { dataforseo: { login: 'u', password: 'p' } };
    const a = serializeIntegrations(payload);
    const b = serializeIntegrations(payload);
    expect(a.equals(b)).toBe(false);
    // Mais les deux décryptent au même contenu
    expect(deserializeIntegrations(a)).toEqual(deserializeIntegrations(b));
  });

  it('chiffre + déchiffre un bloc GSC (refresh token + propriété)', () => {
    const input = {
      gsc: { refreshToken: '1//refresh-token-xyz', propertyUrl: 'sc-domain:example.com' },
    };
    expect(deserializeIntegrations(serializeIntegrations(input))).toEqual(input);
  });

  it('chiffre un bloc GSC connecté sans propriété associée', () => {
    const input = { gsc: { refreshToken: '1//refresh-only' } };
    expect(deserializeIntegrations(serializeIntegrations(input))).toEqual(input);
  });

  it('rejette un bloc GSC sans refresh token', () => {
    expect(() =>
      serializeIntegrations({ gsc: { refreshToken: '' } } as never)
    ).toThrow(/Refresh token GSC requis/);
  });

  it('round-trip DataForSEO + GSC combinés', () => {
    const input = {
      dataforseo: { login: 'u', password: 'p' },
      gsc: { refreshToken: '1//rt', propertyUrl: 'https://example.com/' },
    };
    expect(deserializeIntegrations(serializeIntegrations(input))).toEqual(input);
  });
});
