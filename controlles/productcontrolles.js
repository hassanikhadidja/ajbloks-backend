// controlles/productcontrolles.js
const Product = require("../models/product");
const cloudinary = require("../config/cloudinary");
const { cloudinaryFolder } = require("../config/cloudinaryFolder");
const { dashboardToProductFields, productToDashboard } = require("../utils/productMapper");

const uploadOne = (buffer) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: cloudinaryFolder() }, (err, result) => {
        if (err) reject(err);
        else resolve(result.secure_url);
      })
      .end(buffer);
  });

const uploadAll = (files) =>
  files && files.length > 0
    ? Promise.all(files.map((f) => uploadOne(f.buffer)))
    : Promise.resolve([]);

async function resolveImageUrls(body, uploadedUrls) {
  const keepImgs = [];
  if (body.keepImgs) {
    keepImgs.push(...(Array.isArray(body.keepImgs) ? body.keepImgs : [body.keepImgs]));
  }

  const pictureSources = [
    ...(Array.isArray(body.pictures) ? body.pictures : []),
    ...(Array.isArray(body.img) ? body.img : []),
    ...keepImgs,
    ...(uploadedUrls || []),
  ];

  const resolved = [];
  for (const pic of pictureSources) {
    if (typeof pic !== "string" || !pic.trim()) continue;
    if (pic.startsWith("data:")) {
      const base64 = pic.split(",")[1] || "";
      const buffer = Buffer.from(base64, "base64");
      resolved.push(await uploadOne(buffer));
    } else if (pic.startsWith("http")) {
      resolved.push(pic);
    }
  }

  return [...new Set(resolved)];
}

// ── ADD ──────────────────────────────────────────────────────────
exports.AddProduct = async (req, res) => {
  try {
    const uploaded = await uploadAll(req.files);
    const fields = dashboardToProductFields(req.body);
    const img = await resolveImageUrls(req.body, uploaded);

    if (!img.length) {
      return res.status(400).send({ msg: "At least one image is required" });
    }

    fields.img = img;
    if (!fields.sku) {
      fields.sku = `AJB-${Date.now().toString(36).toUpperCase()}`;
    }

    const product = await Product.create(fields);
    return res.status(201).send({ msg: "product added", id: product._id });
  } catch (error) {
    return res.status(503).send({ msg: error.message });
  }
};

// ── GET ALL ──────────────────────────────────────────────────────
exports.GetProducts = async (req, res) => {
  try {
    const products = await Product.find();
    return res.status(200).json(products.map((p) => productToDashboard(p)));
  } catch (error) {
    return res.status(503).send({ msg: error.message });
  }
};

// ── GET ONE ──────────────────────────────────────────────────────
exports.GetOneProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: "Product not found" });
    return res.status(200).json(productToDashboard(product));
  } catch (error) {
    return res.status(503).send({ msg: error.message });
  }
};

// ── UPDATE ───────────────────────────────────────────────────────
exports.UpdateProduct = async (req, res) => {
  try {
    const uploaded = await uploadAll(req.files);
    const fields = dashboardToProductFields(req.body);
    const img = await resolveImageUrls(req.body, uploaded);

    if (img.length) {
      fields.img = img;
    } else {
      delete fields.img;
    }

    const product = await Product.findByIdAndUpdate(req.params.id, fields, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ msg: "Product not found" });

    return res.status(202).send({ msg: "Update success" });
  } catch (error) {
    return res.status(503).send({ msg: error.message });
  }
};

// ── DELETE ───────────────────────────────────────────────────────
exports.DeleteProduct = async (req, res) => {
  try {
    const result = await Product.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) return res.status(400).send({ msg: "Bad request" });
    return res.status(202).send({ msg: "product deleted" });
  } catch (error) {
    return res.status(503).send({ msg: error.message });
  }
};
