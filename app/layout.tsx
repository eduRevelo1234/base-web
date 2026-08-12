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

const SITE = "https://soylabase.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Base - Distrito Creativo | Venue en Quito",
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
    siteName: "BASE",
    title: "BASE — Un espacio. Todas las experiencias.",
    description:
      "Venue para conciertos, eventos corporativos, privados y fiestas en Quito. Capacidad para +300 personas.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BASE — Un espacio. Todas las experiencias.",
    description:
      "Venue para conciertos, eventos corporativos, privados y fiestas en Quito.",
  },
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
