import { post } from './api.js';
import { ENDPOINTS } from './endpoints.js';

const TOKEN_KEY = 'auth_token';

export async function fetchAndStoreToken() {
  const data = await post(ENDPOINTS.token, {});
  const token = data?.token;
  if (!token) throw new Error('No token returned from API');
  localStorage.setItem(TOKEN_KEY, token);
  return token;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}
