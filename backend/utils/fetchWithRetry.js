const AppError = require("./appError");

const RETRY_STATUS_CODES = new Set([429, 503]);
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 250;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url, options, attempt = 0) {
  try {
    const response = await fetch(url, options);

    if (RETRY_STATUS_CODES.has(response.status) && attempt < MAX_RETRIES) {
      const waitMs = BASE_DELAY_MS * 2 ** attempt;
      await sleep(waitMs);
      return fetchWithRetry(url, options, attempt + 1);
    }

    return response;
  } catch (error) {
    const isNetworkError = error instanceof TypeError;
    if (isNetworkError && attempt < MAX_RETRIES) {
      const waitMs = BASE_DELAY_MS * 2 ** attempt;
      await sleep(waitMs);
      return fetchWithRetry(url, options, attempt + 1);
    }

    throw new AppError("NETWORK_ERROR", "Network request failed", 503, {
      cause: error.message,
    });
  }
}

module.exports = fetchWithRetry;
