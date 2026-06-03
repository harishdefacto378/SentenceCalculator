// 🔐 Auth API (Token)
export const AUTH_TOKEN_URL =
  "https://sentenceapi-hydnhnhmdreaexgu.eastasia-01.azurewebsites.net/api/Auth/token";

// 🌐 Dataverse Base URL
export const DATA_API_BASE =
  "https://orge31c15cd.api.crm8.dynamics.com";

// 📊 All Data Endpoints
export const ENDPOINTS = {
  drugList: `${DATA_API_BASE}/api_getdruglist`,
  averageFactors: `${DATA_API_BASE}/api_getaveragefactors`,
  marqueeSetting: `${DATA_API_BASE}/api_getmarqueesetting`,
  factors: `${DATA_API_BASE}/api_getfactors`
};

export default ENDPOINTS;