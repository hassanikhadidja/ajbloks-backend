const express = require("express");
const router = express.Router();
const ctrl = require("../controlles/cmscontrolles");
const { Auth } = require("../middlewares/isAuth");
const isAdmin = require("../middlewares/isAdmin");

router.get("/", ctrl.listPlay);
router.post("/", Auth, isAdmin, ctrl.createPlay);
router.patch("/:id", Auth, isAdmin, ctrl.updatePlay);
router.delete("/:id", Auth, isAdmin, ctrl.deletePlay);

module.exports = router;
