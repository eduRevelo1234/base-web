import type { MetadataRoute } from "next";

const SITE = "https://www.soylabase.com";

/* El proyecto usa output:"export" (estático para cPanel); las route handlers
   de metadata deben declararse estáticas para poder exportarse. */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE,
      lastModified: new Date(),
      changeFrequency: "weekly", // la agenda de eventos cambia seguido
      priority: 1,
    },
  ];
}
