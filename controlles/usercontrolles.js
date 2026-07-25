const isValidEmail = require("../middlewares/emailvalidator");
const passwordvalidator = require("../middlewares/passwordvalidator");
const { passwordRequirementsMessage } = passwordvalidator;
const User = require("../models/user");
const bcrypt = require("bcrypt");
const { getJwtSecret } = require("../config/jwtSecret");
const { upsertNewsletter } = require("./newslettercontrolles");

exports.Adduser = async (req, res) => {
  try {
    const body = req.body || {};
    if (body.role) {
      return res.status(400).json({ msg: "Not auth !!" });
    }

    const email = String(body.email ?? "").trim().toLowerCase();
    if (!isValidEmail(email)) {
      return res.status(400).json({ msg: "Should be format email" });
    }

    const matchedUser = await User.findOne({ email });
    if (matchedUser) {
      return res.status(400).json({ msg: "Email exist please login" });
    }

    if (!passwordvalidator(String(body.password ?? ""))) {
      return res.status(400).json({ msg: passwordRequirementsMessage() });
    }

    const hashedPassword = await bcrypt.hash(String(body.password), 10);
    const marketingEmail = body.marketingEmail !== false;
    const user = new User({
      email,
      password: hashedPassword,
      name: body.name ? String(body.name) : undefined,
      marketingEmail,
    });
    await user.save();

    try {
      await upsertNewsletter({
        email: user.email,
        name: user.name || "",
        userId: String(user._id),
        source: "account",
        accepted: user.marketingEmail !== false,
      });
    } catch (e) {}

    return res.status(201).json({ msg: "Register success" });
  } catch (error) {
    return res.status(503).json({ msg: error.message });
  }
};

exports.Login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = String(email ?? "").trim().toLowerCase();

    const existUser = await User.findOne({ email: normalizedEmail });
    if (!existUser) {
      return res.status(400).json({ msg: "E-mail ou mot de passe incorrect." });
    }

    const existPassword = await bcrypt.compare(
      String(password ?? ""),
      existUser.password,
    );
    if (!existPassword) {
      return res.status(400).json({ msg: "E-mail ou mot de passe incorrect." });
    }

    const jwt = require("jsonwebtoken");
    const payload = { _id: existUser._id };
    const token = jwt.sign(payload, getJwtSecret());

    return res.status(200).json({ msg: "login success", token });
  } catch (error) {
    if (error.code === "JWT_SECRET_MISSING") {
      return res.status(503).json({ msg: error.message });
    }
    return res.status(503).json({ msg: error.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    return res.status(200).send(req.user);
  } catch (error) {
    return res.status(500).json(error);
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json(error);
  }
};

function sanitizeAddresses(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((a) => String(a ?? "").trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((a) => a.slice(0, 280));
}

function profilePayload(dbUser) {
  return {
    id: String(dbUser._id),
    name: dbUser.name || "",
    email: dbUser.email || "",
    kidsClubBirthday: dbUser.kidsClubBirthday || "",
    kidsClubBirthdayLocked: Boolean(dbUser.kidsClubBirthdayLocked),
    addresses: Array.isArray(dbUser.addresses) ? dbUser.addresses : [],
    marketingEmail: dbUser.marketingEmail !== false,
  };
}

exports.getProfile = async (req, res) => {
  try {
    const dbUser = await User.findById(req.user._id).select(
      "-password -kidsClubPromoCodes",
    );
    if (!dbUser) {
      return res.status(404).json({ msg: "Utilisateur introuvable" });
    }
    return res.status(200).json(profilePayload(dbUser));
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.patchProfile = async (req, res) => {
  try {
    const body = req.body || {};
    const dbUser = await User.findById(req.user._id);
    if (!dbUser) {
      return res.status(404).json({ msg: "Utilisateur introuvable" });
    }

    if ("name" in body) {
      const name = String(body.name ?? "").trim().slice(0, 120);
      if (!name) {
        return res.status(400).json({ msg: "Le nom ne peut pas être vide." });
      }
      dbUser.name = name;
    }

    if ("addresses" in body) {
      dbUser.addresses = sanitizeAddresses(body.addresses);
    }

    if ("marketingEmail" in body) {
      dbUser.marketingEmail = Boolean(body.marketingEmail);
    }

    await dbUser.save();

    try {
      await upsertNewsletter({
        email: dbUser.email,
        name: dbUser.name || "",
        userId: String(dbUser._id),
        source: "account",
        accepted: dbUser.marketingEmail !== false,
      });
    } catch (e) {}

    return res.status(200).json(profilePayload(dbUser));
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.UpdateUSER = async (req, res) => {
  try {
    const { body } = req;
    if (body.password) {
      if (!passwordvalidator(body.password)) {
        return res.status(400).json({ msg: passwordRequirementsMessage() });
      }
      body.password = await bcrypt.hash(body.password, 10);
    }
    if (body.email) {
      body.email = String(body.email).trim().toLowerCase();
    }
    const user = await User.findByIdAndUpdate(req.params.id, body, {
      new: true,
    });
    if (user && user.email) {
      try {
        await upsertNewsletter({
          email: user.email,
          name: user.name || "",
          userId: String(user._id),
          source: "account",
          accepted: user.marketingEmail !== false,
        });
      } catch (e) {}
    }

    return res.status(202).json({ msg: "Update success" });
  } catch (error) {
    return res.status(503).json({ msg: error.message });
  }
};
