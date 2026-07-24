const mongoose = require("mongoose");

const newsletterEmailSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, default: "", trim: true },
    source: {
      type: String,
      enum: [
        "account",
        "footer",
        "signup_drawer",
        "notre_histoire",
        "cookies",
        "diy",
        "printables",
        "gifts",
        "admin",
      ],
      default: "footer",
    },
    accepted: { type: Boolean, default: true, index: true },
    userId: { type: String, default: "", index: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("newsletteremail", newsletterEmailSchema);
