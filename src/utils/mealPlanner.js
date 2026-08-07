const DAYS = ["Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok", "Sobota", "Nedeľa"];
const MEAL_TYPES = ["ranajky", "obed", "vecera"];
const MEAL_SPLIT = {
  ranajky: 0.3,
  obed: 0.4,
  vecera: 0.3
};

// Nutričné hodnoty na 100 g suroviny (v stave, v akom sa váži - obilniny a strukoviny suché).
// `carbs` sú celkové sacharidy vrátane vlákniny, rovnako ako s nimi počíta kalkulačka.
// `min` / `max` sú reálne porcie danej suroviny v jednom jedle - držia gramáže v jedlej rovine.
const FOODS = {
  // --- Bielkovinové zdroje ---
  kuracie_prsia: { name: "Kuracie prsia", protein: 31, carbs: 0, fat: 3.6, fiber: 0, min: 40, max: 350 },
  morcacie_prsia: { name: "Morčacie prsia", protein: 29, carbs: 0, fat: 1.9, fiber: 0, min: 40, max: 350 },
  hovadzie_chude: { name: "Hovädzie chudé mäso", protein: 26, carbs: 0, fat: 8, fiber: 0, min: 40, max: 320 },
  losos: { name: "Losos", protein: 20, carbs: 0, fat: 13, fiber: 0, min: 40, max: 220 },
  treska: { name: "Treska", protein: 18, carbs: 0, fat: 0.7, fiber: 0, min: 40, max: 380 },
  tuniak: { name: "Tuniak vo vlastnej šťave", protein: 24, carbs: 0, fat: 1, fiber: 0, min: 40, max: 320 },
  vajcia: { name: "Vajcia", protein: 13, carbs: 1.1, fat: 10, fiber: 0, min: 30, max: 160 },
  vajecne_bielky: { name: "Vaječné bielky", protein: 11, carbs: 0.7, fat: 0.2, fiber: 0, min: 60, max: 450 },
  skyr: { name: "Skyr", protein: 11, carbs: 4, fat: 0.2, fiber: 0, min: 80, max: 550 },
  grecky_jogurt: { name: "Grécky jogurt 0 %", protein: 10, carbs: 4, fat: 0.4, fiber: 0, min: 80, max: 550 },
  tvaroh: { name: "Nízkotučný tvaroh", protein: 12, carbs: 3.5, fat: 0.5, fiber: 0, min: 80, max: 500 },
  cottage_cheese: { name: "Cottage cheese", protein: 12, carbs: 3.4, fat: 4.3, fiber: 0, min: 80, max: 500 },
  srvatkovy_protein: { name: "Srvátkový proteín", protein: 78, carbs: 7, fat: 6, fiber: 1, min: 10, max: 90 },
  tofu: { name: "Tofu", protein: 12, carbs: 1.9, fat: 7, fiber: 1, min: 50, max: 260 },
  krevety: { name: "Krevety", protein: 24, carbs: 0.2, fat: 0.3, fiber: 0, min: 30, max: 320 },

  // --- Sacharidové zdroje ---
  ovsene_vlocky: { name: "Ovsené vločky", protein: 13.2, carbs: 60, fat: 6.5, fiber: 10, min: 10, max: 260 },
  ovsena_muka: { name: "Ovsená múka", protein: 13, carbs: 60, fat: 7, fiber: 9, min: 10, max: 240 },
  ryza_jazminova: { name: "Jazmínová ryža (suchá)", protein: 7, carbs: 79, fat: 0.6, fiber: 1.3, min: 15, max: 450 },
  basmati: { name: "Basmati ryža (suchá)", protein: 8, carbs: 77, fat: 1, fiber: 1.4, min: 15, max: 450 },
  ryzove_vlocky: { name: "Ryžové vločky", protein: 7, carbs: 77, fat: 1, fiber: 2, min: 10, max: 400 },
  quinoa: { name: "Quinoa (suchá)", protein: 14, carbs: 64, fat: 6, fiber: 7, min: 15, max: 420 },
  bulgur: { name: "Bulgur (suchý)", protein: 12, carbs: 64, fat: 1.3, fiber: 12, min: 15, max: 420 },
  kuskus: { name: "Celozrnný kuskus (suchý)", protein: 13, carbs: 72, fat: 0.6, fiber: 5, min: 15, max: 420 },
  celozrnne_cestoviny: { name: "Celozrnné cestoviny (suché)", protein: 13, carbs: 63, fat: 2.5, fiber: 8, min: 15, max: 420 },
  ryzove_rezance: { name: "Ryžové rezance (suché)", protein: 6, carbs: 80, fat: 0.6, fiber: 2, min: 15, max: 420 },
  celozrnny_chlieb: { name: "Celozrnný chlieb", protein: 9, carbs: 41, fat: 3.5, fiber: 7, min: 20, max: 500 },
  celozrnna_tortilla: { name: "Celozrnná tortilla", protein: 8, carbs: 46, fat: 6, fiber: 5, min: 20, max: 400 },
  granola: { name: "Granola", protein: 9, carbs: 64, fat: 14, fiber: 7, min: 10, max: 70 },
  musli: { name: "Müsli", protein: 10, carbs: 60, fat: 8, fiber: 9, min: 10, max: 90 },
  med: { name: "Med", protein: 0.3, carbs: 82, fat: 0, fiber: 0, min: 3, max: 80 },
  zemiaky: { name: "Zemiaky", protein: 2, carbs: 17, fat: 0.1, fiber: 2.2, min: 60, max: 1400 },
  bataty: { name: "Bataty", protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, min: 60, max: 1200 },
  cicer: { name: "Cícer (varený)", protein: 8, carbs: 18, fat: 2.6, fiber: 7, min: 40, max: 260 },

  // --- Tukové zdroje ---
  olivovy_olej: { name: "Olivový olej", protein: 0, carbs: 0, fat: 100, fiber: 0, min: 2, max: 45 },
  sezamovy_olej: { name: "Sezamový olej", protein: 0, carbs: 0, fat: 100, fiber: 0, min: 2, max: 45 },
  mandlove_maslo: { name: "Mandľové maslo", protein: 21, carbs: 19, fat: 55, fiber: 10, min: 5, max: 60 },
  arasidove_maslo: { name: "Arašidové maslo", protein: 25, carbs: 20, fat: 50, fiber: 6, min: 5, max: 60 },
  kesu_maslo: { name: "Kešu maslo", protein: 18, carbs: 27, fat: 49, fiber: 3, min: 5, max: 60 },
  vlasske_orechy: { name: "Vlašské orechy", protein: 15, carbs: 14, fat: 65, fiber: 7, min: 5, max: 60 },
  lieskove_orechy: { name: "Lieskové orechy", protein: 15, carbs: 17, fat: 61, fiber: 10, min: 5, max: 60 },
  kesu_orechy: { name: "Kešu orechy", protein: 18, carbs: 30, fat: 44, fiber: 3, min: 5, max: 70 },
  mandle: { name: "Mandle", protein: 21, carbs: 22, fat: 50, fiber: 12, min: 5, max: 65 },
  arasidy: { name: "Arašidy", protein: 26, carbs: 16, fat: 49, fiber: 8, min: 5, max: 65 },
  tekvicove_semienka: { name: "Tekvicové semienka", protein: 30, carbs: 11, fat: 49, fiber: 6, min: 5, max: 60 },
  chia: { name: "Chia semienka", protein: 17, carbs: 42, fat: 31, fiber: 34, min: 3, max: 40 },
  avokado: { name: "Avokádo", protein: 2, carbs: 9, fat: 15, fiber: 7, min: 20, max: 200 },
  hummus: { name: "Hummus", protein: 8, carbs: 14, fat: 17, fiber: 6, min: 15, max: 180 },
  guacamole: { name: "Guacamole", protein: 2, carbs: 8, fat: 14, fiber: 6, min: 15, max: 200 },
  parmezan: { name: "Parmezán", protein: 38, carbs: 4, fat: 28, fiber: 0, min: 8, max: 40 },

  // --- Zdroje vlákniny (zelenina a ovocie) ---
  banan: { name: "Banán", protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, min: 30, max: 400 },
  jablko: { name: "Jablko", protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, min: 30, max: 450 },
  cucoriedky: { name: "Čučoriedky", protein: 0.7, carbs: 14, fat: 0.3, fiber: 2.4, min: 30, max: 400 },
  maliny: { name: "Maliny", protein: 1.2, carbs: 12, fat: 0.7, fiber: 6.5, min: 30, max: 350 },
  jahody: { name: "Jahody", protein: 0.7, carbs: 8, fat: 0.3, fiber: 2, min: 30, max: 450 },
  lesne_ovocie: { name: "Lesné ovocie", protein: 1, carbs: 11, fat: 0.4, fiber: 4, min: 30, max: 400 },
  brokolica: { name: "Brokolica", protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, min: 30, max: 450 },
  spenat: { name: "Špenát", protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, min: 30, max: 400 },
  paprika: { name: "Paprika", protein: 1, carbs: 6, fat: 0.3, fiber: 2.1, min: 30, max: 450 },
  mrkva: { name: "Mrkva", protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, min: 30, max: 450 },
  cuketa: { name: "Cuketa", protein: 1.2, carbs: 3.1, fat: 0.3, fiber: 1, min: 30, max: 500 },
  zelene_fazulky: { name: "Zelené fazuľky", protein: 1.8, carbs: 7, fat: 0.1, fiber: 3.4, min: 30, max: 450 },
  salat_mix: { name: "Listový šalát mix", protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.3, min: 30, max: 400 },
  uhorka: { name: "Uhorka", protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, min: 30, max: 500 },
  paradajky: { name: "Paradajky", protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, min: 30, max: 500 },
  spargla: { name: "Špargľa", protein: 2.2, carbs: 3.9, fat: 0.1, fiber: 2.1, min: 30, max: 450 },
  kukurica: { name: "Kukurica", protein: 3.3, carbs: 19, fat: 1.4, fiber: 2.7, min: 30, max: 350 },
  zeleninovy_mix: { name: "Zeleninový mix", protein: 1.8, carbs: 6, fat: 0.3, fiber: 2.5, min: 30, max: 450 }
};

