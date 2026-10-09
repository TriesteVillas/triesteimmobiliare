// La verifica dell'email dell'area clienti (verifica.ts, modulo gemello).
// Stesso stile degli altri test: niente runner, `tsc` puro e node; exit 1 alla
// prima differenza.
//
// IL METRO DEVE SAPER DIRE DI NO: la regola «basta il clic» (`ingenua`, qui
// sotto) deve risultare in difetto sul caso per cui è nata la regola vera — il
// cliente che apre la mail di un account creato da un altro con la sua email.
import {
  DURATA_VERIFICA_S,
  esitoVerifica,
  firmaVerifica,
  improntaCredenziale,
  leggiVerifica,
  type DatiVerifica,
  type EsitoVerifica,
} from "./verifica";

let falliti = 0;
function pari(nome: string, avuto: unknown, atteso: unknown) {
  const a = JSON.stringify(avuto);
  const b = JSON.stringify(atteso);
  if (a === b) return;
  falliti += 1;
  console.error(`✗ ${nome}: atteso ${b}, avuto ${a}`);
}

const SEGRETO = "segreto-di-prova-lungo-abbastanza";
const ALTRO = "un-altro-segreto-lungo-abbastanza";
const ORA = 1_760_000_000;
const D: DatiVerifica = { uid: "recProva00000001", em: "cliente@example.com" };

async function main() {
  // ── token del link ──────────────────────────────────────────────────────────
  const t = await firmaVerifica(SEGRETO, "TSV", D, ORA);
  pari("andata e ritorno", await leggiVerifica(SEGRETO, "TSV", t, ORA), D);
  pari("ancora buono all'ultimo secondo", await leggiVerifica(SEGRETO, "TSV", t, ORA + DURATA_VERIFICA_S), D);
  pari("scaduto", await leggiVerifica(SEGRETO, "TSV", t, ORA + DURATA_VERIFICA_S + 1), null);
  pari("altro segreto", await leggiVerifica(ALTRO, "TSV", t, ORA), null);
  pari("altro marchio", await leggiVerifica(SEGRETO, "TSI", t, ORA), null);
  pari("vuoto", await leggiVerifica(SEGRETO, "TSV", "", ORA), null);
  pari("senza firma", await leggiVerifica(SEGRETO, "TSV", t.split(".")[0], ORA), null);
  pari("spazzatura", await leggiVerifica(SEGRETO, "TSV", "abc.def", ORA), null);
  pari("segreto vuoto non legge niente", await leggiVerifica("", "TSV", t, ORA), null);

  // Corpo cambiato a mano (altra email), firma vecchia: deve cadere.
  const [corpo, firma] = t.split(".");
  const json = JSON.parse(Buffer.from(corpo, "base64url").toString("utf8"));
  const falso = Buffer.from(JSON.stringify({ ...json, em: "impostore@example.com" })).toString("base64url");
  pari("corpo alterato", await leggiVerifica(SEGRETO, "TSV", `${falso}.${firma}`, ORA), null);

  // Un token di SESSIONE firmato con lo stesso segreto non vale da link: il
  // contesto `k` è diverso. Si costruisce come session.ts (stesso HMAC).
  const sess = Buffer.from(JSON.stringify({ k: "acct", uid: D.uid, em: D.em, b: "TSV", exp: ORA + 3600 })).toString("base64url");
  const chiave = await crypto.subtle.importKey("raw", new TextEncoder().encode(SEGRETO), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const firmaSess = Buffer.from(await crypto.subtle.sign("HMAC", chiave, new TextEncoder().encode(sess))).toString("base64url");
  pari("token di sessione come link", await leggiVerifica(SEGRETO, "TSV", `${sess}.${firmaSess}`, ORA), null);

  let lanciato = false;
  try {
    await firmaVerifica("corto", "TSV", D, ORA);
  } catch {
    lanciato = true;
  }
  pari("firmare con un segreto corto lancia", lanciato, true);

  // ── impronta della credenziale ──────────────────────────────────────────────
  const h1 = "pbkdf2$120000$c2FsZQ$aGFzaDE";
  const h2 = "pbkdf2$120000$c2FsZQ$aGFzaDI";
  const p1 = await improntaCredenziale(SEGRETO, h1);
  pari("impronta stabile", await improntaCredenziale(SEGRETO, h1), p1);
  pari("password nuova, impronta nuova", (await improntaCredenziale(SEGRETO, h2)) === p1, false);
  pari("password tolta, impronta nuova", (await improntaCredenziale(SEGRETO, "")) === p1, false);
  pari("dipende dal segreto", (await improntaCredenziale(ALTRO, h1)) === p1, false);
  pari("non contiene l'hash", p1.includes("aGFzaDE"), false);
  pari("lunghezza", p1.length, 22);

  // ── la regola del clic ──────────────────────────────────────────────────────
  const acc = { id: D.uid, email: D.em, stato: "Attivo", verificata: false };
  const casi: Array<[string, Parameters<typeof esitoVerifica>[0], EsitoVerifica]> = [
    ["chi si è appena registrato, stesso browser", { dati: D, account: acc, sessioneDi: D.uid, passwordGiusta: false }, "ok"],
    ["dal telefono, con la password", { dati: D, account: acc, sessioneDi: null, passwordGiusta: true }, "ok"],
    // IL CASO: l'impostore ha creato l'account con l'email del cliente; la
    // mail arriva al cliente, che clicca senza sessione né password.
    ["il padrone della casella, ignaro", { dati: D, account: acc, sessioneDi: null, passwordGiusta: false }, "credenziale"],
    ["sessione di un altro account", { dati: D, account: acc, sessioneDi: "recAltro00000001", passwordGiusta: false }, "credenziale"],
    ["già verificato", { dati: D, account: { ...acc, verificata: true }, sessioneDi: null, passwordGiusta: false }, "gia"],
    ["token falso", { dati: null, account: acc, sessioneDi: D.uid, passwordGiusta: true }, "token"],
    ["account sparito", { dati: D, account: null, sessioneDi: D.uid, passwordGiusta: true }, "token"],
    ["account di un altro", { dati: D, account: { ...acc, id: "recAltro00000001" }, sessioneDi: D.uid, passwordGiusta: true }, "token"],
    ["email cambiata", { dati: D, account: { ...acc, email: "altra@example.com" }, sessioneDi: D.uid, passwordGiusta: true }, "token"],
    ["sospeso", { dati: D, account: { ...acc, stato: "Sospeso" }, sessioneDi: D.uid, passwordGiusta: true }, "token"],
  ];
  for (const [nome, x, atteso] of casi) pari(`clic: ${nome}`, esitoVerifica(x), atteso);

  // La regola ingenua — «il link è buono, quindi si verifica» — sbaglia proprio
  // il caso del cliente ignaro: è il buco che la regola vera chiude.
  const ingenua = (x: Parameters<typeof esitoVerifica>[0]): EsitoVerifica =>
    x.dati && x.account && !x.account.verificata ? "ok" : "token";
  const ignaro = casi[2][1];
  pari("la regola ingenua cade sul cliente ignaro", ingenua(ignaro) === esitoVerifica(ignaro), false);

  if (falliti) {
    console.error(`✗ verifica: ${falliti} casi falliti`);
    process.exit(1);
  }
  console.log("✓ verifica: tutti i casi");
}

main().catch((e) => {
  console.error("✗ verifica: errore", e);
  process.exit(1);
});
