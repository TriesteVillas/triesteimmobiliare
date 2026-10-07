"use client";

import { useSyncExternalStore } from "react";
import s from "./barcolana.module.css";

// La mappa del Villaggio, ridisegnata a mano sulla tavola «Ci trovate qui»
// (1932×1932 px): le coordinate sono quelle della tavola, così un ritocco si
// misura direttamente sull'originale. Il mare è in alto, la Riva in basso; lo
// stand 25 è il primo dell'Area Shopping a destra della radice del Molo Audace.
//
// Due inquadrature: larga sul desktop (colonna a destra del testo), stretta e
// più vicina sul telefono, dove la mappa sta in testa al pannello. Le etichette
// cambiano corpo con la stessa media query in barcolana.module.css.

const VB_LARGA = "360 470 1260 1460";
const VB_STRETTA = "470 740 1080 700";
const STRETTO = "(max-width: 767px)";

const STAND = { x: 1005, y: 1165 };

function ascolta(cambia: () => void) {
  const mq = window.matchMedia(STRETTO);
  mq.addEventListener("change", cambia);
  return () => mq.removeEventListener("change", cambia);
}

// Banchina (y del bordo mare) per piazzare le barche sopra di essa.
function banchina(x: number) {
  if (x <= 905) return 1118;
  if (x <= 1295) return 1118 - (x - 905) * 0.0385;
  return 1103 - (x - 1295) * 0.427;
}

const BARCHE: { x: number; y: number; k: number; r: number }[] = [
  ...Array.from({ length: 15 }, (_, i) => 360 + i * 27).map((x) => ({ x, y: 1078, k: 1, r: 0 })),
  ...Array.from({ length: 10 }, (_, i) => 940 + i * 25).map((x) => ({ x, y: banchina(x) - 36, k: 0.82, r: 0 })),
  ...Array.from({ length: 17 }, (_, i) => 1205 + i * 29).map((x, i) => ({
    x,
    y: banchina(x) - 40 - i * 0.6,
    k: 0.9 + i * 0.018,
    r: -7,
  })),
];
const SCAFO = "M0 -35C7 -24 10 -6 10 12C10 24 7 33 5 35H-5C-7 33 -10 24 -10 12C-10 -6 -7 -24 0 -35Z";

const EDIFICI = [
  "40,1315 295,1305 300,1600 40,1605",
  "690,1330 800,1338 785,1612 690,1615",
  "835,1350 1015,1362 1005,1595 818,1590",
  "1040,1398 1082,1398 1062,1680 1025,1678",
  "640,1700 760,1692 765,2300 630,2300",
  "850,1765 1060,1760 1052,2300 845,2300",
  "1095,1700 1150,1695 1165,2300 1100,2300",
  "1160,1490 1255,1458 1377,1687 1282,1719",
  "1303,1759 1398,1727 1577,2061 1482,2093",
  "1290,1425 1400,1387 1522,1616 1412,1654",
  "1433,1694 1543,1656 1722,1990 1612,2028",
  "1440,1345 1560,1303 1682,1532 1562,1574",
  "1583,1614 1703,1572 1882,1906 1762,1948",
  "1610,1255 1730,1213 1852,1442 1732,1484",
  "1753,1524 1873,1482 2052,1816 1932,1858",
];

const ETICHETTE = {
  it: { piazza: ["Piazza", "Unità"], area: "Area Shopping", verdi: ["Piazza", "Verdi"], golfo: "Golfo di Trieste" },
  en: { piazza: ["Piazza", "Unità"], area: "Shopping Area", verdi: ["Piazza", "Verdi"], golfo: "Gulf of Trieste" },
};

