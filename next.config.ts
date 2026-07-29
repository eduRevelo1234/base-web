import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",       // genera carpeta /out con HTML estático
  images: { unoptimized: true }, // cPanel no tiene servidor de imágenes
  trailingSlash: true,    // compatibilidad con Apache/cPanel
};

export default nextConfig;
