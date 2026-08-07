const express = require("express");
const { pool, query } = require("../db");
const { authenticate } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/asyncHandler");
const { calculateHealthMetrics } = require("../utils/calculator");
const { generateWeeklyMealPlan } = require("../utils/mealPlanner");

const router = express.Router();

router.get("/", authenticate, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT day, meal_type, variant1, variant2, calories, protein, carbs, fat, fiber
     FROM meal_plans
     WHERE user_id = $1
     ORDER BY id ASC`,
    [req.user.id]
  );

  return res.json({ mealPlan: result.rows });
}));

router.post("/generate", authenticate, asyncHandler(async (req, res) => {
  const profileResult = await query("SELECT * FROM profiles WHERE user_id = $1", [req.user.id]);
  const profile = profileResult.rows[0];

  if (!profile) {
    return res.status(400).json({ message: "Najskôr ulož profil a vypočítaj makrá." });
  }

  const macros = calculateHealthMetrics({
    height: Number(profile.height),
    weight: Number(profile.weight),
    activityLevel: profile.activity_level,
    goal: profile.goal
  });

  const weeklyRows = generateWeeklyMealPlan(macros);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM meal_plans WHERE user_id = $1", [req.user.id]);

    for (const row of weeklyRows) {
      await client.query(
        `INSERT INTO meal_plans
          (user_id, day, meal_type, variant1, variant2, calories, protein, carbs, fat, fiber)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          req.user.id,
          row.day,
          row.mealType,
          row.variant1,
          row.variant2,
          row.calories,
          row.protein,
          row.carbs,
          row.fat,
          row.fiber
        ]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return res.json({
    message: "Týždenný jedálniček bol vygenerovaný.",
    mealPlan: weeklyRows
  });
}));

module.exports = router;
