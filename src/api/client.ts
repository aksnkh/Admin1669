import type { TokenPair } from '../types';

declare global {
  interface Window {
    ADMIN1669_CONFIG?: { apiBaseUrl?: string; referralEndpoint?: string | null };
  }
}
export const config = {
  apiBaseUrl: (
    window.ADMIN1669_CONFIG?.apiBaseUrl ||
    import.meta.env.VITE_API_BASE_URL ||
    '/api'
  ).replace(/\/$/, ''),
  referralEndpoint: window.ADMIN1669_CONFIG?.referralEndpoint || null,
};
const SESSION_KEY = 'admin1669.session';
let generation = 0;
let pendingRefresh: Promise<TokenPair> | null = null;
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export function session(): TokenPair | null {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}
export function saveSession(tokens: TokenPair) {
  if (!tokens.accessToken || !tokens.refreshToken) throw new ApiError('پاسخ ورود معتبر نیست.', 502);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(tokens));
}
export function clearSession() {
  generation++;
  sessionStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event('admin1669:signout'));
}
async function send<T>(
  path: string,
  body: unknown,
  accessToken?: string,
  signal?: AbortSignal,
): Promise<T> {
  let response: globalThis.Response;
  try {
    response = await fetch(`${config.apiBaseUrl}/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError(
      'ارتباط با سرور برقرار نشد. اتصال اینترنت و تنظیمات CORS سرور را بررسی کنید.',
      0,
    );
  }
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      data?.message ||
        (response.status === 401
          ? 'نشست شما معتبر نیست؛ دوباره وارد شوید.'
          : `دریافت اطلاعات با خطا مواجه شد (${response.status}).`),
      response.status,
    );
  return data as T;
}
async function refresh(): Promise<TokenPair> {
  if (!pendingRefresh) {
    const current = session();
    if (!current?.refreshToken) throw new ApiError('دوباره وارد شوید.', 401);
    const revision = generation;
    pendingRefresh = send<TokenPair>('auth/refresh', { refreshToken: current.refreshToken })
      .then((tokens) => {
        if (revision !== generation) throw new ApiError('نشست پایان یافته است.', 401);
        saveSession(tokens);
        return tokens;
      })
      .catch((error) => {
        if (revision === generation) clearSession();
        throw error;
      })
      .finally(() => {
        pendingRefresh = null;
      });
  }
  return pendingRefresh;
}
export async function post<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const revision = generation;
  const original = session()?.accessToken;
  try {
    return await send<T>(path, body, original, signal);
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.status !== 401 ||
      !original ||
      signal?.aborted ||
      revision !== generation
    )
      throw error;
    const current = session();
    // Late 401 responses reuse a token already rotated by another request.
    const tokens =
      current?.accessToken && current.accessToken !== original ? current : await refresh();
    try {
      return await send<T>(path, body, tokens.accessToken, signal);
    } catch (retryError) {
      if (retryError instanceof ApiError && retryError.status === 401 && revision === generation)
        clearSession();
      throw retryError;
    }
  }
}
export async function login(userName: string, password: string) {
  const tokens = await send<TokenPair>('auth/login', { userName, password });
  saveSession(tokens);
}
export async function logout() {
  // Serialize with a possible refresh to revoke the most recent token family.
  if (pendingRefresh) await pendingRefresh.catch(() => undefined);
  const current = session();
  clearSession();
  if (current) await send<void>('auth/logout', { refreshToken: current.refreshToken });
}
