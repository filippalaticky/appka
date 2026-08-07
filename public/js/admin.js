const { escapeHtml, apiFetch } = window.appCommon;

const usersCount = document.getElementById("users-count");
const profilesCount = document.getElementById("profiles-count");
const mealRowsCount = document.getElementById("meal-rows-count");
const usersList = document.getElementById("users-list");
const logoutBtn = document.getElementById("logout-btn");
const adminMessage = document.getElementById("admin-message");
const logsBody = document.getElementById("logs-body");
const logsUserFilter = document.getElementById("logs-user-filter");
const logsRefreshBtn = document.getElementById("logs-refresh-btn");

const MEAL_TYPE_LABELS = {
  ranajky: "Raňajky",
  obed: "Obed",
  vecera: "Večera"
};

let knownUsers = [];

function setMessage(message, isError = false) {
  adminMessage.textContent = message;
  adminMessage.className = `text-sm mt-2 ${isError ? "text-red-300" : "text-emerald-300"}`;
}

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
        <p><strong>Meno:</strong> ${escapeHtml(profile.name)}</p>
        <p><strong>Výška:</strong> ${escapeHtml(profile.height)} cm</p>
        <p><strong>Vek:</strong> ${escapeHtml(profile.age)}</p>
        <p><strong>Váha:</strong> ${escapeHtml(profile.weight)} kg</p>
        <p><strong>Pohlavie:</strong> ${escapeHtml(profile.gender)}</p>
        <p><strong>Aktivita:</strong> ${escapeHtml(profile.activity_level)}</p>
        <p><strong>Cieľ:</strong> ${escapeHtml(profile.goal)}</p>
      </div>`
      : `<p class="text-sm text-slate-400 mt-2">Profil zatiaľ nevyplnený.</p>`;

    const mealPreview = mealPlan
      .slice(0, 6)
      .map(
        (row) =>
          `<li class="text-sm text-slate-300">${escapeHtml(row.day)} • ${
            escapeHtml(MEAL_TYPE_LABELS[row.meal_type] || row.meal_type)
          }: ${escapeHtml(row.variant1)} | ${escapeHtml(row.variant2)}</li>`
      )
      .join("");

    const banButton = user.banned
      ? `<button class="btn-secondary text-sm" data-action="unban" data-user-id="${escapeHtml(user.id)}">Odbanovať</button>`
      : `<button class="btn-danger text-sm" data-action="ban" data-user-id="${escapeHtml(user.id)}">Zabanovať</button>`;

    wrapper.innerHTML = `
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 class="text-lg font-semibold">${escapeHtml(user.email)}</h3>
          <p class="text-sm text-slate-400">
            Rola: ${escapeHtml(user.role)}
            ${user.banned ? '<span class="status-badge status-banned">Zabanovaný</span>' : '<span class="status-badge status-active">Aktívny</span>'}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <span class="meal-chip">${escapeHtml(mealPlan.length)} riadkov jedálničku</span>
          ${user.role === "admin" ? "" : banButton}
        </div>
      </div>
      ${profileHtml}
      <ul class="mt-3 space-y-1">${mealPreview || "<li class='text-sm text-slate-400'>Bez jedálnička.</li>"}</ul>
    `;

    usersList.appendChild(wrapper);
  });

  usersList.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", () => changeBanState(button.dataset.userId, button.dataset.action));
  });
}

async function changeBanState(userId, action) {
  setMessage(action === "ban" ? "Banujem používateľa..." : "Odbanovávam používateľa...");

  const response = await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}/${action}`, { method: "POST" });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    setMessage(data.message || "Akcia sa nepodarila.", true);
    return;
  }

  setMessage(data.message);
  await loadDashboard();
  await loadLogs();
}

function renderLogs(logs) {
  if (logs.length === 0) {
    logsBody.innerHTML = '<tr><td colspan="5" class="log-cell text-slate-400">Zatiaľ žiadne prihlásenia.</td></tr>';
    return;
  }

  logsBody.innerHTML = logs
    .map((log) => {
      const when = new Date(log.timestamp).toLocaleString("sk-SK");
      const who = log.current_email || log.email || "neznámy";
      return `
        <tr>
          <td class="log-cell whitespace-nowrap">${escapeHtml(when)}</td>
          <td class="log-cell">${escapeHtml(who)}</td>
          <td class="log-cell whitespace-nowrap">${escapeHtml(log.ip_address || "-")}</td>
          <td class="log-cell log-agent" title="${escapeHtml(log.user_agent || "")}">${escapeHtml(log.user_agent || "-")}</td>
          <td class="log-cell">
            <span class="status-badge ${log.success ? "status-active" : "status-banned"}">
              ${log.success ? "Úspech" : "Neúspech"}
            </span>
          </td>
        </tr>`;
    })
    .join("");
}

function renderUserFilter(users) {
  const current = logsUserFilter.value;
  logsUserFilter.innerHTML =
    '<option value="">Všetci používatelia</option>' +
    users
      .map((user) => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.email)}</option>`)
      .join("");
  logsUserFilter.value = current;
}

async function loadLogs() {
  const userId = logsUserFilter.value;
  const url = userId ? `/api/admin/login-logs?userId=${encodeURIComponent(userId)}` : "/api/admin/login-logs";
  const response = await apiFetch(url);

  if (response.status === 401 || response.status === 403) {
    window.location.href = "/";
    return;
  }

  const data = await response.json().catch(() => ({}));
  renderLogs(data.logs || []);
}

async function loadDashboard() {
  const response = await apiFetch("/api/admin/dashboard");
  if (response.status === 401 || response.status === 403) {
    window.location.href = "/";
    return;
  }

  const data = await response.json().catch(() => ({}));
  const users = data.users || [];
  knownUsers = users;

  usersCount.textContent = users.length;
  profilesCount.textContent = users.filter((u) => u.profile).length;
  mealRowsCount.textContent = users.reduce((acc, u) => acc + (u.mealPlan?.length || 0), 0);

  renderUsers(users);
  renderUserFilter(users);
}

logoutBtn.addEventListener("click", async () => {
  await apiFetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/";
});

logsUserFilter.addEventListener("change", loadLogs);
logsRefreshBtn.addEventListener("click", loadLogs);

async function init() {
  await loadDashboard();
  await loadLogs();
}

init();
