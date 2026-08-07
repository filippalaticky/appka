const express = require("express");
const { query } = require("../db");
const { authenticate } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/asyncHandler");
const { calculateHealthMetrics } = require("../utils/calculator");

const router = express.Router();

function normalizeActivityLevel(value) {
  const allowed = new Set(["1-2x", "3-4x", "5-6x", "7x"]);
  if (!allowed.has(value)) {
    return null;
  }
  return value;
}

function normalizeGoal(value) {
  const allowed = new Set(["schudnut", "nabrat", "udrzat"]);
  if (!allowed.has(value)) {
    return null;
  }
  return value;
}

router.get("/", authenticate, asyncHandler(async (req, res) => {
  const result = await query("SELECT * FROM profiles WHERE user_id = $1", [req.user.id]);
  const profile = result.rows[0];

  if (!profile) {
    return res.json({ profile: null, calculations: null });
  }

  const calculations = calculateHealthMetrics({
    height: Number(profile.height),
    weight: Number(profile.weight),
    activityLevel: profile.activity_level,
    goal: profile.goal
  });

  return res.json({ profile, calculations });
}));

router.post("/", authenticate, asyncHandler(async (req, res) => {
  const { name, height, weight, activityLevel, goal } = req.body;

  const parsedHeight = Number(height);
  const parsedWeight = Number(weight);
  const normalizedActivity = normalizeActivityLevel(activityLevel);
  const normalizedGoal = normalizeGoal(goal);

  if (!name || Number.isNaN(parsedHeight) || Number.isNaN(parsedWeight) || !normalizedActivity || !normalizedGoal) {
    return res.status(400).json({ message: "Skontroluj formulár a skús znova." });
  }

  if (parsedHeight < 120 || parsedHeight > 240 || parsedWeight < 35 || parsedWeight > 250) {
    return res.status(400).json({ message: "Hodnoty výšky alebo váhy sú mimo rozsah." });
  }

  const calculations = calculateHealthMetrics({
    height: parsedHeight,
    weight: parsedWeight,
    activityLevel: normalizedActivity,
    goal: normalizedGoal
  });

  const saveResult = await query(
    `INSERT INTO profiles (user_id, name, height, weight, activity_level, goal)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id)
     DO UPDATE SET name = EXCLUDED.name,
                   height = EXCLUDED.height,
                   weight = EXCLUDED.weight,
                   activity_level = EXCLUDED.activity_level,
                   goal = EXCLUDED.goal
     RETURNING *`,
    [req.user.id, name.trim(), parsedHeight, parsedWeight, normalizedActivity, normalizedGoal]
  );

  return res.json({
    message: "Profil bol uložený.",
    profile: saveResult.rows[0],
    calculations
  });
}));

module.exports = router;
