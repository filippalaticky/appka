const DAYS = ["Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok", "Sobota", "Nedeľa"];
const MEAL_TYPES = ["ranajky", "obed", "vecera"];
const MEAL_SPLIT = {
  ranajky: 0.3,
  obed: 0.4,
  vecera: 0.3
};

const TEMPLATES_PER_MEAL_TYPE = 14; // 7 dní x 2 varianty

/**
 * Povolené sú výhradne základné potraviny. Hodnoty sú na 100 g suroviny
 * (obilniny a cestoviny suché), `carbs` sú celkové sacharidy vrátane vlákniny.
 *
 * `allergens` - zoznam alergénov, kvôli ktorým sa surovina vylúči.
 * `min` / `max` - reálne porcie v jednom jedle, držia gramáže v jedlej rovine.
 * `form`        - tvar do názvu jedla ("Kuracie mäso s ryžou a brokolicou").
 */
const FOODS = {
  // --- Bielkoviny: mäso ---
  kuracie: { name: "Kuracie mäso", protein: 31, carbs: 0, fat: 3.6, fiber: 0, allergens: [], min: 40, max: 350 },
  morcacie: { name: "Morčacie mäso", protein: 29, carbs: 0, fat: 1.9, fiber: 0, allergens: [], min: 40, max: 350 },
  hovadzie: { name: "Hovädzie mäso", protein: 26, carbs: 0, fat: 8, fiber: 0, allergens: [], min: 40, max: 320 },

  // --- Bielkoviny: ryby ---
  losos: { name: "Losos", protein: 20, carbs: 0, fat: 13, fiber: 0, allergens: ["ryby"], min: 40, max: 220 },
  treska: { name: "Treska", protein: 18, carbs: 0, fat: 0.7, fiber: 0, allergens: ["ryby"], min: 40, max: 380 },
  tuniak: { name: "Tuniak", protein: 24, carbs: 0, fat: 1, fiber: 0, allergens: ["ryby"], min: 40, max: 320 },

  // --- Bielkoviny: ostatné ---
  vajcia: { name: "Vajcia", protein: 13, carbs: 1.1, fat: 10, fiber: 0, allergens: ["vajcia"], min: 50, max: 300 },
  tofu: { name: "Tofu", protein: 12, carbs: 1.9, fat: 7, fiber: 1, allergens: ["soja"], min: 50, max: 300 },
  skyr: { name: "Skyr", protein: 11, carbs: 4, fat: 0.2, fiber: 0, allergens: ["laktoza"], min: 80, max: 550 },
  tvaroh: { name: "Tvaroh", protein: 12, carbs: 3.5, fat: 0.5, fiber: 0, allergens: ["laktoza"], min: 80, max: 500 },
  cottage: { name: "Cottage cheese", protein: 12, carbs: 3.4, fat: 4.3, fiber: 0, allergens: ["laktoza"], min: 80, max: 500 },

  // --- Sacharidy ---
  // Ovsené vločky aj bežné cestoviny sa pri bezlepkovej diéte vylučujú.
  ovsene_vlocky: { name: "Ovsené vločky", protein: 13.2, carbs: 60, fat: 6.5, fiber: 10, allergens: ["lepok"], min: 15, max: 420, form: "s ovsenými vločkami" },
  cestoviny: { name: "Cestoviny", protein: 13, carbs: 63, fat: 2.5, fiber: 8, allergens: ["lepok"], min: 15, max: 420, form: "s cestovinami" },
  ryza: { name: "Ryža", protein: 7, carbs: 79, fat: 0.6, fiber: 1.3, allergens: [], min: 15, max: 450, form: "s ryžou" },
  quinoa: { name: "Quinoa", protein: 14, carbs: 64, fat: 6, fiber: 7, allergens: [], min: 15, max: 420, form: "s quinoou" },
  zemiaky: { name: "Zemiaky", protein: 2, carbs: 17, fat: 0.1, fiber: 2.2, allergens: [], min: 60, max: 1400, form: "so zemiakmi" },
  bataty: { name: "Sladké zemiaky", protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, allergens: [], min: 60, max: 1200, form: "so sladkými zemiakmi" },

  // --- Tuky ---
  orechy: { name: "Orechy", protein: 21, carbs: 22, fat: 50, fiber: 12, allergens: ["orechy"], min: 5, max: 70 },
  olivovy_olej: { name: "Olivový olej", protein: 0, carbs: 0, fat: 100, fiber: 0, allergens: [], min: 2, max: 45 },

  // --- Zelenina ---
  brokolica: { name: "Brokolica", protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, allergens: [], min: 30, max: 450, form: "a brokolicou" },
  paprika: { name: "Paprika", protein: 1, carbs: 6, fat: 0.3, fiber: 2.1, allergens: [], min: 30, max: 450, form: "a paprikou" },
  paradajky: { name: "Paradajky", protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, allergens: [], min: 30, max: 500, form: "a paradajkami" },
  uhorka: { name: "Uhorka", protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, allergens: [], min: 30, max: 500, form: "a uhorkou" },
  spenat: { name: "Špenát", protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, allergens: [], min: 30, max: 400, form: "a špenátom" },
  salat: { name: "Šalát", protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.3, allergens: [], min: 30, max: 400, form: "a šalátom" },

  // --- Ovocie ---
  jablko: { name: "Jablko", protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, allergens: [], min: 30, max: 450, form: "a jablkom" },
  banan: { name: "Banán", protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, allergens: [], min: 30, max: 400, form: "a banánom" },
  maliny: { name: "Maliny", protein: 1.2, carbs: 12, fat: 0.7, fiber: 6.5, allergens: [], min: 30, max: 350, form: "a malinami" },
  cucoriedky: { name: "Čučoriedky", protein: 0.7, carbs: 14, fat: 0.3, fiber: 2.4, allergens: [], min: 30, max: 400, form: "a čučoriedkami" }
};

