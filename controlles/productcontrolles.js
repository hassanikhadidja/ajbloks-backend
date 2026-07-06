// controlles/productcontrolles.js
const Product = require("../models/product");
const cloudinary = require("../config/cloudinary");
const { cloudinaryFolder } = require("../config/cloudinaryFolder");
const { dashboardToProductFields, productToDashboard } = require("../utils/productMapper");

function hasCloudinary() {
  return !!(
    process.env.CLOUDINARY_NAME &&
    process.env.CLOUDINARY_APIKEY &&
    process.env.CLOUDINARY_APISECRET
  );
}

const uploadOne = (buffer) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: cloudinaryFolder("products") }, (err, result) => {
        if (err) reject(err);
        else resolve(result.secure_url);
      })
      .end(buffer);
  });

const uploadAll = (files) =>
  files && files.length > 0
    ? Promise.all(files.map((f) => uploadOne(f.buffer)))
    : Promise.resolve([]);

async function uploadDataUrlOrKeep(dataUrl) {
  if (!dataUrl.startsWith("data:")) return dataUrl;
  if (!hasCloudinary()) return dataUrl;
  try {
    const base64 = dataUrl.split(",")[1] || "";
    const buffer = Buffer.from(base64, "base64");
    return await uploadOne(buffer);
  } catch {
    return dataUrl;
  }
}

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
      resolved.push(await uploadDataUrlOrKeep(pic));
    } else if (pic.startsWith("http")) {
      resolved.push(pic);
    }
  }

  return [...new Set(resolved)];
}

function applyProductFields(product, fields, resolvedImg) {
  const scalarKeys = [
    "name",
    "sku",
    "price",
    "description",
    "age_plus",
    "age",
    "ageTranche",
    "isEducational",
    "category",
    "tags",
    "sizes",
    "rating",
    "stock",
    "articles",
    "characteristics",
    "character",
    "warning",
    "whyLoveIt",
    "qa",
    "isBook",
    "isTrending",
    "hasMultipleColors",
    "colors",
  ];

  scalarKeys.forEach((key) => {
    if (fields[key] !== undefined) {
      product.set(key, fields[key]);
    }
  });

  if (Array.isArray(fields.colors)) {
    product.markModified("colors");
  }

  if (resolvedImg && resolvedImg.length) {
    product.set("img", resolvedImg);
  }
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
    if (!fields.sku || fields.sku.startsWith("SKU-")) {
      fields.sku = `AJB-${Date.now().toString(36).toUpperCase()}`;
    }

    const product = await Product.create(fields);
    return res.status(201).send({
      msg: "product added",
      id: product._id,
      product: productToDashboard(product),
    });
  } catch (error) {
    return res.status(503).send({ msg: error.message });
  }
};

// ── GET ALL ──────────────────────────────────────────────────────
exports.GetProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ updatedAt: -1 });
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
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: "Product not found" });

    const uploaded = await uploadAll(req.files);
    const fields = dashboardToProductFields(req.body);
    const hasPicturePayload =
      (Array.isArray(req.body.pictures) && req.body.pictures.length > 0) ||
      (Array.isArray(req.body.img) && req.body.img.length > 0) ||
      (uploaded && uploaded.length > 0);

    const resolvedImg = hasPicturePayload
      ? await resolveImageUrls(req.body, uploaded)
      : null;

    applyProductFields(product, fields, resolvedImg);
    await product.save({ validateModifiedOnly: false });

    return res.status(202).send({
      msg: "Update success",
      product: productToDashboard(product),
    });
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
