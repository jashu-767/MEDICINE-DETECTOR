// backend/config/fdaService.js
// Fetches drug information from the OpenFDA API

const axios = require("axios");

const FDA_BASE = process.env.FDA_API_BASE_URL || "https://api.fda.gov/drug";

/**
 * Query OpenFDA drug label endpoint by brand or generic name.
 * Returns structured data or null if not found.
 */
const fetchFDAData = async (medicineName) => {
  try {
    const query = encodeURIComponent(
      `openfda.brand_name:"${medicineName}" OR openfda.generic_name:"${medicineName}"`
    );
    const url = `${FDA_BASE}/label.json?search=${query}&limit=1`;
    const { data } = await axios.get(url, { timeout: 8000 });
    const result = data?.results?.[0];
    if (!result) return null;

    const openfda = result.openfda || {};
    const extract = (field) =>
      Array.isArray(result[field]) ? result[field][0] : result[field] || null;

    // Parse a raw FDA text block into a clean string array
    const listFromText = (text) => {
      if (!text) return [];
      return text
        .split(/\n|•|\d+\.\s/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10)
        .slice(0, 8);
    };

    return {
      name: (openfda.brand_name?.[0] || medicineName).toUpperCase(),
      genericName: openfda.generic_name?.[0] || null,
      brandNames: openfda.brand_name || [],
      manufacturer: openfda.manufacturer_name?.[0] || null,
      drugClass: openfda.pharm_class_epc?.[0] || null,

      usages: listFromText(extract("indications_and_usage")),
      usageDescription: extract("indications_and_usage"),

      sideEffects: listFromText(extract("adverse_reactions")).map((e) => ({
        severity: "mild",
        effect: e,
        frequency: null,
      })),
      sideEffectsDescription: extract("adverse_reactions"),

      warnings: listFromText(
        extract("warnings_and_cautions") || extract("warnings")
      ),
      contraindications: listFromText(extract("contraindications")),
      dosageInfo: extract("dosage_and_administration"),

      sources: { fda: true, claude: false },
    };
  } catch (err) {
    if (err.response?.status === 404) return null;
    console.error("FDA API error:", err.message);
    return null;
  }
};

/**
 * Try multiple search strategies until one succeeds.
 */
const fetchFDADataWithFallback = async (medicineName) => {
  // Strategy 1: exact brand/generic match
  let result = await fetchFDAData(medicineName);
  if (result) return result;

  // Strategy 2: broader full-text search
  try {
    const query = encodeURIComponent(medicineName);
    const url = `${FDA_BASE}/label.json?search=${query}&limit=1`;
    const { data } = await axios.get(url, { timeout: 8000 });
    const raw = data?.results?.[0];
    if (raw) {
      const name =
        raw.openfda?.brand_name?.[0] ||
        raw.openfda?.generic_name?.[0] ||
        medicineName;
      result = await fetchFDAData(name);
      if (result) return result;
    }
  } catch (_) {}

  return null;
};

module.exports = { fetchFDAData, fetchFDADataWithFallback };
