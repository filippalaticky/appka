const express = require("express");
const { query } = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/asyncHandler");
const { verifyCsrf } = require("../middleware/csrf");
const { parseBoundedNumber } = require("../utils/sanitize");

const router = express.Router();

// Poradie je podstatné: najprv overenie tokenu proti DB (rieši aj ban),
// až potom kontrola roly. Obe bežia pred každou routou nižšie.
router.use(authenticate, requireRole("admin"));

router.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const usersResult = await query(
      "SELECT id, email, role, banned FROM users ORDER BY id ASC"
    );
    const profilesResult = await query(
      "SELECT user_id, name, height, weight, age, gender, activity_level, goal FROM profiles ORDER BY user_id ASC"
    );
    const mealsResult = await query(
      `SELECT user_id, day, meal_type, variant1, variant2, calories, protein, carbs, fat, fiber
       FROM meal_plans
       ORDER BY user_id ASC, id ASC`
    );

    const profilesByUser = new Map();
    profilesResult.rows.forEach((profile) => {
      profilesByUser.set(profile.user_id, profile);
    });

    const mealsByUser = new Map();
    mealsResult.rows.forEach((meal) => {
      const existing = mealsByUser.get(meal.user_id) || [];
      existing.push(meal);
      mealsByUser.set(meal.user_id, existing);
    });

    const users = usersResult.rows.map((user) => ({
      ...user,
      profile: profilesByUser.get(user.id) || null,
      mealPlan: mealsByUser.get(user.id) || []
    }));

    return res.json({ users });
  })
);

router.get(
  "/login-logs",
  asyncHandler(async (req, res) => {
    const limit = parseBoundedNumber(req.query.limit, 1, 200) || 50;
    const userId = req.query.userId ? parseBoundedNumber(req.query.userId, 1, 2147483647) : null;

    if (req.query.userId && userId === null) {
      return res.status(400).json({ message: "Neplatné ID používateľa." });
    }

    const result = await query(
      `SELECT l.id, l.user_id, l.email, l.timestamp, l.ip_address, l.user_agent, l.success,
              u.email AS current_email
       FROM login_logs l
       LEFT JOIN users u ON u.id = l.user_id
       WHERE ($1::int IS NULL OR l.user_id = $1)
       ORDER BY l.timestamp DESC
       LIMIT $2`,
      [userId, limit]
    );

    return res.json({ logs: result.rows });
  })
);

/** Zmena banned stavu. Zvýšenie token_version odhlási používateľa okamžite. */
async function setBanned(req, res, banned) {
  const userId = parseBoundedNumber(req.params.userId, 1, 2147483647);
  if (userId === null) {
    return res.status(400).json({ message: "Neplatné ID používateľa." });
  }

  if (banned && userId === req.user.id) {
    return res.status(400).json({ message: "Nemôžeš zabanovať sám seba." });
  }

  const target = await query("SELECT id, email, role FROM users WHERE id = $1", [userId]);
  if (target.rows.length === 0) {
    return res.status(404).json({ message: "Používateľ neexistuje." });
  }

  if (banned && target.rows[0].role === "admin") {
    return res.status(400).json({ message: "Iného admina zabanovať nemôžeš." });
  }

  const updated = await query(
    `UPDATE users
     SET banned = $2,
         token_version = token_version + 1
     WHERE id = $1
     RETURNING id, email, role, banned`,
    [userId, banned]
  );

  console.log(
    `[admin] ${req.user.email} ${banned ? "zabanoval" : "odbanoval"} používateľa ${target.rows[0].email}`
  );

  return res.json({
    message: banned ? "Používateľ bol zabanovaný." : "Používateľ bol odbanovaný.",
    user: updated.rows[0]
  });
}

router.post(
  "/users/:userId/ban",
  verifyCsrf,
  asyncHandler((req, res) => setBanned(req, res, true))
);

router.post(
  "/users/:userId/unban",
  verifyCsrf,
  asyncHandler((req, res) => setBanned(req, res, false))
);

module.exports = router;
