"use client";
import { useEffect, useRef } from "react";
import { LAT, LNG, NAV } from "./venue";

export default function MapEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<unknown>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Leaflet marks initialized containers with _leaflet_id
    if ((container as HTMLElement & { _leaflet_id?: number })._leaflet_id) return;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if ((container as HTMLElement & { _leaflet_id?: number })._leaflet_id) return;

      const map = L.map(container, {
        center: [LAT, LNG],
        zoom: 16,
        zoomControl: false,
        scrollWheelZoom: false,
        attributionControl: false,
      });
      mapRef.current = map;


      /* CartoDB Dark Matter — dark, minimal, modern */
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 20 }
      ).addTo(map);

      /* Custom gold pin */
      const icon = L.divIcon({
        className: "",
        html: `
          <div style="
            width:14px;height:14px;
            background:#df9f00;
            border-radius:50%;
            border:3px solid #111;
            box-shadow:0 0 0 4px rgba(223,159,0,0.35),0 0 20px rgba(223,159,0,0.4);
          "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      /* Popup accionable: antes solo mostraba texto, ahora lleva a la ruta */
      L.marker([LAT, LNG], { icon, keyboard: true, title: "BASE — cómo llegar" })
        .addTo(map)
        .bindPopup(
          `<b style="font-family:sans-serif;font-size:13px">BASE</b>
           <br/><span style="font-size:11px;color:#888">Francisco Salazar y José Tamayo</span>
           <br/><a href="${NAV.google}" target="_blank" rel="noopener noreferrer"
              style="display:inline-block;margin-top:8px;font-family:sans-serif;font-size:11px;
                     font-weight:700;letter-spacing:.08em;text-transform:uppercase;
                     color:#111;background:#df9f00;padding:6px 12px;text-decoration:none;">
              Cómo llegar →</a>`,
          { closeButton: false }
        )
        .openPopup();

      /* Doble clic sobre el mapa: ruta directa */
      map.on("dblclick", () => window.open(NAV.google, "_blank", "noopener"));

      /* Attribution mínimo */
      L.control.attribution({ prefix: false })
        .addAttribution('© <a href="https://carto.com">CARTO</a>')
        .addTo(map);
    })();

    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", minHeight: 300 }}
    />
  );
}
