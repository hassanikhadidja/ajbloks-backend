require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");
const connectDB = require("./config/connectDB");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    console.log("Database connected successfully");

    const server = app.listen(PORT);

    server.on("listening", () => {
      console.log(`Server is running on port ${PORT}`);
    });

    server.on("error", async (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Stop other dev servers and try again.`);
      } else {
        console.error("Server failed to start:", err.message);
      }

      await mongoose.disconnect().catch(() => {});
      process.exit(1);
    });
  } catch (err) {
    console.error("Failed to connect to database:", err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
