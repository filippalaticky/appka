/**
 * Alergie a intolerancie.
 *
 * Kľúč je zároveň hodnotou checkboxu vo formulári aj tým, čo sa ukladá do
 * profiles.allergies. Jedna surovina môže mať viac alergénov (napr. cestoviny
 * majú lepok), a jedlo sa vyradí, ak obsahuje čo i len jednu zakázanú surovinu.
 */
const ALLERGY_OPTIONS = [
  { key: "laktoza", label: "Laktózová intolerancia" },
  { key: "lepok", label: "Bezlepková diéta" },
  { key: "orechy", label: "Alergia na orechy" },
  { key: "ryby", label: "Alergia na ryby" },
  { key: "vajcia", label: "Alergia na vajcia" },
  { key: "soja", label: "Alergia na sóju" },
  { key: "citrusy", label: "Alergia na citrusy" }
];

const ALLERGY_KEYS = ALLERGY_OPTIONS.map((option) => option.key);
const ALLERGY_KEY_SET = new Set(ALLERGY_KEYS);

/** Zo vstupu spraví čistý zoznam známych kľúčov bez duplicít. */
function normalizeAllergies(value) {
  if (!Array.isArray(value)) return [];

  const unique = new Set();
  for (const item of value) {
    if (typeof item !== "string") continue;
    const key = item.trim().toLowerCase();
    if (ALLERGY_KEY_SET.has(key)) unique.add(key);
  }

  // Poradie podľa ALLERGY_OPTIONS, aby bol zápis v databáze stabilný.
  return ALLERGY_KEYS.filter((key) => unique.has(key));
}

/** Profil z databázy môže mať NULL aj text - obe treba zvládnuť. */
function parseStoredAllergies(stored) {
  if (!stored) return [];
  if (Array.isArray(stored)) return normalizeAllergies(stored);
  if (typeof stored === "string") {
    try {
      return normalizeAllergies(JSON.parse(stored));
    } catch (error) {
      return [];
    }
  }
  return [];
}

module.exports = {
  ALLERGY_OPTIONS,
  ALLERGY_KEYS,
  normalizeAllergies,
  parseStoredAllergies
};
