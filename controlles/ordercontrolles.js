const Order = require("../models/order");
const { generateTrackingCode } = require("../models/order");
const { validateOrderItems } = require("../utils/orderItems");

const FREE_DELIVERY_THRESHOLD = 5000;
const DELIVERY_FEE = 500;

exports.CreateOrder = async (req, res) => {
  try {
    const { customerName, phone, email, wilaya, commune, items, note, paymentMethod } = req.body;

    const validated = await validateOrderItems(items);
    if (validated.error) return res.status(400).json({ msg: validated.error });

    const orderItems = validated.items;

    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    let total = subtotal + deliveryFee;
    if (paymentMethod === "online") total = subtotal * 0.95 + deliveryFee;

    let trackingCode = generateTrackingCode();
    const userId = req.user ? req.user._id : null;

    const order = new Order({
      customerName,
      phone,
      email: email || "",
      wilaya,
      commune,
      userId,
      items: orderItems,
      subtotal,
      deliveryFee,
      total,
      note: note || "",
      paymentMethod: paymentMethod || "cod",
      trackingCode,
    });

    await order.save();
    return res.status(201).json({
      msg: "Order placed successfully",
      orderId: order._id,
      trackingCode: order.trackingCode,
    });
  } catch (error) {
    return res.status(503).json({ msg: error.message });
  }
};

exports.GetOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.status(200).json(orders);
  } catch (error) {
    return res.status(503).json({ msg: error.message });
  }
};

exports.GetOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: "Order not found" });
    return res.status(200).json(order);
  } catch (error) {
    return res.status(503).json({ msg: error.message });
  }
};

exports.GetMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const mapped = orders.map((order) => {
      const first = order.items[0];
      return {
        id: order.trackingCode || String(order._id),
        product: first?.name || "Commande",
        date: order.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        amount: `${order.total.toLocaleString("fr-DZ")} DZD`,
        status: order.status === "shipped" ? "shipped" : order.status === "delivered" ? "delivered" : "processing",
        statusLabel:
          order.status === "shipped" ? "Expédié" : order.status === "delivered" ? "Livré" : "En cours",
        thumb: first?.img || "",
      };
    });
    return res.status(200).json(mapped);
  } catch (error) {
    return res.status(503).json({ msg: error.message });
  }
};

exports.TrackOrder = async (req, res) => {
  try {
    const code = req.query.code;
    const orderId = req.query.orderId;
    if (!code && !orderId) return res.status(400).json({ msg: "Provide code or orderId" });

    const order = code ? await Order.findOne({ trackingCode: code }) : await Order.findById(orderId);
    if (!order) return res.status(404).json({ msg: "Order not found" });
    return res.status(200).json(order);
  } catch (error) {
    return res.status(503).json({ msg: error.message });
  }
};

exports.UpdateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(status)) return res.status(400).json({ msg: "Invalid status value" });

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { returnDocument: "after" });
    if (!order) return res.status(404).json({ msg: "Order not found" });
    return res.status(200).json({ msg: "Status updated", order });
  } catch (error) {
    return res.status(503).json({ msg: error.message });
  }
};

exports.DeleteOrder = async (req, res) => {
  try {
    const result = await Order.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ msg: "Order not found" });
    return res.status(200).json({ msg: "Order deleted" });
  } catch (error) {
    return res.status(503).json({ msg: error.message });
  }
};

exports.GetConfig = (req, res) => {
  res.json({ freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD, deliveryFee: DELIVERY_FEE });
};
