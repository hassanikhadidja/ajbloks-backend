const express = require("express");
const path = require("path");
const cors = require("cors");

const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const storeRoutes = require("./routes/storeRoutes");
const catalogueRoutes = require("./routes/catalogueRoutes");
const playRoutes = require("./routes/playRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

app.use((req, res) => res.status(404).json({ message: "Route not found" }));

module.exports = app;
