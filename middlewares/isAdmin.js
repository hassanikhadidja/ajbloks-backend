// middlewares/isAdmin.js
const isAdmin = (req, res, next) => {
  if (req?.user?.role === "admin") {   // ← lowercase 'role'
    next();
    return;
  }
  return res.status(403).json({ msg: "Access denied - Admins only" });
};

module.exports=isAdmin