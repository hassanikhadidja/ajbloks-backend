const express = require("express");
const multer = require("multer");
const router = express.Router();
const cloudinary = require("../config/cloudinary");
const { Auth } = require("../middlewares/isAuth");
const isAdmin = require("../middlewares/isAdmin");

const uploadMem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
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
    const folder = req.body.folder || "play";
    const resourceType = req.body.resourceType === "raw" ? "raw" : "image";
    let dataUrl;
    let buffer;

    if (req.file) {
      buffer = req.file.buffer;
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
