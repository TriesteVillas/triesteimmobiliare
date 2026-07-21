// La soglia che rende VERA la promessa fatta nel form.
//
// Il form di richiesta accesso dice al visitatore: se ti presenti, l'accesso che
// riceverai dura più del minimo di 15 giorni. Perché non sia una frase di marketing
// scollegata dai fatti, il CRM (pannello Private Collection) pre-seleziona 30 giorni
// invece di 15 quando `intro` supera questa soglia. Nessuna automazione emette il
// codice da sola su questa base: l'ultima parola resta all'operatore.
//
// ⚠️ QUESTA COSTANTE VIVE IN DUE REPO. Qui decide solo il feedback visivo mentre il
// visitatore scrive ("stai per ottenere l'accesso esteso"); a decidere davvero la
// durata è la stessa soglia replicata in `tsv-crm/src/components/Views10.tsx`
// (INTRO_RICH_MIN). Se cambi il numero qui e non lì, il form promette una cosa e il
// pannello ne propone un'altra — cioè esattamente il fallimento che questa soglia
// esiste per evitare. Non c'è modo di condividerla: sono due repo distinti.
//
// 30 caratteri: la scelta è di Martino (2026-07-21). È sopra il rumore ("cerco casa",
// "grazie") e sotto la soglia di fatica che scoraggia chi scrive dal telefono.
export const INTRO_RICH_MIN = 30;

/** True quando la presentazione è abbastanza sostanziosa da valere l'accesso esteso. */
export function introIsRich(intro: string): boolean {
  return intro.trim().length > INTRO_RICH_MIN;
}
