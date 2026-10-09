// Lo spazio personale già pronto (benvenuto.ts, modulo gemello): come si legge
// la risposta della porta del CRM e quale pagina mostra /account/benvenuto.
// Stesso stile degli altri test: niente runner, `tsc` puro e node; exit 1 alla
// prima differenza. Fixture INVENTATE: gettoni, email e id di scheda non
// esistono da nessuna parte.
//
// IL METRO DEVE SAPER DIRE DI NO: la regola «ogni risposta che non è un sì è un
// link che non vale» (`ingenua`, qui sotto) deve risultare in difetto sul caso
// per cui la distinzione è nata — la porta giù davanti a un cliente col link
// buono, a cui non si dice «il tuo link non vale».
import {
  aggancioLead,
  gettoneBuono,
  leggiRispostaInvito,
  sceltaVista,
  type InvitoLetto,
  type Vista,
} from "./benvenuto";

let falliti = 0;
function pari(nome: string, avuto: unknown, atteso: unknown) {
  const a = JSON.stringify(avuto);
  const b = JSON.stringify(atteso);
  if (a === b) return;
  falliti += 1;
  console.error(`✗ ${nome}: atteso ${b}, avuto ${a}`);
}

const K = "AbCdEfGhIjKlMnOpQrStUvWxYz012-_9"; // 32 caratteri base64url, come li conia il CRM
const LEAD = "recInventato12345"; // rec + 14
const OK: InvitoLetto = { tipo: "ok", email: "cliente@example.com", nome: "Anna Prova", lingua: "it", leadRec: LEAD };

// ── il gettone ────────────────────────────────────────────────────────────────
pari("gettone del CRM", gettoneBuono(K), true);
pari("gettone più lungo domani", gettoneBuono(K + K), true);
pari("troppo corto", gettoneBuono("abc"), false);
pari("vuoto", gettoneBuono(""), false);
pari("con caratteri fuori alfabeto", gettoneBuono(K.slice(0, 31) + "/"), false);
pari("con spazio", gettoneBuono(K.slice(0, 31) + " "), false);
pari("ripetuto nella query (array)", gettoneBuono([K, K]), false);
pari("assente", gettoneBuono(undefined), false);
pari("oltre 128", gettoneBuono("a".repeat(129)), false);

// ── la risposta della porta ───────────────────────────────────────────────────
pari(
  "sì ben fatto",
  leggiRispostaInvito(200, { ok: true, email: " Cliente@Example.com ", nome: " Anna Prova ", lingua: "de", leadRec: LEAD, scaduto: false }),
  { tipo: "ok", email: "cliente@example.com", nome: "Anna Prova", lingua: "de", leadRec: LEAD },
);
pari(
  "sì per un lead nato nel CRM",
  leggiRispostaInvito(200, { ok: true, email: "cliente@example.com", nome: "Anna", lingua: "en", leadRec: null, scaduto: false }),
  { tipo: "ok", email: "cliente@example.com", nome: "Anna", lingua: "en", leadRec: null },
);
// Un id che non ha la forma di una scheda non arriva mai a createAccount: con
// typecast CREEREBBE una scheda con quel nome.
pari(
  "leadRec locale: non si aggancia",
  leggiRispostaInvito(200, { ok: true, email: "cliente@example.com", nome: "", lingua: "it", leadRec: "locale:123" }),
  { tipo: "ok", email: "cliente@example.com", nome: "", lingua: "it", leadRec: null },
);
pari(
  "lingua sconosciuta → italiano",
  leggiRispostaInvito(200, { ok: true, email: "cliente@example.com", nome: "Anna", lingua: "sl", leadRec: null }),
  { tipo: "ok", email: "cliente@example.com", nome: "Anna", lingua: "it", leadRec: null },
);
pari("sì con scaduto vero: vince la prudenza", leggiRispostaInvito(200, { ok: true, email: "cliente@example.com", scaduto: true }), {
  tipo: "no",
  motivo: "scaduto",
});
pari("sì senza email", leggiRispostaInvito(200, { ok: true, nome: "Anna" }).tipo, "guasto");
pari("sì con email storta", leggiRispostaInvito(200, { ok: true, email: "non-una-email" }).tipo, "guasto");
pari("sì con stato 500", leggiRispostaInvito(500, { ok: true, email: "cliente@example.com" }).tipo, "guasto");
for (const motivo of ["sconosciuto", "scaduto", "usato", "marchio"] as const) {
  pari(`no «${motivo}» con 200`, leggiRispostaInvito(200, { ok: false, motivo }), { tipo: "no", motivo });
  pari(`no «${motivo}» con 410`, leggiRispostaInvito(410, { ok: false, motivo }), { tipo: "no", motivo });
}
pari("no con motivo inventato", leggiRispostaInvito(400, { ok: false, motivo: "boh" }).tipo, "guasto");
pari("firma rifiutata (401)", leggiRispostaInvito(401, { error: "firma" }).tipo, "guasto");
pari("azione sconosciuta (400)", leggiRispostaInvito(400, { ok: false, error: "azione" }).tipo, "guasto");
pari("corpo non JSON", leggiRispostaInvito(502, null).tipo, "guasto");
pari("corpo stringa", leggiRispostaInvito(200, "ok").tipo, "guasto");

