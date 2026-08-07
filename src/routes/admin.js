const express = require("express");
const { query } = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/asyncHandler");

const router = express.Router();

router.use(authenticate, requireRole("admin"));

router.get("/dashboard", asyncHandler(async (req, res) => {
  const usersResult = await query("SELECT id, email, role FROM users ORDER BY id ASC");
  const profilesResult = await query(
    "SELECT user_id, name, height, weight, activity_level, goal FROM profiles ORDER BY user_id ASC"
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
}));

module.exports = router;
