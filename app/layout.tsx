import type { Metadata } from "next";
import { Barlow_Condensed, Barlow } from "next/font/google";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-heading",
  display: "swap",
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Distrito Creativo BASE — Música & Cultura",
  description:
    "Distrito Creativo BASE — espacio para eventos, música en vivo y cultura urbana en Quito. Próximos eventos y merch exclusivo.",
  openGraph: {
    title: "Distrito Creativo BASE",
    description: "Espacio para eventos, música y cultura en Quito, Ecuador.",
    type: "website",
    url: "https://soylabase.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${barlowCondensed.variable} ${barlow.variable}`}>
      <body>{children}</body>
    </html>
  );
}
