const express = require("express");
const router = express.Router();
const controlles = require("../controlles/productcontrolles");
const upload = require("../utils/multer");
const { Auth } = require("../middlewares/isAuth");
const isAdmin = require("../middlewares/isAdmin");

function maybeMultipart(req, res, next) {
  const contentType = String(req.headers["content-type"] || "");
  if (contentType.includes("multipart/form-data")) {
    return upload.array("files", 10)(req, res, next);
  }
  return next();
}

router.get("/", controlles.GetProducts);
router.get("/:id", controlles.GetOneProduct);

router.post("/", maybeMultipart, Auth, isAdmin, controlles.AddProduct);
router.patch("/:id", maybeMultipart, Auth, isAdmin, controlles.UpdateProduct);
router.delete("/:id", Auth, isAdmin, controlles.DeleteProduct);

module.exports = router;
