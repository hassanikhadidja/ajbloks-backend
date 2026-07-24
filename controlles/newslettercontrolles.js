const NewsletterEmail = require("../models/newsletteremail");
const User = require("../models/user");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PUBLIC_SOURCES = new Set([
  "footer",
  "signup_drawer",
  "notre_histoire",
  "cookies",
  "diy",
  "printables",
  "gifts",
]);

function normalizeEmail(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase();
}

function toDto(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(obj._id),
    _id: String(obj._id),
    email: obj.email || "",
    name: obj.name || "",
    source: obj.source || "footer",
    accepted: obj.accepted !== false,
    userId: obj.userId || "",
    createdAt: obj.createdAt || null,
    updatedAt: obj.updatedAt || null,
  };
}

async function upsertNewsletter({ email, name, source, accepted, userId }) {
  const normalized = normalizeEmail(email);
  if (!EMAIL_RE.test(normalized)) {
    const err = new Error("Adresse e-mail invalide");
    err.status = 400;
    throw err;
  }
  const existing = await NewsletterEmail.findOne({ email: normalized });
  const cleanName = String(name || "").trim().slice(0, 120);
  const src = source || "footer";
  const ok = accepted !== false;
  const uid = String(userId || "").trim();

  if (!existing) {
    return NewsletterEmail.create({
      email: normalized,
      name: cleanName,
      source: src,
      accepted: ok,
      userId: uid,
    });
  }

  if (cleanName) existing.name = cleanName;
  if (uid) existing.userId = uid;
  if (src === "account" || existing.source !== "account") existing.source = src;
  existing.accepted = ok;
  await existing.save();
  return existing;
}

async function syncRegisteredUsers() {
  const users = await User.find({ role: { $ne: "admin" } }).select(
    "email name marketingEmail",
  );
  for (const user of users) {
    const email = normalizeEmail(user.email);
    if (!EMAIL_RE.test(email)) continue;
    await upsertNewsletter({
      email,
      name: user.name || "",
      userId: String(user._id),
      source: "account",
      accepted: user.marketingEmail !== false,
    });
  }
}

exports.listNewsletterEmails = async (req, res) => {
  try {
    await syncRegisteredUsers();
    const acceptedOnly = String(req.query.accepted || "") === "1";
    const filter = acceptedOnly ? { accepted: true } : {};
    const items = await NewsletterEmail.find(filter).sort({ updatedAt: -1 });
    res.json(items.map(toDto));
  } catch (e) {
    res.status(503).json({ msg: e.message });
  }
};

exports.createNewsletterEmail = async (req, res) => {
  try {
    const body = req.body || {};
    let source = String(body.source || "footer");
    const isAdmin = Boolean(req.user && req.user.role === "admin");
    if (isAdmin && source === "admin") {
      // keep
    } else if (!PUBLIC_SOURCES.has(source)) {
      source = "footer";
    }
    const accepted =
      isAdmin && typeof body.accepted === "boolean" ? body.accepted : true;
    const item = await upsertNewsletter({
      email: body.email,
      name: body.name,
      source,
      accepted,
    });
    res.status(201).json({
      msg: "Inscription enregistrée",
      id: item._id,
      email: item.email,
      accepted: item.accepted !== false,
    });
  } catch (e) {
    res.status(e.status || 503).json({ msg: e.message });
  }
};

exports.updateNewsletterEmail = async (req, res) => {
  try {
    const item = await NewsletterEmail.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: "E-mail introuvable" });
    const body = req.body || {};
    if ("accepted" in body) item.accepted = Boolean(body.accepted);
    if ("name" in body) item.name = String(body.name || "").trim().slice(0, 120);
    if ("email" in body) {
      const email = normalizeEmail(body.email);
      if (!EMAIL_RE.test(email)) {
        return res.status(400).json({ msg: "Adresse e-mail invalide" });
      }
      item.email = email;
    }
    await item.save();
    res.status(202).json({ msg: "Mis à jour", item: toDto(item) });
  } catch (e) {
    res.status(503).json({ msg: e.message });
  }
};

exports.deleteNewsletterEmail = async (req, res) => {
  try {
    const result = await NewsletterEmail.deleteOne({ _id: req.params.id });
    if (!result.deletedCount) {
      return res.status(404).json({ msg: "E-mail introuvable" });
    }
    res.json({ msg: "E-mail supprimé" });
  } catch (e) {
    res.status(503).json({ msg: e.message });
  }
};

exports.exportNewsletterEmails = async (req, res) => {
  try {
    await syncRegisteredUsers();
    const acceptedOnly = String(req.query.accepted || "") === "1";
    const filter = acceptedOnly ? { accepted: true } : {};
    const items = await NewsletterEmail.find(filter).sort({ email: 1 });
    const esc = (v) => {
      const text = String(v ?? "");
      if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
      return text;
    };
    const lines = ["email,name,source,accepted,createdAt"];
    for (const item of items) {
      lines.push(
        [
          esc(item.email),
          esc(item.name || ""),
          esc(item.source || ""),
          esc(item.accepted !== false ? "oui" : "non"),
          esc(item.createdAt ? new Date(item.createdAt).toISOString() : ""),
        ].join(","),
      );
    }
    const filename = acceptedOnly
      ? "infolettre-acceptes.csv"
      : "infolettre-tous.csv";
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(lines.join("\r\n") + "\r\n");
  } catch (e) {
    res.status(503).json({ msg: e.message });
  }
};

exports.upsertNewsletter = upsertNewsletter;
