const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "etiquetasSalaMaquinas_v2";
const LOGO_KEY = "logoEmpresaEtiquetas";
let logoBase64 = localStorage.getItem(LOGO_KEY) || "";
let editingId = null;

const fields = [
  "textoEs", "textoEn", "textoDe", "showEs", "showEn", "showDe",
  "sizeSelect", "customWidth", "customHeight", "cantidad",
  "logoPosition", "logoSize", "logoBorder", "pageSize", "pageOrientation", "pageMargin", "labelGap"
];
fields.forEach(id => $(id).addEventListener("input", updatePreview));
$("sizeSelect").addEventListener("change", () => {
  $("customSize").classList.toggle("hidden", $("sizeSelect").value !== "custom");
  updatePreview();
});

$("logoInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    logoBase64 = reader.result;
    localStorage.setItem(LOGO_KEY, logoBase64);
    updatePreview();
  };
  reader.readAsDataURL(file);
});

$("removeLogo").addEventListener("click", () => {
  logoBase64 = "";
  localStorage.removeItem(LOGO_KEY);
  $("logoInput").value = "";
  updatePreview();
});

$("saveLabel").addEventListener("click", saveLabel);
$("clearForm").addEventListener("click", clearForm);
$("printCurrent").addEventListener("click", () => printLabels([getCurrentLabel()]));
$("printAll").addEventListener("click", () => {
  const labels = getSavedLabels();
  if (!labels.length) return alert("No hay etiquetas guardadas.");
  printLabels(labels);
});
$("deleteAll").addEventListener("click", () => {
  if (confirm("¿Borrar todas las etiquetas guardadas?")) {
    localStorage.removeItem(STORAGE_KEY);
    renderSavedList();
  }
});

function getSize() {
  const value = $("sizeSelect").value;
  if (value === "custom") {
    return {
      label: "Personalizado",
      width: Number($("customWidth").value) || 120,
      height: Number($("customHeight").value) || 60
    };
  }
  const [width, height] = value.split("x").map(Number);
  return { label: `${width} x ${height} mm`, width, height };
}

function getPrintOptions() {
  return {
    pageSize: $("pageSize").value,
    orientation: $("pageOrientation").value,
    margin: Math.max(0, Number($("pageMargin").value) || 0),
    gap: Math.max(0, Number($("labelGap").value) || 0)
  };
}

function getLogoOptions() {
  return {
    position: $("logoPosition").value,
    size: $("logoSize").value,
    border: $("logoBorder").checked
  };
}

function getCurrentLabel() {
  return {
    id: editingId || Date.now(),
    logo: logoBase64,
    es: $("textoEs").value.trim(),
    en: $("textoEn").value.trim(),
    de: $("textoDe").value.trim(),
    showEs: $("showEs").checked,
    showEn: $("showEn").checked,
    showDe: $("showDe").checked,
    size: getSize(),
    logoOptions: getLogoOptions(),
    printOptions: getPrintOptions(),
    quantity: Math.max(1, Number($("cantidad").value) || 1)
  };
}

function getVisibleLines(label) {
  const lines = [];
  if (label.showEs && label.es) lines.push(label.es);
  if (label.showEn && label.en) lines.push(label.en);
  if (label.showDe && label.de) lines.push(label.de);
  return lines.length ? lines : ["Texto de etiqueta"];
}

function fontSizeFor(label, print = false) {
  const lines = getVisibleLines(label);
  const longest = Math.max(...lines.map(l => l.length));
  const base = Math.min(label.size.height / Math.max(lines.length, 1) * 0.45, label.size.width / Math.max(longest, 8) * 1.8);
  const mm = Math.max(4, Math.min(13, base));
  return print ? `${(mm * 2.83).toFixed(1)}pt` : `${Math.max(18, mm * 3.7).toFixed(0)}px`;
}

function buildLabelHTML(label, print = false) {
  const lines = getVisibleLines(label);
  const opt = label.logoOptions || { position: "top", size: "medium", border: true };
  const showLogo = label.logo && opt.position !== "none";
  const borderClass = opt.border ? "with-border" : "";
  const logoBox = showLogo && opt.position !== "watermark" ? `<div class="logo-box ${borderClass}"><img src="${label.logo}" alt="Logo"></div>` : "";
  const watermark = showLogo && opt.position === "watermark" ? `<img class="logo-watermark-img" src="${label.logo}" alt="Logo">` : "";
  const textZone = `<div class="text-zone">${lines.map(t => `<div class="label-line">${escapeHtml(t)}</div>`).join("")}</div>`;
  const cls = `${print ? "print-label" : "label-preview"} label logo-${opt.position} logo-${opt.size}`;
  const sizeStyle = print ? `width:${label.size.width}mm;height:${label.size.height}mm;--print-font-size:${fontSizeFor(label, true)};` : `font-size:${fontSizeFor(label, false)};`;
  let inside = "";
  if (opt.position === "left") inside = `${logoBox}${textZone}`;
  else if (opt.position === "right") inside = `${textZone}${logoBox}`;
  else inside = `${watermark}${logoBox}${textZone}`;
  return `<div class="${cls}" style="${sizeStyle}">${inside}</div>`;
}

function updatePreview() {
  const label = getCurrentLabel();
  $("labelPreview").outerHTML = buildLabelHTML(label, false);
  const preview = document.querySelector(".label-preview");
  preview.id = "labelPreview";

  const ratio = label.size.width / label.size.height;
  const maxW = 560;
  const maxH = 340;
  let w = maxW;
  let h = w / ratio;
  if (h > maxH) { h = maxH; w = h * ratio; }
  preview.style.width = `${w}px`;
  preview.style.height = `${h}px`;
  applyGrid(preview, label, false);
}

