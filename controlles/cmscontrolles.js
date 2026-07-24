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
const { cloudinaryFolder } = require("../config/cloudinaryFolder");

async function uploadDataUrlIfNeeded(value, folder, resourceType = "image") {
  if (!value || typeof value !== "string" || !value.startsWith("data:")) return value;
  const hasCloudinary =
    process.env.CLOUDINARY_NAME &&
    process.env.CLOUDINARY_APIKEY &&
    process.env.CLOUDINARY_APISECRET;
  if (!hasCloudinary) return value;
  const result = await cloudinary.uploader.upload(value, {
    folder: cloudinaryFolder(folder),
    resource_type: resourceType,
  });
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

function storePayload(body) {
  const data = body || {};
  return {
    name: data.name,
    location: data.location,
    website: data.website != null ? String(data.website) : "",
    mapLink: data.mapLink != null ? String(data.mapLink).trim() : "",
    storeType: data.storeType != null ? String(data.storeType).trim() : "",
    lat: data.lat != null && data.lat !== "" ? Number(data.lat) : null,
    lng: data.lng != null && data.lng !== "" ? Number(data.lng) : null,
  };
}

exports.listReviews = review.list;
exports.createReview = review.create;
exports.updateReview = async (req, res) => {
  if (req.body.action === "accept") req.body = { status: "published" };
  return review.update(req, res);
};
exports.deleteReview = review.remove;

exports.listStores = store.list;
exports.createStore = async (req, res) => {
  try {
    const payload = storePayload(req.body);
    if (!payload.name || !payload.location) {
      return res.status(400).json({ msg: "Name and location required" });
    }
    if (!Number.isFinite(payload.lat)) payload.lat = null;
    if (!Number.isFinite(payload.lng)) payload.lng = null;
    const item = await Store.create(payload);
    res.status(201).json({ msg: "Created", id: item._id, mapLink: item.mapLink });
  } catch (e) {
    res.status(503).json({ msg: e.message });
  }
};
exports.updateStore = async (req, res) => {
  try {
    const data = req.body || {};
    const $set = {};
    if (data.name != null) $set.name = data.name;
    if (data.location != null) $set.location = data.location;
    if (data.website != null) $set.website = String(data.website);
    if ("mapLink" in data) $set.mapLink = String(data.mapLink || "").trim();
    if ("storeType" in data) $set.storeType = String(data.storeType || "").trim();
    if ("lat" in data) {
      const lat = Number(data.lat);
      $set.lat = Number.isFinite(lat) ? lat : null;
    }
    if ("lng" in data) {
      const lng = Number(data.lng);
      $set.lng = Number.isFinite(lng) ? lng : null;
    }
    await Store.findByIdAndUpdate(req.params.id, { $set }, { new: true, runValidators: true });
    res.status(202).json({ msg: "Updated" });
  } catch (e) {
    res.status(503).json({ msg: e.message });
  }
};
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

const ReturnRequest = require("../models/returnrequest");
const ALLOWED_RETURN_TYPES = new Set([
  "retour",
  "echange",
  "reclamation",
  "contact",
]);

const ALLOWED_RETURN_STATUSES = new Set([
  "nouvelle",
  "en_cours",
  "attente_client",
  "resolue",
  "annulee",
]);

function mapReturnRequest(item) {
  const obj = item.toObject ? item.toObject() : item;
  const pictures = Array.isArray(obj.pictures)
    ? obj.pictures.filter(Boolean)
    : [];
  return {
    ...obj,
    id: String(obj._id),
    _id: String(obj._id),
    pictures,
    picture: pictures[0] || "",
    status: obj.status || "nouvelle",
  };
}

exports.listReturnRequests = async (req, res) => {
  try {
    const items = await ReturnRequest.find().sort({ createdAt: -1 });
    res.json(items.map(mapReturnRequest));
  } catch (e) {
    res.status(503).json({ msg: e.message });
  }
};

exports.createReturnRequest = async (req, res) => {
  try {
    const body = req.body || {};
    const name = String(body.name || "").trim();
    const comment = String(body.comment || "").trim();
    const requestType = String(body.requestType || "").trim();
    const source = body.source === "contact" ? "contact" : "retours";

    if (!name || !comment) {
      return res.status(400).json({ msg: "Nom et commentaire obligatoires" });
    }
    if (!ALLOWED_RETURN_TYPES.has(requestType)) {
      return res.status(400).json({ msg: "Type de demande invalide" });
    }

    const pictures = [];
    for (const pic of body.pictures || []) {
      if (typeof pic !== "string" || !pic.trim()) continue;
      if (pic.startsWith("data:")) {
        pictures.push(await uploadDataUrlIfNeeded(pic, "return-requests"));
      } else {
        pictures.push(pic);
      }
    }

    const item = await ReturnRequest.create({
      name,
      email: String(body.email || "").trim(),
      phone: String(body.phone || "").trim(),
      comment,
      wilaya: String(body.wilaya || "").trim(),
      requestType,
      trackingNumber: String(body.trackingNumber || "").trim(),
      buyerContact: String(body.buyerContact || "").trim(),
      pictures,
      source,
      status: "nouvelle",
    });

    res.status(201).json({ msg: "Demande enregistrée", id: item._id });
  } catch (e) {
    res.status(503).json({ msg: e.message });
  }
};

exports.updateReturnRequest = async (req, res) => {
  try {
    const status = String((req.body && req.body.status) || "").trim();
    if (!ALLOWED_RETURN_STATUSES.has(status)) {
      return res.status(400).json({ msg: "Statut invalide" });
    }
    const item = await ReturnRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );
    if (!item) {
      return res.status(404).json({ msg: "Demande introuvable" });
    }
    res.status(202).json({ msg: "Statut mis à jour", status: item.status });
  } catch (e) {
    res.status(503).json({ msg: e.message });
  }
};

exports.deleteReturnRequest = async (req, res) => {
  try {
    const result = await ReturnRequest.deleteOne({ _id: req.params.id });
    if (!result.deletedCount) {
      return res.status(404).json({ msg: "Demande introuvable" });
    }
    res.json({ msg: "Demande supprimée" });
  } catch (e) {
    res.status(503).json({ msg: e.message });
  }
};
