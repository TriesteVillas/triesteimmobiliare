// Lo spazio personale già pronto (09/10/2026): la parte PURA della pagina
// /account/benvenuto e della sua rotta — come si legge la risposta della porta
// del CRM e quale pagina si mostra.
//
// IL CASO. A chi ha visitato una casa con noi il CRM manda un LINK PERSONALE:
// un clic, una password, ed è dentro, con nome ed email già compilati. Nessuno
// spazio nasce senza quel gesto del cliente, nessuna password viaggia in una
// mail, e nell'indirizzo non c'è nessun dato personale: solo un gettone opaco.
// A chi appartiene lo dice il CRM, dalla porta firmata della Private Collection
// (azione `account-invito`); il marchio lo decide la porta, quindi un gettone
// dell'altro sito qui non si riscatta. L'account lo scrive questo sito
// (store.ts, createAccount), come ogni altro account dell'area clienti.
//
// MODULO GEMELLO: identico in triestevillas-web e triesteimmobiliare. Niente
// import, così si prova con `tsc` e node (benvenuto.test.ts).

/** Il gettone del link. Il CRM lo conia da 24 byte casuali in base64url (32
 *  caratteri): qui si accetta la forma, non la lunghezza esatta, così un
 *  gettone più lungo domani non rompe la pagina. Tutto il resto non va
 *  nemmeno alla porta. */
export function gettoneBuono(k: unknown): k is string {
  return typeof k === "string" && /^[A-Za-z0-9_-]{16,128}$/.test(k);
}

/** Perché il CRM dice di no. Sono le sole quattro risposte che sono un VERDETTO. */
export type MotivoNo = "sconosciuto" | "scaduto" | "usato" | "marchio";

/** Come chiude un invito, detto al CRM (azione `account-invito-usato`). */
export type EsitoInvito = "creato" | "esisteva" | "google";

export type InvitoLetto =
  /** Il gettone è buono: a chi appartiene. `leadRec` = la scheda lead a cui
   *  agganciare l'account, se il lead ha un id del vecchio impianto; `null` per
   *  i lead nati nel CRM, che da qui non si agganciano e non si ricreano. */
  | { tipo: "ok"; email: string; nome: string; lingua: "it" | "en" | "de"; leadRec: string | null }
  /** Il CRM ha guardato e dice di no. */
  | { tipo: "no"; motivo: MotivoNo }
  /** Non lo sappiamo: porta irraggiungibile, segreto sbagliato, risposta
   *  strana. Non è un «no»: dire a chi ha un link buono che non vale sarebbe
   *  una bugia, e la pagina lo dice diversamente. */
  | { tipo: "guasto"; perche: string };

const MOTIVI: readonly string[] = ["sconosciuto", "scaduto", "usato", "marchio"];
const LINGUE: readonly string[] = ["it", "en", "de"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** La forma dell'id di una scheda lead del vecchio impianto. Si controlla qui
 *  e di nuovo in store.ts: nel campo collegato, con typecast, un valore di
 *  un'altra forma CREEREBBE una scheda nuova con quel nome. */
const LEAD_REC = /^rec[A-Za-z0-9]{14}$/;

/**
 * La risposta della porta, letta senza fidarsi. `stato` è lo stato HTTP.
 * Un «no» con un motivo noto vale qualunque sia lo stato (la porta può
 * rispondere 200 o 4xx); un «sì» vale solo con 2xx e un'email ben fatta.
 * Tutto il resto — 401 di firma, 400 di azione sconosciuta, 500 — è un guasto.
 */
export function leggiRispostaInvito(stato: number, corpo: unknown): InvitoLetto {
  const c = (corpo && typeof corpo === "object" ? corpo : {}) as Record<string, unknown>;
  if (c.ok === false && typeof c.motivo === "string" && MOTIVI.includes(c.motivo)) {
    return { tipo: "no", motivo: c.motivo as MotivoNo };
  }
  if (c.ok === true && stato >= 200 && stato < 300) {
    // Il contratto dice `scaduto: false` su ogni «sì»: se mai arrivasse vero,
    // vince la prudenza.
    if (c.scaduto === true) return { tipo: "no", motivo: "scaduto" };
    const email = typeof c.email === "string" ? c.email.trim().toLowerCase() : "";
    if (!EMAIL.test(email)) return { tipo: "guasto", perche: "risposta senza un'email valida" };
    const nome = typeof c.nome === "string" ? c.nome.trim().slice(0, 120) : "";
    const lingua = typeof c.lingua === "string" && LINGUE.includes(c.lingua) ? (c.lingua as "it" | "en" | "de") : "it";
    const leadRec = typeof c.leadRec === "string" && LEAD_REC.test(c.leadRec) ? c.leadRec : null;
    return { tipo: "ok", email, nome, lingua, leadRec };
  }
  return { tipo: "guasto", perche: `risposta inattesa (http ${stato})` };
}

/** Le pagine che /account/benvenuto sa mostrare. */
export type Vista =
  /** Il modulo: password, informativa, consensi. */
  | "attiva"
  /** C'è già un account con quell'email su questo sito: si entra. */
  | "esiste"
  /** C'è, ed è proprio quello aperto in questo browser. */
  | "dentro"
  /** Il link è già stato usato (da qui o da un suo gemello): lo spazio c'è. */
  | "gia-attivo"
  | "scaduto"
  /** Gettone mancante, malformato, sconosciuto o dell'altro sito. */
  | "non-valido"
  /** Non riusciamo a saperlo adesso. */
  | "guasto";

export function sceltaVista(x: {
  gettone: unknown;
  /** L'area clienti di questo sito è configurata (segreto della sessione). */
  servizio: boolean;
  invito: InvitoLetto | null;
  /** C'è già un account con l'email dell'invito? `null` = non chiesto,
   *  "guasto" = chiesto senza risposta. */
  account: "c'è" | "non c'è" | "guasto" | null;
  /** L'email della sessione aperta in questo browser, se c'è. */
  sessioneEmail: string | null;
}): Vista {
  if (!x.servizio) return "guasto";
  if (!gettoneBuono(x.gettone)) return "non-valido";
  const inv = x.invito;
  if (!inv || inv.tipo === "guasto") return "guasto";
  if (inv.tipo === "no") {
    if (inv.motivo === "scaduto") return "scaduto";
    // «Usato» vuol dire che uno spazio per questa persona su questo sito c'è
    // già — l'ha attivato lei, da questo link o da un altro che le avevamo
    // mandato: la cosa utile da dirle è come entrare, non che il link è rotto.
    if (inv.motivo === "usato") return "gia-attivo";
    return "non-valido";
  }
  if (x.account === "c'è") {
    const sess = (x.sessioneEmail ?? "").trim().toLowerCase();
    return sess && sess === inv.email ? "dentro" : "esiste";
  }
  if (x.account === "non c'è") return "attiva";
  // Senza sapere se l'account c'è non si offre il modulo: la rotta lo
  // richiederebbe comunque, e fallirebbe allo stesso modo.
  return "guasto";
}

/** Come si aggancia al lead l'account nato dall'invito: con `leadRec` quella
 *  scheda e nessun'altra; senza, nessuna (store.ts, createAccount). */
export function aggancioLead(leadRec: string | null): { leadId: string } | { senzaLead: true } {
  return leadRec && LEAD_REC.test(leadRec) ? { leadId: leadRec } : { senzaLead: true };
}
