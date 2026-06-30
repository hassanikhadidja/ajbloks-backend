const mongoose = require("mongoose");

module.exports = mongoose.model(
  "catalogue",
  new mongoose.Schema(
    {
      title: { type: String, required: true },
      buttonSentence: { type: String, required: true },
      picture: { type: String, required: true },
      pdfName: { type: String, required: true },
      pdfUrl: { type: String, required: true },
    },
    { timestamps: true },
  ),
);
