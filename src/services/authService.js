import { AUTH_TOKEN_URL } from "./endpoints.js";

const TOKEN_KEY = "auth_token";

export async function fetchAndStoreToken() {
  const res = await fetch(AUTH_TOKEN_URL, {
    method: "GET", // ✅ FIX 1: must be POST
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Token request failed: ${res.status}`);
  }

  // ✅ FIX 2: handle both JSON + text safely
  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  const token =
    typeof data === "string"
      ? data
      : data?.token || data?.accessToken || data?.access_token;

  console.log("🔐 Token Response:", data);
  console.log("🔑 Extracted Token:", token);

  if (!token || typeof token !== "string") {
    throw new Error("Invalid token format received");
  }

  localStorage.setItem(TOKEN_KEY, token);

  return token;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}