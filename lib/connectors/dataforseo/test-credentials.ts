import { createDataForSeoClient, undiciFetcher } from './client';
import type {
  DataForSeoCredentials,
  DataForSeoEnvelope,
  Fetcher,
  TestCredentialsResult,
  UserDataResult,
} from './types';

/**
 * Valide une paire `login` / `password` DataForSEO en interrogeant
 * `/v3/appendix/user_data` (endpoint qui retourne les infos du compte —
 * gratuit, pas de coût en task budget).
 *
 * Cas couverts :
 *  - 200 + envelope.status_code 20000 → ok: true + account
 *  - 401 ou envelope.status_code 401xx → unauthorized
 *  - 5xx ou network error → network
 *  - 200 mais body non-JSON / shape inattendue → invalid_response
 *  - Autre status_code DFS → api_error
 *
 * `fetcher` injectable pour tests.
 */
export async function testCredentials(
  creds: DataForSeoCredentials,
  fetcher: Fetcher = undiciFetcher
): Promise<TestCredentialsResult> {
  const client = createDataForSeoClient(creds, fetcher);

  let response;
  try {
    response = await client.get('/appendix/user_data');
  } catch (err) {
    return {
      ok: false,
      reason: 'network',
      status: 0,
      message: err instanceof Error ? err.message : 'Erreur réseau',
    };
  }

  if (response.status === 401 || response.status === 403) {
    return {
      ok: false,
      reason: 'unauthorized',
      status: response.status,
      message: 'Identifiants DataForSEO invalides',
    };
  }

  if (response.status >= 500) {
    return {
      ok: false,
      reason: 'network',
      status: response.status,
      message: `Erreur serveur DataForSEO (${response.status})`,
    };
  }

  let envelope: DataForSeoEnvelope<UserDataResult>;
  try {
    envelope = JSON.parse(response.body) as DataForSeoEnvelope<UserDataResult>;
  } catch {
    return {
      ok: false,
      reason: 'invalid_response',
      status: response.status,
      message: 'Réponse DataForSEO non-JSON',
    };
  }

  // DFS encode 401xx en envelope status (auth invalide renvoie souvent 200 + status 40100x)
  if (envelope.status_code >= 40100 && envelope.status_code < 40200) {
    return {
      ok: false,
      reason: 'unauthorized',
      status: response.status,
      message: envelope.status_message || 'Identifiants DataForSEO invalides',
    };
  }

  if (envelope.status_code !== 20000) {
    return {
      ok: false,
      reason: 'api_error',
      status: response.status,
      message: `${envelope.status_code}: ${envelope.status_message ?? 'erreur API'}`,
    };
  }

  const task = envelope.tasks?.[0];
  const result = task?.result?.[0];
  if (!result || typeof result.login !== 'string') {
    return {
      ok: false,
      reason: 'invalid_response',
      status: response.status,
      message: 'Shape de réponse DataForSEO inattendue (login manquant)',
    };
  }

  return {
    ok: true,
    account: {
      login: result.login,
      ...(result.timezone ? { timezone: result.timezone } : {}),
      ...(result.money ? { money: result.money } : {}),
    },
  };
}
