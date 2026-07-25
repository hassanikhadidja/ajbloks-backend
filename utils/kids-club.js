const STAMP_ICON =
  "https://res.cloudinary.com/dbtkfjrvd/image/upload/v1782687662/Design_sans_titre_69_l8uydl.png";

function getStampIconUrl() {
  return STAMP_ICON;
}

function stampsFromDeliveredCount(deliveredCount) {
  const n = Math.max(0, Math.floor(deliveredCount));
  if (n <= 0) return 0;
  const mod = n % 8;
  return mod === 0 ? 8 : mod;
}

function cycleFromDeliveredCount(deliveredCount) {
  const n = Math.max(0, Math.floor(deliveredCount));
  if (n <= 0) return 0;
  return Math.floor((n - 1) / 8);
}

function rewardForTier(tier) {
  switch (tier) {
    case 1:
    case 2:
      return { message: null, showPromoCode: false, showBirthdayForm: false };
    case 3:
      return {
        message:
          "Vous avez gagné une promotion de 10 % de réduction. Utilisez le code promo ci-dessous lors de votre prochaine commande pour bénéficier de votre réduction !",
        showPromoCode: true,
        showBirthdayForm: false,
      };
    case 4:
      return {
        message:
          "Félicitations ! Vous faites désormais partie des petits Ajbloks !\nMerci d'avoir renseigné votre date de naissance. À partir de maintenant, vous recevrez un cadeau d'anniversaire Ajbloks chaque année pour célébrer cette journée spéciale avec nous !",
        showPromoCode: false,
        showBirthdayForm: true,
      };
    case 5:
      return { message: null, showPromoCode: false, showBirthdayForm: false };
    case 6:
      return {
        message:
          "Vous avez gagné une promotion de 50 % de réduction. Utilisez le code promo ci-dessous lors de votre prochaine commande pour bénéficier de votre réduction !",
        showPromoCode: true,
        showBirthdayForm: false,
      };
    case 7:
      return { message: null, showPromoCode: false, showBirthdayForm: false };
    case 8:
      return {
        message:
          "Vous avez gagné un cadeau gratuit ! Utilisez le code promo ci-dessous lors de votre prochaine commande pour recevoir votre cadeau offert.",
        showPromoCode: true,
        showBirthdayForm: false,
      };
    default:
      return { message: null, showPromoCode: false, showBirthdayForm: false };
  }
}

function discountForPromoTier(tier) {
  switch (Number(tier)) {
    case 3:
      return { percent: 10, gift: false, label: "Remise Kids Club (10 %)" };
    case 6:
      return { percent: 50, gift: false, label: "Remise Kids Club (50 %)" };
    case 8:
      return { percent: 0, gift: true, label: "Cadeau Kids Club offert" };
    default:
      return { percent: 0, gift: false, label: "Remise code promo" };
  }
}

function generateKidsClubCode(userId, cycle, tier) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rand = "";
  for (let i = 0; i < 4; i++) {
    rand += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  const idPart =
    String(userId).replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() ||
    "AJB";
  return `KC${idPart}${cycle}${tier}${rand}`;
}

function buildKidsClubReward(input) {
  const deliveredCount = Math.max(0, Math.floor(input.deliveredCount || 0));
  const stamps = stampsFromDeliveredCount(deliveredCount);
  const tier = stamps;
  const cycle = cycleFromDeliveredCount(deliveredCount);
  const reward = rewardForTier(tier);
  const birthday = input.birthday ? String(input.birthday).slice(0, 10) : null;
  const birthdayLocked = Boolean(input.birthdayLocked || birthday);

  let promoCode = null;
  let needsCode = false;
  if (reward.showPromoCode && (tier === 3 || tier === 6 || tier === 8)) {
    const existing = (input.promoCodes || []).find(
      (c) => Number(c.tier) === tier && Number(c.cycle) === cycle && !c.used,
    );
    if (existing) promoCode = existing.code;
    else needsCode = true;
  }

  const showBirthdayForm = reward.showBirthdayForm && !birthdayLocked;
  const message = reward.message;

  return {
    deliveredCount,
    stamps,
    tier,
    cycle,
    message,
    showPromoCode: reward.showPromoCode,
    promoCode,
    showBirthdayForm,
    birthday,
    birthdayLocked,
    needsCode,
  };
}

module.exports = {
  getStampIconUrl,
  stampsFromDeliveredCount,
  cycleFromDeliveredCount,
  rewardForTier,
  discountForPromoTier,
  generateKidsClubCode,
  buildKidsClubReward,
};
