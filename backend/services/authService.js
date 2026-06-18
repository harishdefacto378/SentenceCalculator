const AppError = require("../utils/appError");

const AUTH_TOKEN_URL =
  process.env.AUTH_TOKEN_URL ||
  "https://sentenceapi-hydnhnhmdreaexgu.eastasia-01.azurewebsites.net/api/Auth/token";

const EXPIRY_BUFFER_MS = 5 * 60 * 1000;
const DEFAULT_EXPIRES_IN_SECONDS = 60 * 60;

let cachedToken = null;
let tokenExpiryMs = 0;
let tokenFetchPromise = null;

function clearCachedToken(reason = "manual reset") {
  cachedToken = null;
  tokenExpiryMs = 0;
  console.warn(`[authService] Cached token cleared (${reason})`);
}

function getExpiryMs(parsed) {
  const rawExpiresIn =
    parsed?.expires_in ??
    parsed?.expiresIn ??
    parsed?.expires ??
    DEFAULT_EXPIRES_IN_SECONDS;

  const expiresInSeconds = Number(rawExpiresIn);
  const safeExpiresInSeconds =
    Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
      ? expiresInSeconds
      : DEFAULT_EXPIRES_IN_SECONDS;

  const calculatedTtlMs = safeExpiresInSeconds * 1000 - EXPIRY_BUFFER_MS;
  const ttlMs = Math.max(calculatedTtlMs, 1000);
  return Date.now() + ttlMs;
}

function parseToken(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = raw;
  }

  const token =
    typeof parsed === "string"
      ? parsed
      : parsed?.token || parsed?.accessToken || parsed?.access_token;

  if (!token || typeof token !== "string") {
    throw new AppError("INVALID_TOKEN_RESPONSE", "Invalid token format received", 502, { raw });
  }

  return { token, parsed };
}

async function requestNewToken() {
  const response = await fetch(AUTH_TOKEN_URL, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new AppError(
      "AUTH_REQUEST_FAILED",
      `Token request failed (${response.status})`,
      response.status,
      { raw }
    );
  }

  const { token, parsed } = parseToken(raw);
  cachedToken = token;
  tokenExpiryMs = getExpiryMs(parsed);
  console.log("[authService] Token fetched and cached");
  return cachedToken;
}

async function fetchAndStoreToken(forceRefresh = false) {
  if (!forceRefresh && cachedToken && Date.now() < tokenExpiryMs) {
    console.log("[authService] Reusing cached token");
    return cachedToken;
  }

  if (!forceRefresh && tokenFetchPromise) {
    return tokenFetchPromise;
  }

  tokenFetchPromise = requestNewToken();
  try {
    return await tokenFetchPromise;
  } finally {
    tokenFetchPromise = null;
  }
}

module.exports = { fetchAndStoreToken, clearCachedToken };
