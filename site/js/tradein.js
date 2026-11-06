/* Estimarea mașinii tale + formularul de evaluare cu poze. */

let tradeFiles = [];
const mb = b => b < 1048576 ? Math.max(1, Math.round(b / 1024)) + " KB" : (b / 1048576).toFixed(1).replace(".", ",") + " MB";

function tradeEstimate() {
  const t = TRADEIN, f = $("#buyback");
  const Y = +f.an.value, K = +f.kilometri.value || 0, age = new Date().getFullYear() - Y;
  const base = t.baza * t.segment[f.segment.value] * t.caroserie[f.caroserie.value];
  let v = base * Math.pow(t.depreciereAnuala, age)
    * (1 - Math.min(0.35, Math.max(0, (K - age * t.kmPeAn) / 100000 * 0.08)))
    * t.stare[f.stare.value] * t.combustibil[f.combustibil.value];
  v = Math.max(t.minim, v);
  const lo = Math.round(v * (1 - t.marja) / 100) * 100, hi = Math.round(v * (1 + t.marja) / 100) * 100;
  return `${n(lo)} – ${n(hi)} €`;
}
function renderTrade() {
  const s = tradeEstimate();
  $("#tV").textContent = s;
  $("#tEst").value = s;
}

/* ---------- poze ---------- */
const isImg = f => UPLOAD.types.includes(f.type) || /\.(jpe?g|png)$/i.test(f.name);
const totalBytes = () => tradeFiles.reduce((s, f) => s + f.size, 0);

function addFiles(list) {
  const errs = [];
  for (const f of list) {
    if (!isImg(f)) { errs.push(`„${f.name}” nu e JPG sau PNG.`); continue; }
    if (tradeFiles.length >= UPLOAD.maxFiles) { errs.push(`Maximum ${UPLOAD.maxFiles} poze.`); break; }
    if (totalBytes() + f.size > UPLOAD.maxBytes) { errs.push(`„${f.name}” depășește limita de ${mb(UPLOAD.maxBytes)} în total.`); continue; }
    if (tradeFiles.some(x => x.name == f.name && x.size == f.size)) continue;
    tradeFiles.push(f);
  }
  renderFiles(errs);
}
function renderFiles(errs = []) {
  $$("#tList img").forEach(i => URL.revokeObjectURL(i.src));
  $("#tList").innerHTML = tradeFiles.map((f, i) => `<li><img src="${URL.createObjectURL(f)}" alt=""><span>${esc(f.name)}</span><small>${mb(f.size)}</small><button type="button" data-rmfile="${i}" aria-label="Șterge ${esc(f.name)}">×</button></li>`).join("")
    + (tradeFiles.length ? `<li class="sum">${tradeFiles.length} ${tradeFiles.length == 1 ? "poză" : "poze"} · ${mb(totalBytes())} din ${mb(UPLOAD.maxBytes)}</li>` : "");
  const e = $("#tFileErr");
  e.hidden = !errs.length;
  e.textContent = errs.join(" ");
}
function validateFiles() {
  if (tradeFiles.length > UPLOAD.maxFiles) return `Poți trimite maximum ${UPLOAD.maxFiles} poze.`;
  if (totalBytes() > UPLOAD.maxBytes) return `Pozele depășesc ${mb(UPLOAD.maxBytes)} în total.`;
  if (tradeFiles.some(f => !isImg(f))) return "Doar poze JPG sau PNG.";
  return "";
}
/* pune pozele în câmpurile poza-1…poza-10 (Netlify primește câte un fișier pe câmp) */
function attachFiles(fd) {
  for (let i = 1; i <= UPLOAD.maxFiles; i++) fd.delete("poza-" + i);
  tradeFiles.forEach((f, i) => fd.append("poza-" + (i + 1), f, f.name));
}

function tradeSummary() {
  const f = $("#buyback");
  return [
    "Bună ziua! Aș vrea o ofertă pentru mașina mea.",
    f["marca-model"].value.trim() && `Mașina: ${f["marca-model"].value.trim()}`,
    `Caroserie: ${f.caroserie.value}, segment ${f.segment.value}`,
    `An: ${f.an.value}, ${n(+f.kilometri.value || 0)} km`,
    `Stare: ${f.stare.value}, ${f.combustibil.value}`,
    `Estimare de pe site: ${f.estimare.value}`,
    f.nume.value.trim() && `Nume: ${f.nume.value.trim()}`,
    f.telefon.value.trim() && `Telefon: ${f.telefon.value.trim()}`,
    tradeFiles.length ? `Vă trimit aici cele ${tradeFiles.length} poze.` : "Vă trimit pozele aici în conversație."
  ].filter(Boolean).join("\n");
}

function initTrade() {
  const f = $("#buyback"), t = TRADEIN, y = new Date().getFullYear();
  const opts = (keys, sel) => keys.map(k => `<option${k == sel ? " selected" : ""}>${k}</option>`).join("");
  f.caroserie.innerHTML = opts(Object.keys(t.caroserie), "SUV");
  f.segment.innerHTML = opts(Object.keys(t.segment), "Mediu");
  f.an.innerHTML = opts(Array.from({ length: 15 }, (_, i) => y - 2 - i), y - 9);
  f.stare.innerHTML = opts(Object.keys(t.stare), "Bună");
  f.combustibil.innerHTML = opts(Object.keys(t.combustibil), "Diesel");
  ["caroserie", "segment", "an", "stare", "combustibil"].forEach(k => f[k].addEventListener("change", renderTrade));
  f.kilometri.addEventListener("input", renderTrade);
  $("#tOpen").addEventListener("click", () => { $("#tMore").hidden = false; f["marca-model"].focus(); });
  $("#tFiles").addEventListener("change", e => { addFiles([...e.target.files]); e.target.value = ""; });
  $("#tList").addEventListener("click", e => {
    const b = e.target.closest("[data-rmfile]"); if (!b) return;
    tradeFiles.splice(+b.dataset.rmfile, 1); renderFiles();
  });
  renderTrade();
}
