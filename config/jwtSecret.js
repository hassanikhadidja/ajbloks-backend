function getJwtSecret() {
  const secret =
    process.env.secretKey ||
    process.env.JWT_SECRET ||
    process.env.SECRET_KEY;

  if (!secret) {
    const err = new Error("JWT secret is not configured. Set secretKey on the server.");
    err.code = "JWT_SECRET_MISSING";
    throw err;
  }

  return secret;
}

module.exports = { getJwtSecret };
