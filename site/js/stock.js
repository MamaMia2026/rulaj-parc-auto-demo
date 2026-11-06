/* Stoc: căutare, filtre rapide, sortare, favorite, listă de comparat. */

const MAX_CMP = 3;
const state = { q: "", sort: "rec", f: { m: "", c: "", b: "", t: "" }, fav: new Set(), cmp: new Set() };

const QUICK = {
  sub10: c => c.pret < 10000,
  suv: c => c.caroserie == "SUV",
  auto: c => c.cutie == "Automată",
  km: c => c.km < 100000,
  fam: c => ["Break", "Monovolum", "SUV"].includes(c.caroserie),
  fav: c => state.fav.has(c.id)
};
const SORTS = {
  pa: (a, b) => a.pret - b.pret,
  pd: (a, b) => b.pret - a.pret,
  km: (a, b) => a.km - b.km,
  an: (a, b) => b.an - a.an
};

/* parametri URL ↔ stare */
const URL_KEYS = { marca: ["f", "m"], caroserie: ["f", "c"], buget: ["f", "b"], cutie: ["f", "t"] };

function stateFromUrl(search) {
  const p = new URLSearchParams(search);
  for (const k in URL_KEYS) state.f[URL_KEYS[k][1]] = p.get(k) || "";
  state.q = QUICK[p.get("filtru")] ? p.get("filtru") : "";
  state.sort = SORTS[p.get("sortare")] ? p.get("sortare") : "rec";
}
function stateToSearch() {
  const p = new URLSearchParams();
  for (const k in URL_KEYS) { const v = state.f[URL_KEYS[k][1]]; if (v) p.set(k, v); }
  if (state.q) p.set("filtru", state.q);
  if (state.sort != "rec") p.set("sortare", state.sort);
  const s = p.toString();
  return s ? "?" + s : "";
}

function carList() {
  const f = state.f;
  let L = CARS.filter(c => (!f.m || c.marca == f.m) && (!f.c || c.caroserie == f.c) && (!f.b || c.pret <= +f.b) && (!f.t || c.cutie == f.t));
  if (QUICK[state.q]) L = L.filter(QUICK[state.q]);
  if (SORTS[state.sort]) L = [...L].sort(SORTS[state.sort]);
  return L;
}

const carName = c => `${c.marca} ${c.model}`;
const rataCard = c => rata(c.pret * (1 - CREDIT.avansCard / 100), CREDIT.perioadaCard);

function cardHtml(c) {
  const isFav = state.fav.has(c.id);
  return `<article class="car" data-car="${c.slug}">
 <div class="ph">${imgTag(c.poze[0], { alt: carName(c), sizes: "(max-width:760px) calc(100vw - 32px), (max-width:1100px) 50vw, 440px", lazy: true })}
  <div class="tg"><span>✓ Verificat</span><span>${esc(c.etichete[0] || "")}</span></div>
  <button type="button" class="hrt ${isFav ? "on" : ""}" data-fav="${c.id}" aria-pressed="${isFav}" aria-label="${isFav ? "Scoate din favorite" : "Adaugă la favorite"}: ${esc(carName(c))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg></button></div>
 <div class="bd"><h3><a href="/masina/${c.slug}">${esc(c.marca)} ${esc(c.model.split(" ")[0])}<small>${esc(c.model)}</small></a></h3>
  <div class="spec"><span><b>${c.an}</b>an</span><span><b>${n(c.km / 1000)}k</b>km</span><span><b>${c.combustibil}</b>motor</span><span><b>${c.cutie == "Automată" ? "Auto" : "Man."}</b>cutie</span></div>
  <div class="ft"><div class="pr">${n(c.pret)} €<small>preț final, TVA inclus</small></div><div class="rt">de la<b>${n(rataCard(c))} €/lună</b>avans ${CREDIT.avansCard}%, ${CREDIT.perioadaCard} luni</div></div>
  <label class="cmp" data-stop="1"><input type="checkbox" data-cmp="${c.id}" ${state.cmp.has(c.id) ? "checked" : ""}> Compară</label></div></article>`;
}

function renderGrid() {
  const L = carList();
  $("#cnt").innerHTML = `<b>${L.length}</b> ${L.length == 1 ? "mașină găsită" : "mașini găsite"}`;
  $("#grid").innerHTML = L.length ? L.map(cardHtml).join("")
    : `<p class="empty">${state.q == "fav" ? "Nu ai încă mașini favorite. Apasă inima de pe o mașină ca s-o salvezi aici." : "Nicio mașină nu se potrivește. Încearcă alte filtre."}</p>`;
  $$("#bar .pill").forEach(b => b.classList.toggle("on", b.dataset.q == state.q));
  $("#sort").value = state.sort;
  $("#sM").value = state.f.m; $("#sC").value = state.f.c; $("#sB").value = state.f.b; $("#sT").value = state.f.t;
  $("#favN").textContent = $("#favN2").textContent = state.fav.size;
  renderCbar();
}

function renderCbar() {
  const ids = [...state.cmp];
  $("#cbN").textContent = ids.length;
  $("#cbT").innerHTML = ids.map(id => { const c = CARS.find(x => x.id == id); return c ? imgTag(c.poze[0], { alt: "", sizes: "56px", w: 56, h: 38 }) : ""; }).join("");
  $("#cbGo").href = "/compara?ids=" + ids.join(",");
  const show = ids.length > 0;
  $("#cbar").classList.toggle("show", show);
  document.body.classList.toggle("has-cbar", show);
}

/* acțiuni */
function setQuick(q) { state.q = q; syncHomeUrl(); renderGrid(); }
function setSort(s) { state.sort = s; syncHomeUrl(); renderGrid(); }
function heroSearch() {
  state.f = { m: $("#sM").value, c: $("#sC").value, b: $("#sB").value, t: $("#sT").value };
  syncHomeUrl(); renderGrid();
  $("#stoc").scrollIntoView();
}
function toggleFav(id) {
  state.fav.has(id) ? state.fav.delete(id) : state.fav.add(id);
  store.set("rulaj.fav", [...state.fav]);
  renderGrid();
}
function toggleCmp(id, on, input) {
  if (on) {
    if (state.cmp.size >= MAX_CMP) { if (input) input.checked = false; toast(`Poți compara maximum ${MAX_CMP} mașini.`); return; }
    state.cmp.add(id);
  } else state.cmp.delete(id);
  store.set("rulaj.cmp", [...state.cmp]);
  renderCbar();
}

function initStock() {
  const valid = id => CARS.some(c => c.id == id);
  // La prima vizită (nimic salvat) pornim ca în machetă: 1 favorit, 2 mașini de comparat.
  state.fav = new Set(store.get("rulaj.fav", [2]).filter(valid));
  state.cmp = new Set(store.get("rulaj.cmp", [2, 3]).filter(valid).slice(0, MAX_CMP));
  $("#sM").insertAdjacentHTML("beforeend", [...new Set(CARS.map(c => c.marca))].map(m => `<option>${esc(m)}</option>`).join(""));
  $("#sC").insertAdjacentHTML("beforeend", [...new Set(CARS.map(c => c.caroserie))].map(m => `<option>${esc(m)}</option>`).join(""));
  $("#stockN").textContent = CARS.length;
}
