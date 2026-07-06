const mongoose = require("mongoose");

function generateTrackingCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "BK-";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const orderItemColorSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    hex: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "product" },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    img: { type: String, default: "" },
    selectedColor: { type: orderItemColorSchema, default: undefined },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: [true, "Name is required"] },
    phone: { type: String, required: [true, "Phone is required"] },
    email: { type: String, default: "" },
    wilaya: { type: String, required: [true, "Wilaya is required"] },
    commune: { type: String, required: [true, "Commune is required"] },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    note: { type: String, default: "" },
    trackingCode: { type: String, unique: true, sparse: true },
    paymentMethod: { type: String, default: "cod" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("order", orderSchema);
module.exports.generateTrackingCode = generateTrackingCode;
