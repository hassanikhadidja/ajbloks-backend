const express = require("express");
const router = express.Router();
const ctrl = require("../controlles/newslettercontrolles");
const { Auth } = require("../middlewares/isAuth");
const isAdmin = require("../middlewares/isAdmin");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { getJwtSecret } = require("../config/jwtSecret");

async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return next();
    const decoded = jwt.verify(token, getJwtSecret());
    if (decoded && decoded._id) {
      const user = await User.findById(decoded._id).select("-password");
      if (user) req.user = user;
    }
  } catch (e) {
    // ignore invalid token for public subscribe
  }
  next();
}

router.get("/", Auth, isAdmin, ctrl.listNewsletterEmails);
router.get("/export", Auth, isAdmin, ctrl.exportNewsletterEmails);
router.post("/", optionalAuth, ctrl.createNewsletterEmail);
router.patch("/:id", Auth, isAdmin, ctrl.updateNewsletterEmail);
router.delete("/:id", Auth, isAdmin, ctrl.deleteNewsletterEmail);

module.exports = router;
