/* Credit auto: anuitate, comision de analiză, DAE calculat (IRR lunar → anualizat). */

/* rata lunară (anuitate) */
const rata = (P, N, r = CREDIT.dobanda / 12) => P <= 0 ? 0 : P * r / (1 - Math.pow(1 + r, -N));

/* DAE: rata lunară m pentru care valoarea actualizată a ratelor = suma primită efectiv (P − comision),
   căutată prin bisecție, apoi anualizată: (1+m)^12 − 1 */
function dae(P, N, R, fee) {
  let lo = 0, hi = 0.1;
  for (let k = 0; k < 80; k++) {
    const m = (lo + hi) / 2;
    let pv = 0;
    for (let i = 1; i <= N; i++) pv += R / Math.pow(1 + m, i);
    (pv > P - fee) ? lo = m : hi = m;
  }
  return Math.pow(1 + (lo + hi) / 2, 12) - 1;
}

function calcCredit(P, A, N) {
  const L = P * (1 - A / 100), R = rata(L, N), fee = L * CREDIT.comision, D = dae(L, N, R, fee), T = R * N + fee;
  return { P, A, N, L, R, fee, D, T };
}

const pct = (x, d) => (x * 100).toFixed(d).replace(".", ",") + "%";
let lastCredit = null;

function renderCredit() {
  const P = +$("#cP").value, A = +$("#cA").value, N = +($("#cN .on") || { dataset: { n: 60 } }).dataset.n;
  const k = lastCredit = calcCredit(P, A, N);
  $("#vP").textContent = n(P) + " €";
  $("#vA").textContent = A + "% · " + n(P * A / 100) + " €";
  $("#vN").textContent = N + " luni";
  $("#cRes").innerHTML = `<div class="big"><span>Rata lunară</span><b>${n(k.R)} €</b></div><div>Finanțat<b>${n(k.L)} €</b></div><div>Total de plată<b>${n(k.T)} €</b></div>`;
  $("#cRepr").textContent = `Exemplu reprezentativ (demo): valoare finanțată ${n(k.L)} €, ${N} luni, dobândă fixă ${pct(CREDIT.dobanda, 1)}/an, comision de analiză ${n(k.fee)} € (${pct(CREDIT.comision, 0)}), rată lunară ${n(k.R)} €, DAE ${pct(k.D, 2)}, total plătibil ${n(k.T)} €. Ofertă orientativă, supusă aprobării finanțatorului.`;

  // câmpurile ascunse ale formularului
  const f = $("#fCredit");
  f.pret.value = n(P) + " €";
  f.avans.value = `${A}% (${n(P * A / 100)} €)`;
  f.perioada.value = N + " luni";
  f.rata.value = n(k.R) + " €/lună";
  f.total.value = n(k.T) + " €";
  f.dae.value = pct(k.D, 2);
  // dacă prețul nu mai corespunde mașinii alese, revenim la „Încă nu am ales”
  const sel = CARS.find(c => c.id == f.masina.value);
  if (sel && sel.pret != P) f.masina.value = "";
}

function creditSummary() {
  const f = $("#fCredit"), c = CARS.find(x => x.id == f.masina.value);
  return [
    "Bună ziua! Aș vrea o pre-aprobare pentru credit auto.",
    c ? `Mașina: ${carName(c)} (${c.an})` : "Mașina: încă nu am ales",
    `Preț: ${f.pret.value}`,
    `Avans: ${f.avans.value}`,
    `Perioadă: ${f.perioada.value}`,
    `Rata calculată: ${f.rata.value} (DAE ${f.dae.value}, total ${f.total.value})`,
    f.nume.value.trim() && `Nume: ${f.nume.value.trim()}`,
    f.telefon.value.trim() && `Telefon: ${f.telefon.value.trim()}`
  ].filter(Boolean).join("\n");
}

/* „Calculează rata pentru această mașină” din fișă */
function setCreditCar(c) {
  $("#cP").value = c.pret;
  $("#fCredit").masina.value = c.id;
  renderCredit();
}
function openCreditForm() {
  $("#cApply").hidden = true;
  $("#fCredit").hidden = false;
  $("#fCredit").nume.focus({ preventScroll: true });
}

function initCredit() {
  $("#cN").innerHTML = CREDIT.perioade.map(p => `<button type="button" data-n="${p}" class="${p == 60 ? "on" : ""}" aria-pressed="${p == 60}">${p} luni</button>`).join("");
  $("#fcCar").insertAdjacentHTML("beforeend", CARS.map(c => `<option value="${c.id}">${esc(carName(c))} (${c.an}) – ${n(c.pret)} €</option>`).join(""));
  $("#cP").addEventListener("input", renderCredit);
  $("#cA").addEventListener("input", renderCredit);
  $("#cN").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $$("#cN button").forEach(x => { x.classList.toggle("on", x == b); x.setAttribute("aria-pressed", x == b); });
    renderCredit();
  });
  $("#fcCar").addEventListener("change", e => { const c = CARS.find(x => x.id == e.target.value); if (c) { $("#cP").value = c.pret; renderCredit(); } });
  $("#cApply").addEventListener("click", openCreditForm);
  renderCredit();
}
