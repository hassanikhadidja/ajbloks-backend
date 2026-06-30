const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ["pending", "published"], default: "pending" },
    userName: { type: String, required: true },
    productName: { type: String, required: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    photos: [{ type: String }],
    date: { type: String, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("review", reviewSchema);
