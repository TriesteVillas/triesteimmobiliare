import { handleAccountGoogleCallback } from "@/lib/account/google";

export const runtime = "nodejs";

// Step 2 del Google SSO dell'area clienti — callback DEDICATO. Su TriesteVillas
// resta inutilizzato finché questo redirect URI non viene aggiunto al client
// OAuth in Google Cloud Console (poi: ACCOUNT_GOOGLE_CALLBACK=own su Vercel);
// nel frattempo il flusso passa dal callback owner, che smista sullo state.
export async function GET(request: Request) {
  return handleAccountGoogleCallback(request);
}
