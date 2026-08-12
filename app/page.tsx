"use client";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import emailjs from "@emailjs/browser";

const MapEmbed = dynamic(() => import("./MapEmbed"), { ssr: false });

/* ════════════════════════════ TOKENS ════════════════════════════ */
/* Values mirror BASE_BRANDBOOK.pdf p.5. Keep in sync with :root in globals.css. */
const C = {
  black:     "#111111",
  blackSoft: "#181818",
  blackCard: "#1f1f1f",
  blackHi:   "#282828",              // brandbook charcoal
  gold:      "#df9f00",              // brandbook amber — CTAs only
  goldHi:    "#f0ad00",
  ochre:     "#c18500",              // brandbook ochre — secondary accent
  brown:     "#443822",              // brandbook dark olive brown
  cream:     "#f4ecdc",              // brandbook cream
  muted:     "rgba(244,236,220,0.65)",
  muted2:    "rgba(244,236,220,0.42)",
  border:    "rgba(223,159,0,0.12)",
  borderHi:  "rgba(223,159,0,0.32)",
  goldDim:   "rgba(223,159,0,0.08)",
  ochreLine: "rgba(193,133,0,0.22)",
};
const H = "var(--font-heading),'Barlow Condensed',sans-serif";
const B = "var(--font-body),'Barlow',system-ui,sans-serif";

/* Scroll suave sin modificar la URL */
function scrollTo(id: string) {
  return (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    history.replaceState(null, "", window.location.pathname);
  };
}

/* WhatsApp — reemplaza con el número real en formato internacional sin + ni espacios */
const WA_NUMBER = "593980302389";
const WA_MSG    = encodeURIComponent("Hola, quiero recibir información para reservar La Base para un evento.");
const WA_BASE   = `https://wa.me/${WA_NUMBER}`;
const WA_URL    = `${WA_BASE}?text=${WA_MSG}`;

/* ════════════════════════════ HOOKS ════════════════════════════ */
function useReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /* Never strand content at opacity 0: if the observer is unavailable or the
       visitor prefers reduced motion, show immediately. */
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      el.classList.add("visible");
      return;
    }

    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTimeout(() => el.classList.add("visible"), delay);
          obs.disconnect();
        }
      },
      { threshold: 0.06 }
    );
    obs.observe(el);

    /* Safety net — reveal regardless after 2.5s so a missed callback can never
       leave a section permanently invisible. */
    const failsafe = setTimeout(() => el.classList.add("visible"), 2500);
    return () => { obs.disconnect(); clearTimeout(failsafe); };
  }, [delay]);
  return ref;
}

function subscribeToTick(cb: () => void) {
  const id = setInterval(cb, 1000);
  return () => clearInterval(id);
}

/* Seconds remaining, read as a primitive so useSyncExternalStore can compare it
   cheaply and only re-render once a second. The server snapshot is `null`: the
   countdown is time-dependent, so SSR renders a stable placeholder and the real
   digits appear after hydration — previously this hydrated with a different
   second than the server rendered and threw away the whole subtree. */
function useCountdown(targetTime: number) {
  const secondsLeft = useSyncExternalStore(
    subscribeToTick,
    () => Math.max(0, Math.floor((targetTime - Date.now()) / 1000)),
    () => null,
  );

  if (secondsLeft === null) return null;
  if (secondsLeft <= 0) return { d: 0, h: 0, m: 0, s: 0, over: true };
  return {
    d: Math.floor(secondsLeft / 86400),
    h: Math.floor((secondsLeft % 86400) / 3600),
    m: Math.floor((secondsLeft % 3600) / 60),
    s: secondsLeft % 60,
    over: false,
  };
}

function useScrolled(px = 40) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const fn = () => setOn(window.scrollY > px);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [px]);
  return on;
}

/* Viewport width read through useSyncExternalStore: the client gets the real
   width on its first committed render instead of a 1280 default corrected by a
   setState-in-effect, which was causing a desktop-layout flash on phones. */
function subscribeToResize(cb: () => void) {
  window.addEventListener("resize", cb, { passive: true });
  return () => window.removeEventListener("resize", cb);
}

function useBreakpoint() {
  const w = useSyncExternalStore(
    subscribeToResize,
    () => window.innerWidth,
    () => 1280, // server snapshot
  );
  return {
    isSmallMobile: w < 430,
    isMobile:      w < 640,
    isTablet:      w >= 640 && w < 1024,
    isDesktop:     w >= 1024,
    w,
  };
}

/* ════════════════════════════ SHARED ════════════════════════════ */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: H, fontWeight: 700, fontSize: 11,
      letterSpacing: "0.3em", textTransform: "uppercase",
      color: C.gold, marginBottom: 14,
    }}>
      {children}
    </p>
  );
}

function GoldBtn({
  href, onClick, children, outline, small, target,
}: {
  href?: string; onClick?: () => void; target?: string;
  children: React.ReactNode; outline?: boolean; small?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const { isSmallMobile } = useBreakpoint();
  const base: React.CSSProperties = {
    display: "inline-block",
    fontFamily: H, fontWeight: 900,
    fontSize: small ? 11 : isSmallMobile ? 12 : 13,
    letterSpacing: isSmallMobile ? "0.1em" : "0.14em",
    textTransform: "uppercase",
    padding: small ? "10px 22px" : isSmallMobile ? "13px 20px" : "14px 32px",
    textDecoration: "none", border: "none",
    transition: "all 0.22s ease", cursor: "pointer",
    /* Que la flecha no salte de línea en pantallas angostas. */
    whiteSpace: "nowrap",
  };
  const style: React.CSSProperties = outline
    ? { ...base, color: hov ? C.black : C.gold, border: `1.5px solid ${C.gold}`, backgroundColor: hov ? C.gold : "transparent" }
    : { ...base, color: C.black, backgroundColor: hov ? C.goldHi : C.gold };

  if (onClick) {
    return (
      <button type="button" onClick={onClick} style={style}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
        {children}
      </button>
    );
  }
  if (href?.startsWith("#")) {
    return (
      <a href={href} onClick={scrollTo(href.slice(1))} style={style}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
        {children}
      </a>
    );
  }
  return (
    <a href={href} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined}
      style={style} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </a>
  );
}

/* ════════════════════════════ GRAIN ════════════════════════════ */
function Grain() { return <div className="grain-overlay" aria-hidden />; }

/* ════════════════════════════ WHATSAPP BUTTON ════════════════════════════ */
function WhatsAppBtn() {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={WA_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "fixed", bottom: 28, right: 24, zIndex: 300,
        width: 56, height: 56,
        backgroundColor: hov ? "#1ebe57" : "#25d366",
        borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 20px rgba(0,0,0,0.45)",
        transition: "background 0.2s, transform 0.2s",
        transform: hov ? "scale(1.08)" : "scale(1)",
        textDecoration: "none",
      }}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.563 4.14 1.535 5.876L0 24l6.29-1.513A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.88 0-3.64-.494-5.163-1.358l-.369-.217-3.733.897.944-3.634-.24-.374A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
      </svg>
    </a>
  );
}

