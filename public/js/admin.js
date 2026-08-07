const usersCount = document.getElementById("users-count");
const profilesCount = document.getElementById("profiles-count");
const mealRowsCount = document.getElementById("meal-rows-count");
const usersList = document.getElementById("users-list");
const logoutBtn = document.getElementById("logout-btn");

function renderUsers(users) {
  usersList.innerHTML = "";

  users.forEach((user) => {
    const profile = user.profile;
    const mealPlan = user.mealPlan || [];

    const wrapper = document.createElement("article");
    wrapper.className = "meal-card";

    const profileHtml = profile
      ? `
      <div class="mt-2 text-sm text-slate-200">
        <p><strong>Meno:</strong> ${profile.name}</p>
        <p><strong>Výška:</strong> ${profile.height} cm</p>
        <p><strong>Váha:</strong> ${profile.weight} kg</p>
        <p><strong>Aktivita:</strong> ${profile.activity_level}</p>
        <p><strong>Cieľ:</strong> ${profile.goal}</p>
      </div>`
      : `<p class="text-sm text-slate-400 mt-2">Profil zatiaľ nevyplnený.</p>`;

    const mealPreview = mealPlan
      .slice(0, 6)
      .map(
        (row) =>
          `<li class="text-sm text-slate-300">${row.day} • ${row.meal_type}: ${row.variant1} | ${row.variant2}</li>`
      )
      .join("");

    wrapper.innerHTML = `
      <div class="flex items-center justify-between gap-4">
        <div>
          <h3 class="text-lg font-semibold">${user.email}</h3>
          <p class="text-sm text-slate-400">Rola: ${user.role}</p>
        </div>
        <span class="meal-chip">${mealPlan.length} riadkov jedálničku</span>
      </div>
      ${profileHtml}
      <ul class="mt-3 space-y-1">${mealPreview || "<li class='text-sm text-slate-400'>Bez jedálnička.</li>"}</ul>
    `;

    usersList.appendChild(wrapper);
  });
}

async function loadDashboard() {
  const response = await fetch("/api/admin/dashboard");
  if (response.status === 401 || response.status === 403) {
    window.location.href = "/";
    return;
  }

  const data = await response.json();
  const users = data.users || [];

  usersCount.textContent = users.length;
  profilesCount.textContent = users.filter((u) => u.profile).length;
  mealRowsCount.textContent = users.reduce((acc, u) => acc + (u.mealPlan?.length || 0), 0);

  renderUsers(users);
}

logoutBtn.addEventListener("click", async () => {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/";
});

loadDashboard();
