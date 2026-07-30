"use client";

import { useEffect } from "react";
import { ricordaScheda } from "@/lib/listPosition";

// Segnaposto invisibile, montato dalla pagina di una scheda immobile: annota
// quale scheda si sta guardando, così quando si torna a /immobili la lista può
// riaprirsi su quella card invece che in cima. Vedi src/lib/listPosition.ts.
export default function RicordaScheda({ slug }: { slug: string }) {
  useEffect(() => {
    ricordaScheda(slug);
  }, [slug]);
  return null;
}