// ── la pagina da mostrare ─────────────────────────────────────────────────────
const base = { gettone: K, servizio: true, invito: OK, account: "non c'è" as const, sessioneEmail: null };
pari("tutto buono, nessun account → il modulo", sceltaVista(base), "attiva");
pari("area clienti non configurata", sceltaVista({ ...base, servizio: false }), "guasto");
pari("gettone storto (non si chiede alla porta)", sceltaVista({ ...base, gettone: "x", invito: null, account: null }), "non-valido");
pari("gettone assente", sceltaVista({ ...base, gettone: undefined, invito: null, account: null }), "non-valido");
pari("porta giù", sceltaVista({ ...base, invito: { tipo: "guasto", perche: "rete" }, account: null }), "guasto");
pari("porta non interrogata", sceltaVista({ ...base, invito: null, account: null }), "guasto");
pari("scaduto", sceltaVista({ ...base, invito: { tipo: "no", motivo: "scaduto" }, account: null }), "scaduto");
pari("usato → lo spazio c'è già", sceltaVista({ ...base, invito: { tipo: "no", motivo: "usato" }, account: null }), "gia-attivo");
pari("sconosciuto", sceltaVista({ ...base, invito: { tipo: "no", motivo: "sconosciuto" }, account: null }), "non-valido");
pari("dell'altro sito", sceltaVista({ ...base, invito: { tipo: "no", motivo: "marchio" }, account: null }), "non-valido");
pari("account già lì, nessuna sessione", sceltaVista({ ...base, account: "c'è" }), "esiste");
pari("account già lì, sessione di un altro", sceltaVista({ ...base, account: "c'è", sessioneEmail: "altro@example.com" }), "esiste");
pari("account già lì, è proprio lui", sceltaVista({ ...base, account: "c'è", sessioneEmail: " Cliente@Example.com " }), "dentro");
// Una sessione aperta non basta se l'account con quell'email non c'è: «dentro»
// vuol dire «è entrato nel SUO spazio», e lo si dice al CRM.
pari("sessione con l'email giusta ma nessun account", sceltaVista({ ...base, sessioneEmail: "cliente@example.com" }), "attiva");
pari("lettura account fallita: niente modulo", sceltaVista({ ...base, account: "guasto" }), "guasto");
pari("lettura account non fatta: niente modulo", sceltaVista({ ...base, account: null }), "guasto");

// ── il metro sa dire di no ────────────────────────────────────────────────────
const ingenua = (x: { invito: InvitoLetto | null }): Vista => (x.invito?.tipo === "ok" ? "attiva" : "non-valido");
const portaGiu = { ...base, invito: { tipo: "guasto", perche: "rete" } as InvitoLetto, account: null };
pari("la regola ingenua sbaglia proprio qui", ingenua(portaGiu) === sceltaVista(portaGiu), false);

// ── l'aggancio al lead ────────────────────────────────────────────────────────
pari("con la scheda: quella", aggancioLead(LEAD), { leadId: LEAD });
pari("senza scheda: nessuna, e nessuna nuova", aggancioLead(null), { senzaLead: true });
pari("id storto: nessuna", aggancioLead("recCorto"), { senzaLead: true });
pari("id locale: nessuna", aggancioLead("locale:abc"), { senzaLead: true });

if (falliti) {
  console.error(`✗ benvenuto.test: ${falliti} differenze`);
  process.exit(1);
}
console.log("✓ benvenuto.test: lettura della porta, scelta della pagina e aggancio al lead");
