"use client";
import { useEffect, useRef } from "react";

/* Coordenadas de BASE — Francisco Salazar y José Tamayo, Quito */
const LAT = -0.21052;
const LNG = -78.48420;

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

      L.marker([LAT, LNG], { icon })
        .addTo(map)
        .bindPopup(
          `<b style="font-family:sans-serif;font-size:13px">BASE</b>
           <br/><span style="font-size:11px;color:#888">Francisco Salazar y José Tamayo</span>`,
          { closeButton: false }
        );

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", minHeight: 300 }}
    />
  );
}
