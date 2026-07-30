"use client";

// Tornare alla lista dove la si era lasciata.
//
// Il problema: si scorre /immobili, si apre una scheda, si preme indietro — e la
// lista riparte dall'alto. Con cinquanta immobili vuol dire riscorrere ogni
// volta, e in pratica si smette di guardare oltre i primi.
//
// Perché il ripristino nativo del browser non basta: la griglia è costruita da un
// componente client con i filtri, quindi al ritorno viene rimontata e l'altezza
// che il browser aveva memorizzato in quel momento non esiste ancora. Ci si
// ancora invece alla SCHEDA: il suo `data-slug` è stabile, e le card hanno un
// aspect-ratio fisso, quindi l'altezza sopra di essa non cambia mentre le foto
// arrivano.
//
// A registrare è la SCHEDA APERTA, non il click sulla lista: così una freccia
// premuta sullo slider di una card non lascia in giro una posizione fantasma da
// consumare a sproposito la prossima volta che si passa da /immobili.

const CHIAVE = "immobili:ultima-scheda";

export function ricordaScheda(slug: string): void {
  try {
    sessionStorage.setItem(CHIAVE, slug);
  } catch {
    // sessionStorage può mancare (storage bloccato in iframe, vecchie
    // navigazioni private). Perdere la posizione è tollerabile.
  }
}

/** Legge E consuma: il ripristino vale una volta sola, per il ritorno. */
function consumaScheda(): string | null {
  try {
    const slug = sessionStorage.getItem(CHIAVE);
    if (slug) sessionStorage.removeItem(CHIAVE);
    return slug;
  } catch {
    return null;
  }
}

/**
 * Riporta la vista sulla scheda aperta l'ultima volta. Da chiamare in un effect
 * al montaggio della lista.
 *
 * `block: "center"` e non `"start"`: la pillola dell'header è fissa e coprirebbe
 * una card allineata in cima. Al centro si vedono anche le card precedenti, che
 * sono il contesto per capire dove si era rimasti.
 */
export function ripristinaPosizione(): void {
  const slug = consumaScheda();
  if (!slug) return;
  // Due rAF: il primo lascia a React il tempo di dipingere la griglia, il
  // secondo di applicarne il layout. Senza, scrollIntoView misura un DOM che
  // non c'è ancora.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(`[data-slug="${CSS.escape(slug)}"]`)
        // Se la scheda non c'è più (venduta, o fuori da un filtro attivo) non si
        // fa nulla: saltare a un punto a caso sarebbe peggio che restare in cima.
        ?.scrollIntoView({ block: "center", behavior: "instant" });
    });
  });
}
