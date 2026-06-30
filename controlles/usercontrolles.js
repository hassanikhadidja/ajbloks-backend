const isValidEmail = require("../middlewares/emailvalidator")
const passwordvalidator = require("../middlewares/passwordvalidator")
const User=require("../models/user")
const bcrypt = require("bcrypt")

exports.Adduser=async(req,res)=>{
    try {
        const {email}=req.body
        if(req.body.role){
            return res.status(400).json({ msg: "Not auth !!" })
        }
        const ValidEmail=isValidEmail(email)
         if (!ValidEmail){
            return res.status(400).json({ msg: "Should be format email" })
        }
       const Matcheduser=await User.findOne({email})
  if( Matcheduser){
    return res.status(400).json({msg:"Email exist please login"})
  }
  if(!passwordvalidator(req.body.password)){
    return res.status(400).json({msg:"Invalid password"})
  }
  const user= new User(req.body)
  const hashedPassword = await bcrypt.hash(req.body.password,10); 
          user.password=hashedPassword
           await user.save()
           return res.status(201).json({msg:"Register success"})
    } catch (error) {
        return res.status(503).json({msg:error.message})
    }
}


exports.Login=async(req,res)=>{
    try {
        const {email,password}=req.body

        const existUser= await User.findOne({email})
        if (!existUser) {
            return res.status(400).json({msg:"Bad credential !"})
        }
        const existpassword= await bcrypt.compare(password,existUser.password) 
          if(!existpassword){
            return res.status(400).json({msg:"Bad credential !"})
          }
          const jwt = require("jsonwebtoken")
          const payload = { _id: existUser._id };
          const token = jwt.sign(payload, process.env.secretKey);

          return res.status(200).json({msg:"login success",token})
    } catch (error) {
        return res.status(503).json({msg:error.message})
    }
}

exports.getUser=async(req,res)=>{
    try {
        return res.status(200).send(req.user);
      } catch (error) {
        return res.status(500).json(error)
      }
}

exports.getUsers=async(req,res)=>{
    try{
          const users=await User.find()
          return res.status(200).json(users)

    }
    catch{  return res.status(500).json(error)}
}

exports.UpdateUSER=async(req,res)=>{
    try {
     
    const {body}=req
    await User.findByIdAndUpdate(req.params.id,body,{new:true})
        
       return res.status(202).json({msg:"Update success"})
    } catch (error) {
        return res.status(503).json({msg:error.message})
    }
}