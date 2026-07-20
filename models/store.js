const mongoose = require("mongoose");

module.exports = mongoose.model(
  "store",
  new mongoose.Schema(
    {
      name: { type: String, required: true },
      location: { type: String, required: true },
      website: { type: String, default: "" },
      mapLink: { type: String, default: "" },
      storeType: { type: String, default: "" },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    { timestamps: true },
  ),
);
