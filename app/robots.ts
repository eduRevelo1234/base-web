import type { MetadataRoute } from "next";

const SITE = "https://www.soylabase.com";

/* Igual que sitemap.ts: requerido por output:"export". */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
