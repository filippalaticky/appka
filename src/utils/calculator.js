const ACTIVITY_MULTIPLIERS = {
  "1-2x": 1.375,
  "3-4x": 1.55,
  "5-6x": 1.725,
  "7x": 1.9
};

function round(value) {
  return Math.round(value * 100) / 100;
}

function calculateHealthMetrics({ height, weight, activityLevel, goal }) {
  const heightMeters = Number(height) / 100;
  const bmi = Number(weight) / (heightMeters * heightMeters);
  const idealWeight = 22 * (heightMeters * heightMeters);

  const bmr = 10 * Number(weight) + 6.25 * Number(height) - 5 * 30 + 5;
  const tdee = bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || 1.375);

  let calories = tdee;
  if (goal === "schudnut") calories -= 400;
  if (goal === "nabrat") calories += 300;

  let proteinPerKg = 1.8;
  let fatPerKg = 0.9;

  if (goal === "schudnut") {
    proteinPerKg = 2.0;
    fatPerKg = 0.8;
  }

  if (goal === "nabrat") {
    proteinPerKg = 2.2;
    fatPerKg = 1.0;
  }

  const protein = proteinPerKg * Number(weight);
  const fat = fatPerKg * Number(weight);
  const carbs = (calories - protein * 4 - fat * 9) / 4;
  const fiber = Math.max(25, (calories / 1000) * 14);

  return {
    bmi: round(bmi),
    idealWeight: round(idealWeight),
    calories: round(calories),
    protein: round(Math.max(0, protein)),
    carbs: round(Math.max(0, carbs)),
    fat: round(Math.max(0, fat)),
    fiber: round(Math.max(0, fiber))
  };
}

module.exports = {
  calculateHealthMetrics
};
