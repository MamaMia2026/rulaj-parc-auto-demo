/* Fișa mașinii (galerie, raport, test drive) și comparația. */

const td = { car: null, days: [], day: 0, slot: "" };

/* ---------- Test drive: zile și ore ---------- */
function nextDays() {
  const out = [], d = new Date();
  d.setHours(0, 0, 0, 0);
  while (out.length < TEST_DRIVE.zile) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) out.push(new Date(d)); // duminica închis
  }
  return out;
}
const dayShort = d => d.toLocaleDateString("ro-RO", { weekday: "short", day: "numeric" });
const dayLong = d => d.toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" });

/* ore indisponibile: sâmbăta după program + 2 sloturi „ocupate” demo, diferite pe zi/mașină */
function slotTaken(car, d, i) {
  const o = TEST_DRIVE.ore[i];
  if (d.getDay() === 6 && o >= TEST_DRIVE.sambataPanaLa) return true;
  const k = car.id + d.getDate();
  return i == k % 7 || i == (k + 3) % 7;
}

function renderSlots() {
  const c = td.car, d = td.days[td.day];
  $("#dDays").innerHTML = td.days.map((x, i) => `<button type="button" class="${i == td.day ? "on" : ""}" aria-pressed="${i == td.day}" data-day="${i}">${dayShort(x)}</button>`).join("");
  const free = TEST_DRIVE.ore.filter((o, i) => !slotTaken(c, d, i));
  if (!free.includes(td.slot)) td.slot = free.includes("13:00") ? "13:00" : (free[0] || "");
  $("#dSlots").innerHTML = TEST_DRIVE.ore.map((o, i) => {
    const off = slotTaken(c, d, i);
    return `<button type="button" data-slot="${o}" ${off ? "disabled aria-label=\"" + o + " – ocupat\"" : ""} class="${o == td.slot ? "on" : ""}" aria-pressed="${o == td.slot}">${o}</button>`;
  }).join("");
  const f = $("#fTd");
  f.ziua.value = dayLong(d);
  f.ora.value = td.slot;
  $("#dBook").textContent = td.slot ? `Rezervă test drive · ${dayShort(d)}, ${td.slot}` : "Nicio oră liberă în ziua aleasă";
  $("#dBook").disabled = !td.slot;
}

function testDriveSummary() {
  const f = $("#fTd"), c = td.car;
  return [
    "Bună ziua! Aș vrea un test drive.",
    `Mașina: ${carName(c)} (${c.an}), ${n(c.pret)} €`,
    `Ziua: ${f.ziua.value}`,
    `Ora: ${f.ora.value}`,
    f.nume.value.trim() && `Nume: ${f.nume.value.trim()}`,
    f.telefon.value.trim() && `Telefon: ${f.telefon.value.trim()}`,
    `Link: ${location.origin}/masina/${c.slug}`
  ].filter(Boolean).join("\n");
}

/* ---------- Galerie ---------- */
function setPhoto(i) {
  const c = td.car, name = c.poze[i];
  const img = $("#dImg");
  img.src = imgSrc(name); img.srcset = imgSrcset(name);
  img.sizes = "(max-width:760px) 100vw, 650px";
  img.alt = `${carName(c)} – poza ${i + 1} din ${c.poze.length}`;
  $$("#dTh button").forEach((b, k) => { b.classList.toggle("on", k == i); b.setAttribute("aria-pressed", k == i); });
}

/* ---------- Fișa ---------- */
function showCar(c) {
  td.car = c; td.days = nextDays(); td.day = 0; td.slot = "13:00";
  $("#dTitle").textContent = carName(c);
  $("#dPr").innerHTML = `${n(c.pret)} €<small>preț final · sau de la ${n(rataCard(c))} €/lună</small>`;
  $("#dKv").innerHTML = [["An", c.an], ["Kilometri", n(c.km) + " km"], ["Combustibil", c.combustibil], ["Cutie", c.cutie], ["Putere", c.cp + " CP"], ["Caroserie", c.caroserie], ["Culoare", c.culoare], ["Garanție", "12 luni"]]
    .map(r => `<div><span>${r[0]}</span><b>${esc(String(r[1]))}</b></div>`).join("");
  $("#dEq").innerHTML = c.dotari.map(e => `<span>${esc(e)}</span>`).join("") + c.etichete.map(e => `<span class="lab">${esc(e)}</span>`).join("");

  // miniaturi doar dacă există mai multe poze
  const th = $("#dTh");
  th.hidden = c.poze.length < 2;
  th.innerHTML = c.poze.length < 2 ? "" : c.poze.map((p, i) => `<button type="button" data-photo="${i}" aria-label="Poza ${i + 1}">${imgTag(p, { alt: "", sizes: "90px", lazy: true })}</button>`).join("");
  setPhoto(0);

  // formular test drive
  const f = $("#fTd");
  resetForm(f);
  f.masina.value = `${carName(c)} (${c.an}) – ${n(c.pret)} € – /masina/${c.slug}`;
  renderSlots();

  openModal("vCar", `${carName(c)} (${c.an}) – Rulaj`);
}

