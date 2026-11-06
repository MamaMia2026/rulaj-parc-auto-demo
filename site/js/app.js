const WHATSAPP_NUMBER = "40700000000"; // număr WhatsApp în format internațional, fără + (ex. 40700000000)

/* ===== Utilitare ===== */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const n = x => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

const store = {
  get(k, def) { try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch { return def; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* stocare indisponibilă – ignorăm */ } }
};

/* imagini responsive: /img/<nume>-<lățime>.webp pentru fiecare lățime din IMG_WIDTHS */
const imgSrc = name => `/img/${name}-${IMG_WIDTHS[IMG_WIDTHS.length - 1]}.webp`;
const imgSrcset = name => IMG_WIDTHS.map(w => `/img/${name}-${w}.webp ${w}w`).join(", ");
function imgTag(name, { alt = "", sizes = "100vw", lazy = true, w = 400, h = 260 } = {}) {
  return `<img src="${imgSrc(name)}" srcset="${imgSrcset(name)}" sizes="${sizes}" width="${w}" height="${h}" alt="${esc(alt)}"${lazy ? ' loading="lazy"' : ""} decoding="async">`;
}

let toastT;
function toast(m) {
  const t = $("#toast");
  t.textContent = m; t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600);
}
function copyFallback(text) {
  const a = document.createElement("textarea");
  a.value = text; a.setAttribute("readonly", ""); a.style.position = "fixed"; a.style.opacity = "0";
  document.body.appendChild(a); a.select();
  let ok = false; try { ok = document.execCommand("copy"); } catch { }
  a.remove(); return ok;
}

/* ===== WhatsApp ===== */
function openWhatsApp(text) {
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}
const WA = { "test-drive": () => testDriveSummary(), credit: () => creditSummary(), evaluare: () => tradeSummary(), compara: () => compareSummary() };

/* ===== Modal ===== */
const DEFAULT_TITLE = document.title;
let modalView = null, lastFocus = null;

function openModal(view, title) {
  ["vCar", "vCmp", "vRep"].forEach(v => $("#" + v).hidden = v != view);
  const h = $("#" + view + " h2");
  if (h) $("#md").setAttribute("aria-labelledby", h.id);
  if (!modalView) lastFocus = document.activeElement;
  modalView = view;
  $("#ov").classList.add("open");
  document.body.classList.add("lock");
  $("#md").scrollTop = 0;
  $("#md").focus({ preventScroll: true });
  if (title) document.title = title;
}
function hideModal() {
  if (!modalView) return;
  modalView = null;
  $("#ov").classList.remove("open");
  document.body.classList.remove("lock");
  document.title = DEFAULT_TITLE;
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
}

/* ===== Router: /, /masina/<slug>, /compara?ids=… ===== */
let homeSearch = "";

function isHome() { return location.pathname == "/" || location.pathname == "/index.html"; }
function syncHomeUrl() {
  if (!isHome()) return;
  history.replaceState(history.state, "", "/" + stateToSearch() + location.hash);
}
function go(url) {
  if (isHome()) homeSearch = location.search;
  history.pushState({ fromApp: true }, "", url);
  route();
}
function closeModal() {
  if (modalView == "vRep") { hideModal(); return; }   // raportul exemplu nu are rută
  if (history.state && history.state.fromApp) history.back();
  else { history.replaceState(null, "", "/" + homeSearch); route(); }
}
function route() {
  const path = location.pathname.replace(/\/+$/, "") || "/";
  const m = path.match(/^\/masina\/([a-z0-9-]+)$/);
  if (m) {
    const c = CARS.find(x => x.slug == m[1]);
    if (c) { showCar(c); return; }
    history.replaceState(null, "", "/");
    toast("Mașina nu mai e în stoc. Uite ce avem acum.");
  } else if (path == "/compara") {
    const ids = (new URLSearchParams(location.search).get("ids") || "").split(",").map(Number).filter(Boolean);
    showCompare([...new Set(ids)]);
    return;
  } else if (path != "/" && path != "/index.html") {
    history.replaceState(null, "", "/");
  }
  hideModal();
  stateFromUrl(location.search);
  renderGrid();
}

/* ===== Formulare (Netlify Forms) ===== */
const FORMS = {
  "test-drive": {
    el: () => $("#fTd"),
    thanks: f => `<b>Mulțumim, ${esc(f.nume.value.trim())}!</b>Am primit cererea de test drive pentru ${esc(carName(td.car))}, ${esc(f.ziua.value)}, ora ${esc(f.ora.value)}. Te sunăm la ${esc(f.telefon.value.trim())} să confirmăm.`
  },
  credit: {
    el: () => $("#fCredit"),
    prepare: (fd, f) => { const c = CARS.find(x => x.id == f.masina.value); fd.set("masina", c ? `${carName(c)} (${c.an}) – ${n(c.pret)} €` : "Încă nu am ales"); },
    thanks: f => `<b>Mulțumim, ${esc(f.nume.value.trim())}!</b>Am primit cererea de pre-aprobare (rată estimată ${esc(f.rata.value)}, ${esc(f.perioada.value)}). Un consultant te sună la ${esc(f.telefon.value.trim())} în cel mult 30 de minute, în timpul programului.`
  },
  "evaluare-masina": {
    el: () => $("#buyback"),
    validate: () => validateFiles(),
    prepare: fd => attachFiles(fd),
    multipart: true,
    thanks: f => `<b>Mulțumim, ${esc(f.nume.value.trim())}!</b>Am primit datele pentru ${esc(f["marca-model"].value.trim())}${tradeFiles.length ? ` și ${tradeFiles.length} ${tradeFiles.length == 1 ? "poză" : "poze"}` : ""}. Te sunăm la ${esc(f.telefon.value.trim())} pentru oferta fermă și programarea inspecției.`
  }
};