function applyGrid(el, label, print = false) {
  const opt = label.logoOptions || { position: "top", size: "medium" };
  const hasLogo = label.logo && opt.position !== "none" && opt.position !== "watermark";
  const logoTop = opt.size === "large" ? "26%" : opt.size === "small" ? "16%" : "21%";
  const logoSide = opt.size === "large" ? "30%" : opt.size === "small" ? "18%" : "24%";

  if (hasLogo && opt.position === "left") el.style.gridTemplateColumns = `${logoSide} 1fr`;
  else if (hasLogo && opt.position === "right") el.style.gridTemplateColumns = `1fr ${logoSide}`;
  else el.style.gridTemplateColumns = "1fr";

  if (hasLogo && opt.position === "top") el.style.gridTemplateRows = `${logoTop} 1fr`;
  else el.style.gridTemplateRows = "1fr";

  const textZone = el.querySelector(".text-zone");
  if (textZone) textZone.style.gridTemplateRows = `repeat(${getVisibleLines(label).length}, 1fr)`;
}

function saveLabel() {
  const label = getCurrentLabel();
  if (!label.es && !label.en && !label.de) return alert("Escribe al menos un texto.");
  const labels = getSavedLabels();
  const index = labels.findIndex(l => l.id === label.id);
  if (index >= 0) labels[index] = label;
  else labels.push(label);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(labels));
  editingId = null;
  $("saveLabel").textContent = "Guardar etiqueta";
  renderSavedList();
  alert("Etiqueta guardada.");
}

function getSavedLabels() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function renderSavedList() {
  const labels = getSavedLabels();
  $("savedList").innerHTML = labels.length ? labels.map(label => `
    <div class="saved-card">
      <strong>${escapeHtml(label.es || label.en || label.de || "Etiqueta")}</strong>
      <small>${label.size.label} · ${label.quantity} ud.</small><br>
      <button class="btn secondary" onclick="editLabel(${label.id})">Editar</button>
      <button class="btn print auto" onclick="printLabels([getSavedLabels().find(l => l.id === ${label.id})])">Imprimir</button>
      <button class="btn danger" onclick="deleteLabel(${label.id})">Borrar</button>
    </div>
  `).join("") : "<p>No hay etiquetas guardadas todavía.</p>";
}

function editLabel(id) {
  const label = getSavedLabels().find(l => l.id === id);
  if (!label) return;
  editingId = label.id;
  logoBase64 = label.logo || logoBase64;
  $("textoEs").value = label.es || "";
  $("textoEn").value = label.en || "";
  $("textoDe").value = label.de || "";
  $("showEs").checked = label.showEs !== false;
  $("showEn").checked = label.showEn !== false;
  $("showDe").checked = label.showDe !== false;
  $("cantidad").value = label.quantity || 1;
  const standard = `${label.size.width}x${label.size.height}`;
  $("sizeSelect").value = [...$("sizeSelect").options].some(o => o.value === standard) ? standard : "custom";
  $("customWidth").value = label.size.width;
  $("customHeight").value = label.size.height;
  $("customSize").classList.toggle("hidden", $("sizeSelect").value !== "custom");
  const lo = label.logoOptions || {};
  $("logoPosition").value = lo.position || "top";
  $("logoSize").value = lo.size || "medium";
  $("logoBorder").checked = lo.border !== false;
  const po = label.printOptions || {};
  $("pageSize").value = po.pageSize || "A4";
  $("pageOrientation").value = po.orientation || "portrait";
  $("pageMargin").value = po.margin ?? 8;
  $("labelGap").value = po.gap ?? 4;
  $("saveLabel").textContent = "Actualizar etiqueta";
  updatePreview();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteLabel(id) {
  const labels = getSavedLabels().filter(l => l.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(labels));
  renderSavedList();
}

function clearForm() {
  editingId = null;
  $("textoEs").value = "";
  $("textoEn").value = "";
  $("textoDe").value = "";
  $("showEs").checked = true;
  $("showEn").checked = true;
  $("showDe").checked = true;
  $("sizeSelect").value = "120x60";
  $("cantidad").value = 1;
  $("customSize").classList.add("hidden");
  $("saveLabel").textContent = "Guardar etiqueta";
  updatePreview();
}

function printLabels(labels) {
  const valid = labels.filter(Boolean);
  if (!valid.length) return;
  const options = valid[0].printOptions || getPrintOptions();
  document.documentElement.style.setProperty("--print-page-size", options.pageSize || "A4");
  document.documentElement.style.setProperty("--print-orientation", options.orientation || "portrait");
  document.documentElement.style.setProperty("--print-margin", `${options.margin ?? 8}mm`);
  document.documentElement.style.setProperty("--print-gap", `${options.gap ?? 4}mm`);

  let html = "";
  valid.forEach(label => {
    const quantity = Math.max(1, Number(label.quantity) || 1);
    for (let i = 0; i < quantity; i++) html += buildLabelHTML(label, true);
  });
  $("printArea").innerHTML = html;
  [...$("printArea").children].forEach((el, i) => applyGrid(el, valid[Math.min(i, valid.length - 1)], true));
  setTimeout(() => window.print(), 100);
}

function escapeHtml(text) {
  return String(text).replace(/[&<>'"]/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;"
  }[c]));
}

$("textoEs").value = "Ida calefacción";
$("textoEn").value = "Heating flow";
$("textoDe").value = "Heizung Vorlauf";
updatePreview();
renderSavedList();
