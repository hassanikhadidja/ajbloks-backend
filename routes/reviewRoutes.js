const express = require("express");
const router = express.Router();
const ctrl = require("../controlles/cmscontrolles");
const { Auth } = require("../middlewares/isAuth");
const isAdmin = require("../middlewares/isAdmin");

router.get("/", ctrl.listReviews);
router.post("/", ctrl.createReview);
router.patch("/:id", Auth, isAdmin, ctrl.updateReview);
router.delete("/:id", Auth, isAdmin, ctrl.deleteReview);

module.exports = router;
