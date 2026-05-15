import { describe, expect, it } from 'vitest';
import { encodeOAuthState, decodeOAuthState } from '@/lib/gsc/oauth-state';

describe('gsc/oauth-state', () => {
  it('encode + decode round-trip', () => {
    const state = { projectId: 'clp123abc', nonce: 'a1b2c3d4e5f6' };
    const decoded = decodeOAuthState(encodeOAuthState(state));
    expect(decoded).toEqual(state);
  });

  it('decode une chaîne corrompue → null', () => {
    expect(decodeOAuthState('%%%not-base64%%%')).toBeNull();
    expect(decodeOAuthState('')).toBeNull();
  });

  it('decode un JSON valide mais sans nonce → null', () => {
    const partial = Buffer.from(JSON.stringify({ projectId: 'x' })).toString('base64url');
    expect(decodeOAuthState(partial)).toBeNull();
  });

  it('decode un JSON avec projectId vide → null', () => {
    const empty = Buffer.from(JSON.stringify({ projectId: '', nonce: 'n' })).toString('base64url');
    expect(decodeOAuthState(empty)).toBeNull();
  });
});
