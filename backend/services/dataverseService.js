const { fetchAndStoreToken } = require("./authService");
const fetchWithRetry = require("../utils/fetchWithRetry");
const AppError = require("../utils/appError");

const BASE_URL = process.env.DATAVERSE_BASE_URL || "https://orge31c15cd.api.crm8.dynamics.com";

const PATHS = {
  drugList: "/api/data/v9.2/api_getdruglist",
  createSentence: "/api/data/v9.2/api_df_createsentence",
};

async function callDataverseApi(path, payload) {
  const token = await fetchAndStoreToken();

  const response = await fetchWithRetry(`${BASE_URL}${path}`, {
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

  const raw = await response.text();
  console.log(`Dataverse ${path} -> ${response.status}`);

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

module.exports = {
  PATHS,
  callDataverseApi,
};
