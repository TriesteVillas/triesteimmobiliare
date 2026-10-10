// La provenienza delle richieste (lib/provenienza.ts, modulo gemello): la parte
// che gira sul server — pulizia e lettura dall'intestazione. Exit 1 alla prima
// differenza. Si esegue col resto dei test (`npm test`, scripts/run-tests.mjs).
import { pulisciProvenienza, provenienzaDaIntestazione, rigaProvenienza, type Provenienza } from "./provenienza";

let falliti = 0;
function vero(nome: string, cond: boolean, dettaglio = "") {
  if (cond) return;
  falliti += 1;
  console.error(`✗ ${nome}${dettaglio ? `: ${dettaglio}` : ""}`);
}

const p: Provenienza = { ingresso: "/it/annuncio/villa-x?utm_source=crm&utm_medium=email", referrer: "google.com/", utm: { source: "crm", medium: "email", campaign: "conferma-visita" }, annuncio: "google", pagina: "/it/contatti" };
const json = JSON.stringify(p);

// L'intestazione arriva codificata (un percorso può avere lettere accentate).
const letta = provenienzaDaIntestazione(encodeURIComponent(json));
// Confronto per campo: la pulizia ricompone l'oggetto, l'ordine delle chiavi può cambiare.
vero("dall'intestazione si legge la stessa provenienza",
  !!letta && letta.ingresso === p.ingresso && letta.referrer === p.referrer && letta.pagina === p.pagina
    && letta.annuncio === p.annuncio && JSON.stringify(letta.utm) === JSON.stringify(p.utm), JSON.stringify(letta));
vero("un percorso con l'accento sopravvive", provenienzaDaIntestazione(encodeURIComponent(JSON.stringify({ ingresso: "/it/città" })))?.ingresso === "/it/città");
vero("intestazione assente → null", provenienzaDaIntestazione(null) === null && provenienzaDaIntestazione("") === null);
vero("intestazione rotta → null, senza eccezioni", provenienzaDaIntestazione("%E0%A4%A") === null);
vero("intestazione enorme → null", provenienzaDaIntestazione("x".repeat(7000)) === null);

// La pulizia: solo le chiavi note, lunghezze fisse.
const sporca = pulisciProvenienza(JSON.stringify({ ingresso: "https://evil.example/x", referrer: "javascript:alert(1)", annuncio: "tiktok", gclid: "abc", utm: { source: "x".repeat(300), foo: "bar" }, pagina: "/ok" }));
vero("i dati sporchi restano fuori", !!sporca && !sporca.ingresso && !sporca.referrer && !sporca.annuncio && !("gclid" in sporca) && sporca.utm?.source?.length === 80 && sporca.pagina === "/ok", JSON.stringify(sporca));
vero("spazzatura → null", pulisciProvenienza("non json") === null && pulisciProvenienza(42) === null);
vero("la riga leggibile", rigaProvenienza(p).startsWith("Provenienza: crm / email · campagna conferma-visita · clic da annuncio google"), rigaProvenienza(p));

if (falliti) {
  console.error(`${falliti} prove fallite`);
  process.exit(1);
}
console.log("✓ provenienza: tutte le prove passate");
