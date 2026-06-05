const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/getdruglist", async (req, res) => {
  try {
    console.log("API called");

    const token =localStorage.getItem(TOKEN_KEY);

    const response = await fetch(
      "https://orge31c15cd.api.crm8.dynamics.com/api_getdruglist",
      {
        method: "POST",
        headers: {
          "Authorization": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).send(errorText);
    }

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).send(err.toString());
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));