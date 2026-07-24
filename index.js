require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/connectDB");
const app = require("./app");

const isProduction =
  process.env.NODE_ENV === "production" ||
  Boolean(process.env.RAILWAY_ENVIRONMENT) ||
  Boolean(process.env.VERCEL);

const HOST = isProduction ? "0.0.0.0" : "127.0.0.1";

if (process.env.VERCEL) {
  connectDB().catch((err) => {
    console.error("DB warmup failed:", err.message);
  });
}

const listen = (port) =>
  new Promise((resolve, reject) => {
    const server = app.listen(port, HOST, () => {
      console.log(`Server is running on http://${HOST}:${port}`);
      resolve(server);
    });

    server.on("error", reject);
  });

const startServer = async (startPort) => {
  await connectDB();
  console.log("Database connected successfully");

  const maxAttempts = isProduction ? 1 : 10;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const port = startPort + attempt;

    try {
      return await listen(port);
    } catch (err) {
      if (err.code === "EADDRINUSE" && !isProduction) {
        console.warn(`Port ${port} is busy, trying ${port + 1}...`);
        continue;
      }
      throw err;
    }
  }

  throw new Error(`No available port found near ${startPort}`);
};

if (require.main === module) {
  const port = Number(process.env.PORT) || 5000;

  startServer(port).catch(async (err) => {
    console.error("Failed to start server:", err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}

module.exports = app;