/**
 * Z čoho sa skladá ktoré jedlo. Recepty sa nepíšu ručne - poskladajú sa
 * z týchto zoznamov, takže po vyradení alergénov vždy ostane platná ponuka.
 *
 * `protein`      - obvyklé zdroje pre daný typ jedla
 * `proteinBackup`- použijú sa, až keď alergie vyradia všetky obvyklé
 * `fiber`        - zelenina/ovocie s dostatkom vlákniny (nesie vlákninový cieľ)
 * `fiberGarnish` - doplnková zelenina; sama by vlákninu nepokryla, ale dodá pestrosť
 */
const MEAL_COMPONENTS = {
  ranajky: {
    protein: ["skyr", "tvaroh", "cottage", "vajcia"],
    proteinBackup: ["kuracie", "morcacie", "tofu", "tuniak"],
    carbs: ["ovsene_vlocky", "ryza", "quinoa"],
    fat: ["orechy", "olivovy_olej"],
    fiber: ["banan", "jablko", "cucoriedky"],
    // Maliny majú najviac vlákniny na gram sacharidov zo všetkého povoleného
    // ovocia. Sú v každých raňajkách, aby sa vláknina dala pokryť bez toho,
    // aby sladké ovocie prestrelilo sacharidový cieľ.
    fiberGarnish: ["maliny"]
  },
  obed: {
    protein: ["kuracie", "morcacie", "hovadzie", "losos", "treska", "tuniak", "tofu", "vajcia"],
    proteinBackup: ["cottage", "tvaroh"],
    carbs: ["ryza", "zemiaky", "bataty", "cestoviny", "quinoa"],
    fat: ["olivovy_olej", "orechy"],
    fiber: ["brokolica", "paprika", "spenat"],
    fiberGarnish: ["paradajky", "salat", "uhorka"]
  },
  vecera: {
    protein: ["treska", "kuracie", "tuniak", "morcacie", "tofu", "vajcia", "cottage", "hovadzie"],
    proteinBackup: ["skyr", "tvaroh"],
    carbs: ["zemiaky", "ryza", "quinoa", "bataty", "cestoviny"],
    fat: ["olivovy_olej", "orechy"],
    fiber: ["spenat", "brokolica", "paprika"],
    fiberGarnish: ["salat", "paradajky", "uhorka"]
  }
};

