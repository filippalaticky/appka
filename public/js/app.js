/* IIFE: klasické <script> tagy zdieľajú jeden globálny rozsah, takže bez neho
 * by sa deklarácie z common.js a tohto súboru navzájom prekryli a skript by
 * skončil na "Identifier has already been declared". */
(function () {
  "use strict";

const { escapeHtml, apiFetch } = window.appCommon;

const profileForm = document.getElementById("profile-form");
const profileMessage = document.getElementById("profile-message");
const resultsSection = document.getElementById("results-section");
const generatePlanBtn = document.getElementById("generate-plan-btn");
const mealPlanSection = document.getElementById("meal-plan-section");
const mealPlanGrid = document.getElementById("meal-plan-grid");
const logoutBtn = document.getElementById("logout-btn");
const adminLink = document.getElementById("admin-link");
const mealDetailModal = document.getElementById("meal-detail-modal");
const modalCloseBtn = document.getElementById("modal-close-btn");
const modalOverlay = document.getElementById("modal-overlay");
const mealDetailName = document.getElementById("meal-detail-name");
const mealDetailTotals = document.getElementById("meal-detail-totals");
const mealDetailIngredients = document.getElementById("meal-detail-ingredients");
const allergyList = document.getElementById("allergy-list");

let latestCalculations = null;

// Záloha pre prípad, že server zoznam nepošle (napr. profil ešte neexistuje).
const DEFAULT_ALLERGY_OPTIONS = [
  { key: "laktoza", label: "Laktózová intolerancia" },
  { key: "lepok", label: "Bezlepková diéta" },
  { key: "orechy", label: "Alergia na orechy" },
  { key: "ryby", label: "Alergia na ryby" },
  { key: "vajcia", label: "Alergia na vajcia" },
  { key: "soja", label: "Alergia na sóju" },
  { key: "citrusy", label: "Alergia na citrusy" }
];

function renderAllergyOptions(options, selected = []) {
  allergyList.innerHTML = (options || DEFAULT_ALLERGY_OPTIONS)
    .map(
      (option) => `
      <label class="allergy-option">
        <input type="checkbox" value="${escapeHtml(option.key)}" ${selected.includes(option.key) ? "checked" : ""} />
        <span>${escapeHtml(option.label)}</span>
      </label>`
    )
    .join("");
}

function selectedAllergies() {
  return [...allergyList.querySelectorAll("input[type=checkbox]:checked")].map((input) => input.value);
}

const MEAL_TYPE_LABELS = {
  ranajky: "Raňajky",
  obed: "Obed",
  vecera: "Večera"
};

function setMessage(message, isError = false) {
  profileMessage.textContent = message;
  profileMessage.className = `mt-4 text-sm ${isError ? "text-red-300" : "text-emerald-300"}`;
}

function percentFromCalories(totalCalories, grams, macro) {
  const kcal = macro === "fat" ? grams * 9 : grams * 4;
  return Math.max(0, Math.min(100, (kcal / totalCalories) * 100));
}

function renderCalculations(calculations) {
  latestCalculations = calculations;

  document.getElementById("bmi-value").textContent = calculations.bmi;
  document.getElementById("ideal-weight-value").textContent = `${calculations.idealWeight} kg`;
  document.getElementById("calories-value").textContent = `${calculations.calories} kcal`;
  document.getElementById("protein-value").textContent = `${calculations.protein} g`;
  document.getElementById("carbs-value").textContent = `${calculations.carbs} g`;
  document.getElementById("fat-value").textContent = `${calculations.fat} g`;
  document.getElementById("fiber-value").textContent = `${calculations.fiber} g`;

  resultsSection.classList.remove("hidden");
  resultsSection.classList.add("animate-fade-in");
  generatePlanBtn.classList.remove("hidden");

  requestAnimationFrame(() => {
    document.getElementById("protein-bar").style.width = `${percentFromCalories(calculations.calories, calculations.protein, "protein")}%`;
    document.getElementById("carbs-bar").style.width = `${percentFromCalories(calculations.calories, calculations.carbs, "carbs")}%`;
    document.getElementById("fat-bar").style.width = `${percentFromCalories(calculations.calories, calculations.fat, "fat")}%`;
    document.getElementById("fiber-bar").style.width = `${Math.min(100, (calculations.fiber / 35) * 100)}%`;
  });
}

const mealDetailPanel = mealDetailModal.querySelector(".modal-panel");
let lastFocusedMealButton = null;

function closeMealDetailModal() {
  if (mealDetailModal.classList.contains("hidden")) return;

  // Zavieracia animácia dobehne, až potom sa modal skryje.
  mealDetailModal.classList.add("is-closing");
  window.setTimeout(() => {
    mealDetailModal.classList.add("hidden");
    mealDetailModal.classList.remove("is-closing");
    if (lastFocusedMealButton) {
      lastFocusedMealButton.focus();
      lastFocusedMealButton = null;
    }
  }, 200);
}

function formatNumber(value) {
  return Math.round(Number(value) * 10) / 10;
}

function renderMacroChips(source, prefix = "") {
  const calories = source[`${prefix}calories`];
  if (calories === null || calories === undefined) return "";

  return `
    <span class="meal-chip">${Math.round(Number(calories))} kcal</span>
    <span class="meal-chip">P ${formatNumber(source[`${prefix}protein`])} g</span>
    <span class="meal-chip">C ${formatNumber(source[`${prefix}carbs`])} g</span>
    <span class="meal-chip">F ${formatNumber(source[`${prefix}fat`])} g</span>
    <span class="meal-chip">Vl. ${formatNumber(source[`${prefix}fiber`])} g</span>
  `;
}

async function openMealDetailModal(mealId, triggerButton) {
  const response = await apiFetch(`/api/meal-plan/meal/${mealId}`);
  const data = await response.json();

  if (!response.ok) {
    setMessage(data.message || "Nepodarilo sa načítať detail jedla.", true);
    return;
  }

  lastFocusedMealButton = triggerButton || null;

  mealDetailName.textContent = data.meal.name;
  mealDetailTotals.innerHTML = renderMacroChips(data.meal);

  mealDetailIngredients.innerHTML = data.ingredients
    .map(
      (ingredient, index) => `
      <div class="ingredient-row" style="--row-index: ${index}">
        <div>
          <p class="font-semibold text-slate-100">${escapeHtml(ingredient.ingredient_name)}</p>
          <p class="text-xs text-slate-400">${formatNumber(ingredient.grams)} g</p>
        </div>
        <div class="text-right text-xs text-slate-300">
          <p>${Math.round(Number(ingredient.calories))} kcal</p>
          <p>P ${formatNumber(ingredient.protein)} | C ${formatNumber(ingredient.carbs)} | F ${formatNumber(ingredient.fat)} | Vl. ${formatNumber(ingredient.fiber)}</p>
        </div>
      </div>`
    )
    .join("");

  mealDetailModal.classList.remove("hidden", "is-closing");

  // Trieda na paneli ostáva, preto sa animácia musí pri každom otvorení naštartovať znova.
  mealDetailPanel.classList.remove("animate-modal-in");
  void mealDetailPanel.offsetWidth;
  mealDetailPanel.classList.add("animate-modal-in");

  modalCloseBtn.focus();
}

// Jedálničky vygenerované staršou verziou nemajú uložený detail jedla.
// Ostanú čitateľné, ale bez rozkliknutia - stačí ich vygenerovať nanovo.
function renderVariantButton(meal, index) {
  const mealId = meal[`variant${index}_meal_id`];
  const name = meal[`variant${index}`];
  const chips = renderMacroChips(meal, `variant${index}_`);

  if (!mealId) {
    return `
      <div class="meal-detail-btn is-static text-sm text-slate-400">
        <span>${index}) ${escapeHtml(name)}</span>
        <span class="block text-xs mt-1">Detail nie je uložený - vygeneruj jedálniček nanovo.</span>
      </div>`;
  }

  return `
    <button class="meal-detail-btn text-sm text-slate-200" data-meal-id="${mealId}">
      <span>${index}) ${escapeHtml(name)}</span>
      <span class="block">${chips}</span>
    </button>`;
}

function renderMealPlan(rows) {
  if (!rows || rows.length === 0) return;
  mealPlanSection.classList.remove("hidden");
  mealPlanGrid.innerHTML = "";

  const grouped = rows.reduce((acc, row) => {
    if (!acc[row.day]) acc[row.day] = [];
    acc[row.day].push(row);
    return acc;
  }, {});

  Object.entries(grouped).forEach(([day, meals]) => {
    const card = document.createElement("article");
    card.className = "meal-card animate-fade-in";
    const mealsHtml = meals
      .map(
        (meal) => `
          <div class="mt-4">
            <p class="font-semibold uppercase text-teal-300">${escapeHtml(MEAL_TYPE_LABELS[meal.meal_type] || "Jedlo")}</p>
            ${renderVariantButton(meal, 1)}
            ${renderVariantButton(meal, 2)}
          </div>`
      )
      .join("");

    card.innerHTML = `<h3 class="text-lg font-semibold">${escapeHtml(day)}</h3>${mealsHtml}`;
    mealPlanGrid.appendChild(card);
  });

  mealPlanGrid.querySelectorAll(".meal-detail-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const mealId = Number(button.dataset.mealId);
      if (!Number.isNaN(mealId)) {
        await openMealDetailModal(mealId, button);
      }
    });
  });
}

