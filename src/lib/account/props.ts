import "server-only";
import { getProperties, getPrivateProperties } from "../airtable";
import type { Property } from "../properties";

// Risoluzione slug → immobile fatta SEMPRE server-side (stessa regola del
// tracker PC): il client manda solo lo slug, titolo e recId li decide il
// server, così i log non contengono mai testo inventato dal client e il CRM
// vede un nome solo per immobile. Copre anche gli immobili riservati: un
// utente con accesso PC può cuorare/aprire anche quelli.
export async function resolveSiteProp(slug: string): Promise<Property | null> {
  if (!slug) return null;
  const pub = await getProperties();
  const hit = pub.find((p) => p.slug === slug);
  if (hit) return hit;
  try {
    const priv = await getPrivateProperties();
    return priv.find((p) => p.slug === slug) ?? null;
  } catch {
    return null;
  }
}