/**
 * Rozhoduje pomer tuku k bielkovine, nie samotný tuk. Profil má 2 g bielkovín
 * a 0,8 g tuku na kilogram, čiže pomer 0,4 - a časť tuku musí ostať pre olej
 * a prílohu. Surovina nad 0,3 (vajcia 0,77, tofu 0,58, hovädzie 0,31) by sama
 * tukový cieľ prekročila, preto dostane chudého partnera.
 */
const FATTY_RATIO_THRESHOLD = 0.3;

// Partneri sa líšia podľa jedla, aby ryba neskončila v raňajkovej kaši.
const LEAN_PARTNERS = {
  ranajky: ["skyr", "tvaroh", "morcacie", "kuracie"],
  obed: ["treska", "morcacie", "kuracie", "tuniak"],
  vecera: ["treska", "morcacie", "kuracie", "tuniak"]
};

// Tučná bielkovina sa nesmie stretnúť s tučnou prílohou. Vajcia s ovsenými
// vločkami (6,5 g tuku na 100 g) by tukový cieľ prekročili aj pri minime oleja.
const LEAN_CARB_MAX_FAT = 3;

// Keď alergie nechajú len jednu bielkovinu, jedálniček by bol jednotvárny -
// vtedy sa ponuka doplní o náhradné zdroje.
const MIN_PROTEIN_VARIETY = 2;

function fatToProteinRatio(foodKey) {
  const food = FOODS[foodKey];
  return food.protein > 0 ? food.fat / food.protein : Number.POSITIVE_INFINITY;
}

const MACROS = ["protein", "fat", "carbs", "fiber"];

function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function caloriesFromMacros(protein, carbs, fat) {
  return protein * 4 + carbs * 4 + fat * 9;
}

function macroTotal(items, macro) {
  return items.reduce((sum, item) => sum + (item.grams * FOODS[item.food][macro]) / 100, 0);
}

/** Surovina je povolená, keď ju nevylučuje ani jedna zo zaškrtnutých alergií. */
function isFoodAllowed(foodKey, allergies) {
  const food = FOODS[foodKey];
  if (!food) return false;
  return !food.allergens.some((allergen) => allergies.includes(allergen));
}

/** Mapa "názov suroviny" -> alergény. Slúži na kontrolu už uložených jedál. */
function buildIngredientAllergenMap() {
  const map = new Map();
  for (const food of Object.values(FOODS)) {
    map.set(food.name, food.allergens);
  }
  return map;
}

const INGREDIENT_ALLERGENS = buildIngredientAllergenMap();

/**
 * Zistí, ktoré alergény porušuje zoznam ingrediencií uloženého jedla.
 * Neznáma surovina (napr. z jedálnička staršej verzie) sa nepovažuje
 * za bezpečnú - preto sa vracia ako "neznama".
 */
function findViolatedAllergens(ingredientNames, allergies) {
  if (allergies.length === 0) return [];

  const violated = new Set();
  for (const name of ingredientNames) {
    const allergens = INGREDIENT_ALLERGENS.get(name);
    if (!allergens) {
      violated.add("neznama");
      continue;
    }
    for (const allergen of allergens) {
      if (allergies.includes(allergen)) violated.add(allergen);
    }
  }

  return [...violated];
}

/**
 * Škáluje suroviny jedla tak, aby jeho makrá sedeli na cieľ. Každá skupina
 * (bielkovinová, tuková, sacharidová, vlákninová) sa posúva k svojmu cieľu
 * v rámci reálnych porcií; kroky sa opakujú, kým sa hodnoty ustália.
 */
