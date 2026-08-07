const jwt = require("jsonwebtoken");
const { query } = require("../db");

const BANNED_MESSAGE = "Tvoj účet bol zablokovaný.";

function getToken(req) {
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "");
  }

  return null;
}

function clearAuthCookies(res) {
  res.clearCookie("token");
  res.clearCookie("csrfToken");
}

/**
 * Overí token a načíta aktuálny stav používateľa z databázy.
 * Rola ani ban sa nikdy nečítajú z JWT - inak by povýšenie na admina, zabanovanie
 * či zmena hesla platili až po vypršaní tokenu (12 h).
 * Vracia { ok, status, message, user }.
 */
async function resolveUser(req) {
  const token = getToken(req);
  if (!token) {
    return { ok: false, status: 401, message: "Neautorizovaný prístup." };
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return { ok: false, status: 401, message: "Neplatný token." };
  }

  const result = await query(
    "SELECT id, email, role, banned, token_version FROM users WHERE id = $1",
    [payload.id]
  );
  const user = result.rows[0];

  if (!user) {
    return { ok: false, status: 401, message: "Používateľ neexistuje." };
  }

  // Ban sa kontroluje ako prvý. Zabanovanie tiež zvyšuje token_version, takže
  // pri opačnom poradí by používateľ dostal hlášku o vypršanej relácii
  // a nikdy by sa nedozvedel, že je zablokovaný.
  if (user.banned) {
    return { ok: false, status: 403, message: BANNED_MESSAGE, banned: true };
  }

  // Odhlásenie alebo zmena hesla zvýšia verziu a staré tokeny prestanú platiť.
  if (Number(payload.tokenVersion) !== Number(user.token_version)) {
    return { ok: false, status: 401, message: "Relácia vypršala, prihlás sa znova." };
  }

  return {
    ok: true,
    user: { id: user.id, email: user.email, role: user.role, banned: user.banned }
  };
}

async function authenticate(req, res, next) {
  try {
    const outcome = await resolveUser(req);
    if (!outcome.ok) {
      clearAuthCookies(res);
      return res.status(outcome.status).json({ message: outcome.message, banned: Boolean(outcome.banned) });
    }
    req.user = outcome.user;
    return next();
  } catch (error) {
    return next(error);
  }
}

async function authenticatePage(req, res, next) {
  try {
    const outcome = await resolveUser(req);
    if (!outcome.ok) {
      clearAuthCookies(res);
      return res.redirect(outcome.banned ? "/?banned=1" : "/");
    }
    req.user = outcome.user;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireRole(role) {
  return function roleGuard(req, res, next) {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: "Nemáš oprávnenie na túto akciu." });
    }
    return next();
  };
}

function requireRolePage(role) {
  return function roleGuard(req, res, next) {
    if (!req.user || req.user.role !== role) {
      return res.redirect("/app");
    }
    return next();
  };
}

module.exports = {
  authenticate,
  authenticatePage,
  requireRole,
  requireRolePage,
  clearAuthCookies,
  BANNED_MESSAGE
};
