const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const { query, BCRYPT_ROUNDS } = require("../db");
const { authenticate, clearAuthCookies, BANNED_MESSAGE } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/asyncHandler");
const { issueCsrfToken } = require("../middleware/csrf");
const { normalizeEmail, clientIp, userAgent } = require("../utils/sanitize");

const router = express.Router();

// Zamknutie účtu: po 10 neúspešných pokusoch v okne sa email dočasne uzamkne.
const LOCKOUT_THRESHOLD = 10;
const LOCKOUT_WINDOW_MINUTES = 15;
const MIN_PASSWORD_LENGTH = 8;

// Rate-limit na IP: 5 pokusov / 10 minút, podľa zadania.
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: "Príliš veľa pokusov o prihlásenie. Skús to o 10 minút." }
});

function tokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 12
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, tokenVersion: user.token_version },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
}

async function recordLoginAttempt({ userId, email, req, success }) {
  try {
    await query(
      `INSERT INTO login_logs (user_id, email, ip_address, user_agent, success)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, email, clientIp(req), userAgent(req), success]
    );
  } catch (error) {
    // Zlyhanie auditu nesmie zhodiť prihlasovanie, ale musí byť vidieť v logoch.
    console.error("Nepodarilo sa zapísať pokus o prihlásenie:", error.message);
  }
}

async function isLockedOut(email) {
  const result = await query(
    `SELECT COUNT(*)::int AS failures
     FROM login_logs
     WHERE email = $1
       AND success = false
       AND timestamp > NOW() - ($2 || ' minutes')::interval`,
    [email, String(LOCKOUT_WINDOW_MINUTES)]
  );
  return result.rows[0].failures >= LOCKOUT_THRESHOLD;
}

/**
 * Po úspešnom prihlásení sa vydá čerstvý JWT aj nový CSRF token.
 * JWT sa vytvára až tu, takže útočník nevie reláciu podstrčiť vopred
 * (obdoba session regeneration pri klasických serverových reláciách).
 */
function establishSession(res, user) {
  const token = signToken(user);
  res.cookie("token", token, tokenCookieOptions());
  issueCsrfToken(res);
}

router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body && req.body.email);
    const password = req.body && req.body.password;

    if (!email || typeof password !== "string" || password.length === 0) {
      return res.status(400).json({ message: "Email a heslo sú povinné." });
    }

    if (await isLockedOut(email)) {
      await recordLoginAttempt({ userId: null, email, req, success: false });
      return res.status(429).json({
        message: `Účet je dočasne uzamknutý po ${LOCKOUT_THRESHOLD} neúspešných pokusoch. Skús to o ${LOCKOUT_WINDOW_MINUTES} minút.`
      });
    }

    const userResult = await query(
      "SELECT id, email, password, role, banned, token_version FROM users WHERE email = $1",
      [email]
    );
    const user = userResult.rows[0];

    // Hash sa porovnáva aj pri neexistujúcom účte, aby čas odpovede neprezradil,
    // ktoré emaily sú registrované.
    const hash = user ? user.password : "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
    const isValid = await bcrypt.compare(password, hash);

    if (!user || !isValid) {
      await recordLoginAttempt({ userId: user ? user.id : null, email, req, success: false });
      return res.status(401).json({ message: "Nesprávne prihlasovacie údaje." });
    }

    if (user.banned) {
      await recordLoginAttempt({ userId: user.id, email, req, success: false });
      return res.status(403).json({ message: BANNED_MESSAGE, banned: true });
    }

    establishSession(res, user);
    await recordLoginAttempt({ userId: user.id, email, req, success: true });

    return res.json({
      message: "Prihlásenie úspešné.",
      user: { id: user.id, email: user.email, role: user.role }
    });
  })
);

// Verejná registrácia zámerne neexistuje. Účty vznikajú výhradne pri štarte
// servera z environment premenných, takže cudzí účet nemá ako pribudnúť.
router.post("/register", (req, res) => {
  return res.status(404).json({ message: "Registrácia nie je dostupná. Účty prideľuje správca." });
});

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    // Odhlásiť sa musí dať aj s vypršaným tokenom, preto sa tu nepoužíva
    // authenticate - stačí zistiť, koho token to bol, a zneplatniť ho.
    const token = req.cookies && req.cookies.token;
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        await query("UPDATE users SET token_version = token_version + 1 WHERE id = $1", [payload.id]);
      } catch (error) {
        // Neplatný token netreba zneplatňovať - cookies sa aj tak zmažú.
      }
    }

    clearAuthCookies(res);
    return res.json({ message: "Odhlásenie úspešné." });
  })
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    return res.json({ user: req.user });
  })
);

module.exports = router;
