import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { currentWebAccount } from "@/lib/account/auth";
import { ACCT_COOKIE } from "@/lib/account/session";
import { logEvent, patchAccount } from "@/lib/account/store";
import { PRIVACY_VERSION } from "@/lib/account/brand";

export const runtime = "nodejs";

// Preferenze dell'account: criteri di ricerca, frequenza digest, consensi,
// recapiti, richiesta di cancellazione. Ogni cambio di consenso aggiorna il
// timestamp + versione informativa (accountability GDPR); la cancellazione è
// un flag (stato Cancellato) + evento — la purga fisica resta un atto manuale.

const DIGESTS = new Set(["Settimanale", "Mensile", "Mai"]);

export async function POST(request: Request) {
  const acc = await currentWebAccount();
  if (!acc) return NextResponse.json({ ok: false, error: "auth" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? "").trim();
  const ua = h.get("user-agent") ?? "";

  // Cancellazione account (GDPR): flag + logout immediato.
  if (body.del === true) {
    await patchAccount(acc.id, { stato: "Cancellato" });
    await logEvent({ evento: "delete_request", accountId: acc.id, email: acc.email, ip, ua });
    const jar = await cookies();
    jar.set(ACCT_COOKIE, "", { path: "/", maxAge: 0 });
    return NextResponse.json({ ok: true, deleted: true });
  }

  const patch: Record<string, unknown> = {};
  const changes: string[] = [];

  if (typeof body.nome === "string" && body.nome.trim().length >= 2) {
    patch.nome = body.nome.trim().slice(0, 120);
    changes.push("nome");
  }
  if (typeof body.telefono === "string") {
    patch.telefono = body.telefono.trim().slice(0, 40);
    changes.push("telefono");
  }
  if (typeof body.criteri === "string") {
    patch.criteri = body.criteri.trim().slice(0, 1000);
    changes.push("criteri");
  }
  if (typeof body.digest === "string" && DIGESTS.has(body.digest)) {
    patch.digest_freq = body.digest;
    changes.push(`digest=${body.digest}`);
  }
  let consChanged = false;
  if (typeof body.consMarketing === "boolean" && body.consMarketing !== acc.consMarketing) {
    patch.consenso_marketing = body.consMarketing;
    consChanged = true;
    changes.push(`marketing=${body.consMarketing ? "sì" : "no"}`);
  }
  if (typeof body.consProfilazione === "boolean" && body.consProfilazione !== acc.consProfilazione) {
    patch.consenso_profilazione = body.consProfilazione;
    consChanged = true;
    changes.push(`profilazione=${body.consProfilazione ? "sì" : "no"}`);
  }
  if (consChanged) {
    patch.consensi_ts = new Date().toISOString();
    patch.note = `Informativa ${PRIVACY_VERSION}`;
  }
  if (!Object.keys(patch).length) return NextResponse.json({ ok: true, noop: true });

  await patchAccount(acc.id, patch);
  if (typeof body.consMarketing === "boolean" && body.consMarketing !== acc.consMarketing) {
    await logEvent({
      evento: body.consMarketing ? "digest_optin" : "digest_optout",
      accountId: acc.id,
      email: acc.email,
      ip,
      ua,
    });
  }
  await logEvent({
    evento: "prefs_update",
    accountId: acc.id,
    email: acc.email,
    dettaglio: changes.join(", "),
    ip,
    ua,
  });
  return NextResponse.json({ ok: true });
}
