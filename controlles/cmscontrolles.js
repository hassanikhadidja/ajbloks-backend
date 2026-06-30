const makeCrud = (Model) => ({
  list: async (req, res) => {
    try {
      const items = await Model.find().sort({ createdAt: -1 });
      res.json(items);
    } catch (e) {
      res.status(503).json({ msg: e.message });
    }
  },
  create: async (req, res) => {
    try {
      const item = await Model.create(req.body);
      res.status(201).json({ msg: "Created", id: item._id });
    } catch (e) {
      res.status(503).json({ msg: e.message });
    }
  },
  update: async (req, res) => {
    try {
      await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.status(202).json({ msg: "Updated" });
    } catch (e) {
      res.status(503).json({ msg: e.message });
    }
  },
  remove: async (req, res) => {
    try {
      const result = await Model.deleteOne({ _id: req.params.id });
      if (!result.deletedCount) return res.status(404).json({ msg: "Not found" });
      res.json({ msg: "Deleted" });
    } catch (e) {
      res.status(503).json({ msg: e.message });
    }
  },
});

const Review = require("../models/review");
const Store = require("../models/store");
const Catalogue = require("../models/catalogue");
const PlayItem = require("../models/playitem");
const SiteSettings = require("../models/sitesettings");
const cloudinary = require("../config/cloudinary");

async function uploadDataUrlIfNeeded(value, folder, resourceType = "image") {
  if (!value || typeof value !== "string" || !value.startsWith("data:")) return value;
  const hasCloudinary =
    process.env.CLOUDINARY_NAME &&
    process.env.CLOUDINARY_APIKEY &&
    process.env.CLOUDINARY_APISECRET;
  if (!hasCloudinary) return value;
  const result = await cloudinary.uploader.upload(value, { folder, resource_type: resourceType });
  return result.secure_url;
}

async function processPlayBody(body) {
  const data = { ...body };
  if (data.coverImage) {
    data.coverImage = await uploadDataUrlIfNeeded(data.coverImage, "play");
  }
  if (data.pdfUrl) {
    data.pdfUrl = await uploadDataUrlIfNeeded(data.pdfUrl, "play-pdfs", "raw");
  }
  if (Array.isArray(data.steps)) {
    data.steps = await Promise.all(
      data.steps.map(async (step) => ({
        text: step.text,
        image: await uploadDataUrlIfNeeded(step.image, "play-steps"),
      })),
    );
  }
  return data;
}

function mapPlayItem(item) {
  const obj = item.toObject ? item.toObject() : item;
  return { ...obj, id: String(obj._id) };
}

const review = makeCrud(Review);
const store = makeCrud(Store);
const catalogue = makeCrud(Catalogue);

exports.listReviews = review.list;
exports.createReview = review.create;
exports.updateReview = async (req, res) => {
  if (req.body.action === "accept") req.body = { status: "published" };
  return review.update(req, res);
};
exports.deleteReview = review.remove;

exports.listStores = store.list;
exports.createStore = store.create;
exports.updateStore = store.update;
exports.deleteStore = store.remove;

exports.listCatalogues = catalogue.list;
exports.createCatalogue = catalogue.create;
exports.updateCatalogue = catalogue.update;
exports.deleteCatalogue = catalogue.remove;

exports.listPlay = async (req, res) => {
  try {
    const items = await PlayItem.find().sort({ createdAt: -1 });
    const grouped = { toys: [], diy: [], printables: [], bobs: [] };
    items.forEach((item) => {
      const mapped = mapPlayItem(item);
      grouped[item.section].push(mapped);
    });
    res.json(grouped);
  } catch (e) {
    res.status(503).json({ msg: e.message });
  }
};

exports.createPlay = async (req, res) => {
  try {
    const data = await processPlayBody(req.body);
    const item = await PlayItem.create(data);
    res.status(201).json({ msg: "Created", id: item._id });
  } catch (e) {
    res.status(503).json({ msg: e.message });
  }
};

exports.updatePlay = async (req, res) => {
  try {
    const data = await processPlayBody(req.body);
    await PlayItem.findByIdAndUpdate(req.params.id, data, { new: true });
    res.status(202).json({ msg: "Updated" });
  } catch (e) {
    res.status(503).json({ msg: e.message });
  }
};

exports.deletePlay = async (req, res) => {
  try {
    const result = await PlayItem.deleteOne({ _id: req.params.id });
    if (!result.deletedCount) return res.status(404).json({ msg: "Not found" });
    res.json({ msg: "Deleted" });
  } catch (e) {
    res.status(503).json({ msg: e.message });
  }
};

exports.getPromoBar = async (req, res) => {
  try {
    const doc = await SiteSettings.findOne({ key: "promo-bar" });
    res.json({ sentence: doc?.value || "Livraison gratuite pour les commandes de plus de 6500 DZD" });
  } catch (e) {
    res.status(503).json({ msg: e.message });
  }
};

exports.setPromoBar = async (req, res) => {
  try {
    const value = req.body.sentence || "Livraison gratuite pour les commandes de plus de 6500 DZD";
    await SiteSettings.findOneAndUpdate(
      { key: "promo-bar" },
      { key: "promo-bar", value },
      { upsert: true, new: true },
    );
    res.json({ msg: "Promo bar updated", sentence: value });
  } catch (e) {
    res.status(503).json({ msg: e.message });
  }
};
