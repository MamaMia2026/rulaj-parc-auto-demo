/* Rulaj – date demo (stoc, credit, estimare). Toate valorile sunt de exemplu. */

/* Lățimile disponibile pentru pozele mașinilor (fișiere /img/<nume>-<lățime>.webp).
   Originalele actuale au ~406 px, deci există doar varianta de 400.
   Când apar poze la rezoluție mai mare, generează și -800 și adaugă 800 aici. */
const IMG_WIDTHS = [400];

/* poze: lista de fișiere (fără sufix). Galeria arată miniaturi doar dacă sunt minimum 2. */
const CARS = [
  { id: 1, slug: "volkswagen-golf-2018", marca: "Volkswagen", model: "Golf 1.6 TDI", an: 2018, km: 118000, combustibil: "Diesel", cutie: "Manuală", cp: 115, caroserie: "Hatchback", culoare: "Alb", pret: 12900,
    poze: ["vw-golf-alb"], etichete: ["Primul proprietar"], dotari: ["Climatronic", "Senzori parcare", "Apple CarPlay", "Pilot automat"] },
  { id: 2, slug: "nissan-qashqai-2020", marca: "Nissan", model: "Qashqai 1.3 DIG-T", an: 2020, km: 64000, combustibil: "Benzină", cutie: "Automată", cp: 140, caroserie: "SUV", culoare: "Gri", pret: 18900,
    poze: ["nissan-qashqai-gri"], etichete: ["Garanție extinsă"], dotari: ["Cameră 360°", "Navigație", "Scaune încălzite", "Faruri LED"] },
  { id: 3, slug: "volvo-v60-2019", marca: "Volvo", model: "V60 D4 Momentum", an: 2019, km: 142000, combustibil: "Diesel", cutie: "Automată", cp: 190, caroserie: "Break", culoare: "Albastru", pret: 21500,
    poze: ["volvo-v60-albastru"], etichete: ["Service la reprezentanță"], dotari: ["Piele", "Hayon electric", "Pilot adaptiv", "Head-up"] },
  { id: 4, slug: "mercedes-benz-e220d-2017", marca: "Mercedes-Benz", model: "E 220 d", an: 2017, km: 168000, combustibil: "Diesel", cutie: "Automată", cp: 194, caroserie: "Sedan", culoare: "Negru", pret: 23900,
    poze: ["mercedes-e-negru"], etichete: ["Istoric complet"], dotari: ["Piele", "Navigație", "Faruri LED", "Senzori parcare"] },
  { id: 5, slug: "volkswagen-up-2019", marca: "Volkswagen", model: "up! 1.0 MPI", an: 2019, km: 52000, combustibil: "Benzină", cutie: "Manuală", cp: 60, caroserie: "Hatchback", culoare: "Roșu", pret: 7900,
    poze: ["vw-up-rosu"], etichete: ["Ideal pentru oraș"], dotari: ["Aer condiționat", "Bluetooth", "Geamuri electrice"] },
  { id: 6, slug: "skoda-octavia-combi-2019", marca: "Škoda", model: "Octavia Combi 2.0 TDI", an: 2019, km: 131000, combustibil: "Diesel", cutie: "Automată", cp: 150, caroserie: "Break", culoare: "Albastru", pret: 15900,
    poze: ["skoda-octavia-albastru"], etichete: ["Primul proprietar"], dotari: ["Climatronic", "Navigație", "Cârlig remorcare", "Senzori parcare"] },
  { id: 7, slug: "toyota-sienna-2018", marca: "Toyota", model: "Sienna 3.5 V6", an: 2018, km: 97000, combustibil: "Benzină", cutie: "Automată", cp: 296, caroserie: "Monovolum", culoare: "Argintiu", pret: 22900,
    poze: ["toyota-sienna-argintiu"], etichete: ["7 locuri"], dotari: ["Uși glisante electrice", "Cameră spate", "Climatizare 3 zone"] }
];

/* Credit – dobândă anuală fixă de exemplu, comision de analiză 1% din suma finanțată. */
const CREDIT = {
  dobanda: 0.099,
  comision: 0.01,
  avansCard: 20,      // % folosit pentru „de la … €/lună” pe carduri
  perioadaCard: 60,   // luni
  perioade: [24, 36, 48, 60, 72]
};

/* Estimarea mașinii tale – coeficienți de exemplu. */
const TRADEIN = {
  baza: 11000,
  segment: { "Economic": 1, "Mediu": 1.35, "Premium": 1.9 },
  caroserie: { "Hatchback": 0.85, "Sedan": 1, "Break": 1.02, "SUV": 1.15, "Monovolum": 0.95 },
  stare: { "Foarte bună": 1.05, "Bună": 1, "Necesită reparații": 0.85 },
  combustibil: { "Diesel": 1, "Benzină": 1.02, "Hibrid": 1.12 },
  depreciereAnuala: 0.88,
  kmPeAn: 15000,
  minim: 500,
  marja: 0.08          // intervalul afișat: ±8%
};

/* Test drive – ore disponibile. Sâmbăta: doar până la 15:00. Duminica închis. */
const TEST_DRIVE = {
  ore: ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "18:30"],
  sambataPanaLa: "15:00",
  zile: 3
};

/* Limite pentru pozele trimise la evaluare. */
const UPLOAD = { maxFiles: 10, maxBytes: 8 * 1024 * 1024, types: ["image/jpeg", "image/png"] };
