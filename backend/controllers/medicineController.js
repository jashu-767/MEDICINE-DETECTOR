// backend/controllers/medicineController.js
// Core business logic: search by name, search by image, history, medicine list

const Medicine = require("../models/Medicine");
const SearchHistory = require("../models/SearchHistory");
const { fetchFDADataWithFallback } = require("../config/fdaService");
const {
  getMedicineInfoFromClaude,
  getMedicineInfoFromImage,
} = require("../config/claudeService");

// ── Helper: intelligently merge FDA + Claude data ─────────────────────────────
const mergeData = (fdaData, claudeData) => {
  if (!fdaData && !claudeData) return null;
  if (!fdaData) return { ...claudeData, sources: { fda: false, claude: true } };
  if (!claudeData) return { ...fdaData, sources: { fda: true, claude: false } };

  return {
    // Identity: prefer FDA (more authoritative for factual fields)
    name:         fdaData.name        || claudeData.name,
    genericName:  fdaData.genericName || claudeData.genericName,
    brandNames:   [...new Set([...(fdaData.brandNames || []), ...(claudeData.brandNames || [])])],
    manufacturer: fdaData.manufacturer || claudeData.manufacturer,
    drugClass:    fdaData.drugClass    || claudeData.drugClass,

    // Usages: combine and deduplicate both sources
    usages: [...new Set([...(fdaData.usages || []), ...(claudeData.usages || [])])].slice(0, 10),
    usageDescription: claudeData.usageDescription || fdaData.usageDescription,

    // Side effects: prefer Claude's structured + severity-annotated list
    sideEffects: claudeData.sideEffects?.length
      ? claudeData.sideEffects
      : fdaData.sideEffects || [],
    sideEffectsDescription:
      claudeData.sideEffectsDescription || fdaData.sideEffectsDescription,

    // Alternatives: entirely from Claude (FDA doesn't provide this)
    alternatives:            claudeData.alternatives || [],
    alternativesDescription: claudeData.alternativesDescription || null,

    // Safety: merge both, deduplicate
    dosageInfo: fdaData.dosageInfo || claudeData.dosageInfo,
    warnings: [
      ...new Set([...(fdaData.warnings || []), ...(claudeData.warnings || [])]),
    ].slice(0, 8),
    contraindications: [
      ...new Set([
        ...(fdaData.contraindications || []),
        ...(claudeData.contraindications || []),
      ]),
    ].slice(0, 6),
    interactions: claudeData.interactions || [],

    sources: { fda: true, claude: true },
  };
};

// ── Helper: upsert medicine into MongoDB ──────────────────────────────────────
const upsertMedicine = async (data) => {
  const filter = { name: new RegExp(`^${data.name}$`, "i") };
  return Medicine.findOneAndUpdate(
    filter,
    { ...data, lastFetched: new Date() },
    { upsert: true, new: true, runValidators: true }
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/search   { name: "aspirin" }
// ─────────────────────────────────────────────────────────────────────────────
exports.searchByName = async (req, res) => {
  const startTime = Date.now();
  const { name }  = req.body;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid medicine name (at least 2 characters).",
    });
  }

  const medicineName = name.trim();

  try {
    // 1. Check MongoDB cache first
    const cached = await Medicine.findOne({
      name: new RegExp(`^${medicineName}$`, "i"),
    });
    if (cached && !cached.isStale) {
      await SearchHistory.create({
        query:         medicineName,
        medicineName:  cached.name,
        medicineId:    cached._id,
        success:       true,
        responseTimeMs: Date.now() - startTime,
        ipAddress:     req.ip,
      });
      return res.json({ success: true, data: cached, source: "cache" });
    }

    // 2. Fetch from OpenFDA
    console.log(`🔍 Fetching FDA data for: ${medicineName}`);
    const fdaData = await fetchFDADataWithFallback(medicineName);

    // 3. Fetch from Claude AI (passes FDA data as context for accuracy)
    console.log(`🤖 Fetching Claude data for: ${medicineName}`);
    const claudeData = await getMedicineInfoFromClaude(medicineName, fdaData);

    // 4. Merge both sources
    const merged = mergeData(fdaData, claudeData);
    if (!merged) {
      return res.status(404).json({
        success: false,
        message: `No information found for "${medicineName}". Please check the spelling and try again.`,
      });
    }

    // 5. Save to MongoDB
    const medicine = await upsertMedicine(merged);

    await SearchHistory.create({
      query:         medicineName,
      medicineName:  medicine.name,
      medicineId:    medicine._id,
      success:       true,
      responseTimeMs: Date.now() - startTime,
      ipAddress:     req.ip,
    });

    return res.json({ success: true, data: medicine, source: "live" });
  } catch (err) {
    console.error("searchByName error:", err);
    await SearchHistory.create({
      query:         medicineName,
      success:       false,
      errorMessage:  err.message,
      responseTimeMs: Date.now() - startTime,
      ipAddress:     req.ip,
    }).catch(() => {});
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while fetching medicine information. Please try again.",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/search/image   multipart form with field "image"
// ─────────────────────────────────────────────────────────────────────────────
exports.searchByImage = async (req, res) => {
  const startTime = Date.now();

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please upload an image of the medicine.",
    });
  }

  try {
    const base64Image = req.file.buffer.toString("base64");
    const mimeType    = req.file.mimetype;

    // 1. Claude Vision identifies the medicine from the image
    console.log("🖼️  Analysing medicine image with Claude Vision...");
    const claudeData = await getMedicineInfoFromImage(base64Image, mimeType);

    if (!claudeData.identifiedName) {
      return res.status(404).json({
        success: false,
        message:
          "Could not identify any medicine in this image. Please ensure the medicine name or imprint is clearly visible.",
      });
    }

    console.log(
      `✅ Identified: ${claudeData.identifiedName} (confidence: ${claudeData.confidence})`
    );

    // 2. Cross-verify with FDA using the identified name
    const fdaData = await fetchFDADataWithFallback(claudeData.identifiedName);

    // 3. Merge & save
    const merged = mergeData(fdaData, claudeData);
    merged.name  = merged.name || claudeData.identifiedName.toUpperCase();
    const medicine = await upsertMedicine(merged);

    await SearchHistory.create({
      query:         `[IMAGE] ${claudeData.identifiedName}`,
      imageSearch:   true,
      medicineName:  medicine.name,
      medicineId:    medicine._id,
      success:       true,
      responseTimeMs: Date.now() - startTime,
      ipAddress:     req.ip,
    });

    return res.json({
      success: true,
      data:    medicine,
      imageAnalysis: {
        identifiedName:       claudeData.identifiedName,
        confidence:           claudeData.confidence,
        identificationMethod: claudeData.identificationMethod,
      },
      source: "image",
    });
  } catch (err) {
    console.error("searchByImage error:", err);
    return res.status(500).json({
      success: false,
      message:
        "Image analysis failed. Please try again with a clearer image.",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/history
// ─────────────────────────────────────────────────────────────────────────────
exports.getHistory = async (req, res) => {
  try {
    const history = await SearchHistory.find({ success: true })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("query medicineName imageSearch createdAt");
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not fetch history." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/medicines   (for autocomplete)
// ─────────────────────────────────────────────────────────────────────────────
exports.getMedicineList = async (req, res) => {
  try {
    const medicines = await Medicine.find({})
      .select("name genericName drugClass")
      .sort({ name: 1 })
      .limit(100);
    res.json({ success: true, data: medicines });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Could not fetch medicine list." });
  }
};
