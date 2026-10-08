// L'indirizzo del CRM (tsv-pg), UNA costante per tutto il sito (08/10/2026).
// Fino a oggi l'host era scritto come ripiego in sei punti diversi (vetrina,
// trasparenza, porta dei moduli, porta della Private Collection, coda delle
// richieste): il giorno in cui il CRM cambia dominio si cambia QUI, o con la
// variabile CRM_BASE_URL su Vercel, senza toccare altro. Le variabili più
// strette che già esistono (VETRINA_URL, INGRESSO_URL, PC_PORTA_URL) restano
// e vincono, per i collaudi su un server di prova.
export const CRM_ORIGIN = (process.env.CRM_BASE_URL ?? "https://tsv-pg.vercel.app").replace(/\/+$/, "");

/** Un percorso del CRM («/api/vetrina») come URL assoluto. */
export function crmUrl(percorso: string): string {
  return `${CRM_ORIGIN}${percorso.startsWith("/") ? "" : "/"}${percorso}`;
}
