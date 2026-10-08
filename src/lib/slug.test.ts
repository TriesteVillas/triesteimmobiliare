// Casi noti dello slug delle schede (08/10/2026): la risoluzione di uno slug
// che non c'è più (risolviSlug: 308 allo slug di oggi o 404) e il controllo dei
// doppioni (conSlugUnici). Gira da `npm test`, quindi dal prebuild.
// Codici e nomi INVENTATI: questo repo è pubblico.
import { conSlugUnici, risolviSlug } from "./properties";

let falliti = 0;
function pari(nome: string, avuto: unknown, atteso: unknown) {
  if (JSON.stringify(avuto) !== JSON.stringify(atteso)) {
    falliti++;
    console.error(`✗ ${nome}: avuto ${JSON.stringify(avuto)}, atteso ${JSON.stringify(atteso)}`);
  }
}

const catalogo = [
  { id: "TSV-PROP-0851", slug: "bilocale-rinnovato-sul-giardino-0851" },
  { id: "TSV-PROP-0008", slug: "attico-con-terrazza-sul-golfo-0008" },
  { id: "TSV-PROP-0098", slug: "bilocale-primo-piano-con-terrazza-0098" },
  { id: "TSV-PROP-PROVA", slug: "bilocale-con-terrazza-e-vista-citta-0" },
  { id: "CODICE_PROVA", slug: "villa-indipendente-con-giardino-0" },
  { id: "TSV-PROP-CANTIERE-M2A9", slug: "cantiere-app-9-quarto-piano-9" },
  { id: "TSV-PROP-CANTIERE-M4A9", slug: "cantiere-app-9-quinto-piano-9" },
];
const dove = (slug: string) => {
  const e = risolviSlug(slug, catalogo);
  return e.tipo === "assente" ? "assente" : `${e.tipo}:${e.property.id}`;
};

// 0) lo slug di oggi → la scheda
pari("slug esatto", dove("bilocale-rinnovato-sul-giardino-0851"), "esatto:TSV-PROP-0851");
// 1) stesso numero di catalogo, nome pubblico cambiato → 308 alla scheda viva
pari("numero identico, nome cambiato", dove("vecchio-nome-della-casa-0851"), "sposta:TSV-PROP-0851");
// 2) il link aveva perso il numero: la stessa base, una sola scheda → 308
pari("stessa base senza numero", dove("attico-con-terrazza-sul-golfo"), "sposta:TSV-PROP-0008");
// 3) «-0» non identifica nessuno
pari("coda -0", dove("villa-qualunque-0"), "assente");
// 4) due schede con lo stesso numero: nessun rimando a caso
pari("numero ambiguo", dove("cantiere-app-9"), "assente");
// 5) niente che porti a una casa → 404
pari("senza numero, base sconosciuta", dove("casa-che-non-ce-piu"), "assente");
pari("numero sconosciuto", dove("casa-qualunque-4242"), "assente");

// conSlugUnici: gli slug esistenti non cambiano; un doppione prende un'impronta
const unici = conSlugUnici([
  { id: "B-CODICE", slug: "villa-con-giardino-0" },
  { id: "A-CODICE", slug: "villa-con-giardino-0" },
  { id: "TSV-PROP-0098", slug: "bilocale-primo-piano-con-terrazza-0098" },
]);
pari("primo in ordine di codice invariato", unici.find((p) => p.id === "A-CODICE")?.slug, "villa-con-giardino-0");
pari("slug senza doppioni invariato", unici.find((p) => p.id === "TSV-PROP-0098")?.slug, "bilocale-primo-piano-con-terrazza-0098");
const secondo = unici.find((p) => p.id === "B-CODICE")?.slug ?? "";
pari("doppione con impronta", /^villa-con-giardino-0-[0-9a-z]{1,5}$/.test(secondo), true);
pari("impronta senza il codice in chiaro", secondo.includes("codice"), false);
pari("tutti diversi", new Set(unici.map((p) => p.slug)).size, 3);
pari("l'impronta è stabile", conSlugUnici([...unici].reverse()).find((p) => p.id === "B-CODICE")?.slug, secondo);
// lo slug con l'impronta si apre come scheda esatta, non come rimando
pari("il doppione si apre", risolviSlug(secondo, unici).tipo, "esatto");
// senza doppioni la lista torna identica (stesso oggetto)
pari("nessun doppione, nessuna copia", conSlugUnici(catalogo) === catalogo, true);

if (falliti) {
  console.error(`✗ slug.test: ${falliti} casi falliti`);
  process.exit(1);
}
console.log("✓ slug.test: tutti i casi noti passano");
