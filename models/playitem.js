const mongoose = require("mongoose");

const stepSchema = new mongoose.Schema(
  { image: String, text: String },
  { _id: false },
);

module.exports = mongoose.model(
  "playitem",
  new mongoose.Schema(
    {
      section: { type: String, enum: ["toys", "diy", "printables", "bobs"], required: true },
      videoUrl: String,
      toyNames: [String],
      name: String,
      tags: String,
      description: String,
      coverImage: String,
      steps: [stepSchema],
      pdfName: String,
      pdfUrl: String,
      slot: String,
      title: String,
    },
    { timestamps: true },
  ),
);
