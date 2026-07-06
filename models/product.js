const mongoose = require("mongoose");

const qaSchema = new mongoose.Schema(
  { q: { type: String, required: true }, a: { type: String, required: true } },
  { _id: false },
);

const colorSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    hex: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, require: [true, "Le nom du produit est obligatoire"] },
    sku: { type: String, require: [true, "Le code SKU est obligatoire"] },
    price: { type: Number, require: [true, "Le prix est obligatoire"], min: [0, "Le prix ne peut pas être négatif"] },
    img: [{ type: String, default: "product image" }],
    description: { type: String, require: [true, "La description est obligatoire"] },
    age_plus: { type: Number, min: 0, default: 3, required: [true, "L'âge minimum recommandé est obligatoire"] },
    age: { type: String, default: "3Y+" },
    ageTranche: { type: String, default: "" },
    isEducational: { type: Boolean, default: false },
    category: { type: String, default: "", required: true, trim: true },
    tags: [{ type: String, trim: true }],
    sizes: [{ type: String, enum: ["small", "medium", "large", "standard", "one-size"], default: ["standard"] }],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    stock: { type: Number, require: [true, "Le stock est obligatoire"], default: 100 },
    nbr_commande: { type: Number, default: 0 },
    articles: [{ type: String }],
    characteristics: { type: String, default: "" },
    character: { type: String, default: "" },
    warning: { type: String, default: "" },
    whyLoveIt: [{ type: String }],
    qa: [qaSchema],
    isBook: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    hasMultipleColors: { type: Boolean, default: false },
    colors: { type: [colorSchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("product", productSchema);
