import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Until DNS is cut over from the old WordPress (the brand domain still serves it),
// the relaunch lives on a *.vercel.app preview — keep it out of search to avoid
// competing/duplicate content. Flip NEXT_PUBLIC_ALLOW_INDEX=true at cutover.
const ALLOW_INDEX = process.env.NEXT_PUBLIC_ALLOW_INDEX === "true";

export default function robots(): MetadataRoute.Robots {
  if (!ALLOW_INDEX) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    // /private resta fuori dall'indice ANCHE nel ramo indicizzato: al cutover DNS
    // l'area riservata diventerebbe altrimenti crawlabile insieme al resto. Le
    // pagine hanno gia' il loro noindex, ma un disallow esplicito evita perfino la
    // richiesta — e le ghost card in griglia non portano indizi ai crawler.
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/private", "/private/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
