const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const BASE_URL = "https://orge31c15cd.api.crm8.dynamics.com";

app.post("/api/getdruglist", async (req, res) => {
  try {
    console.log("API HIT");

    const token = req.headers.authorization;

    if (!token) {
      return res.status(400).json({ error: "Token missing" });
    }

    const response = await fetch(`${BASE_URL}/api_getdruglist`, {
      method: "POST",
      headers: {
        "Authorization": token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body || {})
    });

    const text = await response.text(); // 🔥 IMPORTANT

    console.log("Dataverse raw response:", text);

    // try JSON parse
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return res.status(500).json({
        error: "Invalid JSON from Dataverse",
        raw: text
      });
    }

    res.json(data);

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});