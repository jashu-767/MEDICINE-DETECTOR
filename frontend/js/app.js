/* ─────────────────────────────────────────────────────────────────────────────
   MediScan — frontend/js/app.js
   All UI interactions, API calls, and DOM rendering.
───────────────────────────────────────────────────────────────────────────── */

const API_BASE = "http://localhost:5000/api";

/* ── State ───────────────────────────────────────────────────────────────── */
let selectedImageFile = null;
let cachedMedicines   = [];

/* ── Boot ────────────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  loadHistory();
  loadMedicineList();
  setupDragDrop();
  setupAutocomplete();
  setupEnterKey();
});

/* ═══════════════════════════════════════════════════════════════════════════
   TAB SWITCHING
═══════════════════════════════════════════════════════════════════════════ */
function switchTab(tabName) {
  document.querySelectorAll(".tab").forEach((t) =>
    t.classList.toggle("active", t.dataset.tab === tabName)
  );
  document.querySelectorAll(".tab-panel").forEach((p) =>
    p.classList.toggle("active", p.id === `tab-${tabName}`)
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   RESULT SECTION TABS
═══════════════════════════════════════════════════════════════════════════ */
function showSection(name, btn) {
  document.querySelectorAll(".rtab").forEach((t) => t.classList.remove("active"));
  document.querySelectorAll(".result-section").forEach((s) => s.classList.remove("active"));
  if (btn) btn.classList.add("active");
  const sec = document.getElementById(`sec-${name}`);
  if (sec) sec.classList.add("active");
}

/* ═══════════════════════════════════════════════════════════════════════════
   KEYBOARD — Enter to search
═══════════════════════════════════════════════════════════════════════════ */
function setupEnterKey() {
  document.getElementById("medicine-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      document.getElementById("autocomplete").innerHTML = "";
      searchByName();
    }
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   AUTOCOMPLETE
═══════════════════════════════════════════════════════════════════════════ */
function setupAutocomplete() {
  const input = document.getElementById("medicine-input");
  const list  = document.getElementById("autocomplete");

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    list.innerHTML = "";
    if (q.length < 2 || !cachedMedicines.length) return;

    const matches = cachedMedicines
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.genericName || "").toLowerCase().includes(q)
      )
      .slice(0, 6);

    matches.forEach((m) => {
      const item = document.createElement("div");
      item.className = "ac-item";
      item.innerHTML = `${m.name}<small>${m.genericName || ""}${
        m.drugClass ? " · " + m.drugClass : ""
      }</small>`;
      item.addEventListener("mousedown", (e) => {
        e.preventDefault(); // prevent blur before click registers
        input.value = m.name;
        list.innerHTML = "";
        searchByName();
      });
      list.appendChild(item);
    });
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".input-wrap")) list.innerHTML = "";
  });
}

