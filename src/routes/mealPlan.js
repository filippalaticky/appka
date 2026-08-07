const express = require("express");
const { pool, query } = require("../db");
const { authenticate } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/asyncHandler");
const { calculateHealthMetrics } = require("../utils/calculator");
const { generateWeeklyMealPlan } = require("../utils/mealPlanner");

const router = express.Router();

// Riadok plánu drží cieľové makrá jedla, tabuľka meals skutočné makrá oboch variantov.
const MEAL_PLAN_QUERY = `
  SELECT mp.id, mp.day, mp.meal_type, mp.variant1, mp.variant2,
         mp.variant1_meal_id, mp.variant2_meal_id,
         mp.calories, mp.protein, mp.carbs, mp.fat, mp.fiber,
         m1.calories AS variant1_calories, m1.protein AS variant1_protein,
         m1.carbs AS variant1_carbs, m1.fat AS variant1_fat, m1.fiber AS variant1_fiber,
         m2.calories AS variant2_calories, m2.protein AS variant2_protein,
         m2.carbs AS variant2_carbs, m2.fat AS variant2_fat, m2.fiber AS variant2_fiber
  FROM meal_plans mp
  LEFT JOIN meals m1 ON m1.id = mp.variant1_meal_id
  LEFT JOIN meals m2 ON m2.id = mp.variant2_meal_id
  WHERE mp.user_id = $1
  ORDER BY mp.id ASC`;

router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await query(MEAL_PLAN_QUERY, [req.user.id]);

    return res.json({ mealPlan: result.rows });
  })
);

router.get(
  "/meal/:mealId",
  authenticate,
  asyncHandler(async (req, res) => {
    const mealId = Number(req.params.mealId);
    if (Number.isNaN(mealId)) {
      return res.status(400).json({ message: "Neplatné ID jedla." });
    }

    const mealResult = await query("SELECT id, name, calories, protein, carbs, fat, fiber FROM meals WHERE id = $1", [mealId]);
    const meal = mealResult.rows[0];
    if (!meal) {
      return res.status(404).json({ message: "Detail jedla neexistuje." });
    }

    const ingredientResult = await query(
      `SELECT ingredient_name, grams, calories, protein, carbs, fat, fiber
       FROM ingredients
       WHERE meal_id = $1
       ORDER BY id ASC`,
      [mealId]
    );

    return res.json({ meal, ingredients: ingredientResult.rows });
  })
);

router.post(
  "/generate",
  authenticate,
  asyncHandler(async (req, res) => {
    const profileResult = await query("SELECT * FROM profiles WHERE user_id = $1", [req.user.id]);
    const profile = profileResult.rows[0];

    if (!profile) {
      return res.status(400).json({ message: "Najskôr ulož profil a vypočítaj makrá." });
    }

    const macros = calculateHealthMetrics({
      height: Number(profile.height),
      weight: Number(profile.weight),
      activityLevel: profile.activity_level,
      goal: profile.goal,
      age: Number(profile.age),
      gender: profile.gender
    });

    const weeklyRows = generateWeeklyMealPlan(macros);
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const previousMealIds = await client.query(
        `SELECT variant1_meal_id, variant2_meal_id
         FROM meal_plans
         WHERE user_id = $1`,
        [req.user.id]
      );
      const idsToDelete = new Set();
      previousMealIds.rows.forEach((row) => {
        if (row.variant1_meal_id) idsToDelete.add(Number(row.variant1_meal_id));
        if (row.variant2_meal_id) idsToDelete.add(Number(row.variant2_meal_id));
      });

      await client.query("DELETE FROM meal_plans WHERE user_id = $1", [req.user.id]);

      for (const id of idsToDelete) {
        await client.query("DELETE FROM ingredients WHERE meal_id = $1", [id]);
        await client.query("DELETE FROM meals WHERE id = $1", [id]);
      }

      for (const row of weeklyRows) {
        const variant1Result = await client.query(
          `INSERT INTO meals (name, calories, protein, carbs, fat, fiber)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            row.variant1.name,
            row.variant1.calories,
            row.variant1.protein,
            row.variant1.carbs,
            row.variant1.fat,
            row.variant1.fiber
          ]
        );

        const variant2Result = await client.query(
          `INSERT INTO meals (name, calories, protein, carbs, fat, fiber)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            row.variant2.name,
            row.variant2.calories,
            row.variant2.protein,
            row.variant2.carbs,
            row.variant2.fat,
            row.variant2.fiber
          ]
        );

        const variant1MealId = variant1Result.rows[0].id;
        const variant2MealId = variant2Result.rows[0].id;

        for (const ingredient of row.variant1.ingredients) {
          await client.query(
            `INSERT INTO ingredients (meal_id, ingredient_name, grams, calories, protein, carbs, fat, fiber)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              variant1MealId,
              ingredient.ingredient_name,
              ingredient.grams,
              ingredient.calories,
              ingredient.protein,
              ingredient.carbs,
              ingredient.fat,
              ingredient.fiber
            ]
          );
        }

        for (const ingredient of row.variant2.ingredients) {
          await client.query(
            `INSERT INTO ingredients (meal_id, ingredient_name, grams, calories, protein, carbs, fat, fiber)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              variant2MealId,
              ingredient.ingredient_name,
              ingredient.grams,
              ingredient.calories,
              ingredient.protein,
              ingredient.carbs,
              ingredient.fat,
              ingredient.fiber
            ]
          );
        }

        await client.query(
          `INSERT INTO meal_plans
            (user_id, day, meal_type, variant1, variant2, variant1_meal_id, variant2_meal_id, calories, protein, carbs, fat, fiber)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            req.user.id,
            row.day,
            row.meal_type,
            row.variant1.name,
            row.variant2.name,
            variant1MealId,
            variant2MealId,
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

    const storedRows = await query(MEAL_PLAN_QUERY, [req.user.id]);

    return res.json({
      message: "Týždenný jedálniček bol vygenerovaný.",
      mealPlan: storedRows.rows
    });
  })
);

module.exports = router;
