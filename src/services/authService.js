const AUTH_API_BASE = 'https://sentenceapi-hydnhnhmdreaexgu.eastasia-01.azurewebsites.net';
const TOKEN_STORAGE_KEY = 'sc_auth_token';

/**
 * Calls the Auth token endpoint, stores the token in localStorage, and returns it.
 */
export async function fetchToken() {
  const res = await fetch(`${AUTH_API_BASE}/api/Auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Auth request failed with status ${res.status}`);
  }

  const data = await res.json();
  // Support common token response shapes
  const token = data.token ?? data.accessToken ?? data.access_token ?? data;

  if (!token || typeof token !== 'string') {
    throw new Error('Unexpected token response format');
  }

  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  return token;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}