async function getCurrentUser() {
  const response = await apiFetch("/api/auth/me");
  if (!response.ok) {
    window.location.href = "/";
    return null;
  }
  const data = await response.json();
  if (data.user.role === "admin") {
    adminLink.classList.remove("hidden");
  }
  return data.user;
}

async function loadProfile() {
  const response = await apiFetch("/api/profile");
  if (!response.ok) {
    renderAllergyOptions();
    return;
  }
  const data = await response.json();

  // Checkboxy sa vykreslia vždy, aj keď profil ešte neexistuje.
  renderAllergyOptions(data.allergyOptions, (data.profile && data.profile.allergies) || []);
  if (!data.profile) return;

  document.getElementById("name").value = data.profile.name || "";
  document.getElementById("height").value = Number(data.profile.height) || "";
  document.getElementById("age").value = Number(data.profile.age) || "";
  document.getElementById("weight").value = Number(data.profile.weight) || "";
  document.getElementById("gender").value = data.profile.gender || "muz";
  document.getElementById("activity-level").value = data.profile.activity_level || "1-2x";
  document.getElementById("goal").value = data.profile.goal || "udrzat";

  if (data.calculations) {
    renderCalculations(data.calculations);
  }
}

async function loadMealPlan() {
  const response = await apiFetch("/api/meal-plan");
  if (!response.ok) return;
  const data = await response.json();
  renderMealPlan(data.mealPlan || []);
}

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("Počítam tvoje hodnoty...");

  const payload = {
    name: document.getElementById("name").value,
    height: document.getElementById("height").value,
    age: document.getElementById("age").value,
    weight: document.getElementById("weight").value,
    gender: document.getElementById("gender").value,
    activityLevel: document.getElementById("activity-level").value,
    goal: document.getElementById("goal").value,
    allergies: selectedAllergies()
  };

  const response = await apiFetch("/api/profile", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    setMessage(data.message || "Nepodarilo sa uložiť profil.", true);
    return;
  }

  renderCalculations(data.calculations);
  // Už vygenerovaný jedálniček alergie nezohľadňuje, kým sa nevytvorí nanovo.
  const hasPlan = mealPlanGrid.children.length > 0;
  setMessage(
    hasPlan
      ? "Profil uložený. Ak si menil alergie, vytvor jedálniček nanovo."
      : "Profil uložený a makrá vypočítané."
  );
});

generatePlanBtn.addEventListener("click", async () => {
  if (!latestCalculations) {
    setMessage("Najskôr vypočítaj makrá.", true);
    return;
  }

  setMessage("Generujem jedálniček...");
  const response = await apiFetch("/api/meal-plan/generate", { method: "POST" });
  const data = await response.json();

  if (!response.ok) {
    setMessage(data.message || "Nepodarilo sa vygenerovať jedálniček.", true);
    return;
  }

  renderMealPlan(data.mealPlan || []);
  setMessage("Jedálniček bol vytvorený a uložený do databázy.");
});

logoutBtn.addEventListener("click", async () => {
  await apiFetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/";
});

modalCloseBtn.addEventListener("click", closeMealDetailModal);
modalOverlay.addEventListener("click", closeMealDetailModal);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMealDetailModal();
});

async function init() {
  const user = await getCurrentUser();
  if (!user) return;
  await loadProfile();
  await loadMealPlan();
}

init();
})();
