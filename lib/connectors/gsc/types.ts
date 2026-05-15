/**
 * Types du connecteur Google Search Console (S2-01/02/03).
 *
 * Implémentation "raw" : OAuth2 + appels HTTP directs (undici), pas de SDK
 * `googleapis` (cf. journal 2026-05-15, cohérent avec le connecteur DataForSEO).
 */

/** Fetcher injectable — permet de mocker le réseau dans les tests. */
export type GscFetcher = (
  url: string,
  init: {
    method: 'GET' | 'POST';
    headers: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  }
) => Promise<GscFetcherResponse>;

export type GscFetcherResponse = {
  status: number;
  body: string;
};

/** Tokens renvoyés par l'endpoint OAuth de Google. */
export type GscOAuthTokens = {
  accessToken: string;
  /** Absent lors d'un refresh ; présent lors d'un échange de code initial. */
  refreshToken?: string;
  expiresIn: number;
  scope: string;
  tokenType: string;
};

/** Une propriété (site) accessible dans Search Console. */
export type GscSite = {
  siteUrl: string;
  permissionLevel: string;
};

/**
 * Ligne brute de l'API Search Analytics. `keys` contient les valeurs des
 * dimensions demandées, dans l'ordre de la requête.
 */
export type GscRawRow = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

/** Raison d'échec normalisée pour tous les appels GSC. */
export type GscErrorReason =
  | 'network'
  | 'invalid_grant'
  | 'unauthorized'
  | 'invalid_response'
  | 'api_error';

export type GscError = {
  ok: false;
  reason: GscErrorReason;
  status: number;
  message: string;
};
