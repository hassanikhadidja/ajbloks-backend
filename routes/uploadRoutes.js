const express = require("express");
const router = express.Router();
const cloudinary = require("../config/cloudinary");
const { Auth } = require("../middlewares/isAuth");
const isAdmin = require("../middlewares/isAdmin");

function hasCloudinary() {
  return !!(
    process.env.CLOUDINARY_NAME &&
    process.env.CLOUDINARY_APIKEY &&
    process.env.CLOUDINARY_APISECRET
  );
}

router.post("/", Auth, isAdmin, async (req, res) => {
  try {
    const { dataUrl, folder = "play", resourceType = "image" } = req.body || {};
    if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
      return res.status(400).json({ msg: "Invalid dataUrl" });
    }

    if (!hasCloudinary()) {
      return res.json({ url: dataUrl });
    }

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder,
      resource_type: resourceType === "raw" ? "raw" : "image",
    });

    return res.json({ url: result.secure_url });
  } catch (e) {
    return res.status(503).json({ msg: e.message });
  }
});

module.exports = router;
