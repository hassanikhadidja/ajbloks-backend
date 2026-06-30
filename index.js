require("dotenv").config();

const net = require("net");
const mongoose = require("mongoose");
const connectDB = require("./config/connectDB");
const app = require("./app");

// Warm up MongoDB on Vercel cold starts
if (process.env.VERCEL) {
  connectDB().catch((err) => {
    console.error("DB warmup failed:", err.message);
  });
}

const DEFAULT_PORT = Number(process.env.PORT) || 5000;
const isDev = process.env.NODE_ENV !== "production";

const isPortAvailable = (port) =>
  new Promise((resolve) => {
    const tester = net
      .createServer()
      .once("error", () => resolve(false))
      .once("listening", () => tester.close(() => resolve(true)))
      .listen(port);
  });

const findAvailablePort = async (startPort, maxAttempts = 10) => {
  for (let port = startPort; port < startPort + maxAttempts; port += 1) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(`No available port found between ${startPort} and ${startPort + maxAttempts - 1}`);
};

const startServer = async () => {
  try {
    let port = DEFAULT_PORT;

    if (!(await isPortAvailable(port))) {
      if (!isDev) {
        throw Object.assign(new Error(`Port ${port} is already in use`), { code: "EADDRINUSE" });
      }

      port = await findAvailablePort(port + 1);
      console.warn(`Port ${DEFAULT_PORT} is busy. Using port ${port} instead.`);
    }

    await connectDB();
    console.log("Database connected successfully");

    const server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });

    server.on("error", async (err) => {
      console.error("Server failed to start:", err.message);
      await mongoose.disconnect().catch(() => {});
      process.exit(1);
    });
  } catch (err) {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${DEFAULT_PORT} is already in use. Stop other dev servers and try again.`);
    } else {
      console.error("Failed to start server:", err.message);
    }
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
