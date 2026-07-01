const express = require("express");
const multer = require("multer");
const router = express.Router();
const cloudinary = require("../config/cloudinary");
const { cloudinaryFolder } = require("../config/cloudinaryFolder");
const { Auth } = require("../middlewares/isAuth");
const isAdmin = require("../middlewares/isAdmin");

const MAX_PRINTABLE_PDF_BYTES = 20 * 1024 * 1024;

const uploadMem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PRINTABLE_PDF_BYTES },
});

function hasCloudinary() {
  return !!(
    process.env.CLOUDINARY_NAME &&
    process.env.CLOUDINARY_APIKEY &&
    process.env.CLOUDINARY_APISECRET
  );
}

function uploadBuffer(buffer, folder, resourceType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType === "raw" ? "raw" : "image" },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
    stream.end(buffer);
  });
}

router.post("/", Auth, isAdmin, (req, res, next) => {
  if (req.is("multipart/form-data")) {
    uploadMem.single("file")(req, res, next);
  } else {
    next();
  }
}, async (req, res) => {
  try {
    const folder = cloudinaryFolder(req.body.folder || "play");
    const resourceType = req.body.resourceType === "raw" ? "raw" : "image";
    let dataUrl;
    let buffer;

    if (req.file) {
      buffer = req.file.buffer;
      if (resourceType === "raw" && buffer.length > MAX_PRINTABLE_PDF_BYTES) {
        return res.status(413).json({ msg: "PDF trop volumineux (max 20 Mo)." });
      }
      const mime =
        req.file.mimetype ||
        (resourceType === "raw" ? "application/pdf" : "image/png");
      dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;
    } else {
      const bodyDataUrl = req.body?.dataUrl;
      if (!bodyDataUrl || typeof bodyDataUrl !== "string" || !bodyDataUrl.startsWith("data:")) {
        return res.status(400).json({ msg: "Invalid dataUrl" });
      }
      dataUrl = bodyDataUrl;
      buffer = Buffer.from(dataUrl.split(",")[1], "base64");
      if (resourceType === "raw" && buffer.length > MAX_PRINTABLE_PDF_BYTES) {
        return res.status(413).json({ msg: "PDF trop volumineux (max 20 Mo)." });
      }
    }

    if (!hasCloudinary()) {
      return res.json({ url: dataUrl });
    }

    try {
      const result = await uploadBuffer(buffer, folder, resourceType);
      return res.json({ url: result.secure_url });
    } catch {
      return res.json({ url: dataUrl });
    }
  } catch (e) {
    return res.status(503).json({ msg: e.message });
  }
});

module.exports = router;
