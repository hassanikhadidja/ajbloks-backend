const mongoose = require("mongoose");

module.exports = mongoose.model(
  "store",
  new mongoose.Schema(
    {
      name: { type: String, required: true },
      location: { type: String, required: true },
      website: { type: String, default: "" },
    },
    { timestamps: true },
  ),
);
