/* Datos del local en un solo sitio: los consumen el mapa (MapEmbed) y los
   botones de navegación (page.tsx). Evita que las coordenadas se dupliquen. */

export const LAT = -0.21052;
export const LNG = -78.48420;
export const DIRECCION = "Francisco Salazar y José Tamayo, Quito, Ecuador";

/* `dir/?api=1` abre el trazado de ruta y, en móvil, la app nativa —
   no solo un pin suelto en el mapa. */
export const NAV = {
  google: `https://www.google.com/maps/dir/?api=1&destination=${LAT},${LNG}`,
  waze: `https://waze.com/ul?ll=${LAT},${LNG}&navigate=yes`,
  apple: `https://maps.apple.com/?daddr=${LAT},${LNG}&dirflg=d`,
} as const;
