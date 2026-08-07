const ACTIVITY_MULTIPLIERS = {
  "1-2x": 1.375,
  "3-4x": 1.55,
  "5-6x": 1.725,
  "7x": 1.9
};

function round(value) {
  return Math.round(value * 100) / 100;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function calculateHealthMetrics({ height, weight, activityLevel, goal, age, gender }) {
  const heightCm = Number(height);
  const weightKg = Number(weight);
  const ageYears = Number(age);
  const heightMeters = heightCm / 100;
  const bmi = weightKg / (heightMeters * heightMeters);
  const heightInchesOver152 = Math.max(0, (heightCm - 152) / 2.54);
  let devine = 50 + 2.3 * heightInchesOver152;
  let robinson = 52 + 1.9 * heightInchesOver152;

  if (gender === "zena") {
    devine = 45.5 + 2.3 * heightInchesOver152;
    robinson = 49 + 1.7 * heightInchesOver152;
  }

  const idealWeight = (devine + robinson) / 2;

  const genderOffset = gender === "zena" ? -161 : 5;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + genderOffset;
  const tdee = bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || 1.375);

  let goalMultiplier = 1;
  if (goal === "schudnut") goalMultiplier = 0.85;
  if (goal === "nabrat") goalMultiplier = 1.15;

  const calories = tdee * goalMultiplier;
  const protein = 2 * weightKg;
  const fat = 0.8 * weightKg;
  const carbs = (calories - protein * 4 - fat * 9) / 4;
  const fiber = clamp((calories / 1000) * 12, 25, 35);

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
