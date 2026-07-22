import "server-only";
import { cookies } from "next/headers";
import { ACCT_COOKIE, verifyAcctSession, type AcctSession } from "./session";
import { getAccount, type WebAccount } from "./store";

// L'account autenticato e ancora Attivo per questa request, o null.
// Ri-verifica Airtable a ogni chiamata (pattern Owner Portal): un account
// sospeso/cancellato smette di funzionare alla navigazione successiva, anche
// se il cookie è ancora crittograficamente valido.
export async function currentWebAccount(): Promise<WebAccount | null> {
  const jar = await cookies();
  const s = await verifyAcctSession(jar.get(ACCT_COOKIE)?.value);
  if (!s) return null;
  const acc = await getAccount(s.uid);
  if (!acc || acc.stato !== "Attivo") return null;
  return acc;
}

// Solo la sessione firmata, SENZA il round-trip Airtable: per l'header, che
// deve solo decidere se mostrare "Accedi" o il nome. Ogni pagina/route che
// tocca dati usa currentWebAccount().
export async function currentAcctSession(): Promise<AcctSession | null> {
  const jar = await cookies();
  return verifyAcctSession(jar.get(ACCT_COOKIE)?.value);
}
