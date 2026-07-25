/** At least 6 chars, with one uppercase letter. Lowercase and digits are allowed. */
function passwordvalidator(ch) {
  if (typeof ch !== "string" || ch.length < 6) return false;
  return /[A-Z]/.test(ch);
}

function passwordRequirementsMessage() {
  return "Le mot de passe doit contenir au moins 6 caractères, dont une majuscule (A–Z).";
}

module.exports = passwordvalidator;
module.exports.passwordRequirementsMessage = passwordRequirementsMessage;
