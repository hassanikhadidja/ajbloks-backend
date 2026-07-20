const mongoose = require("mongoose");

const kidsClubPromoSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    tier: { type: Number, required: true },
    cycle: { type: Number, required: true },
    used: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema({
  email: { type: String, require: true, unique: true },
  password: { type: String, require: true },
  name: { type: String },
  role: { type: String, enum: ["admin", "client"], default: "client" },
  kidsClubBirthday: { type: String, default: "" },
  kidsClubBirthdayLocked: { type: Boolean, default: false },
  kidsClubPromoCodes: { type: [kidsClubPromoSchema], default: [] },
  addresses: { type: [String], default: [] },
  marketingEmail: { type: Boolean, default: true },
});

if (mongoose.models.user) {
  delete mongoose.models.user;
}

const user = mongoose.model("user", userSchema);

module.exports = user;
