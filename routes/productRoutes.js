const express  = require('express');
const router   = express.Router();
const controlles = require("../controlles/productcontrolles");
const upload     = require("../utils/multer");
const { Auth }   = require('../middlewares/isAuth');
const isAdmin    = require('../middlewares/isAdmin');

router.get('/',      controlles.GetProducts);
router.get("/:id",   controlles.GetOneProduct);

// upload.array("files", 10) → accepts up to 10 images under field name "files"
router.post("/",     upload.array("files", 10), Auth, isAdmin, controlles.AddProduct);
router.patch("/:id", upload.array("files", 10), Auth, isAdmin, controlles.UpdateProduct);
router.delete("/:id", Auth, isAdmin, controlles.DeleteProduct);

module.exports = router;
