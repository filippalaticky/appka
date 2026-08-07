const profileForm = document.getElementById("profile-form");
const profileMessage = document.getElementById("profile-message");
const resultsSection = document.getElementById("results-section");
const generatePlanBtn = document.getElementById("generate-plan-btn");
const mealPlanSection = document.getElementById("meal-plan-section");
const mealPlanGrid = document.getElementById("meal-plan-grid");
const logoutBtn = document.getElementById("logout-btn");
const adminLink = document.getElementById("admin-link");

let latestCalculations = null;

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
    document.getElementById("fiber-bar").style.width = `${Math.min(100, (calculations.fiber / 45) * 100)}%`;
  });
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
            <p class="font-semibold uppercase text-teal-300">${meal.meal_type}</p>
            <p class="text-sm text-slate-200 mt-1">1) ${meal.variant1}</p>
            <p class="text-sm text-slate-200">2) ${meal.variant2}</p>
            <div class="mt-2">
              <span class="meal-chip">${meal.calories} kcal</span>
              <span class="meal-chip">P ${meal.protein} g</span>
              <span class="meal-chip">C ${meal.carbs} g</span>
              <span class="meal-chip">F ${meal.fat} g</span>
              <span class="meal-chip">Vl. ${meal.fiber} g</span>
            </div>
          </div>`
      )
      .join("");

    card.innerHTML = `<h3 class="text-lg font-semibold">${day}</h3>${mealsHtml}`;
    mealPlanGrid.appendChild(card);
  });
}

async function getCurrentUser() {
  const response = await fetch("/api/auth/me");
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
  const response = await fetch("/api/profile");
  if (!response.ok) return;
  const data = await response.json();
  if (!data.profile) return;

  document.getElementById("name").value = data.profile.name || "";
  document.getElementById("height").value = Number(data.profile.height) || "";
  document.getElementById("weight").value = Number(data.profile.weight) || "";
  document.getElementById("activity-level").value = data.profile.activity_level || "1-2x";
  document.getElementById("goal").value = data.profile.goal || "udrzat";

  if (data.calculations) {
    renderCalculations(data.calculations);
  }
}

async function loadMealPlan() {
  const response = await fetch("/api/meal-plan");
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
    weight: document.getElementById("weight").value,
    activityLevel: document.getElementById("activity-level").value,
    goal: document.getElementById("goal").value
  };

  const response = await fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();

  if (!response.ok) {
    setMessage(data.message || "Nepodarilo sa uložiť profil.", true);
    return;
  }

  renderCalculations(data.calculations);
  setMessage("Profil uložený a makrá vypočítané.");
});

generatePlanBtn.addEventListener("click", async () => {
  if (!latestCalculations) {
    setMessage("Najskôr vypočítaj makrá.", true);
    return;
  }

  setMessage("Generujem jedálniček...");
  const response = await fetch("/api/meal-plan/generate", { method: "POST" });
  const data = await response.json();

  if (!response.ok) {
    setMessage(data.message || "Nepodarilo sa vygenerovať jedálniček.", true);
    return;
  }

  renderMealPlan(data.mealPlan || []);
  setMessage("Jedálniček bol vytvorený a uložený do databázy.");
});

logoutBtn.addEventListener("click", async () => {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/";
});

async function init() {
  const user = await getCurrentUser();
  if (!user) return;
  await loadProfile();
  await loadMealPlan();
}

init();