export default function BarcolanaMappa({ lingua }: { lingua: "it" | "en" }) {
  const e = ETICHETTE[lingua];
  const stretto = useSyncExternalStore(ascolta, () => window.matchMedia(STRETTO).matches, () => false);

  return (
    <svg
      className={s.mappaSvg}
      viewBox={stretto ? VB_STRETTA : VB_LARGA}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={
        lingua === "it"
          ? "Mappa: lo stand 25 è sulla Riva, lato mare, subito a destra della radice del Molo Audace, nell’Area Shopping; Piazza Unità è a sinistra."
          : "Map: stand 25 is on the seafront, just right of where Molo Audace meets the Riva, in the Shopping Area; Piazza Unità is to the left."
      }
    >
      <defs>
        <linearGradient id="bm-mare" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f2c5c" />
          <stop offset="1" stopColor="#0a2149" />
        </linearGradient>
      </defs>

      <rect x="-400" y="0" width="2800" height="2400" fill="url(#bm-mare)" />

      <text x="1050" y="610" className={`${s.lbl} ${s.lblGolfo}`}>
        {e.golfo}
      </text>

      {/* Terra: Riva, Molo Audace, città */}
      <path
        className={s.terra}
        d="M-400 1118H815L681 300H773L905 1118L1295 1103L1700 930L2400 640V2400H-400Z"
      />
      <path
        className={s.bordo}
        d="M-400 1118H815L681 300M773 300L905 1118L1295 1103L1700 930L2400 640"
      />

      {/* Zone del Villaggio */}
      <path className={s.zona} d="M605 1124H810V1212H605Z" />
      <path className={s.zona} d="M190 1124H390V1212H190Z" />
      <path className={s.piazza} d="M405 1124H575V1290H685V2400H295V1290H405Z" />
      <path className={s.area} d="M905 1126L1295 1110L1690 944L1726 1024L1300 1218L905 1232Z" />

      {EDIFICI.map((p) => (
        <polygon key={p} points={p} className={s.edificio} />
      ))}

      {/* Barche ormeggiate lungo la Riva */}
      <g className={s.barche}>
        {BARCHE.map((b) => (
          <path key={`${b.x}`} d={SCAFO} transform={`translate(${b.x} ${b.y}) rotate(${b.r}) scale(${b.k})`} />
        ))}
      </g>

      {/* Etichette di luogo */}
      <text
        x="826"
        y="925"
        transform="rotate(80.75 826 925)"
        className={`${s.lbl} ${s.lblMolo}`}
        dominantBaseline="middle"
        textAnchor="middle"
      >
        Molo Audace
      </text>
      <text x="628" y="1560" textAnchor="middle" className={`${s.lbl} ${s.lblCaps}`}>
        <tspan x="628">{e.piazza[0]}</tspan>
        <tspan x="628" dy="1.25em">
          {e.piazza[1]}
        </tspan>
      </text>
      <text x="1250" y="1330" transform="rotate(-24 1250 1330)" textAnchor="middle" className={s.lbl}>
        Riva Tre Novembre
      </text>
      <text x="912" y="1690" textAnchor="middle" className={s.lbl}>
        <tspan x="912">{e.verdi[0]}</tspan>
        <tspan x="912" dy="1.2em">
          {e.verdi[1]}
        </tspan>
      </text>
      <text x="1052" y="1196" className={`${s.lbl} ${s.lblArea}`}>
        {e.area}
      </text>

      {/* Lo stand: filo verso il mare, cartiglio, spillo che respira */}
      <line x1={STAND.x} y1={STAND.y - 34} x2={STAND.x} y2="788" className={s.filo} />
      <circle cx={STAND.x} cy="788" r="6" className={s.filoTesta} />
      <text x={STAND.x + 26} y="796" className={`${s.lbl} ${s.lblStand}`}>
        Stand 25
      </text>
      <text x={STAND.x + 26} y="846" className={`${s.lbl} ${s.lblStandNome}`}>
        <tspan x={STAND.x + 26}>TriesteVillas</tspan>
        <tspan x={STAND.x + 26} dy="1.1em">
          × Metroarea
        </tspan>
      </text>

      <g transform={`translate(${STAND.x} ${STAND.y})`}>
        <circle r="30" className={s.onda} />
        <circle r="30" className={`${s.onda} ${s.onda2}`} />
        <circle r="30" className={s.spillo} />
        <rect x="-11" y="-8" width="22" height="16" rx="2.5" className={s.spilloStand} />
        <path d="M-11 -3H11" className={s.spilloTenda} />
      </g>
    </svg>
  );
}
