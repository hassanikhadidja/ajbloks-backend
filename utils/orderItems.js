const Product = require("../models/product");

function normalizeHex(value) {
  const raw = String(value ?? "").trim();
  const hex = raw.startsWith("#") ? raw : `#${raw}`;
  return /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex.toUpperCase() : "";
}

function parseSelectedColor(input) {
  if (!input || typeof input !== "object") return undefined;
  const hex = normalizeHex(input.hex);
  if (!hex) return undefined;
  return {
    name: String(input.name ?? "").trim(),
    hex,
  };
}

function parseProductColors(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map(function (item) {
      if (!item || typeof item !== "object") return null;
      const hex = normalizeHex(item.hex);
      if (!hex) return null;
      return { name: String(item.name ?? "").trim(), hex };
    })
    .filter(Boolean);
}

function sanitizeOrderItem(item) {
  const rawProductId = item.productId;
  const productId =
    typeof rawProductId === "string" &&
    require("mongoose").Types.ObjectId.isValid(rawProductId) &&
    /^[a-f0-9]{24}$/i.test(rawProductId)
      ? rawProductId
      : undefined;

  const row = {
    name: String(item.name || ""),
    price: Number(item.price),
    quantity: Math.max(1, Number(item.quantity) || 1),
    img: String(item.img || ""),
  };

  const selectedColor = parseSelectedColor(item.selectedColor);
  if (selectedColor) row.selectedColor = selectedColor;

  return productId ? Object.assign({}, row, { productId: productId }) : row;
}

async function validateOrderItems(items) {
  if (!Array.isArray(items) || !items.length) {
    return { error: "Order must have at least one item" };
  }

  const orderItems = items.map(sanitizeOrderItem);
  const productIds = [
    ...new Set(orderItems.map((item) => item.productId).filter(Boolean)),
  ];

  const productsById = new Map();
  if (productIds.length) {
    const docs = await Product.find({ _id: { $in: productIds } })
      .select("hasMultipleColors colors name")
      .lean();
    docs.forEach(function (doc) {
      const colors = parseProductColors(doc.colors);
      productsById.set(String(doc._id), {
        hasMultipleColors: Boolean(doc.hasMultipleColors) && colors.length > 0,
        colors,
      });
    });
  }

  for (const item of orderItems) {
    if (!item.productId) continue;
    const product = productsById.get(String(item.productId));
    if (!product) {
      return { error: `Produit introuvable pour « ${item.name} »` };
    }

    if (product.hasMultipleColors) {
      if (!item.selectedColor) {
        return { error: `Choisissez une couleur pour « ${item.name} »` };
      }
      const match = product.colors.find(function (c) {
        return c.hex.toUpperCase() === item.selectedColor.hex.toUpperCase();
      });
      if (!match) {
        return { error: `Couleur invalide pour « ${item.name} »` };
      }
      if (match.name && !item.selectedColor.name) {
        item.selectedColor.name = match.name;
      }
    } else if (item.selectedColor) {
      delete item.selectedColor;
    }
  }

  return { items: orderItems };
}

module.exports = {
  sanitizeOrderItem,
  validateOrderItems,
};