// 14 receptov na každý typ jedla = 7 dní x 2 varianty bez jediného opakovania.
// Tučnejšie suroviny (losos, vajcia, granola) majú v recepte chudého partnera,
// inak by sa jedlo nedalo zmestiť do tukového cieľa 0,8 g/kg.
const MEAL_TEMPLATES = {
  ranajky: [
    { name: "Ovsená kaša so skyrom a banánom", items: [["skyr", "protein"], ["ovsene_vlocky", "carbs"], ["med", "carbs"], ["mandlove_maslo", "fat"], ["banan", "fiber"], ["maliny", "fiber"]] },
    { name: "Jogurt bowl s granolou", items: [["grecky_jogurt", "protein"], ["ryzove_vlocky", "carbs"], ["granola", "carbs"], ["vlasske_orechy", "fat"], ["cucoriedky", "fiber"], ["maliny", "fiber"]] },
    { name: "Proteínové lievance", items: [["vajecne_bielky", "protein"], ["ovsena_muka", "carbs"], ["med", "carbs"], ["arasidove_maslo", "fat"], ["maliny", "fiber"]] },
    { name: "Tvarohový pohár s müsli", items: [["tvaroh", "protein"], ["ryzove_vlocky", "carbs"], ["musli", "carbs"], ["chia", "fat"], ["mandle", "fat"], ["jablko", "fiber"], ["maliny", "fiber"]] },
    { name: "Sendvič s vajíčkom a avokádom", items: [["vajecne_bielky", "protein"], ["vajcia", "protein"], ["celozrnny_chlieb", "carbs"], ["med", "carbs"], ["avokado", "fat"], ["paradajky", "fiber"]] },
    { name: "Ryžová kaša s proteínom", items: [["srvatkovy_protein", "protein"], ["ryzove_vlocky", "carbs"], ["med", "carbs"], ["lieskove_orechy", "fat"], ["jahody", "fiber"], ["maliny", "fiber"]] },
    { name: "Skyr parfait s lesným ovocím", items: [["skyr", "protein"], ["ovsene_vlocky", "carbs"], ["med", "carbs"], ["kesu_maslo", "fat"], ["lesne_ovocie", "fiber"], ["maliny", "fiber"]] },
    { name: "Toasty s cottage cheese", items: [["cottage_cheese", "protein"], ["celozrnny_chlieb", "carbs"], ["med", "carbs"], ["tekvicove_semienka", "fat"], ["uhorka", "fiber"]] },
    { name: "Omeleta s ovsenými plackami", items: [["vajecne_bielky", "protein"], ["vajcia", "protein"], ["ovsene_vlocky", "carbs"], ["ryzove_vlocky", "carbs"], ["olivovy_olej", "fat"], ["spenat", "fiber"]] },
    { name: "Proteínové smoothie bowl", items: [["srvatkovy_protein", "protein"], ["ovsene_vlocky", "carbs"], ["med", "carbs"], ["mandle", "fat"], ["banan", "fiber"], ["spenat", "fiber"]] },
    { name: "Tvarohové palacinky", items: [["tvaroh", "protein"], ["ovsena_muka", "carbs"], ["med", "carbs"], ["arasidove_maslo", "fat"], ["cucoriedky", "fiber"], ["maliny", "fiber"]] },
    { name: "Jogurt s müsli a jablkom", items: [["grecky_jogurt", "protein"], ["ryzove_vlocky", "carbs"], ["musli", "carbs"], ["vlasske_orechy", "fat"], ["jablko", "fiber"], ["maliny", "fiber"]] },
    { name: "Ovsená kaša s kešu a jahodami", items: [["skyr", "protein"], ["ovsene_vlocky", "carbs"], ["med", "carbs"], ["kesu_orechy", "fat"], ["jahody", "fiber"], ["maliny", "fiber"]] },
    { name: "Vajíčková nátierka s toastom", items: [["vajecne_bielky", "protein"], ["vajcia", "protein"], ["celozrnny_chlieb", "carbs"], ["ryzove_vlocky", "carbs"], ["hummus", "fat"], ["paprika", "fiber"]] }
  ],
  obed: [
    { name: "Kuracie prsia s ryžou a brokolicou", items: [["kuracie_prsia", "protein"], ["ryza_jazminova", "carbs"], ["olivovy_olej", "fat"], ["brokolica", "fiber"]] },
    { name: "Morčacie s quinoou a avokádom", items: [["morcacie_prsia", "protein"], ["quinoa", "carbs"], ["avokado", "fat"], ["salat_mix", "fiber"]] },
    { name: "Hovädzie stir-fry s basmati", items: [["hovadzie_chude", "protein"], ["basmati", "carbs"], ["sezamovy_olej", "fat"], ["paprika", "fiber"]] },
    { name: "Losos so zemiakmi a fazuľkami", items: [["losos", "protein"], ["treska", "protein"], ["zemiaky", "carbs"], ["celozrnny_chlieb", "carbs"], ["olivovy_olej", "fat"], ["zelene_fazulky", "fiber"]] },
    { name: "Tofu bowl s ryžovými rezancami", items: [["tofu", "protein"], ["krevety", "protein"], ["ryzove_rezance", "carbs"], ["arasidy", "fat"], ["mrkva", "fiber"]] },
    { name: "Kuracie burrito bowl", items: [["kuracie_prsia", "protein"], ["basmati", "carbs"], ["guacamole", "fat"], ["kukurica", "fiber"]] },
    { name: "Tuniakové cestoviny s parmezánom", items: [["tuniak", "protein"], ["celozrnne_cestoviny", "carbs"], ["olivovy_olej", "fat"], ["parmezan", "fat"], ["spenat", "fiber"]] },
    { name: "Morčacie s batatom a cuketou", items: [["morcacie_prsia", "protein"], ["bataty", "carbs"], ["basmati", "carbs"], ["olivovy_olej", "fat"], ["cuketa", "fiber"]] },
    { name: "Hovädzie s bulgurom", items: [["hovadzie_chude", "protein"], ["bulgur", "carbs"], ["olivovy_olej", "fat"], ["zeleninovy_mix", "fiber"]] },
    { name: "Kuracie s kuskusom a mandľami", items: [["kuracie_prsia", "protein"], ["kuskus", "carbs"], ["mandle", "fat"], ["cuketa", "fiber"]] },
    { name: "Losos s ryžou a špargľou", items: [["losos", "protein"], ["krevety", "protein"], ["basmati", "carbs"], ["olivovy_olej", "fat"], ["spargla", "fiber"]] },
    { name: "Morčacie cestoviny s brokolicou", items: [["morcacie_prsia", "protein"], ["celozrnne_cestoviny", "carbs"], ["olivovy_olej", "fat"], ["parmezan", "fat"], ["brokolica", "fiber"]] },
    { name: "Tofu s cícerom a ryžou", items: [["tofu", "protein"], ["krevety", "protein"], ["cicer", "carbs"], ["basmati", "carbs"], ["sezamovy_olej", "fat"], ["zeleninovy_mix", "fiber"]] },
    { name: "Treska so zemiakmi a mrkvou", items: [["treska", "protein"], ["zemiaky", "carbs"], ["celozrnny_chlieb", "carbs"], ["olivovy_olej", "fat"], ["mrkva", "fiber"]] }
  ],
  vecera: [
    { name: "Treska s kuskusom a špenátom", items: [["treska", "protein"], ["kuskus", "carbs"], ["olivovy_olej", "fat"], ["spenat", "fiber"]] },
    { name: "Tuniakový šalát s cícerom", items: [["tuniak", "protein"], ["cicer", "carbs"], ["kuskus", "carbs"], ["avokado", "fat"], ["salat_mix", "fiber"]] },
    { name: "Kuracie wrapy s hummusom", items: [["kuracie_prsia", "protein"], ["celozrnna_tortilla", "carbs"], ["basmati", "carbs"], ["hummus", "fat"], ["zeleninovy_mix", "fiber"]] },
    { name: "Vaječná omeleta s pečenými zemiakmi", items: [["vajecne_bielky", "protein"], ["vajcia", "protein"], ["zemiaky", "carbs"], ["olivovy_olej", "fat"], ["paradajky", "fiber"]] },
    { name: "Tofu stir-fry s ryžou", items: [["tofu", "protein"], ["krevety", "protein"], ["ryza_jazminova", "carbs"], ["kesu_orechy", "fat"], ["brokolica", "fiber"]] },
    { name: "Cottage bowl s pečivom", items: [["cottage_cheese", "protein"], ["celozrnny_chlieb", "carbs"], ["zemiaky", "carbs"], ["vlasske_orechy", "fat"], ["uhorka", "fiber"]] },
    { name: "Morčacie prsia s bulgurom", items: [["morcacie_prsia", "protein"], ["bulgur", "carbs"], ["tekvicove_semienka", "fat"], ["zeleninovy_mix", "fiber"]] },
    { name: "Lososová misa s ryžou", items: [["losos", "protein"], ["krevety", "protein"], ["ryza_jazminova", "carbs"], ["olivovy_olej", "fat"], ["spargla", "fiber"]] },
    { name: "Kuracie so zemiakovým šalátom", items: [["kuracie_prsia", "protein"], ["zemiaky", "carbs"], ["olivovy_olej", "fat"], ["paprika", "fiber"]] },
    { name: "Tvarohová misa s pečivom", items: [["tvaroh", "protein"], ["celozrnny_chlieb", "carbs"], ["med", "carbs"], ["tekvicove_semienka", "fat"], ["paradajky", "fiber"]] },
    { name: "Treskový šalát s bulgurom", items: [["treska", "protein"], ["bulgur", "carbs"], ["avokado", "fat"], ["salat_mix", "fiber"]] },
    { name: "Morčacie tortilly s guacamole", items: [["morcacie_prsia", "protein"], ["celozrnna_tortilla", "carbs"], ["basmati", "carbs"], ["guacamole", "fat"], ["kukurica", "fiber"]] },
    { name: "Tofu s kuskusom a arašidmi", items: [["tofu", "protein"], ["krevety", "protein"], ["kuskus", "carbs"], ["arasidy", "fat"], ["cuketa", "fiber"]] },
    { name: "Hovädzie s celozrnnými cestovinami", items: [["hovadzie_chude", "protein"], ["celozrnne_cestoviny", "carbs"], ["olivovy_olej", "fat"], ["spenat", "fiber"]] }
  ]
};

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

