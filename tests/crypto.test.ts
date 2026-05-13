import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import { decrypt, encrypt } from '@/lib/crypto';

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

describe('crypto · AES-256-GCM', () => {
  it('encrypt → decrypt round-trip restitue le plaintext', () => {
    const plaintext = 'login=admin&password=hunter2&token=eyJ.abc';
    const cipher = encrypt(plaintext);
    expect(cipher).not.toBe(plaintext);
    expect(decrypt(cipher)).toBe(plaintext);
  });

  it('produit un IV différent à chaque appel (cipher non-déterministe)', () => {
    const plaintext = 'identique';
    const c1 = encrypt(plaintext);
    const c2 = encrypt(plaintext);
    expect(c1).not.toBe(c2);
  });

  it('gère les payloads vides et unicode', () => {
    expect(decrypt(encrypt(''))).toBe('');
    expect(decrypt(encrypt('café · 日本 · 🔐'))).toBe('café · 日本 · 🔐');
  });

  it('decrypt avec une clé différente → erreur', () => {
    const cipher = encrypt('secret');
    process.env.ENCRYPTION_KEY = KEY_B;
    expect(() => decrypt(cipher)).toThrow();
  });

  it('decrypt avec un tag falsifié → erreur', () => {
    const cipher = encrypt('secret');
    const buf = Buffer.from(cipher, 'base64');
    const tagOffset = 12;
    buf[tagOffset] = buf[tagOffset]! ^ 0xff;
    const tampered = buf.toString('base64');
    expect(() => decrypt(tampered)).toThrow();
  });

  it('decrypt avec un ciphertext falsifié → erreur', () => {
    const cipher = encrypt('secret message un peu long');
    const buf = Buffer.from(cipher, 'base64');
    const lastByteIndex = buf.length - 1;
    buf[lastByteIndex] = buf[lastByteIndex]! ^ 0xff;
    const tampered = buf.toString('base64');
    expect(() => decrypt(tampered)).toThrow();
  });

  it('decrypt sur payload trop court → erreur', () => {
    expect(() => decrypt(Buffer.from('trop court').toString('base64'))).toThrow('Invalid ciphertext');
  });

  it('encrypt sans ENCRYPTION_KEY → erreur explicite', () => {
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt('x')).toThrow('ENCRYPTION_KEY is not set');
  });

  it('rejette une clé de mauvaise longueur', () => {
    process.env.ENCRYPTION_KEY = 'abcd'.repeat(4); // 16 hex chars = 8 bytes
    expect(() => encrypt('x')).toThrow('ENCRYPTION_KEY must be 32 bytes (64 hex chars)');
  });
});