/* ════════════════════════════ NAVBAR ════════════════════════════ */
function Navbar() {
  const scrolled = useScrolled(60);
  const { isMobile, isTablet } = useBreakpoint();
  const [open, setOpen] = useState(false);

  const LINKS = [
    ["El Espacio", "#espacio" ],
    ["Galería",    "#galeria" ],
    ["Eventos",    "#eventos" ],
    ["Reservas",   "#booking"   ],
    ["Ubicación",  "#ubicacion" ],
    ["Contacto",   "#contacto"  ],
  ];

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
      background: scrolled || open ? "rgba(17,17,17,0.98)" : "rgba(17,17,17,0.15)",
      backdropFilter: "blur(20px)",
      borderBottom: `1px solid ${scrolled ? C.borderHi : "transparent"}`,
      transition: "background 0.4s ease, border-color 0.4s ease",
    }}>
      <div style={{
        maxWidth: 1280, margin: "0 auto",
        padding: isMobile ? "0 20px" : isTablet ? "0 32px" : "0 40px",
        height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <a href="#inicio" style={{ textDecoration: "none" }}
          onClick={(e) => { scrollTo("inicio")(e); setOpen(false); }}>
          <Wordmark />
        </a>

        {!isMobile && !isTablet && (
          <nav style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {LINKS.map(([l, h]) => (
              <a key={h} href={h} className="u-hover"
                onClick={scrollTo((h as string).slice(1))}
                style={{
                  fontFamily: H, fontWeight: 700, fontSize: 12,
                  letterSpacing: "0.18em", textTransform: "uppercase",
                  color: C.cream, opacity: 0.65, textDecoration: "none",
                }}>{l}</a>
            ))}
          </nav>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {!isMobile && (
            <a href="#booking" onClick={scrollTo("booking")} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontFamily: H, fontWeight: 900, fontSize: 11,
              letterSpacing: "0.14em", textTransform: "uppercase",
              color: C.black, backgroundColor: C.gold,
              padding: "10px 22px", textDecoration: "none",
              transition: "background 0.2s",
            }}>
              Reservas
            </a>
          )}

          {(isMobile || isTablet) && (
            <button
              onClick={() => setOpen((o) => !o)}
              style={{
                all: "unset", cursor: "pointer",
                display: "flex", flexDirection: "column",
                gap: 5, padding: "6px", justifyContent: "center",
              }}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
            >
              {[0, 1, 2].map((i) => (
                <span key={i} style={{
                  display: "block", height: 2, borderRadius: 1,
                  backgroundColor: C.cream,
                  width: i === 1 ? 22 : 28,
                  transition: "all 0.25s ease",
                  opacity: open && i === 1 ? 0 : 1,
                  transform: open
                    ? i === 0 ? "rotate(45deg) translate(5px,5px)"
                    : i === 2 ? "rotate(-45deg) translate(5px,-5px)"
                    : "none"
                    : "none",
                }} />
              ))}
            </button>
          )}
        </div>
      </div>

      {(isMobile || isTablet) && open && (
        <div style={{
          backgroundColor: "rgba(17,17,17,0.98)",
          borderTop: `1px solid ${C.border}`,
          padding: "24px 20px 32px",
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          {LINKS.map(([l, h]) => (
            <a key={h} href={h}
              onClick={(e) => { scrollTo((h as string).slice(1))(e); setOpen(false); }}
              style={{
                fontFamily: H, fontWeight: 800, fontSize: 28,
                letterSpacing: "0.06em", textTransform: "uppercase",
                color: C.cream, textDecoration: "none",
                padding: "10px 0",
                borderBottom: `1px solid ${C.border}`,
                display: "block",
              }}
            >{l}</a>
          ))}
          <div style={{ marginTop: 20 }}>
            <a href="#booking" onClick={(e) => { scrollTo("booking")(e); setOpen(false); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontFamily: H, fontWeight: 900, fontSize: 13,
                letterSpacing: "0.14em", textTransform: "uppercase",
                color: C.black, backgroundColor: C.gold,
                padding: "13px 32px", textDecoration: "none",
              }}>
              Reservas →
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

/* ════════════════════════════ HERO ════════════════════════════ */
function Hero() {
  const { isMobile, isTablet, isSmallMobile } = useBreakpoint();

  return (
    <section id="inicio" style={{
      position: "relative",
      minHeight: "100vh",
      backgroundColor: C.black,
      display: "flex", alignItems: "center",
      overflow: "hidden",
    }}>
      {/* Venue photography — the brandbook calls for warm low-light imagery,
          and the hero was previously flat black. */}
      <Image
        src="/fotos_base/DSC06294.JPG"
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        style={{
          objectFit: "cover",
          objectPosition: "68% 78%",
          filter: "brightness(1.28) saturate(1.08)",
          zIndex: 0,
        }}
      />
      {/* Legibility scrim — keeps the headline well above 4.5:1 over the photo */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, zIndex: 0,
        background:
          "linear-gradient(100deg, rgba(17,17,17,0.93) 0%, rgba(17,17,17,0.72) 44%, rgba(17,17,17,0.24) 100%)",
      }} />
      {/* Repeating isotype texture (brandbook motif) — kept faint so it reads
          as texture, not as a wireframe grid over the photo. */}
      <div className="isotype-tile" aria-hidden style={{
        position: "absolute", inset: 0, zIndex: 0, opacity: 0.22,
        pointerEvents: "none",
      }} />

      {/* Gold glow */}
      <div style={{
        position: "absolute", top: -80, left: -60,
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(223,159,0,0.10) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{
        position: "relative", zIndex: 1,
        maxWidth: 1280, margin: "0 auto", width: "100%",
        padding: isSmallMobile ? "100px 16px 64px" : isMobile ? "110px 20px 72px" : isTablet ? "120px 36px 80px" : "130px 40px 100px",
      }}>
        {/* Top tag */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
          <span className="live-dot" />
          <span style={{
            fontFamily: H, fontWeight: 700, fontSize: 11,
            letterSpacing: "0.3em", textTransform: "uppercase", color: C.gold,
          }}>
            Venue · Quito, Ecuador
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: H, fontWeight: 900,
          /* Archivo at wdth 122 sets ~35% wider than Barlow Condensed did, so
             the display scale is tuned down to match. */
          /* Sized so the longest forced line ("EXPERIENCIAS.") clears the
             gutters at every breakpoint — it cannot wrap, the lines are <br>. */
          fontSize: isSmallMobile ? "clamp(26px,8.4vw,34px)" : isMobile ? "clamp(30px,8.5vw,50px)" : isTablet ? "clamp(42px,7.4vw,68px)" : "clamp(56px,6.4vw,96px)",
          lineHeight: 0.9, textTransform: "uppercase",
          color: C.cream, marginBottom: 36,
          letterSpacing: "0.005em",
          maxWidth: 920,
        }}>
          UN ESPACIO.<br />
          <span style={{ color: C.gold }}>TODAS</span> LAS<br />
          EXPERIENCIAS.
        </h1>

        {/* Tagline */}
        <p style={{
          fontFamily: B, fontSize: isMobile ? 15 : 17, lineHeight: 1.75,
          color: "rgba(244,236,220,0.78)", maxWidth: 460, marginBottom: 44,
        }}>
          BASE es un venue para conciertos, eventos corporativos, privados y fiestas. Capacidad para +300 personas.<br />
          Conoce más acerca de nosotros.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <GoldBtn href="#eventos">Ver próximos eventos →</GoldBtn>
          <GoldBtn href="#booking" outline>Reservar el espacio</GoldBtn>
        </div>

        {/* Stats row */}
        <div style={{
          marginTop: isMobile ? 52 : 72,
          display: "grid",
          /* Tres columnas no caben en ningún teléfono (a 430px "LA MARISCAL"
             partía en dos líneas): dos columnas hasta 640px. */
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
          gap: 2,
        }}>
          {[
            { val: "+300", lbl: "Capacidad", sub: "Personas de pie" },
            { val: "03",   lbl: "Formatos",  sub: "Conciertos · Fiestas · Corporativos" },
            { val: "QUITO",lbl: "La Mariscal", sub: "Francisco Salazar y José Tamayo" },
          ].map((s, i) => (
            <div key={s.lbl} style={{
              backgroundColor: "rgba(31,31,31,0.72)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${C.border}`,
              padding: isMobile ? "20px 18px" : "24px 28px",
              minWidth: 0,
              /* A dos columnas el tercer tile quedaba solo a media fila;
                 que ocupe el ancho completo se lee como intencional. */
              gridColumn: isMobile && i === 2 ? "1 / -1" : "auto",
            }}>
              <div style={{
                fontFamily: H, fontWeight: 900,
                fontSize: isSmallMobile ? 20 : isMobile ? 24 : isTablet ? 30 : 36, color: C.gold, lineHeight: 1,
                marginBottom: 6,
              }}>{s.val}</div>
              <div style={{
                fontFamily: H, fontWeight: 800, fontSize: 13,
                textTransform: "uppercase", color: C.cream,
                letterSpacing: "0.04em", marginBottom: 3,
              }}>{s.lbl}</div>
              <div style={{
                fontFamily: B, fontSize: 12, color: C.muted,
              }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}

/* ════════════════════════════ MARQUEE ════════════════════════════ */
function Marquee() {
  const items = ["BASE","CONCIERTOS","FIESTAS","EVENTOS","VENUE","QUITO","CORPORATIVOS","MÚSICA","CULTURA"];
  const rep   = [...items, ...items];
  return (
    <div style={{ backgroundColor: C.gold, padding: "13px 0", overflow: "hidden" }}>
      <div className="marquee-track">
        {rep.map((item, i) => (
          <span key={i} style={{
            fontFamily: H, fontWeight: 900, fontSize: 12,
            letterSpacing: "0.24em", textTransform: "uppercase",
            color: C.black, padding: "0 28px", whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 28,
          }}>
            {item} <span style={{ opacity: 0.35, fontSize: 10 }}>◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════ EVENTS ════════════════════════════ */
const CLASICOS_START = new Date("2026-08-29T20:00:00-05:00").getTime();

function ClasicosCountdown() {
  const t = useCountdown(CLASICOS_START);
  if (t?.over) return null;
  // `null` on the server / first paint — same markup, placeholder digits.
  const units = [
    ["días", t?.d], ["hrs", t?.h], ["min", t?.m], ["seg", t?.s],
  ] as const;
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{
        fontFamily: H, fontWeight: 700, fontSize: 9,
        letterSpacing: "0.28em", textTransform: "uppercase",
        color: C.gold, marginBottom: 10,
      }}>Faltan</p>
      <div style={{ display: "flex", gap: 8 }}>
        {units.map(([lbl, val]) => (
          <div key={lbl} style={{
            flex: 1, backgroundColor: "rgba(193,133,0,0.10)",
            border: `1px solid ${C.ochreLine}`,
            padding: "10px 6px", textAlign: "center",
          }}>
            <div style={{
              fontFamily: H, fontWeight: 900, fontSize: 28,
              color: C.gold, lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}>{val === undefined ? "––" : String(val).padStart(2, "0")}</div>
            <div style={{
              fontFamily: H, fontWeight: 700, fontSize: 9,
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: C.muted2, marginTop: 4,
            }}>{lbl}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const EVENTOS_PASADOS: [string, string][] = [
  ["Jony Beltrán & Serko Fu",              "6 Ago 2026"],
  ["Cumbia Sin Fronteras · La Bochinchera", "1 Ago 2026"],
  ["GIANNY EN VIVO · Promotor Mad Max",     "31 Jul 2026"],
  ["La Velada del Año VI · Night Party",    "25 Jul 2026"],
];

function Events() {
  const refH = useReveal(0);
  const refC = useReveal(120);
  const refB = useReveal(80);
  const refA = useReveal(80);
  const refM = useReveal(100);
  const [showPast, setShowPast] = useState(false);
  const { isMobile, isTablet } = useBreakpoint();
  return (
    <section id="eventos" style={{ backgroundColor: C.black, padding: isMobile ? "64px 0" : isTablet ? "80px 0" : "100px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "0 20px" : isTablet ? "0 32px" : "0 40px" }}>

        <div ref={refH} className="reveal" style={{
          display: "flex", alignItems: "flex-end",
          justifyContent: "space-between", marginBottom: isMobile ? 36 : 56, flexWrap: "wrap", gap: 20,
        }}>
          <div>
            <Label>Agenda</Label>
            <h2 style={{
              fontFamily: H, fontWeight: 900,
              fontSize: "clamp(34px,4.8vw,60px)",
              lineHeight: 0.95, textTransform: "uppercase", color: C.cream,
            }}>
              PRÓXIMOS<br /><span style={{ color: C.gold }}>EVENTOS</span>
            </h2>
          </div>
          <p style={{ fontFamily: B, fontSize: 14, color: C.muted, maxWidth: 260, lineHeight: 1.7 }}>
            Síguenos en @soylabase para enterarte primero de cada fecha y novedad.
          </p>
        </div>

        {/* Evento más próximo — muestra de Caro Iturralde (13 ago) */}
        <div ref={refM} className="reveal" style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "3fr 2fr",
          border: `1px solid ${C.borderHi}`,
          overflow: "hidden", marginBottom: 3,
        }}>
          <div style={{ position: "relative", minHeight: isMobile ? 300 : isTablet ? 400 : 480, backgroundColor: "#1a1a1a" }}>
            <Image
              src="/events/caro_iturralde/EXPO_1080x1350.png"
              alt="Las formas de lo invisible Vol 2: reflejo · Muestra de Caro Iturralde · 13 de Agosto"
              fill style={{ objectFit: "contain" }}
              sizes="(max-width:900px) 100vw, 60vw"
            />
          </div>
          <div style={{ backgroundColor: C.blackCard, padding: isMobile ? "28px 24px" : isTablet ? "36px 32px" : "48px 44px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <span style={{ display: "inline-block", backgroundColor: C.gold, color: C.black, fontFamily: H, fontWeight: 800, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", padding: "5px 12px", marginBottom: 32 }}>Próximo evento</span>
              <h3 style={{ fontFamily: H, fontWeight: 900, fontSize: "clamp(26px,2.7vw,38px)", lineHeight: 0.9, textTransform: "uppercase", color: C.cream, marginBottom: 12 }}>LAS FORMAS DE LO INVISIBLE<br /><span style={{ fontSize: "0.5em", color: C.gold, fontWeight: 700, letterSpacing: "0.06em" }}>Vol 2 : reflejo</span></h3>
              <p style={{ fontFamily: B, fontSize: 13, color: C.gold, letterSpacing: "0.06em", marginBottom: 20 }}>Una muestra de Caro Iturralde</p>
              <div style={{ width: 36, height: 2, backgroundColor: C.gold, marginBottom: 24 }} />
              <p style={{ fontFamily: B, fontSize: 14, lineHeight: 1.75, color: C.muted }}>Muestra de arte en el Distrito Creativo.<br />Puertas desde las 5:00 pm · Presentación 7:00 pm</p>
            </div>
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, borderTop: `1px solid ${C.border}`, paddingTop: 28, marginTop: 32, marginBottom: 32 }}>
                {[["Fecha","Jue 13 de Agosto"],["Hora","5:00 pm"],["Lugar","BASE · Quito"]].map(([k,v]) => (
                  <div key={k} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <span style={{ fontFamily: H, fontWeight: 700, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: C.muted, width: 52, flexShrink: 0, paddingTop: 3 }}>{k}</span>
                    <span style={{ fontFamily: H, fontWeight: 900, fontSize: 17, textTransform: "uppercase", color: C.cream, lineHeight: 1.2 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <GoldBtn
                  href={`${WA_BASE}?text=${encodeURIComponent("Hola! Me interesa la muestra \"Las formas de lo invisible Vol 2: reflejo\" de Caro Iturralde del jueves 13 de agosto en BASE. ¿Pueden darme más información?")}`}
                  target="_blank"
                >Más info →</GoldBtn>
                <GoldBtn href="#ubicacion" outline>Cómo llegar</GoldBtn>
              </div>
            </div>
          </div>
        </div>

        {/* Evento — DJ 1sak */}
        <div ref={refC} className="reveal" style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "3fr 2fr",
          border: `1px solid ${C.borderHi}`,
          overflow: "hidden", marginBottom: 3,
        }}>
          <div style={{ position: "relative", minHeight: isMobile ? 300 : isTablet ? 400 : 480, backgroundColor: "#1a1a1a" }}>
            <Image
              src="/events/dj1sak_Quito/djisak_1080X1350.png"
              alt="DJ 1sak · 15 de Agosto"
              fill style={{ objectFit: "contain" }}
              sizes="(max-width:900px) 100vw, 60vw"
            />
          </div>
          <div style={{
            backgroundColor: C.blackCard,
            padding: isMobile ? "28px 24px" : isTablet ? "36px 32px" : "48px 44px",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
          }}>
            <div>
              <span style={{ display: "inline-block", backgroundColor: "transparent", border: `1px solid ${C.gold}`, color: C.gold, fontFamily: H, fontWeight: 800, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", padding: "5px 12px", marginBottom: 32 }}>Próximo evento</span>
              <h3 style={{ fontFamily: H, fontWeight: 900, fontSize: "clamp(28px,2.9vw,42px)", lineHeight: 0.9, textTransform: "uppercase", color: C.cream, marginBottom: 12 }}>DJ 1SAK</h3>
              <p style={{ fontFamily: B, fontSize: 13, color: C.gold, letterSpacing: "0.06em", marginBottom: 20 }}>Desde México · LNG/SHT · Galaxia Cero</p>
              <div style={{ width: 36, height: 2, backgroundColor: C.gold, marginBottom: 24 }} />
              <p style={{ fontFamily: B, fontSize: 14, lineHeight: 1.75, color: C.muted }}>Entrada gratuita · Venta de merch oficial LNG/SHT</p>
            </div>
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, borderTop: `1px solid ${C.border}`, paddingTop: 28, marginTop: 32, marginBottom: 32 }}>
                {[["Fecha","Sáb 15 de Agosto"],["Lugar","BASE · Quito"]].map(([k,v]) => (
                  <div key={k} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <span style={{ fontFamily: H, fontWeight: 700, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: C.muted, width: 52, flexShrink: 0, paddingTop: 3 }}>{k}</span>
                    <span style={{ fontFamily: H, fontWeight: 900, fontSize: 17, textTransform: "uppercase", color: C.cream, lineHeight: 1.2 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <GoldBtn onClick={() => openReservas("dj1sak")}>Reservar mi lugar →</GoldBtn>
                <GoldBtn href={WA_URL} target="_blank" outline>Más info</GoldBtn>
              </div>
            </div>
          </div>
        </div>

        {/* Evento — Clásicos VS Cumbia */}
        <div ref={refB} className="reveal" style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "3fr 2fr",
          border: `1px solid ${C.borderHi}`,
          overflow: "hidden", marginBottom: 3,
        }}>
          <div style={{ position: "relative", minHeight: isMobile ? 300 : isTablet ? 400 : 480, backgroundColor: "#1a1a1a" }}>
            <Image
              src="/events/ClasicosVSCumbia/flyer-short.png"
              alt="Clásicos VS Cumbia · 29 de Agosto"
              fill style={{ objectFit: "contain" }}
              sizes="(max-width:900px) 100vw, 60vw"
            />
          </div>
          <div style={{ backgroundColor: C.blackCard, padding: isMobile ? "28px 24px" : isTablet ? "36px 32px" : "48px 44px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <span style={{ display: "inline-block", backgroundColor: "transparent", border: `1px solid ${C.gold}`, color: C.gold, fontFamily: H, fontWeight: 800, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", padding: "5px 12px", marginBottom: 32 }}>Próximo evento</span>
              <h3 style={{ fontFamily: H, fontWeight: 900, fontSize: "clamp(26px,2.7vw,38px)", lineHeight: 0.9, textTransform: "uppercase", color: C.cream, marginBottom: 12 }}>CLÁSICOS VS CUMBIA<br /><span style={{ fontSize: "0.5em", color: C.gold, fontWeight: 700, letterSpacing: "0.06em" }}>· Promotor Cumbia Capital</span></h3>
              <div style={{ width: 36, height: 2, backgroundColor: C.gold, marginBottom: 24 }} />
              <p style={{ fontFamily: B, fontSize: 14, lineHeight: 1.75, color: C.muted }}>Dos estilos, una sola fiesta. Bebidas y picaditas.<br />Preventa $7 · En puerta $10</p>
            </div>
            <div>
              {/* Countdown */}
              <ClasicosCountdown />
              <div style={{ display: "flex", flexDirection: "column", gap: 14, borderTop: `1px solid ${C.border}`, paddingTop: 28, marginTop: 24, marginBottom: 32 }}>
                {[["Fecha","Sáb 29 de Agosto"],["Hora","8:00 pm"],["Lugar","BASE · Quito"]].map(([k,v]) => (
                  <div key={k} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <span style={{ fontFamily: H, fontWeight: 700, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: C.muted, width: 52, flexShrink: 0, paddingTop: 3 }}>{k}</span>
                    <span style={{ fontFamily: H, fontWeight: 900, fontSize: 17, textTransform: "uppercase", color: C.cream, lineHeight: 1.2 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <GoldBtn onClick={() => openReservas("clasicos")}>Reservar mi lugar →</GoldBtn>
                <GoldBtn
                  href={`https://wa.me/593996242174?text=${encodeURIComponent("Hola! Me interesa el evento Clásicos VS Cumbia del 29 de Agosto en BASE. ¿Pueden darme más información sobre preventa y reservas?")}`}
                  target="_blank" outline
                >Más info</GoldBtn>
              </div>
            </div>
          </div>
        </div>

        {/* Evento — Homer El Mero Mero (entradas externas, no reserva) */}
        <div ref={refA} className="reveal" style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "3fr 2fr",
          border: `1px solid ${C.borderHi}`,
          overflow: "hidden", marginBottom: 3,
        }}>
          <div style={{ position: "relative", minHeight: isMobile ? 300 : isTablet ? 400 : 480, backgroundColor: "#1a1a1a" }}>
            <Image
              src="/events/Homer_El_Mero_Mero/IMG_0549.JPEG"
              alt="Homer El Mero Mero · Resurrección Tour 2026 · 4 de Septiembre"
              fill style={{ objectFit: "contain" }}
              sizes="(max-width:900px) 100vw, 60vw"
            />
          </div>
          <div style={{ backgroundColor: C.blackCard, padding: isMobile ? "28px 24px" : isTablet ? "36px 32px" : "48px 44px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <span style={{ display: "inline-block", backgroundColor: "transparent", border: `1px solid ${C.gold}`, color: C.gold, fontFamily: H, fontWeight: 800, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", padding: "5px 12px", marginBottom: 32 }}>Próximo evento</span>
              <h3 style={{ fontFamily: H, fontWeight: 900, fontSize: "clamp(26px,2.7vw,38px)", lineHeight: 0.9, textTransform: "uppercase", color: C.cream, marginBottom: 12 }}>HOMER EL MERO MERO<br /><span style={{ fontSize: "0.5em", color: C.gold, fontWeight: 700, letterSpacing: "0.06em" }}>· Resurrección Tour 2026</span></h3>
              <div style={{ width: 36, height: 2, backgroundColor: C.gold, marginBottom: 24 }} />
              <p style={{ fontFamily: B, fontSize: 14, lineHeight: 1.75, color: C.muted }}>Gira internacional en Quito.<br />Entradas en buenplan.com.ec</p>
            </div>
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, borderTop: `1px solid ${C.border}`, paddingTop: 28, marginTop: 32, marginBottom: 32 }}>
                {[["Fecha","Vie 4 de Septiembre"],["Lugar","BASE · Quito"]].map(([k,v]) => (
                  <div key={k} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <span style={{ fontFamily: H, fontWeight: 700, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: C.muted, width: 52, flexShrink: 0, paddingTop: 3 }}>{k}</span>
                    <span style={{ fontFamily: H, fontWeight: 900, fontSize: 17, textTransform: "uppercase", color: C.cream, lineHeight: 1.2 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <GoldBtn href="https://buenplan.com.ec" target="_blank">Comprar entradas →</GoldBtn>
                <GoldBtn
                  href={`${WA_BASE}?text=${encodeURIComponent("Hola! Me interesa el evento Homer El Mero Mero (Resurrección Tour) del 4 de Septiembre en BASE. ¿Pueden darme más información?")}`}
                  target="_blank" outline
                >Más info</GoldBtn>
              </div>
            </div>
          </div>
        </div>

        {/* Eventos pasados — colapsados por defecto para no competir con la agenda */}
        <button
          type="button"
          onClick={() => setShowPast((v) => !v)}
          aria-expanded={showPast}
          aria-controls="eventos-pasados"
          style={{
            all: "unset", cursor: "pointer", width: "100%", boxSizing: "border-box",
            marginTop: 3, marginBottom: 3,
            padding: isMobile ? "16px 20px" : "18px 36px",
            backgroundColor: C.blackSoft,
            border: `1px solid ${C.ochreLine}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 16, flexWrap: "wrap",
          }}
        >
          <span style={{
            fontFamily: H, fontWeight: 700, fontSize: 12,
            letterSpacing: "0.22em", textTransform: "uppercase", color: C.muted,
          }}>
            Eventos pasados ({EVENTOS_PASADOS.length})
          </span>
          <span style={{
            fontFamily: H, fontWeight: 800, fontSize: 13,
            letterSpacing: "0.1em", textTransform: "uppercase", color: C.ochre,
            display: "inline-flex", alignItems: "center", gap: 8,
          }}>
            {showPast ? "Ocultar" : "Ver historial"}
            <span aria-hidden style={{
              display: "inline-block",
              transform: showPast ? "rotate(180deg)" : "none",
              transition: "transform 0.22s ease",
            }}>▾</span>
          </span>
        </button>

        {showPast && (
          <div id="eventos-pasados">
            {EVENTOS_PASADOS.map(([name, date]) => (
              <div key={name} style={{
                backgroundColor: C.blackCard, border: `1px solid ${C.border}`,
                padding: isMobile ? "20px 20px" : "20px 36px",
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "auto 1fr auto",
                alignItems: "center", gap: isMobile ? 12 : 24, marginBottom: 3,
              }}>
                <span style={{ fontFamily: H, fontWeight: 800, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: C.ochre, backgroundColor: "rgba(193,133,0,0.10)", border: `1px solid ${C.ochreLine}`, padding: "4px 10px", whiteSpace: "nowrap" }}>Evento pasado</span>
                <span style={{ fontFamily: H, fontWeight: 900, fontSize: isMobile ? 18 : 24, textTransform: "uppercase", color: C.muted }}>{name}</span>
                <span style={{ fontFamily: H, fontWeight: 700, fontSize: 13, color: C.muted2, whiteSpace: "nowrap" }}>{date}</span>
              </div>
            ))}
          </div>
        )}

        {/* Más eventos strip */}
        <div style={{
          backgroundColor: C.blackSoft, border: `1px solid ${C.border}`,
          padding: "20px 36px",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
        }}>
          <span style={{
            fontFamily: H, fontWeight: 700, fontSize: 12,
            letterSpacing: "0.22em", textTransform: "uppercase",
            color: C.muted, opacity: 0.6,
          }}>Más eventos próximamente</span>
          <a href="https://www.instagram.com/soylabase" target="_blank" rel="noopener noreferrer"
            className="u-hover"
            style={{
              fontFamily: H, fontWeight: 800, fontSize: 13,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: C.gold, textDecoration: "none",
            }}>
            Seguir @soylabase →
          </a>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════ MODAL TRIGGER ════════════════════════════ */
/* Opens <ReservasModal />. Optionally preselects an event by id. */
function openReservas(eventoId?: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("base:openReservas", { detail: { evento: eventoId } })
    );
  }
}

/* ════════════════════════════ RESERVAS MODAL ════════════════════════════ */
/* Upcoming events only — keep in sync with the cards in <Events />. */
const EVENTOS_PROXIMOS = [
  {
    id:    "dj1sak",
    fecha: "Sáb 15 de Agosto",
    hora:  "Puertas 8:00 pm",
    name:  "DJ 1SAK",
    desc:  "Desde México · LNG/SHT · Galaxia Cero",
    badge: "Entrada gratuita",
    badgeColor: C.gold,
  },
  {
    id:    "clasicos",
    fecha: "Sáb 29 de Agosto",
    hora:  "8:00 pm",
    name:  "Clásicos VS Cumbia",
    desc:  "Back in Time vs Cumbia Capital",
    badge: "Preventa $7",
    badgeColor: C.ochre,
  },
];

type FormState = {
  nombre: string;
  whatsapp: string;
  email: string;
  personas: string;
  evento: string;
  enterado: string;
  terminos: boolean;
};

function ReservasModal() {
  const [open, setOpen]       = useState(false);
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const { isMobile }          = useBreakpoint();

  const [form, setForm] = useState<FormState>({
    nombre: "", whatsapp: "", email: "",
    personas: "", evento: "", enterado: "", terminos: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    const fn = (e: Event) => {
      const id = (e as CustomEvent<{ evento?: string }>).detail?.evento;
      if (id) setForm((p) => ({ ...p, evento: id }));
      setOpen(true);
    };
    window.addEventListener("base:openReservas", fn);
    return () => window.removeEventListener("base:openReservas", fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const set = (k: keyof FormState, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  function validate() {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.nombre.trim())   e.nombre   = "Campo requerido";
    if (!form.whatsapp.trim()) e.whatsapp = "Campo requerido";
    if (!form.email.trim())    e.email    = "Campo requerido";
    if (!form.personas)        e.personas = "Selecciona una opción";
    if (!form.evento)          e.evento   = "Selecciona un evento";
    if (!form.enterado)        e.enterado = "Selecciona una opción";
    if (!form.terminos)        e.terminos = "Debes aceptar los términos";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const ev = EVENTOS_PROXIMOS.find((x) => x.id === form.evento);
    const eventoLabel = ev ? `${ev.name} (${ev.fecha}, ${ev.hora})` : form.evento;

    const enteradoLabel: Record<string, string> = {
      ig: "Instagram", tk: "TikTok", ref: "Recomendación de un amigo", otro: "Otro",
    };

    const msg = [
      "Hola! Quiero reservar mi lugar en BASE 🎶",
      "",
      `*Nombre:* ${form.nombre}`,
      `*WhatsApp:* ${form.whatsapp}`,
      `*Email:* ${form.email}`,
      `*Personas:* ${form.personas}`,
      `*Evento:* ${eventoLabel}`,
      `*¿Cómo me enteré?:* ${enteradoLabel[form.enterado] ?? form.enterado}`,
      "",
      "Acepto los términos de reserva ✓",
    ].join("\n");

    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    setLoading(false);
    setSent(true);
  }

  const inp: React.CSSProperties = {
    backgroundColor: C.black, border: `1px solid ${C.border}`,
    color: C.cream, fontFamily: B, fontSize: 14,
    padding: "13px 16px", outline: "none", width: "100%",
  };
  const lbl: React.CSSProperties = {
    fontFamily: H, fontWeight: 700, fontSize: 10,
    letterSpacing: "0.22em", textTransform: "uppercase",
    color: C.muted, display: "block", marginBottom: 7,
  };
  const err: React.CSSProperties = {
    fontFamily: B, fontSize: 12, color: "#e05a00", marginTop: 4,
  };

  if (!open) return null;

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        backgroundColor: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobile ? 0 : "24px",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: C.blackCard,
          border: `1px solid ${C.borderHi}`,
          width: "100%",
          maxWidth: isMobile ? "100%" : 900,
          maxHeight: isMobile ? "92dvh" : "88dvh",
          overflowY: "auto",
          display: "flex", flexDirection: "column",
          animation: isMobile ? "slideUp 0.32s cubic-bezier(0.16,1,0.3,1)" : "scaleIn 0.28s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 28px",
          borderBottom: `1px solid ${C.border}`,
          position: "sticky", top: 0, zIndex: 10,
          backgroundColor: C.blackCard,
        }}>
          <div>
            <p style={{
              fontFamily: H, fontWeight: 700, fontSize: 10,
              letterSpacing: "0.26em", textTransform: "uppercase",
              color: C.gold, marginBottom: 2,
            }}>Cupo limitado · Reserva gratuita</p>
            <p style={{
              fontFamily: H, fontWeight: 900, fontSize: 22,
              textTransform: "uppercase", color: C.cream,
            }}>Reserva tu lugar</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              all: "unset", cursor: "pointer",
              width: 36, height: 36, display: "flex",
              alignItems: "center", justifyContent: "center",
              color: C.muted, fontSize: 20, fontWeight: 300,
            }}
            aria-label="Cerrar"
          >✕</button>
        </div>

        {sent ? (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "64px 32px", gap: 20, textAlign: "center",
          }}>
            <div style={{
              width: 72, height: 72, backgroundColor: C.gold,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: H, fontWeight: 900, fontSize: 34, color: C.black,
            }}>✓</div>
            <h3 style={{
              fontFamily: H, fontWeight: 900, fontSize: 40,
              textTransform: "uppercase", color: C.cream,
            }}>¡Reserva confirmada!</h3>
            <p style={{ fontFamily: B, fontSize: 15, color: C.muted, maxWidth: 360, lineHeight: 1.75 }}>
              Se abrió WhatsApp con tu información. Envía el mensaje para confirmar tu lugar.
            </p>
            <button onClick={() => setOpen(false)} style={{
              marginTop: 8, all: "unset", cursor: "pointer",
              fontFamily: H, fontWeight: 900, fontSize: 13,
              letterSpacing: "0.14em", textTransform: "uppercase",
              color: C.black, backgroundColor: C.gold,
              padding: "13px 32px",
            }}>Cerrar</button>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1.5fr",
            flex: 1,
          }}>
            <div style={{
              padding: "28px",
              borderRight: isMobile ? "none" : `1px solid ${C.border}`,
              borderBottom: isMobile ? `1px solid ${C.border}` : "none",
              display: "flex", flexDirection: "column", gap: 3,
            }}>
              <p style={{ ...lbl, marginBottom: 14 }}>Selecciona tu evento</p>

              {EVENTOS_PROXIMOS.map((ev) => (
                <button key={ev.id} type="button" onClick={() => set("evento", ev.id)}
                  aria-pressed={form.evento === ev.id}
                  style={{
                    all: "unset", cursor: "pointer", textAlign: "left",
                    display: "flex", flexDirection: "column", gap: 6,
                    padding: "18px 20px",
                    backgroundColor: form.evento === ev.id ? C.blackHi : C.black,
                    border: `1px solid ${form.evento === ev.id ? C.borderHi : C.border}`,
                    transition: "all 0.18s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: H, fontWeight: 700, fontSize: 12, color: C.gold, letterSpacing: "0.08em" }}>
                      {ev.fecha} · {ev.hora}
                    </span>
                    <span style={{
                      fontFamily: H, fontWeight: 800, fontSize: 9,
                      letterSpacing: "0.14em", textTransform: "uppercase",
                      color: "#111", backgroundColor: ev.badgeColor,
                      padding: "3px 8px",
                    }}>{ev.badge}</span>
                  </div>
                  <span style={{ fontFamily: H, fontWeight: 900, fontSize: 18, textTransform: "uppercase", color: C.cream, lineHeight: 1.1 }}>
                    {ev.name}
                  </span>
                  <span style={{ fontFamily: B, fontSize: 12, color: C.muted }}>{ev.desc}</span>
                  {form.evento === ev.id && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: C.gold }} />
                      <span style={{ fontFamily: H, fontWeight: 700, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: C.gold }}>
                        Seleccionado
                      </span>
                    </div>
                  )}
                </button>
              ))}
              {errors.evento && <p style={err}>{errors.evento}</p>}

              <div style={{
                marginTop: 8, padding: "14px 16px",
                backgroundColor: "rgba(223,159,0,0.05)",
                border: `1px solid ${C.border}`,
              }}>
                <p style={{ fontFamily: B, fontSize: 12, color: C.muted, lineHeight: 1.65 }}>
                  <span style={{ color: C.gold, fontWeight: 600 }}>Cupo limitado.</span> La reserva es gratuita. El acceso está sujeto a derecho de admisión.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate style={{
              padding: "28px",
              display: "flex", flexDirection: "column", gap: 20,
            }}>
              <div>
                <label style={lbl}>Nombre completo <span style={{ color: C.gold }}>*</span></label>
                <input type="text" placeholder="Tu nombre completo"
                  value={form.nombre} onChange={(e) => set("nombre", e.target.value)}
                  style={{ ...inp, borderColor: errors.nombre ? "#e05a00" : C.border }} />
                {errors.nombre && <p style={err}>{errors.nombre}</p>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>WhatsApp <span style={{ color: C.gold }}>*</span></label>
                  <input type="tel" placeholder="+593 000 000 000"
                    value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)}
                    style={{ ...inp, borderColor: errors.whatsapp ? "#e05a00" : C.border }} />
                  {errors.whatsapp && <p style={err}>{errors.whatsapp}</p>}
                </div>
                <div>
                  <label style={lbl}>Correo electrónico <span style={{ color: C.gold }}>*</span></label>
                  <input type="email" placeholder="tu@email.com"
                    value={form.email} onChange={(e) => set("email", e.target.value)}
                    style={{ ...inp, borderColor: errors.email ? "#e05a00" : C.border }} />
                  {errors.email && <p style={err}>{errors.email}</p>}
                </div>
              </div>

              <div>
                <label style={lbl}>Personas en tu reserva <span style={{ color: C.gold }}>*</span></label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                  {["1","2","3","4+"].map((op) => (
                    <button key={op} type="button" onClick={() => set("personas", op)} style={{
                      all: "unset", cursor: "pointer", textAlign: "center",
                      padding: "11px 0",
                      fontFamily: H, fontWeight: 900, fontSize: 20,
                      color: form.personas === op ? C.black : C.cream,
                      backgroundColor: form.personas === op ? C.gold : C.black,
                      border: `1px solid ${form.personas === op ? C.gold : C.border}`,
                      transition: "all 0.16s ease",
                    }}>{op}</button>
                  ))}
                </div>
                {errors.personas && <p style={err}>{errors.personas}</p>}
              </div>

              <div>
                <label style={lbl}>¿Cómo te enteraste? <span style={{ color: C.gold }}>*</span></label>
                <div role="radiogroup" aria-label="¿Cómo te enteraste?"
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { id: "ig",   label: "Instagram" },
                    { id: "tk",   label: "TikTok" },
                    { id: "ref",  label: "Recomendación de un amigo" },
                    { id: "otro", label: "Otro" },
                  ].map((op) => (
                    <RadioRow key={op.id} id={op.id} label={op.label}
                      checked={form.enterado === op.id}
                      onChange={() => set("enterado", op.id)} />
                  ))}
                </div>
                {errors.enterado && <p style={err}>{errors.enterado}</p>}
              </div>

              <div>
                <button type="button" onClick={() => set("terminos", !form.terminos)} style={{
                  all: "unset", cursor: "pointer",
                  display: "flex", alignItems: "flex-start", gap: 12,
                }}>
                  <div style={{
                    width: 20, height: 20, flexShrink: 0, marginTop: 1,
                    backgroundColor: form.terminos ? C.gold : "transparent",
                    border: `1.5px solid ${form.terminos ? C.gold : C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.16s ease",
                  }}>
                    {form.terminos && (
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                        <path d="M1 4L4 7L10 1" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontFamily: B, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                    Acepto los{" "}
                    <span style={{ color: C.gold, textDecoration: "underline" }}>términos de reserva</span>
                    {" "}— política de cancelación y derecho de admisión.{" "}
                    <span style={{ color: C.gold }}>*</span>
                  </span>
                </button>
                {errors.terminos && <p style={err}>{errors.terminos}</p>}
              </div>

              <button type="submit" disabled={loading} style={{
                backgroundColor: loading ? C.blackHi : C.gold,
                color: loading ? C.muted : C.black,
                fontFamily: H, fontWeight: 900, fontSize: 14,
                letterSpacing: "0.14em", textTransform: "uppercase",
                border: "none", padding: "16px", cursor: loading ? "wait" : "pointer",
                transition: "all 0.2s", marginTop: 4,
              }}>
                {loading ? "Enviando..." : "Confirmar Reserva →"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function RadioRow({
  id, label, checked, onChange,
}: { id: string; label: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      id={`enterado-${id}`} role="radio" aria-checked={checked}
      style={{
      all: "unset", cursor: "pointer",
      display: "flex", alignItems: "center", gap: 12,
      padding: "11px 16px",
      backgroundColor: checked ? C.blackHi : C.blackSoft,
      border: `1px solid ${checked ? C.borderHi : C.border}`,
      transition: "all 0.18s ease",
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
        border: `1.5px solid ${checked ? C.gold : C.border}`,
        backgroundColor: checked ? C.gold : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.18s ease",
      }}>
        {checked && <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: C.black }} />}
      </div>
      <span style={{
        fontFamily: B, fontSize: 14,
        color: checked ? C.cream : C.muted,
        transition: "color 0.18s",
      }}>{label}</span>
    </button>
  );
}

/* ════════════════════════════ GALLERY CARD ════════════════════════════ */
function GalleryCard({
  img, idx, tall, onOpen, contained,
}: {
  img: { src: string; alt: string; label: string };
  idx: number;
  tall?: boolean;
  contained?: boolean;
  onOpen: (i: number) => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={() => onOpen(idx)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label={`Ampliar foto: ${img.alt}`}
      className="isotype-mask"
      /* Explicit resets rather than `all: unset` — the shorthand also clears
         clip-path, and inline styles beat the .isotype-mask class rule. */
      style={{
        appearance: "none",
        background: "none",
        padding: 0,
        margin: 0,
        font: "inherit",
        color: "inherit",
        textAlign: "inherit",
        boxSizing: "border-box",
        display: "block", width: "100%",
        position: "relative",
        gridRow: tall ? "1 / 3" : "auto",
        minHeight: tall ? 480 : 200,
        cursor: "pointer", overflow: "hidden",
        border: `1px solid ${hov ? C.borderHi : C.border}`,
        transition: "border-color 0.25s",
        backgroundColor: contained ? C.ochre : C.blackCard,
      }}
    >
      <Image
        src={img.src} alt={img.alt} fill
        style={{
          objectFit: contained ? "contain" : "cover",
          transition: "transform 0.5s ease",
          transform: hov && !contained ? "scale(1.04)" : "scale(1)",
        }}
        sizes="(max-width:768px) 100vw, 33vw"
      />
      <div style={{
        position: "absolute", inset: 0,
        background: contained ? "none" : "linear-gradient(to top, rgba(17,17,17,0.75) 0%, transparent 55%)",
        opacity: hov ? 1 : 0.85,
        transition: "opacity 0.3s",
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "16px 20px",
      }}>
        <p style={{
          fontFamily: H, fontWeight: 700, fontSize: 10,
          letterSpacing: "0.22em", textTransform: "uppercase",
          color: C.gold, marginBottom: 2,
        }}>{img.label}</p>
        <p style={{
          fontFamily: H, fontWeight: 900, fontSize: 15,
          textTransform: "uppercase", color: C.cream, lineHeight: 1.2,
        }}>{img.alt}</p>
      </div>
      <div style={{
        position: "absolute", top: 12, right: 12,
        backgroundColor: "rgba(17,17,17,0.65)",
        color: C.cream, fontSize: 14, padding: "4px 9px",
        fontFamily: H, fontWeight: 700,
        opacity: hov ? 1 : 0, transition: "opacity 0.2s",
      }}>⊕</div>
    </button>
  );
}

/* ════════════════════════════ GALLERY ════════════════════════════ */
const IMGS = [
  { src: "/fotos_base/DSC06294.JPG",  alt: "Salón principal de BASE",        label: "El venue"   },
  { src: "/fotos_base/DSC06265.JPG",  alt: "Pasillo de arcos iluminados",    label: "Ambiente"   },
  { src: "/fotos_base/DSC06275.jpeg", alt: "Escenario e iluminación",        label: "Escenario"  },
  { src: "/fotos_base/DSC06291.JPG",  alt: "Mural y mesas del salón",        label: "El espacio" },
  { src: "/fotos_base/DSC06314.JPG",  alt: "Salón de doble altura",          label: "Noche"      },
  { src: "/fotos_base/DSC06315.JPG",  alt: "Mural de caligrafía en detalle", label: "Detalles"   },
  { src: "/fotos_base/base_004.jpeg", alt: "Fachada exterior de BASE",       label: "El venue"   },
];

function Gallery() {
  const [lbIndex, setLbIndex] = useState<number | null>(null);
  const { isMobile, isTablet } = useBreakpoint();
  const ref = useReveal(0);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape")     setLbIndex(null);
      if (e.key === "ArrowRight") setLbIndex(i => i !== null ? (i + 1) % IMGS.length : null);
      if (e.key === "ArrowLeft")  setLbIndex(i => i !== null ? (i - 1 + IMGS.length) % IMGS.length : null);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  return (
    <section id="galeria" style={{ backgroundColor: C.blackSoft, padding: isMobile ? "64px 0" : isTablet ? "80px 0" : "100px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "0 20px" : isTablet ? "0 32px" : "0 40px" }}>

        <div ref={ref} className="reveal" style={{ marginBottom: isMobile ? 36 : 56 }}>
          <Label>Galería</Label>
          <h2 style={{
            fontFamily: H, fontWeight: 900,
            fontSize: "clamp(34px,4.8vw,60px)", lineHeight: 0.95,
            textTransform: "uppercase", color: C.cream,
          }}>
            EL ESPACIO<br /><span style={{ color: C.gold }}>EN ACCIÓN</span>
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "2fr 1fr 1fr",
          gridTemplateRows: "auto",
          gap: 3,
        }}>
          <GalleryCard img={IMGS[0]} idx={0} tall={!isMobile && !isTablet} onOpen={setLbIndex} />
          <GalleryCard img={IMGS[1]} idx={1} onOpen={setLbIndex} />
          <GalleryCard img={IMGS[2]} idx={2} onOpen={setLbIndex} />
          <GalleryCard img={IMGS[3]} idx={3} onOpen={setLbIndex} />
          <GalleryCard img={IMGS[4]} idx={4} onOpen={setLbIndex} />
          <GalleryCard img={IMGS[5]} idx={5} onOpen={setLbIndex} />
          <GalleryCard img={IMGS[6]} idx={6} onOpen={setLbIndex} />
        </div>

        <p style={{
          fontFamily: B, fontSize: 13, color: C.muted, opacity: 0.4,
          marginTop: 20, textAlign: "center",
        }}>
          Más fotos en{" "}
          <a href="https://www.instagram.com/soylabase" target="_blank" rel="noopener noreferrer"
            style={{ color: C.gold, textDecoration: "none" }}>
            @soylabase
          </a>
        </p>
      </div>

      {/* Lightbox carrusel */}
      {lbIndex !== null && (() => {
        const cur  = IMGS[lbIndex];
        const prev = () => setLbIndex((lbIndex - 1 + IMGS.length) % IMGS.length);
        const next = () => setLbIndex((lbIndex + 1) % IMGS.length);
        return (
          <div
            onClick={() => setLbIndex(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 600,
              backgroundColor: "rgba(0,0,0,0.94)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: isMobile ? "64px 16px 24px" : "60px 80px 40px",
              animation: "fadeIn 0.2s ease",
            }}
          >
            {/* Imagen */}
            <div
              onClick={e => e.stopPropagation()}
              style={{ position: "relative", maxWidth: 900, width: "100%", maxHeight: "80dvh" }}
            >
              <Image
                src={cur.src} alt={cur.alt}
                width={900} height={600}
                style={{ objectFit: "contain", width: "100%", height: "auto", maxHeight: "80dvh", display: "block" }}
              />
            </div>

            {/* Cerrar */}
            <button onClick={() => setLbIndex(null)} style={{
              position: "fixed", top: 16, right: 20,
              background: "rgba(17,17,17,0.7)", border: "none", cursor: "pointer",
              color: C.cream, fontSize: 18, width: 36, height: 36,
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 10,
            }} aria-label="Cerrar">✕</button>

            {/* Flecha izquierda */}
            <button onClick={e => { e.stopPropagation(); prev(); }} style={{
              position: "fixed", left: isMobile ? 8 : 24, top: "50%", transform: "translateY(-50%)",
              background: "rgba(17,17,17,0.7)", border: `1px solid ${C.border}`,
              cursor: "pointer", color: C.cream, fontSize: 22,
              width: isMobile ? 36 : 48, height: isMobile ? 36 : 48,
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 10, transition: "background 0.2s",
            }} aria-label="Anterior">‹</button>

            {/* Flecha derecha */}
            <button onClick={e => { e.stopPropagation(); next(); }} style={{
              position: "fixed", right: isMobile ? 8 : 24, top: "50%", transform: "translateY(-50%)",
              background: "rgba(17,17,17,0.7)", border: `1px solid ${C.border}`,
              cursor: "pointer", color: C.cream, fontSize: 22,
              width: isMobile ? 36 : 48, height: isMobile ? 36 : 48,
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 10, transition: "background 0.2s",
            }} aria-label="Siguiente">›</button>

            {/* Contador y título */}
            <div style={{
              position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              zIndex: 10,
            }}>
              <p style={{
                fontFamily: H, fontWeight: 900, fontSize: 14,
                textTransform: "uppercase", color: C.cream, letterSpacing: "0.06em",
                textAlign: "center",
              }}>{cur.alt}</p>
              {/* Dots */}
              <div style={{ display: "flex", gap: 6 }}>
                {IMGS.map((_, i) => (
                  <button key={i} onClick={e => { e.stopPropagation(); setLbIndex(i); }} style={{
                    width: i === lbIndex ? 20 : 6, height: 6, borderRadius: 3,
                    backgroundColor: i === lbIndex ? C.gold : "rgba(244,236,220,0.3)",
                    border: "none", cursor: "pointer", padding: 0,
                    transition: "all 0.25s ease",
                  }} aria-label={`Foto ${i + 1}`} />
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
}

/* ════════════════════════════ ESPACIO ════════════════════════════ */
function Espacio() {
  const refH = useReveal(0);
  const { isMobile, isTablet, isSmallMobile } = useBreakpoint();

  const TIPOS = [
    {
      n: "01",
      title: "Conciertos",
      desc: "Escenario, iluminación profesional y sonido de calidad para artistas locales e internacionales.",
      tag: "Música en vivo",
    },
    {
      n: "02",
      title: "Fiestas & Celebraciones",
      desc: "Cumpleaños, graduaciones, reuniones privadas. Barra completa y DJ incluido bajo pedido.",
      tag: "Eventos sociales",
    },
    {
      n: "03",
      title: "Eventos Corporativos",
      desc: "Lanzamientos, presentaciones, afterworks y convenciones con capacidad para 300+ personas.",
      tag: "Corporativos",
    },
  ];

  return (
    <section id="espacio" style={{ backgroundColor: C.black, padding: isMobile ? "64px 0" : isTablet ? "80px 0" : "100px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "0 20px" : isTablet ? "0 32px" : "0 40px" }}>

        <div ref={refH} className="reveal" style={{
          display: "flex", alignItems: "flex-end",
          justifyContent: "space-between", marginBottom: isMobile ? 40 : 64, flexWrap: "wrap", gap: 20,
        }}>
          <div>
            <Label>El Espacio</Label>
            <h2 style={{
              fontFamily: H, fontWeight: 900,
              fontSize: "clamp(34px,4.8vw,60px)", lineHeight: 0.95,
              textTransform: "uppercase", color: C.cream,
            }}>
              UN VENUE.<br /><span style={{ color: C.gold }}>TRES MODOS.</span>
            </h2>
          </div>
          <div style={{ maxWidth: 280 }}>
            <p style={{ fontFamily: B, fontSize: 14, color: C.cream, lineHeight: 1.7, opacity: 0.75 }}>
              BASE se adapta a cada tipo de evento. Desde un show íntimo hasta una producción corporativa.
            </p>
          </div>
        </div>

        <div style={{
          display: "grid",
          /* En tablet caben dos por fila; apilarlas las tres desperdiciaba
             el ancho de 640–1023px. */
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2,1fr)" : "repeat(3,1fr)",
          gap: 3,
        }}>
          {TIPOS.map((t, i) => (
            <TipoCard key={t.n} t={t} i={i} />
          ))}
        </div>

        {/* Datos del venue */}
        <div style={{
          marginTop: 3,
          backgroundColor: C.blackHi,
          border: `1px solid ${C.border}`,
          padding: isMobile ? "28px 24px" : "32px 44px",
          display: "grid",
          gridTemplateColumns: isMobile || isTablet ? "1fr 1fr" : "repeat(4,1fr)",
          gap: isMobile || isTablet ? 16 : 0,
        }}>
          {[
            { val: "+300",   lbl: "Personas de pie" },
            { val: "Pro",    lbl: "Sonido e iluminación" },
            { val: "Barra",  lbl: "Completa · bajo pedido" },
            { val: "Quito",  lbl: "La Mariscal" },
          ].map((d, i) => (
            <div key={d.lbl} style={{
              display: "flex", flexDirection: "column", gap: 6,
              borderLeft: (!isMobile && !isTablet && i > 0) ? `1px solid ${C.ochreLine}` : "none",
              paddingLeft: (!isMobile && !isTablet && i > 0) ? 40 : 0,
            }}>
              <span style={{
                fontFamily: H, fontWeight: 900,
                fontSize: isSmallMobile ? 22 : isMobile ? 26 : isTablet ? 30 : 36,
                color: C.gold, lineHeight: 1,
                textTransform: "uppercase",
              }}>{d.val}</span>
              <span style={{
                fontFamily: H, fontWeight: 700, fontSize: 11,
                letterSpacing: "0.18em", textTransform: "uppercase",
                color: C.muted,
              }}>{d.lbl}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Own component so useReveal is not called inside a .map() (Rules of Hooks). */
function TipoCard({
  t, i,
}: { t: { n: string; title: string; desc: string; tag: string }; i: number }) {
  const ref = useReveal(i * 80);
  const { isMobile, isTablet } = useBreakpoint();
  return (
    <div ref={ref} className="reveal bento-card" style={{
      backgroundColor: C.blackCard,
      border: `1px solid ${C.border}`,
      padding: isMobile ? "28px 22px 32px" : "36px 32px 40px",
      display: "flex", flexDirection: "column", gap: 0,
      /* Sin minWidth:0 el ítem de grid no baja de su min-content y desborda
         la sección en pantallas angostas y a 1024px. */
      minWidth: 0,
      /* En tablet la rejilla es de 2: la tercera ocupa la fila entera en vez
         de quedar suelta a media fila. */
      gridColumn: isTablet && i === 2 ? "1 / -1" : "auto",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <span style={{
          fontFamily: H, fontWeight: 900, fontSize: 13,
          color: C.ochre, letterSpacing: "0.1em",
        }}>{t.n}</span>
        <span style={{
          fontFamily: H, fontWeight: 700, fontSize: 9,
          letterSpacing: "0.2em", textTransform: "uppercase",
          color: C.cream, border: `1px solid ${C.ochreLine}`,
          backgroundColor: "rgba(193,133,0,0.10)",
          padding: "4px 10px",
        }}>{t.tag}</span>
      </div>
      {/* Escalado para que la palabra más larga ("CELEBRACIONES") quepa tanto
          a 360px como en la columna de 3 a 1024px. */}
      <h3 style={{
        fontFamily: H, fontWeight: 900, fontSize: "clamp(20px,2.4vw,30px)",
        textTransform: "uppercase", color: C.cream,
        lineHeight: 1.02, marginBottom: 16,
      }}>{t.title}</h3>
      <div style={{ width: 32, height: 2, backgroundColor: C.gold, marginBottom: 20 }} />
      <p style={{ fontFamily: B, fontSize: 14, lineHeight: 1.75, color: C.muted }}>
        {t.desc}
      </p>
    </div>
  );
}

/* ════════════════════════════ BOOKING ════════════════════════════ */
function Booking() {
  const ref = useReveal(0);
  const { isMobile, isTablet, isSmallMobile } = useBreakpoint();

  return (
    <section id="booking" style={{
      position: "relative",
      backgroundColor: C.brown,
      padding: isMobile ? "64px 0" : isTablet ? "80px 0" : "100px 0",
      overflow: "hidden",
    }}>
      {/* Ghost text */}
      <div aria-hidden style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        fontFamily: H, fontWeight: 900,
        fontSize: "clamp(120px,22vw,280px)",
        textTransform: "uppercase",
        color: "transparent",
        WebkitTextStroke: "1px rgba(223,159,0,0.05)",
        whiteSpace: "nowrap",
        pointerEvents: "none", userSelect: "none",
        letterSpacing: "-0.02em", lineHeight: 1,
      }}>BOOK</div>

      <div ref={ref} className="reveal" style={{
        maxWidth: 1280, margin: "0 auto",
        padding: isMobile ? "0 20px" : isTablet ? "0 32px" : "0 40px",
        position: "relative", zIndex: 1,
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile || isTablet ? "1fr" : "1fr 1fr",
          gap: isMobile ? 48 : 80,
          alignItems: "start",
        }}>

          {/* Left */}
          <div>
            <Label>Reservas</Label>
            <h2 style={{
              fontFamily: H, fontWeight: 900,
              fontSize: "clamp(34px,4.8vw,62px)", lineHeight: 0.95,
              textTransform: "uppercase", color: C.cream, marginBottom: 28,
            }}>
              RESERVA<br /><span style={{ color: C.gold }}>EL ESPACIO</span>
            </h2>
            <p style={{
              fontFamily: B, fontSize: 16, lineHeight: 1.8,
              color: C.muted, maxWidth: 400, marginBottom: 40,
            }}>
              Disponible para eventos privados, corporativos, conciertos y fiestas.
              Escríbenos para recibir información sobre tarifas, disponibilidad y paquetes.
            </p>

            {/* Info cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 40 }}>
              {[
                { label: "Capacidad",    val: "+300 personas paradas" },
                { label: "Tipos",        val: "Corporativos · Conciertos · Fiestas" },
                { label: "Ubicación",    val: "Francisco Salazar y José Tamayo" },
                { label: "Contacto",     val: "WhatsApp directo" },
              ].map((row) => (
                <div key={row.label} style={{
                  display: "flex",
                  flexDirection: isSmallMobile ? "column" : "row",
                  justifyContent: "space-between",
                  alignItems: isSmallMobile ? "flex-start" : "center",
                  padding: isMobile ? "12px 16px" : "14px 20px",
                  backgroundColor: "rgba(244,236,220,0.04)",
                  border: `1px solid rgba(244,236,220,0.07)`,
                  gap: isSmallMobile ? 4 : 16,
                }}>
                  <span style={{
                    fontFamily: H, fontWeight: 700, fontSize: 10,
                    letterSpacing: "0.22em", textTransform: "uppercase",
                    color: C.muted, flexShrink: 0,
                  }}>{row.label}</span>
                  <span style={{
                    fontFamily: H, fontWeight: 800,
                    fontSize: isSmallMobile ? 13 : isMobile ? 14 : 16,
                    textTransform: "uppercase", color: C.cream,
                    textAlign: isSmallMobile ? "left" : "right",
                  }}>{row.val}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a
                href={WA_URL}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  fontFamily: H, fontWeight: 900, fontSize: 13,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  color: C.black, backgroundColor: "#25d366",
                  padding: "14px 28px", textDecoration: "none",
                  transition: "background 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "#1ebe57"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "#25d366"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.563 4.14 1.535 5.876L0 24l6.29-1.513A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.88 0-3.64-.494-5.163-1.358l-.369-.217-3.733.897.944-3.634-.24-.374A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                Escribir por WhatsApp
              </a>
              <GoldBtn href="#contacto" outline small>Formulario de contacto →</GoldBtn>
            </div>
          </div>

          {/* Right — CTA visual */}
          <div style={{
            backgroundColor: "rgba(223,159,0,0.05)",
            border: `1px solid ${C.borderHi}`,
            padding: isMobile ? "36px 28px" : "48px 44px",
          }}>
            <p style={{
              fontFamily: H, fontWeight: 700, fontSize: 11,
              letterSpacing: "0.3em", textTransform: "uppercase",
              color: C.gold, marginBottom: 24,
            }}>Para la cotización incluye:</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
              {[
                "Tipo de evento",
                "Fecha y horario tentativo",
                "Número estimado de asistentes",
                "Requerimientos especiales (sonido, decoración, catering)",
                "Tu nombre y contacto",
              ].map((item) => (
                <div key={item} style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                }}>
                  <div style={{
                    width: 22, height: 22, flexShrink: 0,
                    backgroundColor: C.gold,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginTop: 1,
                  }}>
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4L4 7L10 1" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p style={{ fontFamily: B, fontSize: 15, color: C.muted, lineHeight: 1.5 }}>{item}</p>
                </div>
              ))}
            </div>

            <p style={{
              fontFamily: B, fontSize: 13, color: C.muted, lineHeight: 1.65,
              borderTop: `1px solid ${C.border}`, paddingTop: 24,
            }}>
              Respondemos en menos de 24 horas. Consultas sin compromiso.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════ MERCH ════════════════════════════ */
const MERCH = [
  { id: 1, name: "Camiseta", desc: "100% algodón", price: "", avail: false },
  { id: 2, name: "Gorra",    desc: "Snapback",      price: "", avail: false },
  { id: 3, name: "Tote Bag", desc: "Lona",          price: "", avail: false },
];

/* Own component so useReveal is not called inside a .map() (Rules of Hooks). */
function MerchCard({ item, i }: { item: (typeof MERCH)[number]; i: number }) {
  const mRef = useReveal(i * 80);
  return (
    <div className="merch-card reveal" ref={mRef}
      style={{ backgroundColor: C.blackCard, display: "flex", flexDirection: "column" }}>
      <div className="merch-wrap isotype-mask" style={{ aspectRatio: "1/1", backgroundColor: "#181818" }}>
        <div className="merch-placeholder" style={{
          width: "100%", height: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Wordmark dim />
        </div>
        <div className="merch-overlay">
          <a href="#contacto" onClick={scrollTo("contacto")} style={{
            fontFamily: H, fontWeight: 900, fontSize: 12,
            letterSpacing: "0.14em", textTransform: "uppercase",
            color: C.black, backgroundColor: C.gold,
            padding: "12px 26px", textDecoration: "none",
          }}>
            {item.avail ? "Pedir ahora" : "Avísame"}
          </a>
        </div>
      </div>

      <div style={{ padding: "22px 24px 28px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <h3 style={{
          fontFamily: H, fontWeight: 900, fontSize: 21,
          textTransform: "uppercase", color: C.cream,
        }}>
          {item.name}
        </h3>
        <p style={{ fontFamily: B, fontSize: 13, color: C.muted, marginBottom: 12 }}>{item.desc}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
          {item.avail && item.price ? (
            <span style={{ fontFamily: H, fontWeight: 900, fontSize: 22, color: C.gold }}>
              {item.price}
            </span>
          ) : (
            <span style={{
              fontFamily: H, fontWeight: 700, fontSize: 10,
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: C.ochre,
            }}>Próximamente</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Merch() {
  const ref = useReveal(0);
  const { isMobile, isTablet } = useBreakpoint();
  return (
    <section id="merch" style={{ backgroundColor: C.blackSoft, padding: isMobile ? "64px 0" : isTablet ? "80px 0" : "100px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "0 20px" : isTablet ? "0 32px" : "0 40px" }}>
        <div ref={ref} className="reveal" style={{
          display: "flex", alignItems: "flex-end",
          justifyContent: "space-between", marginBottom: isMobile ? 32 : 56, flexWrap: "wrap", gap: 20,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <Label>Tienda</Label>
              <span style={{
                fontFamily: H, fontWeight: 800, fontSize: 10,
                letterSpacing: "0.22em", textTransform: "uppercase",
                color: C.black, backgroundColor: C.gold,
                padding: "4px 12px",
              }}>Próximamente</span>
            </div>
            <h2 style={{
              fontFamily: H, fontWeight: 900,
              fontSize: "clamp(34px,4.8vw,60px)", lineHeight: 0.95,
              textTransform: "uppercase", color: C.cream,
            }}>
              MERCH <span style={{ color: C.gold }}>BASE</span>
            </h2>
          </div>
          <p style={{ fontFamily: B, fontSize: 14, color: C.muted, maxWidth: 260, lineHeight: 1.7 }}>
            Piezas limitadas.<br />Lanzamiento pronto.
          </p>
        </div>

        {/* auto-fit: 2 columnas a 640px, 3 desde ~768px — evita que la tercera
            pieza quede huérfana en tablet. */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit,minmax(220px,1fr))",
          gap: 3,
        }}>
          {MERCH.map((item, i) => (
            <MerchCard key={item.id} item={item} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════ LOCATION ════════════════════════════ */
function Location() {
  const { isMobile, isTablet } = useBreakpoint();
  const MAPS_LINK = "https://maps.app.goo.gl/vN5DfK8U481gjTvj8";
  const ref = useReveal(0);

  return (
    <section id="ubicacion" style={{ backgroundColor: C.black, borderTop: `1px solid ${C.border}`, padding: isMobile ? "64px 0" : isTablet ? "80px 0" : "100px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "0 20px" : isTablet ? "0 32px" : "0 40px" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile || isTablet ? "1fr" : "1fr 1fr",
        minHeight: isMobile ? "auto" : 500,
        border: `1px solid ${C.border}`,
        overflow: "hidden",
      }}>
        <div style={{
          position: "relative",
          minHeight: isMobile ? 300 : isTablet ? 380 : "100%",
          order: isMobile ? 2 : 1,
          isolation: "isolate",
        }}>
          <MapEmbed />
          {!isMobile && !isTablet && (
            <div style={{
              position: "absolute", top: 0, right: 0, bottom: 0,
              width: 1, backgroundColor: C.borderHi,
              pointerEvents: "none", zIndex: 1,
            }} />
          )}
        </div>

        <div ref={ref} className="reveal" style={{
          order: isMobile ? 1 : 2,
          padding: isMobile ? "48px 20px" : isTablet ? "56px 40px" : "64px 56px",
          display: "flex", flexDirection: "column", justifyContent: "center",
          backgroundColor: C.blackSoft,
        }}>
          <Label>Ubicación</Label>
          <h2 style={{
            fontFamily: H, fontWeight: 900,
            fontSize: "clamp(30px,3.6vw,52px)", lineHeight: 0.9,
            textTransform: "uppercase", color: C.cream, marginBottom: 28,
          }}>
            CÓMO<br /><span style={{ color: C.gold }}>LLEGAR</span>
          </h2>
          <div style={{ width: 40, height: 3, backgroundColor: C.gold, marginBottom: 32 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 40 }}>
            {[
              { icon: "📍", label: "Dirección",  value: "Francisco Salazar y José Tamayo", sub: "Quito, Ecuador" },
              { icon: "🏙",  label: "Referencia", value: "Detrás del Hospital Baca Ortíz", sub: "Esquina" },
            ].map((item) => (
              <div key={item.label} style={{
                display: "flex", gap: 16, alignItems: "flex-start",
                paddingBottom: 20, borderBottom: `1px solid ${C.border}`,
              }}>
                <div style={{
                  width: 40, height: 40, flexShrink: 0,
                  backgroundColor: C.goldDim, border: `1px solid ${C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}>
                  {item.icon}
                </div>
                <div>
                  <p style={{
                    fontFamily: H, fontWeight: 700, fontSize: 10,
                    letterSpacing: "0.22em", textTransform: "uppercase",
                    color: C.muted, marginBottom: 4,
                  }}>{item.label}</p>
                  <p style={{
                    fontFamily: H, fontWeight: 900, fontSize: 18,
                    textTransform: "uppercase", color: C.cream, lineHeight: 1.2,
                  }}>{item.value}</p>
                  <p style={{ fontFamily: B, fontSize: 13, color: C.muted, marginTop: 2 }}>{item.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                fontFamily: H, fontWeight: 900, fontSize: 13,
                letterSpacing: "0.12em", textTransform: "uppercase",
                color: C.black, backgroundColor: C.gold,
                padding: "13px 28px", textDecoration: "none",
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Abrir en Maps
            </a>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}

/* ════════════════════════════ CONTACT ════════════════════════════ */
const EJS_SERVICE  = "service_74icrmm";
const EJS_TEMPLATE = "template_vrh005p";
const EJS_KEY      = "ir0X9nr2U8iRt--jH";

function Contact() {
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const ref = useReveal(0);
  const { isMobile, isTablet } = useBreakpoint();

  const inputStyle: React.CSSProperties = {
    backgroundColor: C.blackSoft, border: `1px solid ${C.border}`,
    color: C.cream, fontFamily: B, fontSize: 14,
    padding: "14px 16px", outline: "none", width: "100%", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: H, fontWeight: 700, fontSize: 10,
    letterSpacing: "0.22em", textTransform: "uppercase", color: C.muted,
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await emailjs.sendForm(EJS_SERVICE, EJS_TEMPLATE, formRef.current!, EJS_KEY);
      setSent(true);
    } catch {
      setError("Hubo un error al enviar. Intenta de nuevo o escríbenos por WhatsApp.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="contacto" style={{ backgroundColor: C.blackSoft, padding: isMobile ? "64px 0" : isTablet ? "80px 0" : "100px 0", borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "0 20px" : isTablet ? "0 32px" : "0 40px" }}>
        <div ref={ref} className="reveal" style={{
          display: "grid", gridTemplateColumns: isMobile || isTablet ? "1fr" : "1fr 1fr",
          gap: isMobile ? 40 : 96, alignItems: "start",
        }}>
          <div>
            <Label>Contacto</Label>
            <h2 style={{
              fontFamily: H, fontWeight: 900,
              fontSize: "clamp(34px,4.8vw,64px)", lineHeight: 0.95,
              textTransform: "uppercase", color: C.cream, marginBottom: 24,
            }}>
              HÁBLANOS
            </h2>
            <p style={{ fontFamily: B, fontSize: 15, lineHeight: 1.8, color: C.muted, maxWidth: 360, marginBottom: 40 }}>
              Para rentar el espacio, colaborar en un evento o cualquier consulta.
            </p>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                { lbl: "Instagram", val: "@soylabase",              href: "https://www.instagram.com/soylabase?igsh=M2V4c2RieG9kMG40", icon: <IconInstagram size={18} color={C.gold} /> },
                { lbl: "TikTok",   val: "@soylabase",              href: "https://www.tiktok.com/@soylabase",                          icon: <IconTikTok    size={18} color={C.gold} /> },
                { lbl: "Email",    val: "contacto@soylabase.com",  href: "mailto:contacto@soylabase.com",                             icon: <IconEmail     size={18} color={C.gold} /> },
                { lbl: "WhatsApp", val: "Escribir ahora",          href: WA_URL,                                                       icon: <IconWhatsApp  size={18} color={C.gold} /> },
              ].map(({ lbl, val, href, icon }) => (
                <div key={lbl} style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                  /* Envuelve en pantallas angostas: la fila etiqueta + correo
                     no cabía a 360px y recortaba la sección. */
                  flexWrap: "wrap", gap: "4px 16px",
                  padding: "18px 0", borderBottom: `1px solid ${C.border}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {icon}
                    <span style={{
                      fontFamily: H, fontWeight: 700, fontSize: 11,
                      letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted,
                    }}>{lbl}</span>
                  </div>
                  <a href={href} target="_blank" rel="noopener noreferrer" className="u-hover" style={{
                    fontFamily: H, fontWeight: 800,
                    fontSize: isMobile ? 15 : 17,
                    color: C.gold, textDecoration: "none",
                    overflowWrap: "anywhere",
                  }}>{val}</a>
                </div>
              ))}
            </div>
          </div>

          {sent ? (
            <div style={{
              backgroundColor: C.blackCard, border: `1px solid ${C.borderHi}`,
              padding: "60px 48px",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 20, minHeight: 400, textAlign: "center",
            }}>
              <div style={{
                width: 60, height: 60, backgroundColor: C.gold,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: H, fontWeight: 900, fontSize: 28, color: C.black,
              }}>✓</div>
              <h3 style={{
                fontFamily: H, fontWeight: 900, fontSize: 34,
                textTransform: "uppercase", color: C.cream,
              }}>¡Mensaje enviado!</h3>
              <p style={{ fontFamily: B, fontSize: 15, color: C.muted }}>
                Te respondemos a la brevedad.
              </p>
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit}
              style={{
                backgroundColor: C.blackCard, border: `1px solid ${C.border}`,
                padding: isMobile ? "32px 24px" : "44px",
                display: "flex", flexDirection: "column", gap: 22,
              }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label htmlFor="nombre" style={labelStyle}>Nombre</label>
                <input id="nombre" name="nombre" type="text" required placeholder="Tu nombre" style={inputStyle} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label htmlFor="email" style={labelStyle}>Email</label>
                <input id="email" name="email" type="email" required placeholder="tu@email.com" style={inputStyle} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label htmlFor="telefono" style={labelStyle}>Teléfono / WhatsApp</label>
                <input id="telefono" name="telefono" type="tel" placeholder="+593 99 000 0000" style={inputStyle} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label htmlFor="mensaje" style={labelStyle}>Mensaje</label>
                <textarea id="mensaje" name="mensaje" rows={4} required placeholder="¿En qué podemos ayudarte?" style={{
                  ...inputStyle, resize: "none",
                }} />
              </div>
              {error && (
                <p style={{ fontFamily: B, fontSize: 13, color: "#ff6b6b" }}>{error}</p>
              )}
              <button type="submit" disabled={loading} style={{
                backgroundColor: loading ? C.border : C.gold,
                color: C.black,
                fontFamily: H, fontWeight: 900, fontSize: 13,
                letterSpacing: "0.14em", textTransform: "uppercase",
                border: "none", padding: "16px", cursor: loading ? "not-allowed" : "pointer",
                marginTop: 4, transition: "background 0.2s",
              }}>
                {loading ? "Enviando..." : "Enviar Mensaje →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════ FOOTER ════════════════════════════ */
function Footer() {
  const { isMobile, isTablet } = useBreakpoint();

  const NAV = [
    { label: "El Espacio", href: "#espacio"  },
    { label: "Galería",    href: "#galeria"  },
    { label: "Eventos",    href: "#eventos"  },
    { label: "Reservas",   href: "#booking"   },
    { label: "Ubicación",  href: "#ubicacion" },
    { label: "Contacto",   href: "#contacto"  },
  ];
  const SOCIAL = [
    { label: "Instagram", href: "https://www.instagram.com/soylabase?igsh=M2V4c2RieG9kMG40", handle: "@soylabase",            icon: <IconInstagram size={18} color={C.black} /> },
    { label: "TikTok",    href: "https://www.tiktok.com/@soylabase",                          handle: "@soylabase",            icon: <IconTikTok    size={18} color={C.black} /> },
    { label: "Email",     href: "mailto:contacto@soylabase.com",                              handle: "contacto@soylabase.com",icon: <IconEmail     size={18} color={C.black} /> },
    { label: "WhatsApp",  href: WA_URL,                                                        handle: "WhatsApp",              icon: <IconWhatsApp  size={18} color={C.black} /> },
  ];

  return (
    <footer style={{ backgroundColor: C.blackSoft }}>

      {/* Gold accent top border */}
      <div style={{ height: 3, background: `linear-gradient(to right, ${C.gold}, ${C.goldHi}, ${C.gold})` }} />

      {/* Main content */}
      <div style={{
        maxWidth: 1280, margin: "0 auto",
        padding: isMobile ? "48px 20px 40px" : isTablet ? "56px 32px 48px" : "64px 40px 56px",
      }}>

        {/* Top row: brand + nav */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 40 : 64,
          paddingBottom: isMobile ? 36 : 48,
          borderBottom: `1px solid ${C.border}`,
          marginBottom: isMobile ? 36 : 48,
        }}>

          {/* Brand */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
            <Wordmark height={52} />
            <p style={{ fontFamily: B, fontSize: 15, lineHeight: 1.75, color: C.muted, maxWidth: 300 }}>
              Venue para conciertos, fiestas y eventos en Quito, Ecuador.
            </p>
            <a href="#booking" onClick={scrollTo("booking")} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontFamily: H, fontWeight: 900, fontSize: 11,
              letterSpacing: "0.14em", textTransform: "uppercase",
              color: C.black, backgroundColor: C.gold,
              padding: "10px 20px", textDecoration: "none",
              width: "fit-content", marginTop: 4,
            }}>
              Reservar el espacio →
            </a>
          </div>

          {/* Nav — 2 col wrap on mobile, single col on desktop */}
          <div>
            <p style={{
              fontFamily: H, fontWeight: 700, fontSize: 10,
              letterSpacing: "0.28em", textTransform: "uppercase",
              color: C.gold, marginBottom: 20,
            }}>Navegación</p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px 24px",
            }}>
              {NAV.map((n) => (
                <a key={n.href} href={n.href} onClick={scrollTo(n.href.slice(1))} className="u-hover" style={{
                  fontFamily: H, fontWeight: 800, fontSize: 15,
                  letterSpacing: "0.04em", textTransform: "uppercase",
                  color: C.cream, textDecoration: "none",
                }}>{n.label}</a>
              ))}
            </div>
          </div>
        </div>

        {/* Social row */}
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: isMobile ? 24 : 16,
          paddingBottom: isMobile ? 36 : 40,
          borderBottom: `1px solid ${C.border}`,
          marginBottom: 28,
        }}>
          <p style={{
            fontFamily: H, fontWeight: 700, fontSize: 10,
            letterSpacing: "0.28em", textTransform: "uppercase",
            color: C.gold, flexShrink: 0,
          }}>Redes & Contacto</p>

          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: isMobile ? 8 : 10,
          }}>
            {SOCIAL.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                title={s.label}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  textDecoration: "none",
                  fontFamily: H, fontWeight: 800, fontSize: 12,
                  letterSpacing: "0.04em", textTransform: "uppercase",
                  color: C.black, backgroundColor: C.gold,
                  padding: "8px 14px",
                  transition: "background 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = C.goldHi}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = C.gold}
              >
                {s.icon}
                {s.handle}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        }}>
          <p style={{ fontFamily: B, fontSize: 12, color: C.muted }}>
            © {new Date().getFullYear()} BASE · Quito, Ecuador
          </p>
          <div style={{ display: "flex", gap: 20 }}>
            {[["Privacidad","#"],["Términos","#"]].map(([l,h]) => (
              <a key={l} href={h} className="u-hover" style={{
                fontFamily: H, fontWeight: 700, fontSize: 10,
                letterSpacing: "0.18em", textTransform: "uppercase",
                color: C.muted, textDecoration: "none",
              }}>{l}</a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}

/* ════════════════════════════ SOCIAL ICONS ════════════════════════════ */
function IconInstagram({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill={color} stroke="none" />
    </svg>
  );
}

function IconTikTok({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
    </svg>
  );
}

function IconEmail({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="2,4 12,13 22,4" />
    </svg>
  );
}

function IconWhatsApp({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.563 4.14 1.535 5.876L0 24l6.29-1.513A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.88 0-3.64-.494-5.163-1.358l-.369-.217-3.733.897.944-3.634-.24-.374A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  );
}

/* ════════════════════════════ WORDMARK ════════════════════════════ */
function Wordmark({ dim, height = 36 }: { dim?: boolean; height?: number }) {
  if (dim) {
    return (
      <div style={{
        fontFamily: H, fontWeight: 900, fontSize: 20,
        letterSpacing: "0.08em", textTransform: "uppercase",
        lineHeight: 1, opacity: 0.07, userSelect: "none", color: C.cream,
      }}>
        BASE
      </div>
    );
  }
  return (
    /* Intrinsic size declared truthfully (the asset is 1920x1080) and scaled by
       height alone — the previous 108x36 pair mis-stated the ratio. */
    <Image
      src="/1.png"
      alt="BASE"
      width={1920}
      height={1080}
      priority
      style={{
        display: "block", height, width: "auto",
        /* Sin esto, un contenedor flex en columna (el footer) lo estira a lo
           ancho y deforma el logo. */
        alignSelf: "flex-start", maxWidth: "100%", objectFit: "contain",
      }}
    />
  );
}

/* ════════════════════════════ PAGE ════════════════════════════ */
export default function Page() {
  return (
    <>
      <Grain />
      <ReservasModal />
      <WhatsAppBtn />
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        {/* Order matches the navbar: El Espacio → Galería → Eventos → Reservas
            → Ubicación → Contacto. Previously Eventos came first, so visitors
            hit flyers before learning what BASE is. */}
        <Espacio />
        <Gallery />
        <Events />
        <Booking />
        <Merch />
        <Location />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
