export type DataForSeoCredentials = {
  login: string;
  password: string;
};

export type Fetcher = (
  url: string,
  init: {
    method: 'GET' | 'POST';
    headers: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  }
) => Promise<FetcherResponse>;

export type FetcherResponse = {
  status: number;
  body: string;
};

export type TestCredentialsResult =
  | {
      ok: true;
      account: {
        login: string;
        timezone?: string;
        money?: { balance?: number; currency?: string };
      };
    }
  | {
      ok: false;
      reason: 'unauthorized' | 'network' | 'invalid_response' | 'api_error';
      status: number;
      message: string;
    };

/**
 * Shape commune des réponses DataForSEO (v3). Chaque appel renvoie un wrapper
 * avec `status_code` (codes DFS, 20000 = OK) et un tableau `tasks` chacune
 * porteuse de son propre `status_code` + `result`.
 */
export type DataForSeoEnvelope<T> = {
  status_code: number;
  status_message: string;
  cost?: number;
  tasks_count?: number;
  tasks_error?: number;
  tasks?: Array<{
    id: string;
    status_code: number;
    status_message: string;
    result?: T[] | null;
  }>;
};

/** Result item de `/v3/appendix/user_data`. */
export type UserDataResult = {
  login: string;
  timezone?: string;
  rates?: Record<string, unknown>;
  money?: { balance?: number; currency?: string };
};
