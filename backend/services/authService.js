const AppError = require("../utils/appError");

const AUTH_TOKEN_URL =
  process.env.AUTH_TOKEN_URL ||
  "https://sentenceapi-hydnhnhmdreaexgu.eastasia-01.azurewebsites.net/api/Auth/token";

let cachedToken = null;
let tokenExpiryMs = 0;

async function fetchAndStoreToken() {
  if (cachedToken && Date.now() < tokenExpiryMs) {
    return cachedToken;
  }

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

  cachedToken = token;
  tokenExpiryMs = Date.now() + 60 * 60 * 1000;
  return token;
}

module.exports = { fetchAndStoreToken };
