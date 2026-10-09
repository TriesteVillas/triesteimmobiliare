import "server-only";
import { cookies } from "next/headers";
import { ACCT_COOKIE, acctGateConfigured, credFingerprint, verifyAcctSession, type AcctSession } from "./session";
import { getAccount, type WebAccount } from "./store";

// L'account autenticato e ancora Attivo per questa request, o null.
// Ri-verifica Airtable a ogni chiamata (pattern Owner Portal): un account
// sospeso/cancellato smette di funzionare alla navigazione successiva, anche
// se il cookie è ancora crittograficamente valido.
//
// Dal 09/10/2026 anche la password: la sessione porta l'impronta (pf) della
// password con cui è nata, e se nel frattempo la password è cambiata — un
// reset, o tolta perché Google ha provato la casella di un account mai
// verificato — la sessione cade. È ciò che chiude fuori chi avesse aperto
// l'account con l'email di un altro, nel momento in cui il vero titolare
// prende possesso della casella (verifica.ts). I cookie senza `pf` (di prima)
// cadono una volta sola.
export async function currentWebAccount(): Promise<WebAccount | null> {
  if (!acctGateConfigured()) return null;
  const jar = await cookies();
  const s = await verifyAcctSession(jar.get(ACCT_COOKIE)?.value);
  if (!s) return null;
  const acc = await getAccount(s.uid);
  if (!acc || acc.stato !== "Attivo") return null;
  if (!s.pf || s.pf !== (await credFingerprint(acc.hash))) return null;
  return acc;
}

// Solo la sessione firmata, SENZA il round-trip Airtable: per l'header, che
// deve solo decidere se mostrare "Accedi" o il nome. Ogni pagina/route che
// tocca dati usa currentWebAccount(): questa non sa se l'account è sospeso, se
// la password è cambiata né se l'email è verificata.
export async function currentAcctSession(): Promise<AcctSession | null> {
  const jar = await cookies();
  return verifyAcctSession(jar.get(ACCT_COOKIE)?.value);
}
