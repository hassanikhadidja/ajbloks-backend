const mongoose = require("mongoose");

module.exports = mongoose.model(
  "sitesettings",
  new mongoose.Schema(
    {
      key: { type: String, required: true, unique: true },
      value: { type: String, required: true },
    },
    { timestamps: true },
  ),
);
