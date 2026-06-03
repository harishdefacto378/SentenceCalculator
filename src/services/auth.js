import { AUTH_TOKEN_URL } from './endpoints.js';

const TOKEN_KEY = 'auth_token';

/**
 * Fetches an auth token from the backend, stores it in localStorage,
 * and returns the token string.
 */
export async function fetchAndStoreToken() {
  const res = await fetch(AUTH_TOKEN_URL, { method: 'POST' });

  if (!res.ok) {
    throw new Error(`Token request failed: ${res.status}`);
  }

  const data = await res.json();
  const token = data.token ?? data.accessToken ?? data.access_token ?? data;

  if (typeof token === 'string') {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
  }

  return token;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}
