const jwt = require("jsonwebtoken");

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

function authenticate(req, res, next) {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ message: "Neautorizovaný prístup." });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Neplatný token." });
  }
}

function authenticatePage(req, res, next) {
  const token = getToken(req);
  if (!token) {
    return res.redirect("/");
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.redirect("/");
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
  requireRolePage
};
