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
    items.forEach((item) => grouped[item.section].push(item));
    res.json(grouped);
  } catch (e) {
    res.status(503).json({ msg: e.message });
  }
};

exports.createPlay = async (req, res) => {
  try {
    const item = await PlayItem.create(req.body);
    res.status(201).json({ msg: "Created", id: item._id });
  } catch (e) {
    res.status(503).json({ msg: e.message });
  }
};

exports.updatePlay = async (req, res) => {
  try {
    await PlayItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
