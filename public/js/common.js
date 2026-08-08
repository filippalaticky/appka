/* Spoločné pomôcky pre všetky stránky: escapovanie výstupu, CSRF a ban handling.
 *
 * Celý súbor je v IIFE. Klasické <script> tagy zdieľajú jeden globálny rozsah,
 * takže bez neho by `function apiFetch` kolidovalo s `const { apiFetch }`
 * v stránkových skriptoch a tie by sa vôbec nenaparsovali.
 * Von ide výhradne window.appCommon. */
(function () {
  "use strict";

const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};

/**
 * Escapuje text pred vložením do innerHTML.
 * Toto je skutočná ochrana pred XSS - všetko, čo pochádza od používateľa
 * (email, meno v profile, user agent), musí prejsť cez toto.
 */
function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

function readCookie(name) {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function showBannedAndRedirect(message) {
  window.location.href = "/?banned=1&reason=" + encodeURIComponent(message || "Tvoj účet bol zablokovaný.");
}

/**
 * Obálka nad fetch, ktorá k zapisujúcim požiadavkám pridá CSRF token
 * a zabanovaného používateľa okamžite odhlási.
 */
async function apiFetch(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = { ...(options.headers || {}) };

  if (method !== "GET" && method !== "HEAD") {
    const csrfToken = readCookie("csrfToken");
    if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
  }

  const response = await fetch(url, { ...options, headers, credentials: "same-origin" });

  if (response.status === 403) {
    // Odpoveď sa číta z klonu, aby volajúci mohol telo prečítať znova.
    const data = await response.clone().json().catch(() => ({}));
    if (data.banned) {
      showBannedAndRedirect(data.message);
      return response;
    }
  }

  return response;
}

  window.appCommon = { escapeHtml, apiFetch, readCookie };
})();
