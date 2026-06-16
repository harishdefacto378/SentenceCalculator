const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes/apiRoutes");
const { errorHandler, notFoundHandler } = require("./utils/errorHandler");

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/api", apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error("➡ Stop the existing process or run with a different PORT.");
    process.exit(1);
  }
  console.error("❌ Server startup error:", err);
  process.exit(1);
});

function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);
  server.close(() => {
    console.log("✅ Server stopped.");
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));