function runFitPasses(items, target, passes) {
  for (let pass = 0; pass < passes; pass += 1) {
    MACROS.forEach((macro) => {
      const pool = items.filter((item) => item.role === macro);
      if (pool.length === 0) return;

      const poolAmount = macroTotal(pool, macro);
      if (poolAmount <= 1e-9) return;

      const gap = target[macro] - macroTotal(items, macro);
      const factor = Math.max(0, (poolAmount + gap) / poolAmount);

      pool.forEach((item) => {
        const food = FOODS[item.food];
        item.grams = clamp(item.grams * factor, food.min, food.max);
      });
    });
  }
}

/**
 * Presúva gramáže vnútri jednej skupiny tak, že `holdMacro` ostáva nezmenené
 * a `reduceMacro` klesá k cieľu. Rieši dva reálne konflikty: celozrnné prílohy
 * nesú viac vlákniny než je cieľ, a sladké ovocie donesie priveľa sacharidov.
 */
function tradeWithinPool(items, role, holdMacro, reduceMacro, target) {
  const pool = items.filter((item) => item.role === role);
  if (pool.length < 2) return false;

  const ratio = (item) => {
    const food = FOODS[item.food];
    return food[holdMacro] > 0 ? food[reduceMacro] / food[holdMacro] : Number.POSITIVE_INFINITY;
  };

  let moved = false;

  for (let step = 0; step < 60; step += 1) {
    const excess = macroTotal(items, reduceMacro) - target[reduceMacro];
    if (excess <= 0.05) break;

    const donor = pool
      .filter((item) => item.grams > FOODS[item.food].min + 1e-6)
      .sort((a, b) => ratio(b) - ratio(a))[0];
    const receiver = pool
      .filter((item) => item.grams < FOODS[item.food].max - 1e-6)
      .sort((a, b) => ratio(a) - ratio(b))[0];

    if (!donor || !receiver || donor === receiver) break;
    if (ratio(donor) - ratio(receiver) < 1e-9) break;

    const donorFood = FOODS[donor.food];
    const receiverFood = FOODS[receiver.food];
    const holdRatio = donorFood[holdMacro] / receiverFood[holdMacro];
    const savedPerGram = donorFood[reduceMacro] / 100 - (receiverFood[reduceMacro] / 100) * holdRatio;
    if (savedPerGram <= 1e-9) break;

    let grams = Math.min(excess / savedPerGram, donor.grams - donorFood.min);
    const receiverHeadroom = receiverFood.max - receiver.grams;
    if (grams * holdRatio > receiverHeadroom) {
      grams = receiverHeadroom / holdRatio;
    }
    if (grams <= 1e-6) break;

    donor.grams -= grams;
    receiver.grams += grams * holdRatio;
    moved = true;
  }

  return moved;
}

function fitMealToTarget(items, target) {
  items.forEach((item) => {
    item.grams = FOODS[item.food].min;
  });

  runFitPasses(items, target, 300);

  // Výmena rozhodí ostatné makrá, preto sa striedavo dolaďuje aj zvyšok.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const tradedFiber = tradeWithinPool(items, "carbs", "carbs", "fiber", target);
    const tradedCarbs = tradeWithinPool(items, "fiber", "fiber", "carbs", target);
    if (!tradedFiber && !tradedCarbs) break;
    runFitPasses(items, target, 120);
  }

  items.forEach((item) => {
    item.grams = round(item.grams, 1);
  });

  return items;
}

