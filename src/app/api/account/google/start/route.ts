import { startAccountGoogleFlow } from "@/lib/account/google";

export const runtime = "nodejs";

// Step 1 del Google SSO dell'area clienti. Inattivo (503) finché
// GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET non sono configurati sul progetto.
export async function GET() {
  return startAccountGoogleFlow();
}
