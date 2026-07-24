require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/connectDB");
const app = require("./app");

const isProduction =
  process.env.NODE_ENV === "production" ||
  Boolean(process.env.RAILWAY_ENVIRONMENT) ||
  Boolean(process.env.VERCEL);

if (process.env.VERCEL) {
  connectDB().catch((err) => {
    console.error("DB warmup failed:", err.message);
  });
}

const startServer = async (port) => {
  try {
    await connectDB();
    console.log("Database connected successfully");

    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`Server is running on port ${port}`);
    });

    server.on("error", async (err) => {
      console.error("Server failed to start:", err.message);
      await mongoose.disconnect().catch(() => {});
      process.exit(1);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

const resolvePort = async () => {
  const defaultPort = Number(process.env.PORT) || 5000;

  if (isProduction) {
    return defaultPort;
  }

  const net = require("net");
  const isPortAvailable = (port) =>
    new Promise((resolve) => {
      const tester = net
        .createServer()
        .once("error", () => resolve(false))
        .once("listening", () => tester.close(() => resolve(true)))
        .listen(port);
    });

  if (await isPortAvailable(defaultPort)) {
    return defaultPort;
  }

  for (let port = defaultPort + 1; port < defaultPort + 10; port += 1) {
    if (await isPortAvailable(port)) {
      console.warn(`Port ${defaultPort} is busy. Using port ${port} instead.`);
      return port;
    }
  }

  throw new Error(`No available port found near ${defaultPort}`);
};

if (require.main === module) {
  resolvePort()
    .then((port) => startServer(port))
    .catch((err) => {
      console.error("Failed to start server:", err.message);
      process.exit(1);
    });
}

module.exports = app;
