/**
 * database/seed.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Seeds the MongoDB collection with sample medicine data for testing.
 *
 * Usage (from the database/ folder):
 *   node seed.js
 *
 * Or from the project root:
 *   node database/seed.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

require("dotenv").config({ path: require("path").join(__dirname, "../backend/.env") });
const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/medicine_detection";

// ── Minimal schema (mirrors backend/models/Medicine.js) ──────────────────────
const MedicineSchema = new mongoose.Schema(
  {
    name:         String,
    genericName:  String,
    brandNames:   [String],
    manufacturer: String,
    drugClass:    String,
    usageDescription:        String,
    usages:                  [String],
    sideEffects:             [{ severity: String, effect: String, frequency: String }],
    sideEffectsDescription:  String,
    alternatives:            [{ name: String, genericName: String, manufacturer: String, reason: String }],
    alternativesDescription: String,
    dosageInfo:              String,
    warnings:                [String],
    contraindications:       [String],
    interactions:            [String],
    sources:     { fda: Boolean, claude: Boolean },
    lastFetched: Date,
  },
  { timestamps: true }
);
const Medicine = mongoose.model("Medicine", MedicineSchema);

// ── Seed data ────────────────────────────────────────────────────────────────
const medicines = [
  {
    name: "ASPIRIN",
    genericName: "Acetylsalicylic Acid",
    brandNames: ["Bayer Aspirin", "Ecotrin", "Bufferin", "Disprin"],
    manufacturer: "Bayer AG",
    drugClass: "NSAID / Antiplatelet Agent",
    usageDescription:
      "Aspirin is a nonsteroidal anti-inflammatory drug (NSAID) used to reduce fever, pain, and inflammation. It is widely used for mild to moderate pain relief and as an antiplatelet agent to reduce the risk of heart attacks and strokes. Aspirin works by irreversibly inhibiting the cyclooxygenase (COX) enzyme, blocking the production of thromboxane A2 and prostaglandins. Low-dose aspirin is a cornerstone of cardiovascular disease prevention therapy.",
    usages: [
      "Relief of mild to moderate pain (headache, toothache, muscle aches)",
      "Reduction of fever",
      "Anti-inflammatory treatment for arthritis",
      "Prevention of blood clots",
      "Reduction of heart attack and stroke risk",
      "Post-myocardial infarction therapy",
    ],
    sideEffects: [
      { severity: "mild",     effect: "Stomach upset or heartburn",        frequency: "common (>10%)" },
      { severity: "mild",     effect: "Nausea",                            frequency: "common (>10%)" },
      { severity: "moderate", effect: "Gastrointestinal bleeding",         frequency: "uncommon (1–10%)" },
      { severity: "moderate", effect: "Tinnitus (ringing in ears)",        frequency: "uncommon (1–10%)" },
      { severity: "moderate", effect: "Prolonged bleeding time",           frequency: "common at therapeutic doses" },
      { severity: "severe",   effect: "Anaphylaxis / severe allergic reaction", frequency: "rare (<0.1%)" },
      { severity: "severe",   effect: "Reye's Syndrome (children under 16)", frequency: "rare" },
    ],
    sideEffectsDescription:
      "Common side effects involve the gastrointestinal tract. Serious reactions are rare but include severe internal bleeding and anaphylaxis. Use with food or an antacid to reduce GI irritation.",
    alternatives: [
      { name: "Ibuprofen",  genericName: "Ibuprofen",        manufacturer: "Various",  reason: "Similar NSAID with less GI irritation; preferred for inflammation" },
      { name: "Paracetamol",genericName: "Acetaminophen",    manufacturer: "Various",  reason: "Safer for the GI tract; no antiplatelet effect" },
      { name: "Naproxen",   genericName: "Naproxen Sodium",  manufacturer: "Bayer",    reason: "Longer-acting NSAID; twice-daily dosing" },
      { name: "Clopidogrel",genericName: "Clopidogrel",      manufacturer: "Sanofi",   reason: "Antiplatelet alternative for aspirin-intolerant patients" },
    ],
    alternativesDescription:
      "For pain and fever, ibuprofen or paracetamol are preferred with fewer GI side effects. For cardiovascular protection, clopidogrel is an alternative for patients who cannot tolerate aspirin.",
    dosageInfo:
      "Adults (pain/fever): 325–650 mg every 4–6 hours as needed; max 4 g/day. Cardiovascular prevention: 75–100 mg once daily. Not recommended for children under 16 without medical supervision.",
    warnings: [
      "Do not give to children or teenagers under 16 — risk of Reye's Syndrome",
      "Avoid if you have an active peptic ulcer or GI bleeding",
      "Stop use at least 7 days before surgery due to antiplatelet effect",
      "Use with caution in asthma patients — may trigger aspirin-exacerbated respiratory disease",
    ],
    contraindications: [
      "Active peptic ulcer disease",
      "Haemophilia or bleeding disorders",
      "Third trimester of pregnancy",
      "Known hypersensitivity to aspirin or NSAIDs",
    ],
    interactions: [
      "Warfarin — increased bleeding risk",
      "Methotrexate — increased toxicity",
      "Other NSAIDs — additive GI side effects",
      "ACE inhibitors — reduced antihypertensive effect",
      "Alcohol — increased GI bleeding risk",
    ],
    sources: { fda: true, claude: true },
    lastFetched: new Date(),
  },

  {
    name: "PARACETAMOL",
    genericName: "Acetaminophen",
    brandNames: ["Tylenol", "Calpol", "Panadol", "Dolo 650", "Crocin"],
    manufacturer: "McNeil Consumer Healthcare (J&J)",
    drugClass: "Analgesic / Antipyretic",
    usageDescription:
      "Paracetamol (acetaminophen) is one of the most widely used over-the-counter analgesics and antipyretics worldwide. It effectively reduces mild to moderate pain and fever by acting on the central nervous system. Unlike NSAIDs, it does not cause significant gastric irritation and has no antiplatelet effect, making it suitable for a wider range of patients including pregnant women and those with GI problems. It is the first-line treatment for pain and fever in most international guidelines.",
    usages: [
      "Headache and migraine relief",
      "Reduction of fever",
      "Mild to moderate pain relief",
      "Post-vaccination fever in infants and children",
      "Toothache and dental pain",
      "Menstrual cramps and period pain",
      "Arthritis pain (when anti-inflammatory effect is not required)",
    ],
    sideEffects: [
      { severity: "mild",     effect: "Nausea (rare at standard doses)",   frequency: "uncommon (<1%)" },
      { severity: "mild",     effect: "Skin rash or urticaria",            frequency: "rare (<1%)" },
      { severity: "moderate", effect: "Elevated liver enzymes (with regular high doses)", frequency: "uncommon" },
      { severity: "severe",   effect: "Acute liver failure (overdose)",    frequency: "rare (overdose only)" },
      { severity: "severe",   effect: "Acute kidney injury (overdose)",    frequency: "rare (overdose only)" },
    ],
    sideEffectsDescription:
      "Paracetamol is extremely well-tolerated at therapeutic doses. The most serious risk is liver damage from overdose — N-acetylcysteine is the antidote. Chronic alcohol users face higher liver toxicity risk even at standard doses.",
    alternatives: [
      { name: "Ibuprofen",  genericName: "Ibuprofen",       manufacturer: "Various", reason: "Preferred when anti-inflammatory effect is also needed" },
      { name: "Aspirin",    genericName: "Acetylsalicylic Acid", manufacturer: "Bayer", reason: "Alternative analgesic with antiplatelet properties" },
      { name: "Diclofenac", genericName: "Diclofenac Sodium",   manufacturer: "Novartis", reason: "Stronger NSAID for moderate to severe pain" },
    ],
    alternativesDescription:
      "For pain without inflammation, paracetamol is often the first choice. When inflammation is present, NSAIDs like ibuprofen are preferred but carry more GI risk.",
    dosageInfo:
      "Adults: 500–1000 mg every 4–6 hours; max 4 g/day (3 g/day in elderly or those with liver concerns). Children: 10–15 mg/kg every 4–6 hours as needed. Always follow weight-based dosing for children.",
    warnings: [
      "Do not exceed the recommended daily dose — overdose causes serious liver damage",
      "Avoid or limit alcohol consumption — increases liver toxicity risk",
      "Check all other medications for hidden paracetamol to avoid accidental overdose",
      "Reduce dose in patients with chronic liver disease or heavy alcohol use",
    ],
    contraindications: [
      "Severe hepatic (liver) impairment",
      "Known hypersensitivity to acetaminophen or any excipient",
    ],
    interactions: [
      "Warfarin (high doses of paracetamol can increase INR)",
      "Isoniazid — increased hepatotoxicity risk",
      "Alcohol — additive liver toxicity",
      "Cholestyramine — reduces paracetamol absorption",
    ],
    sources: { fda: true, claude: true },
    lastFetched: new Date(),
  },

  {
    name: "AMOXICILLIN",
    genericName: "Amoxicillin Trihydrate",
    brandNames: ["Amoxil", "Trimox", "Moxatag", "Novamox"],
    manufacturer: "GlaxoSmithKline",
    drugClass: "Aminopenicillin Antibiotic",
    usageDescription:
      "Amoxicillin is a broad-spectrum penicillin-type antibiotic that works by inhibiting bacterial cell wall synthesis, leading to bacterial cell death. It is effective against a wide range of Gram-positive and some Gram-negative bacteria. It is commonly used to treat respiratory tract infections, ear infections, urinary tract infections, skin infections, and dental infections. It must only be used for bacterial infections — it has no effect on viral infections.",
    usages: [
      "Bacterial chest and lung infections (pneumonia, bronchitis)",
      "Ear infections (otitis media)",
      "Throat infections (strep throat, tonsillitis)",
      "Urinary tract infections (UTIs)",
      "Skin and soft tissue infections",
      "Dental abscesses",
      "H. pylori eradication (in combination therapy)",
    ],
    sideEffects: [
      { severity: "mild",     effect: "Diarrhoea",                       frequency: "common (>10%)" },
      { severity: "mild",     effect: "Nausea and stomach upset",        frequency: "common (>10%)" },
      { severity: "mild",     effect: "Skin rash",                       frequency: "common (5–10%)" },
      { severity: "moderate", effect: "Oral or vaginal thrush (Candida)",frequency: "uncommon" },
      { severity: "moderate", effect: "Antibiotic-associated colitis",   frequency: "uncommon" },
      { severity: "severe",   effect: "Anaphylaxis / severe allergy",    frequency: "rare (<0.1%)" },
      { severity: "severe",   effect: "Stevens-Johnson syndrome",        frequency: "very rare" },
    ],
    sideEffectsDescription:
      "GI side effects are the most common. A rash may not always indicate allergy — inform your doctor. Severe allergic reactions require immediate emergency treatment.",
    alternatives: [
      { name: "Azithromycin",  genericName: "Azithromycin",  manufacturer: "Pfizer",   reason: "Macrolide antibiotic; used when penicillin allergy exists" },
      { name: "Cefalexin",     genericName: "Cefalexin",     manufacturer: "Various",  reason: "Cephalosporin antibiotic; alternative for skin and UTI" },
      { name: "Co-amoxiclav",  genericName: "Amoxicillin/Clavulanate", manufacturer: "GSK", reason: "Broader spectrum — includes beta-lactamase producing bacteria" },
    ],
    alternativesDescription:
      "For patients allergic to penicillin, azithromycin or cefalexin are common alternatives depending on infection type. Co-amoxiclav covers more resistant organisms.",
    dosageInfo:
      "Adults: 250–500 mg every 8 hours or 500–875 mg every 12 hours, depending on severity. Children: 25–45 mg/kg/day in divided doses. Complete the full course even if symptoms improve.",
    warnings: [
      "Complete the full course — stopping early contributes to antibiotic resistance",
      "Tell your doctor about any penicillin or antibiotic allergies before taking",
      "Not effective against viral infections (colds, flu)",
      "May reduce effectiveness of oral contraceptive pills",
    ],
    contraindications: [
      "Known allergy to penicillin or cephalosporin antibiotics",
      "History of amoxicillin-associated jaundice or hepatic dysfunction",
    ],
    interactions: [
      "Warfarin — may increase anticoagulant effect",
      "Methotrexate — reduced renal clearance",
      "Oral contraceptives — reduced efficacy reported",
      "Allopurinol — increased risk of allergic skin rash",
    ],
    sources: { fda: true, claude: true },
    lastFetched: new Date(),
  },
];

/* ── Run seeder ──────────────────────────────────────────────────────────── */
const seed = async () => {
  console.log("\n🌱  MediScan Database Seeder");
  console.log("─".repeat(40));

  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`✅  Connected to MongoDB: ${MONGODB_URI}`);

    await Medicine.deleteMany({});
    console.log("🗑️   Cleared existing medicine records");

    const inserted = await Medicine.insertMany(medicines);
    console.log(`✅  Seeded ${inserted.length} medicines:\n`);
    inserted.forEach((m) => console.log(`     • ${m.name} (${m.genericName})`));

    console.log("\n─".repeat(40));
    console.log("✅  Seeding complete. Start the backend with: npm run dev\n");
  } catch (err) {
    console.error("\n❌  Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
};

seed();