async function loadMedicineList() {
  try {
    const res  = await fetch(`${API_BASE}/medicines`);
    const data = await res.json();
    if (data.success) cachedMedicines = data.data;
  } catch (_) {
    /* silently ignore — autocomplete is a nice-to-have */
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   IMAGE UPLOAD
═══════════════════════════════════════════════════════════════════════════ */
function handleImageSelect(event) {
  const file = event.target.files[0];
  if (file) setImageFile(file);
}

function setImageFile(file) {
  selectedImageFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById("image-preview");
    const content = document.getElementById("upload-content");
    preview.src = e.target.result;
    preview.classList.remove("hidden");
    content.classList.add("hidden");
  };
  reader.readAsDataURL(file);

  document.getElementById("btn-image-search").disabled = false;
}

function setupDragDrop() {
  const zone = document.getElementById("upload-zone");

  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.classList.add("dragover");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("dragover");
    const file = e.dataTransfer?.files[0];
    if (file && file.type.startsWith("image/")) setImageFile(file);
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   UI STATE HELPERS
═══════════════════════════════════════════════════════════════════════════ */
function showLoader(message) {
  setText("loader-text", message);
  show("loader");
  hide("results");
  hide("error-card");
  hide("identify-banner");
}

function hideLoader() { hide("loader"); }

function showError(message) {
  hideLoader();
  setText("error-msg", message);
  show("error-card");
}

function clearError() { hide("error-card"); }

function show(id) { document.getElementById(id)?.classList.remove("hidden"); }
function hide(id) { document.getElementById(id)?.classList.add("hidden"); }
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SEARCH BY NAME
═══════════════════════════════════════════════════════════════════════════ */
async function searchByName() {
  const name = document.getElementById("medicine-input").value.trim();
  if (!name) { showError("Please enter a medicine name."); return; }

  showLoader("Querying FDA database…");

  // Update loader message after a short delay
  const loaderTimer = setTimeout(() => {
    setText("loader-text", "Analysing with Claude AI…");
  }, 2800);

  try {
    const res = await fetch(`${API_BASE}/search`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name }),
    });
    clearTimeout(loaderTimer);
    const data = await res.json();

    hideLoader();

    if (!data.success) {
      showError(data.message || "No information found for this medicine.");
      return;
    }

    renderResult(data.data, data.source);
    loadHistory();
    loadMedicineList();
  } catch (_) {
    clearTimeout(loaderTimer);
    showError(
      "Cannot connect to the server. Please make sure the backend is running on port 5000."
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   SEARCH BY IMAGE
═══════════════════════════════════════════════════════════════════════════ */
async function searchByImage() {
  if (!selectedImageFile) {
    showError("Please select an image first.");
    return;
  }

  showLoader("Identifying medicine from image…");

  const loaderTimer = setTimeout(() => {
    setText("loader-text", "Cross-verifying with FDA database…");
  }, 3200);

  try {
    const formData = new FormData();
    formData.append("image", selectedImageFile);

    const res = await fetch(`${API_BASE}/search/image`, {
      method: "POST",
      body:   formData,
    });
    clearTimeout(loaderTimer);
    const data = await res.json();

    hideLoader();

    if (!data.success) {
      showError(data.message || "Could not identify the medicine in this image.");
      return;
    }

    // Show identification banner
    if (data.imageAnalysis) {
      const { identifiedName, confidence } = data.imageAnalysis;
      setText("identify-name", identifiedName);
      setText("identify-conf", confidence + " confidence");
      show("identify-banner");
    }

    renderResult(data.data, data.source);
    loadHistory();
  } catch (_) {
    clearTimeout(loaderTimer);
    showError(
      "Cannot connect to the server. Please make sure the backend is running on port 5000."
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   RENDER RESULT
═══════════════════════════════════════════════════════════════════════════ */
function renderResult(medicine, source) {
  /* ── Hero ── */
  setText("res-name",    medicine.name    || "Unknown Medicine");
  setText("res-class",   medicine.drugClass || "");
  setText("res-generic", medicine.genericName ? `Generic: ${medicine.genericName}` : "");
  setText("hero-mfr",    medicine.manufacturer ? `Manufacturer: ${medicine.manufacturer}` : "");

  // Brand name tags
  document.getElementById("hero-brands").innerHTML = (medicine.brandNames || [])
    .slice(0, 5)
    .map((b) => `<span class="brand-tag">${b}</span>`)
    .join("");

  // Source dots
  const dots = [];
  if (source === "cache")      dots.push('<span class="source-dot dot-cache">Cached</span>');
  if (medicine.sources?.fda)   dots.push('<span class="source-dot dot-fda">OpenFDA</span>');
  if (medicine.sources?.claude)dots.push('<span class="source-dot dot-claude">Claude AI</span>');
  document.getElementById("source-dots").innerHTML = dots.join("");

  /* ── Usage section ── */
  setText("usage-desc", medicine.usageDescription || "");
  document.getElementById("usage-list").innerHTML = (medicine.usages || [])
    .map((u) => `<li>${escHtml(u)}</li>`)
    .join("");

  /* ── Side effects section ── */
  setText("se-desc", medicine.sideEffectsDescription || "");
  document.getElementById("se-grid").innerHTML = (medicine.sideEffects || [])
    .map(
      (se) => `
      <div class="se-card ${se.severity || "mild"}">
        <div class="se-sev">${se.severity || "mild"}</div>
        <div class="se-effect">${escHtml(se.effect)}</div>
        ${se.frequency ? `<div class="se-freq">${escHtml(se.frequency)}</div>` : ""}
      </div>`
    )
    .join("");

  /* ── Alternatives section ── */
  setText("alt-desc", medicine.alternativesDescription || "");
  document.getElementById("alt-grid").innerHTML = (medicine.alternatives || [])
    .map(
      (alt) => `
      <div class="alt-card">
        <div class="alt-name">${escHtml(alt.name)}</div>
        <div class="alt-generic">${escHtml(alt.genericName || "")}</div>
        ${alt.reason ? `<span class="alt-reason">${escHtml(alt.reason)}</span>` : ""}
        ${alt.manufacturer ? `<div class="alt-mfr">${escHtml(alt.manufacturer)}</div>` : ""}
      </div>`
    )
    .join("");

  /* ── Safety section ── */
  const renderSafetyList = (elId, items) => {
    document.getElementById(elId).innerHTML =
      (items || []).length
        ? items.map((i) => `<li>${escHtml(i)}</li>`).join("")
        : "<li>No information available.</li>";
  };

  renderSafetyList("warnings-list",  medicine.warnings);
  renderSafetyList("contra-list",    medicine.contraindications);
  renderSafetyList("interact-list",  medicine.interactions);

  const dosageBlock = document.getElementById("dosage-block");
  if (medicine.dosageInfo) {
    setText("dosage-text", medicine.dosageInfo);
    dosageBlock.style.display = "";
  } else {
    dosageBlock.style.display = "none";
  }

  /* ── Reset tabs to first tab ── */
  document.querySelectorAll(".rtab").forEach((t, i) =>
    t.classList.toggle("active", i === 0)
  );
  document.querySelectorAll(".result-section").forEach((s, i) =>
    s.classList.toggle("active", i === 0)
  );

  /* ── Show results and scroll ── */
  show("results");
  setTimeout(() => {
    document.getElementById("results").scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 50);
}

/* ═══════════════════════════════════════════════════════════════════════════
   RECENT SEARCH HISTORY
═══════════════════════════════════════════════════════════════════════════ */
async function loadHistory() {
  try {
    const res  = await fetch(`${API_BASE}/history`);
    const data = await res.json();

    const section = document.getElementById("history-section");
    const listEl  = document.getElementById("history-list");

    if (!data.success || !data.data.length) {
      section.style.display = "none";
      return;
    }

    // Deduplicate by medicineName, keep the most recent 10
    const seen   = new Set();
    const unique = data.data.filter((h) => {
      const key = h.medicineName || h.query;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 10);

    listEl.innerHTML = unique
      .map(
        (h) => `
      <span
        class="history-chip"
        onclick="quickSearch('${escAttr(h.medicineName || h.query)}')"
        title="Search ${escAttr(h.medicineName || h.query)}"
      >
        ${h.imageSearch ? '<span class="chip-img">⊞</span>' : ""}
        ${escHtml(h.medicineName || h.query)}
      </span>`
      )
      .join("");

    section.style.display = "block";
  } catch (_) {
    /* silently ignore */
  }
}

function quickSearch(name) {
  switchTab("text");
  document.getElementById("medicine-input").value = name;
  document.getElementById("autocomplete").innerHTML = "";
  searchByName();
}

/* ═══════════════════════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════════════════════ */
function escHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escAttr(str) {
  if (!str) return "";
  return String(str).replace(/'/g, "\\'").replace(/"/g, "&quot;");
}
