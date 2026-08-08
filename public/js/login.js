/* IIFE: klasické <script> tagy zdieľajú jeden globálny rozsah, takže bez neho
 * by sa deklarácie z common.js a tohto súboru navzájom prekryli a skript by
 * skončil na "Identifier has already been declared". */
(function () {
  "use strict";

const { apiFetch } = window.appCommon;

const form = document.getElementById("login-form");
const errorEl = document.getElementById("error-message");
const submitBtn = document.getElementById("submit-btn");

function showError(message) {
  // textContent, nie innerHTML - hláška môže pochádzať zo servera aj z URL.
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

/**
 * Prihlasovacie údaje nepatria do adresy - dostanú sa do histórie prehliadača
 * aj do logov servera. Keby ich tam čokoľvek dostalo, hneď sa odtiaľ odstránia.
 */
function stripCredentialsFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("email") && !params.has("password")) return;

  params.delete("email");
  params.delete("password");
  const query = params.toString();
  window.history.replaceState({}, "", window.location.pathname + (query ? `?${query}` : ""));
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
  stripCredentialsFromUrl();
  if (showBannedNotice()) return;

  const response = await fetch("/api/auth/me", { credentials: "same-origin" });
  if (!response.ok) return;
  const { user } = await response.json();
  window.location.href = user.role === "admin" ? "/admin" : "/app";
}

checkAuth();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorEl.classList.add("hidden");
  errorEl.textContent = "";

  submitBtn.disabled = true;
  submitBtn.textContent = "Prihlasujem...";

  try {
    const response = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      showError(data.message || "Prihlásenie sa nepodarilo.");
      return;
    }

    window.location.href = data.user.role === "admin" ? "/admin" : "/app";
  } catch (error) {
    showError("Server neodpovedá. Skús to o chvíľu znova.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Prihlásiť sa";
  }
});
})();
