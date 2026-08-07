const { apiFetch } = window.appCommon;

const form = document.getElementById("login-form");
const errorEl = document.getElementById("error-message");
const modeLoginBtn = document.getElementById("mode-login");
const modeRegisterBtn = document.getElementById("mode-register");
const submitBtn = document.getElementById("submit-btn");
const modeHint = document.getElementById("mode-hint");

let mode = "login";

function renderMode() {
  const isLogin = mode === "login";

  // Vlastné triedy namiesto Tailwind utilít - farba aktívnej záložky tak
  // nezávisí od poradia štýlov a je na tmavom pozadí jednoznačne vidieť.
  modeLoginBtn.classList.toggle("is-active", isLogin);
  modeLoginBtn.classList.toggle("is-inactive", !isLogin);
  modeRegisterBtn.classList.toggle("is-active", !isLogin);
  modeRegisterBtn.classList.toggle("is-inactive", isLogin);

  submitBtn.textContent = isLogin ? "Prihlásiť sa" : "Vytvoriť účet";
  modeHint.textContent = isLogin
    ? "Prihlás sa existujúcim účtom."
    : "Vytvor si nový účet. Heslo musí mať aspoň 8 znakov.";

  errorEl.classList.add("hidden");
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
