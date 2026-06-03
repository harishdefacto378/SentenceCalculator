const API_BASE = 'https://orge31c15cd.api.crm8.dynamics.com';
const PREFETCH_STORAGE_KEY = 'sc_prefetched_data';

/**
 * Makes 4 secured API calls in parallel using the provided token.
 * Results are stored in localStorage for the calculator page to consume.
 */
export async function prefetchAll(token) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const [drugList, avgFactors, marqueeSetting, factors] = await Promise.all([
    fetchEndpoint(`${API_BASE}/api_getdruglist`, headers),
    fetchEndpoint(`${API_BASE}/api_getaveragefactors`, headers),
    fetchEndpoint(`${API_BASE}/api_getmarqueesetting`, headers),
    fetchEndpoint(`${API_BASE}/api_getfactors`, headers),
  ]);

  const data = { drugList, avgFactors, marqueeSetting, factors };
  localStorage.setItem(PREFETCH_STORAGE_KEY, JSON.stringify(data));
  return data;
}

async function fetchEndpoint(url, headers) {
  const res = await fetch(url, { method: 'POST', headers });
  if (!res.ok) {
    throw new Error(`API call to ${url} failed with status ${res.status}`);
  }
  return res.json();
}

export function getPrefetchedData() {
  const raw = localStorage.getItem(PREFETCH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
