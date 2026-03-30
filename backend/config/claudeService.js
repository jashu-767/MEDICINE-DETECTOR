// backend/config/claudeService.js
// Groq AI integration — free, fast, no credit card needed

const Groq = require("groq-sdk");

let client;
const getClient = () => {
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
};

const buildTextPrompt = (medicineName, fdaContext = null) => {
  const fdaSection = fdaContext
    ? `\n\nFDA DATA ALREADY RETRIEVED (use this, do NOT contradict it):\n${JSON.stringify(fdaContext, null, 2)}`
    : "";

  return `You are an expert medical information assistant with comprehensive knowledge of ALL medicines worldwide including Indian brands (Dolo, Crocin, Combiflam, Pan-D, Ecosprin), generic drugs, OTC medicines, vitamins, supplements and combination drugs.

Medicine asked: "${medicineName}".${fdaSection}

RULES:
1. If name is misspelled, identify the closest medicine and answer for it.
2. If it is an Indian brand, identify active ingredients (Dolo 650 = Paracetamol, Combiflam = Ibuprofen+Paracetamol).
3. NEVER refuse — always give best available information.
4. For combination drugs, list all active ingredients in genericName.

Return ONLY valid JSON (absolutely no markdown, no code blocks, no extra text):
{
  "name": "MEDICINE NAME IN UPPERCASE",
  "genericName": "active ingredient(s)",
  "brandNames": ["brand1", "brand2", "brand3"],
  "manufacturer": "company or null",
  "drugClass": "pharmacological class",
  "usageDescription": "4-6 sentence paragraph about what it treats and how it works in the body including mechanism of action",
  "usages": ["use1","use2","use3","use4","use5","use6","use7"],
  "sideEffects": [
    {"severity":"mild",     "effect":"effect name","frequency":"common (>10%)"},
    {"severity":"mild",     "effect":"effect name","frequency":"common (>10%)"},
    {"severity":"mild",     "effect":"effect name","frequency":"common (>10%)"},
    {"severity":"moderate", "effect":"effect name","frequency":"uncommon (1-10%)"},
    {"severity":"moderate", "effect":"effect name","frequency":"uncommon (1-10%)"},
    {"severity":"severe",   "effect":"effect name","frequency":"rare (<1%)"},
    {"severity":"severe",   "effect":"effect name","frequency":"rare (<1%)"}
  ],
  "sideEffectsDescription": "detailed paragraph about side effects and when to seek medical attention",
  "alternatives": [
    {"name":"Alt1","genericName":"generic","manufacturer":"company","reason":"specific reason"},
    {"name":"Alt2","genericName":"generic","manufacturer":"company","reason":"specific reason"},
    {"name":"Alt3","genericName":"generic","manufacturer":"company","reason":"specific reason"},
    {"name":"Alt4","genericName":"generic","manufacturer":"company","reason":"specific reason"}
  ],
  "alternativesDescription": "paragraph explaining when and why to consider these alternatives",
  "dosageInfo": "detailed dosage for adults and children with frequency and maximum dose",
  "warnings": ["w1","w2","w3","w4","w5"],
  "contraindications": ["c1","c2","c3"],
  "interactions": ["i1","i2","i3","i4","i5"]
}`;
};

const buildImagePrompt = () => {
  return `You are a medical AI expert in medicine identification. Analyse the described medicine image carefully.

Return ONLY valid JSON (no markdown, no code blocks, no extra text):
{
  "identifiedName": "medicine name or null if unidentifiable",
  "confidence": "high|medium|low",
  "identificationMethod": "how you identified it",
  "name": "UPPERCASE NAME",
  "genericName": "active ingredient(s)",
  "brandNames": ["brand1", "brand2"],
  "manufacturer": "company or null",
  "drugClass": "pharmacological class",
  "usageDescription": "4-6 sentence description of what it treats and how it works",
  "usages": ["use1","use2","use3","use4","use5","use6"],
  "sideEffects": [
    {"severity":"mild",    "effect":"effect","frequency":"common (>10%)"},
    {"severity":"mild",    "effect":"effect","frequency":"common (>10%)"},
    {"severity":"moderate","effect":"effect","frequency":"uncommon (1-10%)"},
    {"severity":"moderate","effect":"effect","frequency":"uncommon (1-10%)"},
    {"severity":"severe",  "effect":"effect","frequency":"rare (<1%)"},
    {"severity":"severe",  "effect":"effect","frequency":"rare (<1%)"}
  ],
  "sideEffectsDescription": "paragraph about side effects",
  "alternatives": [
    {"name":"Alt1","genericName":"g","manufacturer":"c","reason":"reason"},
    {"name":"Alt2","genericName":"g","manufacturer":"c","reason":"reason"},
    {"name":"Alt3","genericName":"g","manufacturer":"c","reason":"reason"}
  ],
  "alternativesDescription": "paragraph about alternatives",
  "dosageInfo": "dosage info for adults and children",
  "warnings": ["w1","w2","w3","w4"],
  "contraindications": ["c1","c2","c3"],
  "interactions": ["i1","i2","i3","i4"]
}`;
};

const getMedicineInfoFromClaude = async (medicineName, fdaData = null) => {
  try {
    const completion = await getClient().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a medical information assistant. Always respond with valid JSON only. No markdown, no code blocks, no extra text.",
        },
        {
          role: "user",
          content: buildTextPrompt(medicineName, fdaData),
        },
      ],
      temperature: 0.3,
      max_tokens: 2500,
    });

    const text = completion.choices[0]?.message?.content || "";
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("Groq text error:", err.message);
    throw err;
  }
};

const getMedicineInfoFromImage = async (base64Image, mimeType = "image/jpeg", fdaData = null) => {
  try {
    // Groq supports vision with llama-4 scout model
    const completion = await getClient().chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildImagePrompt(),
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 2500,
    });

    const text = completion.choices[0]?.message?.content || "";
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("Groq image error:", err.message);
    throw err;
  }
};

module.exports = { getMedicineInfoFromClaude, getMedicineInfoFromImage };