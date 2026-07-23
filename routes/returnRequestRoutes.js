const express = require("express");
const router = express.Router();
const ctrl = require("../controlles/cmscontrolles");
const { Auth } = require("../middlewares/isAuth");
const isAdmin = require("../middlewares/isAdmin");

router.get("/", Auth, isAdmin, ctrl.listReturnRequests);
router.post("/", ctrl.createReturnRequest);
router.delete("/:id", Auth, isAdmin, ctrl.deleteReturnRequest);

module.exports = router;
