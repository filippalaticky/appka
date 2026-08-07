const crypto = require("crypto");

const CSRF_COOKIE = "csrfToken";
const CSRF_HEADER = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function createCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

function csrfCookieOptions() {
  return {
    // Zámerne NIE httpOnly - frontend token číta a posiela ho späť v hlavičke.
    // Bezpečnosť stojí na tom, že cudzia doména cookie prečítať nedokáže.
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 12
  };
}

function issueCsrfToken(res) {
  const token = createCsrfToken();
  res.cookie(CSRF_COOKIE, token, csrfCookieOptions());
  return token;
}

/** Každá odpoveď bez CSRF cookie ju dostane, aby mal frontend čo poslať späť. */
function ensureCsrfToken(req, res, next) {
  if (!req.cookies || !req.cookies[CSRF_COOKIE]) {
    issueCsrfToken(res);
  }
  return next();
}

function timingSafeEqual(a, b) {
  const bufferA = Buffer.from(String(a));
  const bufferB = Buffer.from(String(b));
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
}

/**
 * Double-submit cookie: token musí prísť zároveň v cookie aj v hlavičke.
 * Cudzia stránka vie vynútiť odoslanie cookie, ale hodnotu z nej neprečíta,
 * takže hlavičku doplniť nedokáže.
 */
function verifyCsrf(req, res, next) {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const cookieToken = req.cookies && req.cookies[CSRF_COOKIE];
  const headerToken = req.get(CSRF_HEADER);

  if (!cookieToken || !headerToken || !timingSafeEqual(cookieToken, headerToken)) {
    return res.status(403).json({ message: "Neplatný CSRF token. Obnov stránku a skús znova." });
  }

  return next();
}

module.exports = {
  CSRF_COOKIE,
  CSRF_HEADER,
  ensureCsrfToken,
  verifyCsrf,
  issueCsrfToken
};
