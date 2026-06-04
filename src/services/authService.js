// import { AUTH_TOKEN_URL } from "./endpoints.js";

// const TOKEN_KEY = "auth_token";

// export async function fetchAndStoreToken() {
//   const res = await fetch(AUTH_TOKEN_URL, {
//     method: "GET", // ✅ FIX 1: must be POST
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });

//   if (!res.ok) {
//     throw new Error(`Token request failed: ${res.status}`);
//   }

//   // ✅ FIX 2: handle both JSON + text safely
//   const text = await res.text();

//   let data;
//   try {
//     data = JSON.parse(text);
//   } catch {
//     data = text;
//   }

//   const token =
//     typeof data === "string"
//       ? data
//       : data?.token || data?.accessToken || data?.access_token;


//   if (!token || typeof token !== "string") {
//     throw new Error("Invalid token format received");
//   }

//   localStorage.setItem(TOKEN_KEY, token);

//   return token;
// }

// export function getStoredToken() {
//   return localStorage.getItem(TOKEN_KEY);
// }


import { AUTH_TOKEN_URL } from "./endpoints.js";

const TOKEN_KEY = "auth_token";
const TOKEN_EXPIRY_KEY = "auth_token_expiry";

export async function fetchAndStoreToken() {
  const storedToken = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

  // ✅ अगर token already hai aur valid hai → API call skip
  if (storedToken && expiry && Date.now() < Number(expiry)) {
    console.log("Using stored token");
    return storedToken;
  }

  console.log("Fetching new token from API...");

  const res = await fetch(AUTH_TOKEN_URL, {
    method: "GET", // ✅ IMPORTANT (API GET expect karti hai)
    headers: {
      "Content-Type": "application/json",
    },
  });

  console.log("Response status:", res.status);

  if (!res.ok) {
    throw new Error(`Token request failed: ${res.status}`);
  }

  const text = await res.text();
  console.log("Raw response:", text);

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

  if (!token || typeof token !== "string") {
    throw new Error("Invalid token format received");
  }

  // ✅ save token
  localStorage.setItem(TOKEN_KEY, token);

  // ✅ expiry set (1 hour)
  const expiryTime = Date.now() + 60 * 60 * 1000;
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime);

  return token;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}