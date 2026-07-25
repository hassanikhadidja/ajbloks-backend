const Order = require("../models/order");
const User = require("../models/user");
const {
  buildKidsClubReward,
  generateKidsClubCode,
  getStampIconUrl,
  discountForPromoTier,
} = require("../utils/kids-club");

async function deliveredCountForUser(userId) {
  return Order.countDocuments({ userId, status: "delivered" });
}

async function buildState(userId) {
  const user = await User.findById(userId).select(
    "kidsClubBirthday kidsClubBirthdayLocked kidsClubPromoCodes name email",
  );
  if (!user) return null;

  const deliveredCount = await deliveredCountForUser(userId);
  const codes = user.kidsClubPromoCodes || [];
  let state = buildKidsClubReward({
    deliveredCount,
    birthday: user.kidsClubBirthday || null,
    birthdayLocked: user.kidsClubBirthdayLocked,
    promoCodes: codes,
  });

  if (state.needsCode && (state.tier === 3 || state.tier === 6 || state.tier === 8)) {
    const code = generateKidsClubCode(userId, state.cycle, state.tier);
    codes.push({
      code,
      tier: state.tier,
      cycle: state.cycle,
      used: false,
      createdAt: new Date(),
    });
    user.kidsClubPromoCodes = codes;
    await user.save();
    state = buildKidsClubReward({
      deliveredCount,
      birthday: user.kidsClubBirthday || null,
      birthdayLocked: user.kidsClubBirthdayLocked,
      promoCodes: codes,
    });
  }

  return {
    deliveredCount: state.deliveredCount,
    stamps: state.stamps,
    tier: state.tier,
    cycle: state.cycle,
    message: state.message,
    showPromoCode: state.showPromoCode,
    promoCode: state.promoCode,
    showBirthdayForm: state.showBirthdayForm,
    birthday: state.birthday,
    birthdayLocked: state.birthdayLocked,
    stampIconUrl: getStampIconUrl(),
  };
}

exports.getKidsClub = async (req, res) => {
  try {
    const state = await buildState(String(req.user._id));
    if (!state) return res.status(404).json({ msg: "User not found" });
    return res.status(200).json(state);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.setBirthday = async (req, res) => {
  try {
    const birthdayRaw = String((req.body && req.body.birthday) ?? "").trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdayRaw)) {
      return res
        .status(400)
        .json({ msg: "Date de naissance invalide (AAAA-MM-JJ)." });
    }

    const parsed = new Date(birthdayRaw + "T00:00:00");
    if (Number.isNaN(parsed.getTime())) {
      return res.status(400).json({ msg: "Date de naissance invalide." });
    }

    const existing = await User.findById(req.user._id);
    if (!existing) return res.status(404).json({ msg: "User not found" });

    if (existing.kidsClubBirthdayLocked && existing.kidsClubBirthday) {
      return res
        .status(400)
        .json({ msg: "La date de naissance ne peut plus être modifiée." });
    }

    const deliveredCount = await deliveredCountForUser(String(req.user._id));
    const state = buildKidsClubReward({ deliveredCount });
    if (state.tier !== 4) {
      return res.status(400).json({
        msg: "La date de naissance peut être enregistrée au 4e tampon Kids Club.",
      });
    }

    existing.kidsClubBirthday = birthdayRaw;
    existing.kidsClubBirthdayLocked = true;
    await existing.save();

    const next = await buildState(String(req.user._id));
    return res.status(200).json(next);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.validatePromo = async (req, res) => {
  try {
    const code = String((req.body && req.body.code) ?? "")
      .trim()
      .toUpperCase();

    if (!code) {
      return res.status(400).json({ msg: "Veuillez entrer un code promo." });
    }

    const dbUser = await User.findById(req.user._id).select("kidsClubPromoCodes");
    if (!dbUser) {
      return res.status(404).json({ msg: "Utilisateur introuvable." });
    }

    const found = (dbUser.kidsClubPromoCodes || []).find(
      (c) => String(c.code || "").toUpperCase() === code && !c.used,
    );

    if (!found) {
      return res.status(400).json({ msg: "Code invalide ou déjà utilisé." });
    }

    const tier = Number(found.tier);
    const discount = discountForPromoTier(tier);

    return res.status(200).json({
      valid: true,
      code: found.code,
      tier,
      percent: discount.percent,
      gift: discount.gift,
      label: discount.label,
    });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