function buildMealVariant(template, target) {
  const items = template.items.map(([food, role]) => ({ food, role, grams: 0 }));
  fitMealToTarget(items, target);

  const ingredients = items.map((item) => {
    const food = FOODS[item.food];
    const ratio = item.grams / 100;
    const protein = round(food.protein * ratio, 1);
    const carbs = round(food.carbs * ratio, 1);
    const fat = round(food.fat * ratio, 1);
    const fiber = round(food.fiber * ratio, 1);

    return {
      ingredient_name: food.name,
      grams: item.grams,
      calories: Math.round(caloriesFromMacros(protein, carbs, fat)),
      protein,
      carbs,
      fat,
      fiber
    };
  });

  const totals = ingredients.reduce(
    (acc, ingredient) => ({
      protein: acc.protein + ingredient.protein,
      carbs: acc.carbs + ingredient.carbs,
      fat: acc.fat + ingredient.fat,
      fiber: acc.fiber + ingredient.fiber
    }),
    { protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  return {
    name: template.name,
    calories: Math.round(caloriesFromMacros(totals.protein, totals.carbs, totals.fat)),
    protein: round(totals.protein, 1),
    carbs: round(totals.carbs, 1),
    fat: round(totals.fat, 1),
    fiber: round(totals.fiber, 1),
    ingredients
  };
}

function buildMealName(proteinKey, carbKey, fiberKey) {
  return `${FOODS[proteinKey].name} ${FOODS[carbKey].form} ${FOODS[fiberKey].form}`;
}

/**
 * Poskladá recepty pre jeden typ jedla z povolených surovín.
 * Vyberá tak, aby sa suroviny čo najviac striedali - preto sa v každom kroku
 * uprednostní kombinácia, ktorá použije najmenej už použitých surovín.
 */
function buildTemplates(mealType, allergies) {
  const components = MEAL_COMPONENTS[mealType];
  const keep = (list) => (list || []).filter((food) => isFoodAllowed(food, allergies));

  const allowed = {
    carbs: keep(components.carbs),
    fat: keep(components.fat),
    fiber: keep(components.fiber),
    garnish: keep(components.fiberGarnish)
  };

  // Náhradné bielkoviny sa pridajú, keď alergie zredukujú obvyklé na jednu.
  allowed.protein = keep(components.protein);
  if (allowed.protein.length < MIN_PROTEIN_VARIETY) {
    const backup = keep(components.proteinBackup).filter((food) => !allowed.protein.includes(food));
    allowed.protein = [...allowed.protein, ...backup];
  }

  // Bez bielkoviny, prílohy alebo zeleniny sa jedlo poskladať nedá.
  if (allowed.protein.length === 0 || allowed.carbs.length === 0 || allowed.fiber.length === 0) {
    return [];
  }

  const leanPartners = keep(LEAN_PARTNERS[mealType]).filter(
    (food) => fatToProteinRatio(food) < FATTY_RATIO_THRESHOLD
  );

  const combos = [];
  for (const protein of allowed.protein) {
    // Tučnej bielkovine sa priradí chudý partner, aby jedlo sadlo do tukov.
    const partners = fatToProteinRatio(protein) >= FATTY_RATIO_THRESHOLD
      ? leanPartners.filter((food) => food !== protein)
      : [];
    const partner = partners.length > 0 ? partners[0] : null;

    // K tučnej bielkovine sa pripustia len chudé prílohy.
    const isFatty = fatToProteinRatio(protein) >= FATTY_RATIO_THRESHOLD;
    const leanCarbs = allowed.carbs.filter((food) => FOODS[food].fat <= LEAN_CARB_MAX_FAT);
    const usableCarbs = isFatty && leanCarbs.length > 0 ? leanCarbs : allowed.carbs;

    for (const carbs of usableCarbs) {
      for (const fiber of allowed.fiber) {
        // Tuk je voliteľný: keď ho alergie vyradia, tuk dodá mäso a príloha.
        for (const fat of allowed.fat.length > 0 ? allowed.fat : [null]) {
          combos.push({ protein, partner, carbs, fat, fiber, garnish: null });
        }
      }
    }
  }

  // Doplnková zelenina sa strieda naprieč kombináciami, aby jedlá neboli fádne.
  if (allowed.garnish.length > 0) {
    combos.forEach((combo, index) => {
      combo.garnish = allowed.garnish[index % allowed.garnish.length];
    });
  }

  const picked = [];
  const usage = new Map();
  const useCount = (key) => usage.get(key) || 0;

  while (picked.length < TEMPLATES_PER_MEAL_TYPE && combos.length > 0) {
    let bestIndex = 0;
    let bestScore = Infinity;

    combos.forEach((combo, index) => {
      const score =
        useCount(combo.protein) * 4 + useCount(combo.carbs) * 3 + useCount(combo.fiber) * 2 + useCount(combo.fat);
      if (score < bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    const [combo] = combos.splice(bestIndex, 1);
    for (const key of [combo.protein, combo.carbs, combo.fiber, combo.fat, combo.garnish]) {
      if (key) usage.set(key, useCount(key) + 1);
    }

    const items = [
      [combo.protein, "protein"],
      [combo.carbs, "carbs"],
      [combo.fiber, "fiber"]
    ];
    if (combo.partner) items.push([combo.partner, "protein"]);
    if (combo.fat) items.push([combo.fat, "fat"]);
    if (combo.garnish) items.push([combo.garnish, "fiber"]);

    picked.push({ name: buildMealName(combo.protein, combo.carbs, combo.fiber), items });
  }

  // Pri veľa alergiách môže ostať menej než 14 kombinácií - vtedy sa
  // ponuka zopakuje, aby mal každý deň obidva varianty.
  const templates = [];
  for (let i = 0; i < TEMPLATES_PER_MEAL_TYPE; i += 1) {
    templates.push(picked[i % picked.length]);
  }
  return templates;
}

function splitMacroAcrossMeals(total) {
  const breakfast = round(total * MEAL_SPLIT.ranajky, 1);
  const lunch = round(total * MEAL_SPLIT.obed, 1);
  const dinner = round(total - breakfast - lunch, 1);
  return { ranajky: breakfast, obed: lunch, vecera: dinner };
}

function targetMealsForDay(macros) {
  return {
    calories: splitMacroAcrossMeals(macros.calories),
    protein: splitMacroAcrossMeals(macros.protein),
    carbs: splitMacroAcrossMeals(macros.carbs),
    fat: splitMacroAcrossMeals(macros.fat),
    fiber: splitMacroAcrossMeals(macros.fiber)
  };
}

/**
 * Týždenný jedálniček. `allergies` je zoznam kľúčov z utils/allergies -
 * suroviny, ktoré niektorá z nich vylučuje, sa do jedál vôbec nedostanú.
 */
function generateWeeklyMealPlan(macros, allergies = []) {
  const rows = [];
  const dayTargets = targetMealsForDay(macros);

  const templatesByMealType = {};
  for (const mealType of MEAL_TYPES) {
    templatesByMealType[mealType] = buildTemplates(mealType, allergies);
    if (templatesByMealType[mealType].length === 0) {
      throw new Error(
        "Pri zvolených alergiách sa nedá poskladať jedálniček. Skús odškrtnúť aspoň jednu položku."
      );
    }
  }

  DAYS.forEach((day, dayIndex) => {
    MEAL_TYPES.forEach((mealType) => {
      const target = {
        calories: dayTargets.calories[mealType],
        protein: dayTargets.protein[mealType],
        carbs: dayTargets.carbs[mealType],
        fat: dayTargets.fat[mealType],
        fiber: dayTargets.fiber[mealType]
      };

      const templates = templatesByMealType[mealType];
      const variantA = templates[(dayIndex * 2) % templates.length];
      const variantB = templates[(dayIndex * 2 + 1) % templates.length];

      rows.push({
        day,
        meal_type: mealType,
        variant1: buildMealVariant(variantA, target),
        variant2: buildMealVariant(variantB, target),
        calories: target.calories,
        protein: target.protein,
        carbs: target.carbs,
        fat: target.fat,
        fiber: target.fiber
      });
    });
  });

  return rows;
}

module.exports = {
  generateWeeklyMealPlan,
  findViolatedAllergens,
  isFoodAllowed,
  buildTemplates,
  FOODS,
  MEAL_COMPONENTS
};
