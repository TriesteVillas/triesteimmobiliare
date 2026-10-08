@AGENTS.md

# triesteimmobiliare.com — regole del repo

⚠️ **Questo repo è PUBBLICO su GitHub.** Niente nomi interni degli immobili, niente nomi
di proprietari, niente identificativi Airtable (base, tabelle, campi, record), niente dati
reali: né nei file, né nei commenti, né nei messaggi di commit. Un immobile si chiama col
nome pubblico o col codice `TSV-PROP-…`.

## Pubblicare

- Pubblicare = `git push` su `main`: Vercel è collegato a git. **Mai `vercel --prod`.**
- Più sessioni lavorano su questo repo: ognuna in un `git worktree` suo, creato da
  `origin/main`. Prima del push `git fetch origin && git rebase origin/main`; `git add` per
  path; mai `--force`, mai `stash`/`reset`/`checkout` sul lavoro altrui.
- Il commit deve avere un autore autorizzato su Vercel, altrimenti il deploy resta
  `BLOCKED` senza avvisare.
- Prima del push: `npm run prebuild` (i cancelli: Analytics, messaggi, registro video,
  etichette AI, dotazioni) e `npx tsc --noEmit`.
- La produzione si verifica dallo SHA (`targets.production.meta.githubCommitSha`) insieme a
  `targets.production.readyState` = `READY`: lo SHA cambia già mentre il deploy è in build.

## Testi

- Stanno in `messages/{it,en,de,sl}.json` (stesse chiavi di `en.json`, controllate dal
  prebuild), in `src/content/**` e nelle pagine di contenuto (es. `/privacy`).
- Recapiti: telefono e WhatsApp **331 8940822** (in EN/DE/SL si scrive +39 331 8940822);
  mail principale **info@triesteimmobiliare.com**. `contact.phone` va scritto senza +39:
  footer e `/contatti` lo antepongono da soli nel link `tel:`.
- Conteggi del gruppo (quanti marchi, quante case, quanti compratori): mai una cifra
  scritta a mano. Se non c'è una fonte unica e verificabile, la cifra non si scrive.
- I testi scritti con l'AI portano l'etichetta (art. 50 Reg. UE 2024/1689).

## Moduli gemelli

Questi file esistono uguali negli altri portali del gruppo (triestevillas-web,
triesteaffitti, friulivillas): si correggono in tutte le copie nello stesso giro, o le copie
divergono senza che nessuno se ne accorga. `src/lib/simili.ts`, `src/lib/dotazioni.ts` con
`scripts/check-dotazioni.mjs`, `src/app/api/revalidate`, `src/app/api/geocode`,
`src/components/CookieBanner.tsx`, `src/lib/ingressoPorta.ts`.

## Orari

Ogni ora o data che l'utente legge, o su cui il sito decide, si calcola in `Europe/Rome`.
