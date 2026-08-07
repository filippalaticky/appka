const { apiFetch } = window.appCommon;

const form = document.getElementById("login-form");
const errorEl = document.getElementById("error-message");
const modeLoginBtn = document.getElementById("mode-login");
const modeRegisterBtn = document.getElementById("mode-register");
const submitBtn = document.getElementById("submit-btn");

let mode = "login";

function renderMode() {
  const activeClasses = ["border-teal-400", "text-teal-200"];
  const inactiveClasses = ["border-slate-500", "text-slate-200"];

  modeLoginBtn.classList.remove(...activeClasses, ...inactiveClasses);
  modeRegisterBtn.classList.remove(...activeClasses, ...inactiveClasses);

  if (mode === "login") {
    modeLoginBtn.classList.add(...activeClasses);
    modeRegisterBtn.classList.add(...inactiveClasses);
    submitBtn.textContent = "Prihlásiť sa";
  } else {
    modeRegisterBtn.classList.add(...activeClasses);
    modeLoginBtn.classList.add(...inactiveClasses);
    submitBtn.textContent = "Vytvoriť účet";
  }
}

function showError(message) {
  // textContent, nie innerHTML - hláška môže pochádzať zo servera aj z URL.
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

/** Po odhlásení kvôli banu sa dôvod prenáša v URL. */
function showBannedNotice() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("banned") !== "1") return false;
  showError(params.get("reason") || "Tvoj účet bol zablokovaný.");
  window.history.replaceState({}, "", window.location.pathname);
  return true;
}

async function checkAuth() {
  if (showBannedNotice()) return;

  const response = await fetch("/api/auth/me", { credentials: "same-origin" });
  if (!response.ok) return;
  const { user } = await response.json();
  if (user.role === "admin") {
    window.location.href = "/admin";
    return;
  }
  window.location.href = "/app";
}

checkAuth();
renderMode();

modeLoginBtn.addEventListener("click", () => {
  mode = "login";
  renderMode();
});

modeRegisterBtn.addEventListener("click", () => {
  mode = "register";
  renderMode();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorEl.classList.add("hidden");
  errorEl.textContent = "";

  const payload = {
    email: document.getElementById("email").value,
    password: document.getElementById("password").value
  };

  const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
  const response = await apiFetch(endpoint, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    showError(data.message || "Operácia sa nepodarila.");
    return;
  }

  if (data.user.role === "admin") {
    window.location.href = "/admin";
    return;
  }
  window.location.href = "/app";
});
