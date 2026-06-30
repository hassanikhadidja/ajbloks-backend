const express = require("express");
const router = express.Router();
const ctrl = require("../controlles/cmscontrolles");
const { Auth } = require("../middlewares/isAuth");
const isAdmin = require("../middlewares/isAdmin");

router.get("/", ctrl.listStores);
router.post("/", Auth, isAdmin, ctrl.createStore);
router.patch("/:id", Auth, isAdmin, ctrl.updateStore);
router.delete("/:id", Auth, isAdmin, ctrl.deleteStore);

module.exports = router;
