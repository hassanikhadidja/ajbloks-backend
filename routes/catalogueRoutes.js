const express = require("express");
const router = express.Router();
const ctrl = require("../controlles/cmscontrolles");
const { Auth } = require("../middlewares/isAuth");
const isAdmin = require("../middlewares/isAdmin");

router.get("/", ctrl.listCatalogues);
router.post("/", Auth, isAdmin, ctrl.createCatalogue);
router.patch("/:id", Auth, isAdmin, ctrl.updateCatalogue);
router.delete("/:id", Auth, isAdmin, ctrl.deleteCatalogue);

module.exports = router;
