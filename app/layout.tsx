import type { Metadata } from "next";
import { Archivo, Barlow } from "next/font/google";
import "./globals.css";

/* Headings — Archivo variable, widened to 125 (`wdth` axis) to match the
   brandbook's Microgramma *Extended* spec. Barlow Condensed was the opposite
   width axis and read as generic. */
const archivo = Archivo({
  subsets: ["latin"],
  weight: "variable",
  axes: ["wdth"],
  variable: "--font-heading",
  display: "swap",
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

/* Canónico con www: el apex responde 308 hacia www, así que anunciar el apex
   hacía que la og:image se sirviera detrás de un redirect. */
const SITE = "https://www.soylabase.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "BASE - Distrito Creativo",
    template: "%s | BASE - Distrito Creativo",
  },
  description:
    "Venue para conciertos, eventos corporativos, privados y fiestas en Quito. Capacidad para +300 personas. Próximos eventos y reservas.",
  keywords: [
    "venue Quito", "eventos Quito", "conciertos Quito",
    "eventos corporativos Quito", "alquiler espacio eventos", "BASE Distrito Creativo",
  ],
  openGraph: {
    type: "website",
    locale: "es_EC",
    url: SITE,
    siteName: "BASE - Distrito Creativo",
    title: "BASE - Distrito Creativo",
    description:
      "Venue para conciertos, eventos corporativos, privados y fiestas en Quito. Capacidad para +300 personas.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BASE - Distrito Creativo",
    description:
      "Venue para conciertos, eventos corporativos, privados y fiestas en Quito.",
  },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${archivo.variable} ${barlow.variable}`}>
      <body>{children}</body>
    </html>
  );
}