/**
 * Škáluje suroviny jedného jedla tak, aby jeho makrá sedeli na cieľ.
 * Každá skupina surovín (bielkovinová, tuková, sacharidová, vlákninová) sa
 * posúva k svojmu cieľu v rámci reálnych porcií - keďže každá surovina prispieva
 * do viacerých makier, kroky sa niekoľkokrát opakujú, kým sa hodnoty ustália.
 * Škálovanie je pre celú skupinu spoločné, takže pomer surovín v nej ostáva zachovaný.
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
 * Presúva gramáže vnútri jednej skupiny surovín tak, že `holdMacro` (to, kvôli
 * čomu je skupina v jedle) ostáva nezmenené a `reduceMacro` klesá k cieľu.
 * Rieši dva reálne konflikty:
 *  - celozrnné prílohy nesú viac vlákniny, než je cieľ (skupina sacharidov),
 *  - sladké ovocie donesie priveľa sacharidov, kým dopĺňa vlákninu (skupina vlákniny).
 * Vracia true, ak sa niečo presunulo.
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
    // Za každý odobraný gram donora doplníme toľko receivera, aby `holdMacro` sedelo.
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
  // Spoločné škálovanie celej skupiny pomer po výmene zachová, takže sa nezruší.
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

function splitMacroAcrossMeals(total) {
  const breakfast = round(total * MEAL_SPLIT.ranajky, 1);
  const lunch = round(total * MEAL_SPLIT.obed, 1);
  const dinner = round(total - breakfast - lunch, 1);
  return {
    ranajky: breakfast,
    obed: lunch,
    vecera: dinner
  };
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

function generateWeeklyMealPlan(macros) {
  const rows = [];
  const dayTargets = targetMealsForDay(macros);

  DAYS.forEach((day, dayIndex) => {
    MEAL_TYPES.forEach((mealType) => {
      const target = {
        calories: dayTargets.calories[mealType],
        protein: dayTargets.protein[mealType],
        carbs: dayTargets.carbs[mealType],
        fat: dayTargets.fat[mealType],
        fiber: dayTargets.fiber[mealType]
      };

      // 7 dní x 2 varianty = 14 slotov, 14 receptov -> žiadne jedlo sa v týždni neopakuje.
      const templates = MEAL_TEMPLATES[mealType];
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
  FOODS,
  MEAL_TEMPLATES
};
