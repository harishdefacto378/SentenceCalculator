const { fetchAndStoreToken, clearCachedToken } = require("./authService");
const fetchWithRetry = require("../utils/fetchWithRetry");
const AppError = require("../utils/appError");

const BASE_URL = process.env.DATAVERSE_BASE_URL || "https://orge31c15cd.api.crm8.dynamics.com";

const PATHS = {
  drugList: "/api/data/v9.2/api_getdruglist",
  averageFactors: "/api/data/v9.2/api_getaveragefactors",
  createSentence: "/api/data/v9.2/api_df_createsentence",
};

async function callDataverseApi(path, payload) {
  const requestDataverse = async (token) =>
    fetchWithRetry(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload || {}),
    });

  const initialToken = await fetchAndStoreToken();
  if (!initialToken) {
    throw new AppError("DATAVERSE_MISSING_TOKEN", "Missing Dataverse token", 500, { path });
  }

  let response = await requestDataverse(initialToken);
  let raw = await response.text();
  console.log(`Dataverse ${path} -> ${response.status}`);

  if (response.status === 401) {
    console.warn("[dataverseService] Received 401, refreshing token and retrying once");
    clearCachedToken("401 from Dataverse");
    const refreshedToken = await fetchAndStoreToken(true);
    if (!refreshedToken) {
      throw new AppError("DATAVERSE_MISSING_TOKEN", "Missing Dataverse token after refresh", 500, { path });
    }

    response = await requestDataverse(refreshedToken);
    raw = await response.text();
    console.log(`Dataverse retry ${path} -> ${response.status}`);
  }

  if (!response.ok) {
    throw new AppError(
      "DATAVERSE_REQUEST_FAILED",
      `Dataverse request failed (${response.status})`,
      response.status,
      { path, raw }
    );
  }

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new AppError("DATAVERSE_INVALID_JSON", `Dataverse returned invalid JSON for ${path}`, 502);
  }
}

async function getAverageFactors(payload) {
  const response = await callDataverseApi(PATHS.averageFactors, payload);
  console.log("[averageFactorsService] Fresh data fetched from API");
  let aggr = [];
  let mitig = [];

  try {
    aggr = JSON.parse(response.aggravatingAverageFactors || "[]");
  } catch {
    throw new AppError("DATAVERSE_INVALID_JSON", "Invalid aggravatingAverageFactors payload", 502);
  }

  try {
    mitig = JSON.parse(response.mitigatingAverageFactors || "[]");
  } catch {
    throw new AppError("DATAVERSE_INVALID_JSON", "Invalid mitigatingAverageFactors payload", 502);
  }

  console.log("[averageFactorsService] Parsed API response");
  console.log({
    aggravatingRaw: aggr.length,
    mitigatingRaw: mitig.length,
  });

  const formatted = {
    aggravating: aggr.map((item, i) => ({
      id: `a${i + 1}`,
      label: item.factorName,
      sentence: 0,
      fine: 0,
      avg: Math.round(item.average),
    })),
    mitigating: mitig.map((item, i) => ({
      id: `m${i + 1}`,
      label: item.factorName,
      sentence: 0,
      fine: 0,
      avg: Math.round(item.average),
    })),
  };

  console.log("[averageFactorsService] Final formatted data ready");
  console.log({
    aggravating: formatted.aggravating.length,
    mitigating: formatted.mitigating.length,
  });

  return formatted;
}

module.exports = {
  PATHS,
  callDataverseApi,
  getAverageFactors,
};
