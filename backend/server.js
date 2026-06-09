const express = require("express");
const cors = require("cors");
const { fetchAndStoreToken } = require("../src/services/authService");

const app = express();
app.use(cors());
app.use(express.json());

const BASE_URL = "https://orge31c15cd.api.crm8.dynamics.com";
const API_PATH =
  "/api/data/v9.2/api_getdruglist";

// safe fetch (Node 18+)
const fetchFn = globalThis.fetch;

app.post("/api/getdruglist", async (req, res) => {
  try {
    console.log("🔥 API HIT");

    const token = await fetchAndStoreToken();
    
    const response = await fetchFn(`${BASE_URL}${API_PATH}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
        Prefer: "return=representation",
      },
      body: JSON.stringify(req.body || {}),
    });

    const text = await response.text();

    console.log("📡 STATUS:", response.status);
    console.log("📦 RAW RESPONSE:", text);

    if (!text) {
      return res.status(500).json({
        error: "Empty response from Dataverse",
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return res.status(500).json({
        error: "Invalid JSON from Dataverse",
        raw: text,
      });
    }

    return res.json(data);
  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});