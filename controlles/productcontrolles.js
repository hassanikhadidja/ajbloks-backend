// controlles/productcontrolles.js
const Product    = require("../models/product");
const cloudinary = require("../config/cloudinary");

// Upload one buffer to Cloudinary, return secure_url
const uploadOne = (buffer) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "jeunes-toys" },
      (err, result) => { if (err) reject(err); else resolve(result.secure_url); }
    ).end(buffer);
  });

// Upload all files in req.files in parallel
const uploadAll = (files) =>
  files && files.length > 0
    ? Promise.all(files.map(f => uploadOne(f.buffer)))
    : Promise.resolve([]);

// ── ADD ──────────────────────────────────────────────────────────
exports.AddProduct = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0)
      return res.status(400).send({ msg: "At least one image is required" });

    const urls    = await uploadAll(req.files);
    const product = new Product(req.body);
    product.img   = urls;
    await product.save();
    return res.status(201).send({ msg: "product added" });
  } catch (error) {
    return res.status(503).send({ msg: error.message });
  }
};

// ── GET ALL ──────────────────────────────────────────────────────
exports.GetProducts = async (req, res) => {
  try {
    return res.status(200).json(await Product.find());
  } catch (error) {
    return res.status(503).send({ msg: error.message });
  }
};

// ── GET ONE ──────────────────────────────────────────────────────
exports.GetOneProduct = async (req, res) => {
  try {
    return res.status(200).json(await Product.findById(req.params.id));
  } catch (error) {
    return res.status(503).send({ msg: error.message });
  }
};

// ── UPDATE ───────────────────────────────────────────────────────
exports.UpdateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // keepImgs: existing Cloudinary URLs the frontend wants to KEEP.
    // Can be a single string or an array — normalise to array.
    let keepImgs = req.body.keepImgs || [];
    if (typeof keepImgs === "string") keepImgs = [keepImgs];

    // Upload any new files
    const newUrls = await uploadAll(req.files);

    // Final img array = kept existing URLs + newly uploaded URLs
    updateData.img = [...keepImgs, ...newUrls];

    // Remove keepImgs from the top-level update object
    // (it's now merged into img, no need to store it separately)
    delete updateData.keepImgs;

    await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: "after" }
    );

    return res.status(202).send({ msg: "Update success" });
  } catch (error) {
    return res.status(503).send({ msg: error.message });
  }
};

// ── DELETE ───────────────────────────────────────────────────────
exports.DeleteProduct = async (req, res) => {
  try {
    const result = await Product.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0)
      return res.status(400).send({ msg: "Bad request" });
    return res.status(202).send({ msg: "product deleted" });
  } catch (error) {
    return res.status(503).send({ msg: error.message });
  }
};
