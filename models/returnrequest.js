const mongoose = require("mongoose");

const returnRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    comment: { type: String, required: true, trim: true },
    wilaya: { type: String, default: "", trim: true },
    requestType: {
      type: String,
      enum: ["retour", "echange", "reclamation", "contact"],
      required: true,
    },
    trackingNumber: { type: String, default: "", trim: true },
    buyerContact: { type: String, default: "", trim: true },
    pictures: [{ type: String }],
    source: { type: String, enum: ["retours", "contact"], required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("returnrequest", returnRequestSchema);
