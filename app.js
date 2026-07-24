const express = require("express");
const path = require("path");
const cors = require("cors");
const connectDB = require("./config/connectDB");

const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const storeRoutes = require("./routes/storeRoutes");
const catalogueRoutes = require("./routes/catalogueRoutes");
const playRoutes = require("./routes/playRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const returnRequestRoutes = require("./routes/returnRequestRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");

const app = express();

// origin: "*" + credentials: true is invalid in browsers — reflect the request origin instead
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    maxAge: 86400,
  }),
);
app.options(/.*/, cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

let dbReady;

app.use(async (req, res, next) => {
  try {
    if (!dbReady) {
      dbReady = connectDB();
    }
    await dbReady;
    next();
  } catch (error) {
    dbReady = null;
    return res.status(503).json({
      msg: "Database connection failed",
      error: error.message,
    });
  }
});

const mount = (prefix, router) => {
  app.use(prefix, router);
  app.use("/api" + prefix, router);
};

mount("/product", productRoutes);
mount("/user", userRoutes);
mount("/order", orderRoutes);
mount("/review", reviewRoutes);
mount("/store", storeRoutes);
mount("/catalogue", catalogueRoutes);
mount("/play", playRoutes);
mount("/settings", settingsRoutes);
mount("/upload", uploadRoutes);
mount("/return-request", returnRequestRoutes);
mount("/newsletter", newsletterRoutes);

app.use((req, res) => res.status(404).json({ message: "Route not found" }));

module.exports = app;
