const express = require('express');
const router = express.Router();
const usercontrolles=require("../controlles/usercontrolles");
const kidsClubcontrolles = require("../controlles/kidsClubcontrolles");
const { Auth } = require('../middlewares/isAuth');
const isAdmin = require('../middlewares/isAdmin');

router.post("/register",usercontrolles.Adduser)
router.post("/login",usercontrolles.Login)

router.get("/getcurrentuser",Auth,usercontrolles.getUser)

router.get("/profile", Auth, usercontrolles.getProfile)
router.patch("/profile", Auth, usercontrolles.patchProfile)

router.get("/kids-club", Auth, kidsClubcontrolles.getKidsClub)
router.post("/kids-club", Auth, kidsClubcontrolles.setBirthday)
router.post("/kids-club/validate-promo", Auth, kidsClubcontrolles.validatePromo)

router.get("/",Auth,isAdmin,usercontrolles.getUsers)

router.patch("/:id",Auth,usercontrolles.UpdateUSER)


module.exports=router