/* ---------- Comparație ---------- */
function showCompare(ids) {
  const L = ids.map(id => CARS.find(c => c.id == id)).filter(Boolean).slice(0, MAX_CMP);
  const v = $("#vCmp");
  if (!L.length) {
    v.innerHTML = `<div class="cmpv"><h2 class="o" id="cTitle" style="font-size:30px;margin-bottom:14px">Comparație</h2><p>Bifează „Compară” pe 2 sau 3 mașini din stoc, apoi apasă „Compară” în bara de jos.</p></div>`;
    openModal("vCmp", "Comparație – Rulaj");
    return;
  }
  const bestOf = (key, fn) => fn(...L.map(c => c[key]));
  const row = (t, key, fmt, fn) => `<tr><th scope="row">${t}</th>${L.map(c => `<td class="${fn && L.length > 1 && c[key] == bestOf(key, fn) ? "best" : ""}">${fmt ? fmt(c[key]) : esc(String(c[key]))}</td>`).join("")}</tr>`;
  v.innerHTML = `<div class="cmpv"><h2 class="o" id="cTitle" style="font-size:30px;margin-bottom:14px;padding-right:44px">Comparație</h2>
 <div style="overflow-x:auto"><table class="ctab"><tr><th></th>${L.map(c => `<td><a href="/masina/${c.slug}">${imgTag(c.poze[0], { alt: "", sizes: "220px", lazy: false })}<div class="o" style="font-size:18px;margin-top:8px">${esc(carName(c))}</div></a></td>`).join("")}</tr>
 ${row("Preț", "pret", x => n(x) + " €", Math.min)}${row("An", "an", null, Math.max)}${row("Kilometri", "km", x => n(x) + " km", Math.min)}${row("Putere", "cp", x => x + " CP", Math.max)}${row("Combustibil", "combustibil")}${row("Cutie", "cutie")}${row("Caroserie", "caroserie")}
 <tr><th scope="row">Rată / lună</th>${L.map(c => `<td>${n(rataCard(c))} €</td>`).join("")}</tr></table></div>
 <p class="repr" style="margin-top:12px">Verde = cea mai bună valoare din comparație. Rata: avans ${CREDIT.avansCard}%, ${CREDIT.perioadaCard} luni (exemplu).</p>
 <div class="cmpa"><button type="button" class="btn btn-l" data-share="1">Trimite linkul comparației</button><button type="button" class="btn btn-g" data-wa="compara">Trimite pe WhatsApp</button></div></div>`;
  v.dataset.ids = L.map(c => c.id).join(",");
  openModal("vCmp", `Comparație: ${L.map(c => c.marca + " " + c.model.split(" ")[0]).join(" vs ")} – Rulaj`);
}

function compareUrl() { return `${location.origin}/compara?ids=${$("#vCmp").dataset.ids}`; }
function compareSummary() {
  const ids = $("#vCmp").dataset.ids.split(",").map(Number);
  return ["Comparație mașini Rulaj:", ...ids.map(id => { const c = CARS.find(x => x.id == id); return `• ${carName(c)} (${c.an}) – ${n(c.pret)} €`; }), compareUrl()].join("\n");
}
async function shareCompare() {
  const url = compareUrl();
  if (navigator.share && matchMedia("(pointer:coarse)").matches) {
    try { await navigator.share({ title: "Comparație mașini – Rulaj", url }); return; } catch (e) { if (e.name == "AbortError") return; }
  }
  try { await navigator.clipboard.writeText(url); toast("Link copiat: " + url.replace(location.origin, "")); }
  catch { copyFallback(url) ? toast("Link copiat.") : toast(url); }
}

/* ---------- Raport exemplu (fără rută) ---------- */
function showReport() {
  $("#vRep").innerHTML = `<div class="cmpv"><h2 class="o" id="rTitle" style="font-size:30px;margin-bottom:6px;padding-right:44px">Raport verificare · 120/120</h2>
  <p style="color:var(--mu);margin-bottom:12px">Așa arată raportul pe care îl primești la fiecare mașină.</p>${$("#dRep").innerHTML.replace(/<h3[\s\S]*?<\/h3>/, "")}</div>`;
  openModal("vRep", null);
}
