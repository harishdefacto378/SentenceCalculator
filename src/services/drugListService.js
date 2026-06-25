const DRUG_CACHE_KEY = "drugsData";
const FACTOR_CACHE_KEY = "averageFactorsData";
const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// In-flight promise guard — prevents duplicate concurrent API calls
let _pendingFetch = null;

/**
 * Returns cached drug data if it exists and has not expired, otherwise null.
 */
export function getCachedDrugList() {
  try {
    const raw = localStorage.getItem(DRUG_CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp < CACHE_EXPIRY_MS && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch {
    // Corrupted cache entry — clear it
    localStorage.removeItem(DRUG_CACHE_KEY);
  }
  return null;
}

export function getCachedAverageFactors() {
  try {
    const raw = localStorage.getItem(FACTOR_CACHE_KEY);
    if (!raw) return null;
    const { aggravating, mitigating, timestamp } = JSON.parse(raw);
    if (
      Date.now() - timestamp < CACHE_EXPIRY_MS &&
      Array.isArray(aggravating) &&
      Array.isArray(mitigating)
    ) {
      return { aggravating, mitigating };
    }
  } catch {
    localStorage.removeItem(FACTOR_CACHE_KEY);
  }
  return null;
}

/**
 * Fetches the drug list from the API, with localStorage caching and 10-minute expiry.
 * - Returns cached data immediately if valid.
 * - Deduplicates concurrent in-flight requests (only one real fetch at a time).
 * - Stores the response in localStorage after a successful fetch.
 *
 * @returns {Promise<Array>} Resolved array of drug records.
 */
export async function fetchDrugList() {
  const cached = getCachedDrugList();
  const cachedFactors = getCachedAverageFactors();
  if (cached) {
    console.log("[drugListService] Using cached drug data");
    console.log(JSON.parse(localStorage.getItem(DRUG_CACHE_KEY)))
    if (cachedFactors) {
      const factorsRaw = localStorage.getItem(FACTOR_CACHE_KEY);
      const factorsStamp = factorsRaw ? JSON.parse(factorsRaw)?.timestamp : undefined;
      console.log("[averageFactorsService] Using cached factors data");
      console.log({
        aggravatingCount: cachedFactors.aggravating.length,
        mitigatingCount: cachedFactors.mitigating.length,
        timestamp: factorsStamp,
      });
    }
    return cached;
  }

  // Re-use an in-flight request if one is already pending
  if (_pendingFetch) {
    console.log("[drugListService] Re-using in-flight request");
    return _pendingFetch;
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  console.log("[drugListService] Fetching drug list from API...");

  _pendingFetch = fetch(`${apiUrl}/api/getdruglist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({}),
  })
    .then(res => {
      if (!res.ok) throw new Error(`API error ${res.status}`);
      return res.json();
    })
    .then(json => {
      const data = (json.value || []).filter(d => d.df_drugidentifier);
      if (data.length > 0) {
        localStorage.setItem(DRUG_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
        console.log("[drugListService] Drug data fetched and cached");
      }
      if (Array.isArray(json.aggravating) && Array.isArray(json.mitigating)) {
        localStorage.setItem(
          FACTOR_CACHE_KEY,
          JSON.stringify({
            aggravating: json.aggravating,
            mitigating: json.mitigating,
            timestamp: Date.now(),
          })
        );
        console.log("[drugListService] Average factors fetched and cached");
        console.log("[averageFactorsService] Final formatted data ready");
        console.log({
          aggravating: json.aggravating.length,
          mitigating: json.mitigating.length,
        });
      }
      return data;
    })
    .catch(err => {
      console.error("[drugListService] Failed to fetch drug list:", err.message);
      throw err;
    })
    .finally(() => {
      _pendingFetch = null;
    });

  return _pendingFetch;
}

/** Clears the drug list cache (useful for forced refresh). */
export function clearDrugListCache() {
  localStorage.removeItem(DRUG_CACHE_KEY);
  localStorage.removeItem(FACTOR_CACHE_KEY);
  _pendingFetch = null;
}
