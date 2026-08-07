const DAYS = ["Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok", "Sobota", "Nedeľa"];
const MEAL_SPLIT = {
  ranajky: 0.3,
  obed: 0.4,
  vecera: 0.3
};

const VARIANTS = {
  ranajky: [
    ["Ovsená kaša s gréckym jogurtom a ovocím", "Miešané vajcia s celozrnným toastom a avokádom"],
    ["Skyr bowl s orechmi a chia semienkami", "Proteínové palacinky s tvarohom a malinami"]
  ],
  obed: [
    ["Kuracie prsia s ryžou a zeleninou", "Losos so sladkými zemiakmi a šalátom"],
    ["Morčacie mäso s quinoou a brokolicou", "Hovädzie stir-fry s jazmínovou ryžou"]
  ],
  vecera: [
    ["Tuniakový šalát s cícerom", "Tofu wok so zeleninou a ryžovými rezancami"],
    ["Cottage cheese bowl s celozrnným pečivom", "Pečená treska so zemiakovým pyré a špenátom"]
  ]
};

function round(value) {
  return Math.round(value * 100) / 100;
}

function generateWeeklyMealPlan(macros) {
  const rows = [];

  DAYS.forEach((day, dayIndex) => {
    ["ranajky", "obed", "vecera"].forEach((mealType) => {
      const ratio = MEAL_SPLIT[mealType];
      const mealCalories = round(macros.calories * ratio);
      const mealProtein = round(macros.protein * ratio);
      const mealCarbs = round(macros.carbs * ratio);
      const mealFat = round(macros.fat * ratio);
      const mealFiber = round(macros.fiber * ratio);

      const pair = VARIANTS[mealType][dayIndex % VARIANTS[mealType].length];

      rows.push({
        day,
        meal_type: mealType,
        variant1: pair[0],
        variant2: pair[1],
        calories: mealCalories,
        protein: mealProtein,
        carbs: mealCarbs,
        fat: mealFat,
        fiber: mealFiber
      });
    });
  });

  return rows;
}

module.exports = {
  generateWeeklyMealPlan
};
