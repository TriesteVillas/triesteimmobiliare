import { NextResponse } from "next/server";
import { currentWebAccount } from "@/lib/account/auth";
import { listPrefsByEmail } from "@/lib/account/store";

export const runtime = "nodejs";

// Idratazione client: chi sono, quali cuori/voti ho. Una sola chiamata per
// pagina (il favstore la cachea a modulo), niente dati sensibili.
export async function GET() {
  const acc = await currentWebAccount();
  if (!acc) return NextResponse.json({ ok: false }, { status: 401 });
  const prefs = await listPrefsByEmail(acc.email);
  const votes: Record<string, "up" | "down"> = {};
  for (const p of prefs) {
    if (p.voto === "Like") votes[p.slug] = "up";
    if (p.voto === "Dislike") votes[p.slug] = "down";
  }
  return NextResponse.json({
    ok: true,
    nome: acc.nome.split(" ")[0] || acc.nome,
    email: acc.email,
    favs: prefs.filter((p) => p.cuore).map((p) => p.slug),
    alerts: prefs.filter((p) => p.avvisoPrezzo).map((p) => p.slug),
    votes,
    consMarketing: acc.consMarketing,
    consProfilazione: acc.consProfilazione,
    digest: acc.digest || "Mai",
    criteri: acc.criteri,
    telefono: acc.telefono,
  });
}