async function submitForm(name, form) {
  const cfg = FORMS[name], err = [...form.querySelectorAll(".err")].pop();
  err.hidden = true;
  const v = cfg.validate && cfg.validate();
  if (v) { err.textContent = v; err.hidden = false; return; }
  const btn = form.querySelector('[type="submit"]'), label = btn.textContent;
  btn.disabled = true; btn.textContent = "Se trimite…";
  try {
    const fd = new FormData(form);
    if (cfg.prepare) cfg.prepare(fd, form);
    let body = fd, headers = {};
    if (!cfg.multipart) {
      body = new URLSearchParams([...fd].filter(([, val]) => typeof val == "string")).toString();
      headers["Content-Type"] = "application/x-www-form-urlencoded";
    }
    const r = await fetch("/", { method: "POST", headers, body });
    if (!r.ok) throw new Error("HTTP " + r.status);
    showThanks(form, cfg.thanks(form), name);
  } catch (e) {
    err.textContent = "Nu am putut trimite cererea. Încearcă din nou sau scrie-ne pe WhatsApp.";
    err.hidden = false;
  } finally {
    btn.disabled = false; btn.textContent = label;
  }
}

function showThanks(form, html, name) {
  let box = document.querySelector(`.thanks[data-for="${name}"]`);
  if (!box) { // evaluare: mesajul stă în locul formularului
    box = document.createElement("div");
    box.className = "thanks"; box.dataset.for = name;
    form.querySelector("#tMore").after(box);
  }
  box.innerHTML = html + `<br><button type="button" data-again="${name}">Trimite altă cerere</button>`;
  box.hidden = false;
  if (name == "evaluare-masina") $("#tMore").hidden = true; else form.hidden = true;
  if (name == "credit") $("#cApply").hidden = true;
  box.setAttribute("tabindex", "-1"); box.focus();
}
function resetForm(form) {
  const name = form.getAttribute("name");
  const box = document.querySelector(`.thanks[data-for="${name}"]`);
  if (box) box.hidden = true;
  form.hidden = false;
  form.querySelectorAll(".err").forEach(e => e.hidden = true);
}
function again(name) {
  const form = FORMS[name].el();
  resetForm(form);
  if (name == "evaluare-masina") { form.reset(); tradeFiles = []; renderFiles(); renderTrade(); $("#tMore").hidden = false; }
  else { form.nume.value = ""; form.telefon.value = ""; }
  form.querySelector('[name="nume"]').focus();
}

/* ===== Evenimente ===== */
document.addEventListener("click", e => {
  const t = e.target;
  const plain = !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) && e.button == 0;

  const fv = t.closest("[data-fav]"); if (fv) { e.stopPropagation(); toggleFav(+fv.dataset.fav); return; }
  if (t.closest("[data-stop]")) return;
  if (t.closest("[data-close]") || t.id == "ov") { closeModal(); return; }
  const wa = t.closest("[data-wa]"); if (wa) { openWhatsApp(WA[wa.dataset.wa]()); return; }
  if (t.closest("[data-share]")) { shareCompare(); return; }
  const ag = t.closest("[data-again]"); if (ag) { again(ag.dataset.again); return; }

  // linkuri interne cu rută (carduri, comparație, bara Compară)
  const a = t.closest('a[href^="/masina/"], a[href^="/compara"]');
  if (a && plain) { e.preventDefault(); go(a.getAttribute("href")); return; }
  const car = t.closest("[data-car]"); if (car && plain) { go("/masina/" + car.dataset.car); return; }

  const p = t.closest("#bar .pill"); if (p) { setQuick(p.dataset.q); return; }
  if (t.closest("[data-favs]")) { setQuick("fav"); $("#stoc").scrollIntoView(); return; }
  if (t.closest("[data-rep]")) { showReport(); return; }

  // fișă: zi / oră / poză
  const dy = t.closest("[data-day]"); if (dy) { td.day = +dy.dataset.day; renderSlots(); return; }
  const sl = t.closest("[data-slot]"); if (sl && !sl.disabled) { td.slot = sl.dataset.slot; renderSlots(); return; }
  const ph = t.closest("[data-photo]"); if (ph) { setPhoto(+ph.dataset.photo); return; }
  if (t.closest("#dCredit")) {
    e.preventDefault();
    const c = td.car;
    closeModal();
    setCreditCar(c);
    setTimeout(() => { $("#credit").scrollIntoView(); openCreditForm(); }, 50);
    return;
  }
});

document.addEventListener("change", e => {
  const c = e.target.dataset.cmp;
  if (c) toggleCmp(+c, e.target.checked, e.target);
});
document.addEventListener("submit", e => {
  const form = e.target, name = form.getAttribute("name");
  if (FORMS[name]) { e.preventDefault(); submitForm(name, form); }
  else if (form.id == "srch") { e.preventDefault(); heroSearch(); }
});
addEventListener("keydown", e => {
  if (e.key == "Escape" && modalView) closeModal();
  if (e.key == "Tab" && modalView) { // focus în interiorul ferestrei
    const f = [...$("#md").querySelectorAll('button:not([disabled]),a[href],input:not([type=hidden]),select')].filter(x => x.offsetParent);
    if (!f.length) return;
    if (e.shiftKey && (document.activeElement == f[0] || document.activeElement == $("#md"))) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement == f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
});
addEventListener("popstate", route);
$("#sort").addEventListener("change", e => setSort(e.target.value));

/* ===== Start ===== */
initStock();
initCredit();
initTrade();
route();
