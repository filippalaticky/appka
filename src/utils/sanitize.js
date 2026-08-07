// Vstupná sanitizácia je druhá línia obrany. Skutočnou ochranou pred XSS je
// escapovanie pri VÝSTUPE (frontend používa textContent / escapeHtml) - vstup
// sa čistí len preto, aby sa do databázy nedostal zjavne škodlivý obsah.

const HTML_TAG = /<[^>]*>/g;
const CONTROL_CHARS = /[\x00-\x1F\x7F]/g;
const DANGEROUS_SCHEME = /(javascript|data|vbscript)\s*:/gi;

/** Odstráni HTML značky, JS schémy a riadiace znaky; oreže dĺžku. */
function sanitizeText(value, maxLength = 200) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(CONTROL_CHARS, "")
    .replace(HTML_TAG, "")
    .replace(DANGEROUS_SCHEME, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

// Zámerne konzervatívny tvar - prejde bežný email, neprejde nič s HTML.
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function normalizeEmail(value) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return null;
  return email;
}

/** Číslo v rozsahu, inak null. Chráni pred NaN aj pred Infinity. */
function parseBoundedNumber(value, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    // Render posiela reťaz proxy - prvá adresa je pôvodný klient.
    return forwarded.split(",")[0].trim().slice(0, 90);
  }
  return String(req.ip || req.socket?.remoteAddress || "").slice(0, 90);
}

function userAgent(req) {
  return sanitizeText(req.get("user-agent") || "", 300);
}

module.exports = {
  sanitizeText,
  normalizeEmail,
  parseBoundedNumber,
  clientIp,
  userAgent
};
