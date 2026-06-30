const express = require("express");
const router = express.Router();
const ctrl = require("../controlles/cmscontrolles");
const { Auth } = require("../middlewares/isAuth");
const isAdmin = require("../middlewares/isAdmin");

router.get("/promo-bar", ctrl.getPromoBar);
router.put("/promo-bar", Auth, isAdmin, ctrl.setPromoBar);

module.exports = router;
