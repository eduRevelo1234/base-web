"use client";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";

/* ════════════════════════════ TOKENS ════════════════════════════ */
const C = {
  black:     "#111111",
  blackSoft: "#181818",
  blackCard: "#1f1f1f",
  blackHi:   "#262626",
  gold:      "#df9f00",
  goldHi:    "#f0ad00",
  brown:     "#231806",
  cream:     "#f4ecdc",
  muted:     "rgba(244,236,220,0.45)",
  muted2:    "rgba(244,236,220,0.22)",
  border:    "rgba(223,159,0,0.12)",
  borderHi:  "rgba(223,159,0,0.32)",
  goldDim:   "rgba(223,159,0,0.08)",
};
const H = "var(--font-heading),'Barlow Condensed',sans-serif";
const B = "var(--font-body),'Barlow',system-ui,sans-serif";

/* ════════════════════════════ HOOKS ════════════════════════════ */
function useCountdown(target: Date) {
  const ms = target.getTime();
  const calc = useCallback(() => {
    const d = ms - Date.now();
    if (d <= 0) return { d: 0, h: 0, m: 0, s: 0 };
    return {
      d: Math.floor(d / 86400000),
      h: Math.floor((d % 86400000) / 3600000),
      m: Math.floor((d % 3600000) / 60000),
      s: Math.floor((d % 60000) / 1000),
    };
  }, [ms]);
  const [t, setT] = useState(calc);
  useEffect(() => {
    setT(calc());
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return t;
}

function useReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
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
    return () => obs.disconnect();
  }, [delay]);
  return ref;
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

function useBreakpoint() {
  const [w, setW] = useState(1280);
  useEffect(() => {
    setW(window.innerWidth);
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn, { passive: true });
    return () => window.removeEventListener("resize", fn);
  }, []);
  return {
    isMobile:  w < 640,
    isTablet:  w >= 640 && w < 1024,
    isDesktop: w >= 1024,
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
  href, onClick, children, outline, small,
}: {
  href?: string; onClick?: () => void;
  children: React.ReactNode; outline?: boolean; small?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const base: React.CSSProperties = {
    display: "inline-block",
    fontFamily: H, fontWeight: 900,
    fontSize: small ? 11 : 13,
    letterSpacing: "0.14em", textTransform: "uppercase",
    padding: small ? "10px 22px" : "14px 32px",
    textDecoration: "none", border: "none",
    transition: "all 0.22s ease", cursor: "pointer",
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
  return (
    <a href={href} style={style}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </a>
  );
}

/* ════════════════════════════ GRAIN ════════════════════════════ */
function Grain() {
  return <div className="grain-overlay" aria-hidden />;
}

/* ════════════════════════════ NAVBAR ════════════════════════════ */
function Navbar() {
  const scrolled  = useScrolled(60);
  const { isMobile, isTablet } = useBreakpoint();
  const [open, setOpen] = useState(false);

  const LINKS = [
    ["Eventos",  "#eventos" ],
    ["Espacio",  "#sobre"   ],
    ["Merch",    "#merch"   ],
    ["Contacto", "#contacto"],
  ];

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
      background: scrolled || open ? "rgba(17,17,17,0.98)" : "rgba(17,17,17,0.2)",
      backdropFilter: "blur(20px)",
      borderBottom: `1px solid ${scrolled ? C.borderHi : "transparent"}`,
      transition: "background 0.4s ease, border-color 0.4s ease",
    }}>
      {/* Main bar */}
      <div style={{
        maxWidth: 1280, margin: "0 auto",
        padding: isMobile ? "0 20px" : "0 40px",
        height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <a href="#inicio" style={{ textDecoration: "none" }} onClick={() => setOpen(false)}>
          <Wordmark />
        </a>

        {/* Desktop nav */}
        {!isMobile && !isTablet && (
          <nav style={{ display: "flex", gap: 36, alignItems: "center" }}>
            {LINKS.map(([l, h]) => (
              <a key={h} href={h} className="u-hover" style={{
                fontFamily: H, fontWeight: 700, fontSize: 12,
                letterSpacing: "0.18em", textTransform: "uppercase",
                color: C.cream, opacity: 0.65, textDecoration: "none",
              }}>{l}</a>
            ))}
          </nav>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {!isMobile && <GoldBtn onClick={openReservas} small>Reservar</GoldBtn>}

          {/* Hamburger — mobile & tablet */}
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

      {/* Mobile dropdown */}
      {(isMobile || isTablet) && open && (
        <div style={{
          backgroundColor: "rgba(17,17,17,0.98)",
          borderTop: `1px solid ${C.border}`,
          padding: "24px 20px 32px",
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          {LINKS.map(([l, h]) => (
            <a key={h} href={h}
              onClick={() => setOpen(false)}
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
            <GoldBtn onClick={() => { openReservas(); setOpen(false); }} small>Reservar Ahora →</GoldBtn>
          </div>
        </div>
      )}
    </header>
  );
}

/* ════════════════════════════ HERO ════════════════════════════ */
function Hero() {
  const EVENT = new Date("2026-07-25T20:00:00");
  const { d, h, m, s } = useCountdown(EVENT);
  const { isMobile, isTablet } = useBreakpoint();

  return (
    <section id="inicio" style={{
      position: "relative",
      minHeight: "100vh",
      backgroundColor: C.black,
      display: "flex", alignItems: "center",
      borderBottom: `1px solid ${C.border}`,
      overflow: "hidden",
    }}>
      {/* Ghost "BASE" text behind everything */}
      <div className="ghost-text" style={{ fontFamily: H }}>BASE</div>

      {/* Gold glow top-right */}
      <div style={{
        position: "absolute", top: -120, right: -80,
        width: 480, height: 480, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(223,159,0,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        position: "relative", zIndex: 1,
        maxWidth: 1280, margin: "0 auto",
        padding: isMobile ? "100px 20px 60px" : isTablet ? "110px 32px 70px" : "120px 40px 80px",
        width: "100%",
        display: "grid",
        gridTemplateColumns: isMobile || isTablet ? "1fr" : "1fr 400px",
        gap: isMobile ? 40 : 56,
        alignItems: "center",
      }}>
        {/* LEFT */}
        <div>
          {/* Live badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
            <span className="live-dot" />
            <span style={{
              fontFamily: H, fontWeight: 700, fontSize: 11,
              letterSpacing: "0.3em", textTransform: "uppercase", color: C.gold,
            }}>
              Inauguración · 25 de Julio 2026
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: H, fontWeight: 900,
            fontSize: "clamp(88px, 12vw, 168px)",
            lineHeight: 0.86, textTransform: "uppercase",
            color: C.cream, marginBottom: 40,
            letterSpacing: "-0.01em",
          }}>
            TOMA
            <br />
            <span style={{ color: C.gold }}>LA</span>
            <br />
            MÚSICA
          </h1>

          {/* Tagline */}
          <p style={{
            fontFamily: B, fontSize: 16, lineHeight: 1.8,
            color: C.muted, maxWidth: 420, marginBottom: 44,
          }}>
            BASE es el punto de encuentro para la música, la cultura urbana y
            la comunidad. Eventos en vivo, merch exclusivo y vibra que no
            encontrarás en otro lugar.
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <GoldBtn href="#eventos">Próximos Eventos →</GoldBtn>
            <GoldBtn href="#sobre" outline>Conoce BASE</GoldBtn>
          </div>

          {/* Countdown inline */}
          <div style={{
            marginTop: 56, paddingTop: 32,
            borderTop: `1px solid ${C.border}`,
            display: "grid", gridTemplateColumns: "repeat(4,auto)",
            gap: 32, width: "fit-content",
          }}>
            {([["d", d, "días"], ["h", h, "hrs"], ["m", m, "min"], ["s", s, "seg"]] as [string, number, string][]).map(([key, val, lbl]) => (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{
                  fontFamily: H, fontWeight: 900,
                  fontSize: "clamp(36px,4vw,52px)",
                  color: C.gold, lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {String(val).padStart(2, "0")}
                </span>
                <span style={{
                  fontFamily: H, fontWeight: 700, fontSize: 10,
                  letterSpacing: "0.22em", textTransform: "uppercase", color: C.muted,
                }}>
                  {lbl}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Flyer (hidden on mobile to keep hero clean) */}
        <div style={{ display: isMobile ? "none" : "flex", flexDirection: "column", gap: 12 }}>
          <div style={{
            position: "relative",
            aspectRatio: "3/4",
            border: `1px solid ${C.borderHi}`,
            overflow: "hidden",
          }}>
            <Image
              src="/event-julio25.jpeg"
              alt="La Era del Perreo · 25 Julio"
              fill priority
              style={{ objectFit: "cover" }}
              sizes="400px"
            />
            {/* Bottom gradient label */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "linear-gradient(to top,rgba(17,17,17,0.92) 0%,transparent 100%)",
              padding: "52px 20px 20px",
            }}>
              <p style={{
                fontFamily: H, fontWeight: 700, fontSize: 10,
                letterSpacing: "0.22em", textTransform: "uppercase",
                color: C.gold, marginBottom: 4,
              }}>Fiesta de Inauguración</p>
              <p style={{
                fontFamily: H, fontWeight: 900, fontSize: 22,
                textTransform: "uppercase", color: C.cream,
              }}>
                La Era del Perreo
              </p>
            </div>
          </div>

          {/* Date chip */}
          <div style={{
            backgroundColor: C.gold, padding: "12px 20px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{
              fontFamily: H, fontWeight: 900, fontSize: 13,
              letterSpacing: "0.08em", textTransform: "uppercase", color: C.black,
            }}>
              Sáb 25 Julio · 20:00 hrs
            </span>
            <span style={{
              fontFamily: H, fontWeight: 900, fontSize: 13, color: C.black,
            }}>→</span>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div style={{
        position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 1,
      }}>
        <span style={{
          fontFamily: H, fontWeight: 700, fontSize: 10,
          letterSpacing: "0.24em", textTransform: "uppercase",
          color: C.muted, opacity: 0.5,
        }}>Scroll</span>
        <div style={{
          width: 1, height: 40,
          background: `linear-gradient(to bottom, ${C.gold}, transparent)`,
        }} />
      </div>
    </section>
  );
}

/* ════════════════════════════ MARQUEE ════════════════════════════ */
function Marquee() {
  const items = ["BASE","MÚSICA","CULTURA","PERREO","INAUGURACIÓN","EVENTOS","MERCH","VIBRA"];
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

/* ════════════════════════════ BENTO ════════════════════════════ */
function Bento() {
  const ref = useReveal(0);
  const { isMobile, isTablet } = useBreakpoint();
  return (
    <section style={{ backgroundColor: C.blackSoft, padding: isMobile ? "48px 0" : "80px 0" }}>
      <div ref={ref} className="reveal" style={{
        maxWidth: 1280, margin: "0 auto",
        padding: isMobile ? "0 20px" : "0 40px",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "2fr 1fr 1fr",
        gridTemplateRows: "auto",
        gap: 3,
      }}>

        {/* Big: Próximo evento */}
        <BentoCard span="row" bg={C.blackCard} gold style={isMobile || isTablet ? {} : { gridRow: "1 / 3" }}>
          <Label>Próximo Evento</Label>
          <div style={{
            fontFamily: H, fontWeight: 900,
            fontSize: "clamp(40px,5vw,72px)", lineHeight: 0.9,
            textTransform: "uppercase", color: C.cream, marginBottom: 16,
          }}>
            LA ERA<br />DEL<br />
            <span style={{ color: C.gold }}>PERREO</span>
          </div>
          <p style={{ fontFamily: B, fontSize: 14, color: C.muted, lineHeight: 1.7, maxWidth: 320, marginBottom: 28 }}>
            La fiesta que abre las puertas de BASE. Reggaetón, perreo y pura vibra.
          </p>
          <GoldBtn onClick={openReservas} small>Reservar →</GoldBtn>
        </BentoCard>

        {/* Stat: Capacidad */}
        <BentoCard bg={C.gold}>
          <span style={{
            fontFamily: H, fontWeight: 900, fontSize: 56, color: C.black, lineHeight: 1,
          }}>500+</span>
          <span style={{
            fontFamily: H, fontWeight: 700, fontSize: 11, letterSpacing: "0.2em",
            textTransform: "uppercase", color: "rgba(0,0,0,0.6)", marginTop: 6,
          }}>Personas</span>
        </BentoCard>

        {/* Stat: Fecha */}
        <BentoCard bg={C.blackHi} gold>
          <span style={{
            fontFamily: H, fontWeight: 900, fontSize: "clamp(28px,3vw,42px)",
            color: C.gold, lineHeight: 1,
          }}>25 JUL</span>
          <span style={{
            fontFamily: H, fontWeight: 700, fontSize: 11, letterSpacing: "0.2em",
            textTransform: "uppercase", color: C.muted, marginTop: 6,
          }}>Fecha</span>
        </BentoCard>

        {/* Stat: Hora */}
        <BentoCard bg={C.blackCard} gold>
          <span style={{
            fontFamily: H, fontWeight: 900, fontSize: "clamp(28px,3vw,42px)",
            color: C.cream, lineHeight: 1,
          }}>20:00</span>
          <span style={{
            fontFamily: H, fontWeight: 700, fontSize: 11, letterSpacing: "0.2em",
            textTransform: "uppercase", color: C.muted, marginTop: 6,
          }}>Hora</span>
        </BentoCard>

        {/* Social */}
        <BentoCard bg={C.blackHi} gold>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <IconInstagram size={22} color={C.gold} />
            <IconTikTok size={22} color={C.gold} />
          </div>
          <span style={{
            fontFamily: H, fontWeight: 900, fontSize: 22, color: C.gold, lineHeight: 1,
          }}>@soylabase</span>
          <span style={{
            fontFamily: H, fontWeight: 700, fontSize: 11, letterSpacing: "0.2em",
            textTransform: "uppercase", color: C.muted, marginTop: 6,
          }}>Redes Sociales</span>
        </BentoCard>

      </div>
    </section>
  );
}

function BentoCard({
  children, bg, gold, style, span: _span,
}: {
  children: React.ReactNode;
  bg: string;
  gold?: boolean;
  style?: React.CSSProperties;
  span?: string;
}) {
  return (
    <div className="bento-card" style={{
      backgroundColor: bg,
      border: `1px solid ${gold ? "rgba(223,159,0,0.12)" : "rgba(255,255,255,0.04)"}`,
      padding: "36px 36px",
      display: "flex", flexDirection: "column", justifyContent: "flex-end",
      minHeight: 200,
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ════════════════════════════ EVENTS ════════════════════════════ */
function Events() {
  const refH = useReveal(0);
  const refC = useReveal(120);
  const { isMobile, isTablet } = useBreakpoint();
  return (
    <section id="eventos" style={{ backgroundColor: C.black, padding: isMobile ? "64px 0" : "100px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "0 20px" : "0 40px" }}>

        <div ref={refH} className="reveal" style={{
          display: "flex", alignItems: "flex-end",
          justifyContent: "space-between", marginBottom: isMobile ? 36 : 56, flexWrap: "wrap", gap: 20,
        }}>
          <div>
            <Label>Agenda</Label>
            <h2 style={{
              fontFamily: H, fontWeight: 900,
              fontSize: "clamp(52px,7vw,88px)",
              lineHeight: 0.88, textTransform: "uppercase", color: C.cream,
            }}>
              PRÓXIMOS<br /><span style={{ color: C.gold }}>EVENTOS</span>
            </h2>
          </div>
          <p style={{ fontFamily: B, fontSize: 14, color: C.muted, maxWidth: 260, lineHeight: 1.7 }}>
            Cada noche en BASE es una experiencia curada. La vibra, la música y la gente son el show.
          </p>
        </div>

        {/* Featured event card */}
        <div ref={refC} className="reveal" style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "3fr 2fr",
          border: `1px solid ${C.borderHi}`,
          overflow: "hidden", marginBottom: 3,
        }}>
          {/* Flyer */}
          <div style={{ position: "relative", minHeight: isMobile ? 300 : 560 }}>
            <Image
              src="/event-julio25.jpeg"
              alt="La Era del Perreo"
              fill style={{ objectFit: "cover" }}
              sizes="(max-width:900px) 100vw, 60vw"
            />
          </div>

          {/* Info panel */}
          <div style={{
            backgroundColor: C.blackCard,
            padding: isMobile ? "28px 24px" : "52px 44px",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
          }}>
            <div>
              <span style={{
                display: "inline-block", backgroundColor: C.gold, color: C.black,
                fontFamily: H, fontWeight: 800, fontSize: 10,
                letterSpacing: "0.22em", textTransform: "uppercase",
                padding: "5px 12px", marginBottom: 32,
              }}>
                Fiesta de Inauguración
              </span>

              <h3 style={{
                fontFamily: H, fontWeight: 900,
                fontSize: "clamp(40px,4vw,64px)", lineHeight: 0.9,
                textTransform: "uppercase", color: C.cream, marginBottom: 20,
              }}>
                LA ERA<br />DEL PERREO
              </h3>

              <div style={{ width: 36, height: 2, backgroundColor: C.gold, marginBottom: 24 }} />

              <p style={{ fontFamily: B, fontSize: 15, lineHeight: 1.75, color: C.muted }}>
                La noche que abre las puertas de BASE. Reggaetón, perreo y pura vibra para
                celebrar el inicio de algo grande.
              </p>
            </div>

            <div>
              <div style={{
                display: "flex", flexDirection: "column", gap: 14,
                borderTop: `1px solid ${C.border}`, paddingTop: 28, marginTop: 32, marginBottom: 32,
              }}>
                {[["Fecha","Sáb 25 de Julio"],["Hora","20:00 hrs"],["Lugar","BASE"]].map(([k,v]) => (
                  <div key={k} style={{ display: "flex", gap: 20, alignItems: "baseline" }}>
                    <span style={{
                      fontFamily: H, fontWeight: 700, fontSize: 10,
                      letterSpacing: "0.22em", textTransform: "uppercase",
                      color: C.muted, width: 40, flexShrink: 0,
                    }}>{k}</span>
                    <span style={{
                      fontFamily: H, fontWeight: 900, fontSize: 20,
                      textTransform: "uppercase", color: C.cream,
                    }}>{v}</span>
                  </div>
                ))}
              </div>
              <GoldBtn onClick={openReservas}>Reservar lugar →</GoldBtn>
            </div>
          </div>
        </div>

        {/* Coming soon row */}
        <div style={{
          backgroundColor: C.blackCard, border: `1px solid ${C.border}`,
          padding: "24px 36px",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
        }}>
          <div>
            <span style={{
              fontFamily: H, fontWeight: 700, fontSize: 10,
              letterSpacing: "0.26em", textTransform: "uppercase",
              color: C.gold, opacity: 0.55, display: "block", marginBottom: 4,
            }}>Próximamente · Agosto 2026</span>
            <span style={{
              fontFamily: H, fontWeight: 900, fontSize: 28,
              textTransform: "uppercase", color: C.cream, opacity: 0.18,
            }}>Por anunciar</span>
          </div>
          <span style={{
            fontFamily: H, fontWeight: 700, fontSize: 11,
            letterSpacing: "0.2em", textTransform: "uppercase",
            color: C.muted, opacity: 0.4,
          }}>
            Síguenos · @soylabase
          </span>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════ MODAL TRIGGER ════════════════════════════ */
function openReservas() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("base:openReservas"));
  }
}

/* ════════════════════════════ RESERVAS MODAL ════════════════════════════ */

const EVENTOS_25 = [
  {
    id:    "velada",
    hora:  "11:30 – 20:30",
    name:  "La Velada del Año VI",
    desc:  "Transmisión en pantalla gigante",
    badge: "Todo público",
    badgeColor: C.gold,
  },
  {
    id:    "night",
    hora:  "21:00 – 02:00",
    name:  "Night Party",
    desc:  "La BASE del Perreo",
    badge: "+18",
    badgeColor: "#e05a00",
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

  /* open/close via global event */
  useEffect(() => {
    const fn = () => setOpen(true);
    window.addEventListener("base:openReservas", fn);
    return () => window.removeEventListener("base:openReservas", fn);
  }, []);

  /* lock body scroll */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  /* close on Escape */
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
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
    /* Backdrop */
    <div
      onClick={() => setOpen(false)}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        backgroundColor: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobile ? 0 : "24px",
        animation: "fadeIn 0.2s ease",
      }}
    >
      {/* Panel */}
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
        {/* Modal header */}
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
            }}>25 de Julio 2026</p>
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
              transition: "color 0.2s",
            }}
            aria-label="Cerrar"
          >✕</button>
        </div>

        {sent ? (
          /* ── Success ── */
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
              Recibimos tu reserva. Te enviaremos una confirmación a tu correo y WhatsApp.
            </p>
            <p style={{ fontFamily: H, fontWeight: 900, fontSize: 18, color: C.gold }}>
              Nos vemos el 25 de julio 🎶
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
          /* ── Form body ── */
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1.5fr",
            flex: 1,
          }}>
            {/* LEFT — event cards */}
            <div style={{
              padding: "28px 28px",
              borderRight: isMobile ? "none" : `1px solid ${C.border}`,
              borderBottom: isMobile ? `1px solid ${C.border}` : "none",
              display: "flex", flexDirection: "column", gap: 3,
            }}>
              <p style={{ ...lbl, marginBottom: 14 }}>Selecciona tu evento</p>

              {EVENTOS_25.map((ev) => (
                <button key={ev.id} type="button" onClick={() => set("evento", ev.id)}
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
                      {ev.hora}
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

            {/* RIGHT — form fields */}
            <form onSubmit={handleSubmit} noValidate style={{
              padding: "28px 28px",
              display: "flex", flexDirection: "column", gap: 20,
            }}>
              {/* Nombre */}
              <div>
                <label style={lbl}>Nombre completo <span style={{ color: C.gold }}>*</span></label>
                <input type="text" placeholder="Tu nombre completo"
                  value={form.nombre} onChange={(e) => set("nombre", e.target.value)}
                  style={{ ...inp, borderColor: errors.nombre ? "#e05a00" : C.border }} />
                {errors.nombre && <p style={err}>{errors.nombre}</p>}
              </div>

              {/* WA + Email */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>WhatsApp <span style={{ color: C.gold }}>*</span></label>
                  <input type="tel" placeholder="+52 000 000 0000"
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

              {/* Personas */}
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

              {/* Cómo se enteró */}
              <div>
                <label style={lbl}>¿Cómo te enteraste? <span style={{ color: C.gold }}>*</span></label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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

              {/* Términos */}
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

              {/* Submit */}
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

/* helper: radio row */
function RadioRow({
  id, label, checked, onChange,
}: { id: string; label: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} style={{
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

/* ════════════════════════════ STATEMENT ════════════════════════════ */
function Statement() {
  const ref = useReveal(0);
  const { isMobile } = useBreakpoint();
  return (
    <section style={{
      position: "relative",
      backgroundColor: C.brown,
      padding: isMobile ? "64px 20px" : "100px 40px",
      overflow: "hidden",
      textAlign: "center",
    }}>
      {/* Ghost */}
      <div aria-hidden style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        fontFamily: H, fontWeight: 900,
        fontSize: "clamp(100px,20vw,260px)",
        textTransform: "uppercase",
        color: "transparent",
        WebkitTextStroke: "1px rgba(223,159,0,0.07)",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        userSelect: "none",
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}>
        BASE
      </div>

      <div ref={ref} className="reveal" style={{ position: "relative", zIndex: 1 }}>
        <Label>Nuestra filosofía</Label>
        <h2 style={{
          fontFamily: H, fontWeight: 900,
          fontSize: "clamp(48px,8vw,110px)",
          lineHeight: 0.88, textTransform: "uppercase",
          color: C.cream, maxWidth: 900, margin: "0 auto",
        }}>
          EL LUGAR DONDE <span style={{ color: C.gold }}>TODO</span> PASA
        </h2>
        <p style={{
          fontFamily: B, fontSize: 17, lineHeight: 1.8, color: C.muted,
          maxWidth: 500, margin: "32px auto 0",
        }}>
          BASE nace para ser más que un venue — es un punto de encuentro
          para artistas, creativos y amantes de la música que buscan
          un espacio auténtico.
        </p>
      </div>
    </section>
  );
}

/* ════════════════════════════ ABOUT ════════════════════════════ */
function About() {
  const refL = useReveal(0);
  const refR = useReveal(160);
  const { isMobile, isTablet } = useBreakpoint();
  const pillars = [
    { n: "01", title: "Eventos en Vivo",  desc: "Fiestas, conciertos y showcases curados con lo mejor de la escena local e internacional." },
    { n: "02", title: "Merch Exclusivo",  desc: "Ropa y accesorios de edición limitada del sello BASE para los que viven la cultura." },
    { n: "03", title: "Venue en Renta",   desc: "El espacio está disponible para eventos privados, lanzamientos y experiencias únicas." },
  ];
  return (
    <section id="sobre" style={{ backgroundColor: C.blackSoft, padding: isMobile ? "64px 0" : "100px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "0 20px" : "0 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile || isTablet ? "1fr" : "1fr 1fr", gap: isMobile ? 40 : 80, alignItems: "start" }}>
          <div ref={refL} className="reveal">
            <Label>Espacio</Label>
            <h2 style={{
              fontFamily: H, fontWeight: 900,
              fontSize: "clamp(56px,7vw,96px)", lineHeight: 0.88,
              textTransform: "uppercase", color: C.cream, marginBottom: 32,
            }}>
              MÚSICA<br />&<br /><span style={{ color: C.gold }}>CULTURA</span>
            </h2>
            <div style={{ width: 44, height: 3, backgroundColor: C.gold, marginBottom: 28 }} />
            <p style={{ fontFamily: B, fontSize: 16, lineHeight: 1.8, color: C.muted, maxWidth: 400 }}>
              Un espacio diseñado para eventos de primer nivel, con sonido
              profesional, barra completa y una atmósfera única que combina
              lo mejor del arte urbano y la música.
            </p>
          </div>

          <div ref={refR} className="reveal" style={{ display: "flex", flexDirection: "column" }}>
            {pillars.map((p, i) => (
              <div key={p.n} style={{
                display: "grid", gridTemplateColumns: "52px 1fr",
                gap: 20, padding: "28px 0",
                borderBottom: i < pillars.length - 1 ? `1px solid rgba(244,236,220,0.07)` : "none",
              }}>
                <span style={{
                  fontFamily: H, fontWeight: 900, fontSize: 13,
                  color: C.gold, opacity: 0.5, letterSpacing: "0.1em", paddingTop: 3,
                }}>
                  {p.n}
                </span>
                <div>
                  <h4 style={{
                    fontFamily: H, fontWeight: 900, fontSize: 22,
                    textTransform: "uppercase", color: C.cream, marginBottom: 8,
                  }}>
                    {p.title}
                  </h4>
                  <p style={{ fontFamily: B, fontSize: 14, lineHeight: 1.7, color: C.muted }}>
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════ MERCH ════════════════════════════ */
const MERCH = [
  { id: 1, name: "Camiseta BASE", desc: "100% algodón · Serigrafía gold", price: "$350", avail: true },
  { id: 2, name: "Gorra BASE",    desc: "Bordado en dorado · Snapback",    price: "$280", avail: true },
  { id: 3, name: "Tote Bag",      desc: "Lona · Print completo",           price: "$200", avail: false },
];

function Merch() {
  const ref = useReveal(0);
  const { isMobile, isTablet } = useBreakpoint();
  return (
    <section id="merch" style={{ backgroundColor: C.black, padding: isMobile ? "64px 0" : "100px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "0 20px" : "0 40px" }}>
        <div ref={ref} className="reveal" style={{
          display: "flex", alignItems: "flex-end",
          justifyContent: "space-between", marginBottom: isMobile ? 32 : 56, flexWrap: "wrap", gap: 20,
        }}>
          <div>
            <Label>Tienda</Label>
            <h2 style={{
              fontFamily: H, fontWeight: 900,
              fontSize: "clamp(52px,7vw,88px)", lineHeight: 0.88,
              textTransform: "uppercase", color: C.cream,
            }}>
              MERCH <span style={{ color: C.gold }}>BASE</span>
            </h2>
          </div>
          <p style={{ fontFamily: B, fontSize: 14, color: C.muted, maxWidth: 260, lineHeight: 1.7 }}>
            Piezas limitadas para los que viven la cultura. Pasa el cursor para ver opciones.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(3,1fr)", gap: 3 }}>
          {MERCH.map((item, i) => (
            <div key={item.id} className="merch-card reveal" ref={useReveal(i * 80)}
              style={{ backgroundColor: C.blackCard, display: "flex", flexDirection: "column" }}>
              {/* Image */}
              <div className="merch-wrap" style={{ aspectRatio: "1/1", backgroundColor: "#181818" }}>
                <div className="merch-placeholder" style={{
                  width: "100%", height: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Wordmark dim />
                </div>
                <div className="merch-overlay">
                  <a href="#contacto" style={{
                    fontFamily: H, fontWeight: 900, fontSize: 12,
                    letterSpacing: "0.14em", textTransform: "uppercase",
                    color: C.black, backgroundColor: C.gold,
                    padding: "12px 26px", textDecoration: "none",
                  }}>
                    {item.avail ? "Pedir ahora" : "Pronto"}
                  </a>
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: "22px 24px 28px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                <h3 style={{
                  fontFamily: H, fontWeight: 900, fontSize: 21,
                  textTransform: "uppercase", color: C.cream,
                }}>
                  {item.name}
                </h3>
                <p style={{ fontFamily: B, fontSize: 13, color: C.muted, marginBottom: 12 }}>{item.desc}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                  <span style={{ fontFamily: H, fontWeight: 900, fontSize: 22, color: C.gold }}>
                    {item.price}
                  </span>
                  {!item.avail && (
                    <span style={{
                      fontFamily: H, fontWeight: 700, fontSize: 10,
                      letterSpacing: "0.18em", textTransform: "uppercase",
                      color: C.muted, opacity: 0.45,
                    }}>Pronto</span>
                  )}
                </div>
              </div>
            </div>
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
  const EMBED_SRC = "https://maps.google.com/maps?q=Francisco+Salazar+y+Jose+Tamayo,+Quito,+Ecuador&t=&z=16&ie=UTF8&iwloc=&output=embed";
  const ref = useReveal(0);

  return (
    <section id="ubicacion" style={{ backgroundColor: C.black, borderTop: `1px solid ${C.border}` }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile || isTablet ? "1fr" : "1fr 1fr",
        minHeight: isMobile ? "auto" : 520,
      }}>

        {/* LEFT — Map embed */}
        <div style={{
          position: "relative",
          minHeight: isMobile ? 280 : isTablet ? 360 : "100%",
          order: isMobile ? 2 : 1,
        }}>
          <iframe
            src={EMBED_SRC}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              border: "none", filter: "grayscale(30%) contrast(1.1)",
            }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Ubicación BASE"
          />
          {/* Gold border overlay on right edge (desktop only) */}
          {!isMobile && !isTablet && (
            <div style={{
              position: "absolute", top: 0, right: 0, bottom: 0,
              width: 1, backgroundColor: C.borderHi,
              pointerEvents: "none",
            }} />
          )}
        </div>

        {/* RIGHT — Info */}
        <div
          ref={ref}
          className="reveal"
          style={{
            order: isMobile ? 1 : 2,
            padding: isMobile ? "48px 20px" : isTablet ? "56px 40px" : "64px 56px",
            display: "flex", flexDirection: "column", justifyContent: "center",
            backgroundColor: C.blackSoft,
          }}
        >
          <Label>Ubicación</Label>

          <h2 style={{
            fontFamily: H, fontWeight: 900,
            fontSize: "clamp(44px,6vw,80px)", lineHeight: 0.9,
            textTransform: "uppercase", color: C.cream,
            marginBottom: 28,
          }}>
            CÓMO<br /><span style={{ color: C.gold }}>LLEGAR</span>
          </h2>

          <div style={{ width: 40, height: 3, backgroundColor: C.gold, marginBottom: 32 }} />

          {/* Address block */}
          <div style={{
            display: "flex", flexDirection: "column", gap: 20,
            marginBottom: 40,
          }}>
            {[
              {
                icon: "📍",
                label: "Dirección",
                value: "Francisco Salazar y José Tamayo",
                sub: "Quito, Ecuador",
              },
              {
                icon: "🏙",
                label: "Referencia",
                value: "Av. Eloy Alfaro",
                sub: "Sector La Floresta",
              },
              {
                icon: "🕗",
                label: "Horario del evento",
                value: "Sábado 25 Jul — desde 11:30",
                sub: "Puertas abren 30 min antes",
              },
            ].map((item) => (
              <div key={item.label} style={{
                display: "flex", gap: 16, alignItems: "flex-start",
                paddingBottom: 20,
                borderBottom: `1px solid ${C.border}`,
              }}>
                <div style={{
                  width: 40, height: 40, flexShrink: 0,
                  backgroundColor: C.goldDim,
                  border: `1px solid ${C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
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
                  <p style={{
                    fontFamily: B, fontSize: 13, color: C.muted, marginTop: 2,
                  }}>{item.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a
              href={MAPS_LINK}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                fontFamily: H, fontWeight: 900, fontSize: 13,
                letterSpacing: "0.12em", textTransform: "uppercase",
                color: C.black, backgroundColor: C.gold,
                padding: "13px 28px", textDecoration: "none",
                transition: "background 0.2s",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Abrir en Google Maps
            </a>
            <GoldBtn onClick={openReservas} outline small>
              Reservar →
            </GoldBtn>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════ CONTACT ════════════════════════════ */
function Contact() {
  const [sent, setSent] = useState(false);
  const ref = useReveal(0);
  const { isMobile, isTablet } = useBreakpoint();

  return (
    <section id="contacto" style={{ backgroundColor: C.blackSoft, padding: isMobile ? "64px 0" : "100px 0", borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "0 20px" : "0 40px" }}>
        <div ref={ref} className="reveal" style={{
          display: "grid", gridTemplateColumns: isMobile || isTablet ? "1fr" : "1fr 1fr", gap: isMobile ? 40 : 96, alignItems: "start",
        }}>
          {/* Left */}
          <div>
            <Label>Contacto</Label>
            <h2 style={{
              fontFamily: H, fontWeight: 900,
              fontSize: "clamp(52px,7vw,96px)", lineHeight: 0.88,
              textTransform: "uppercase", color: C.cream, marginBottom: 36,
            }}>
              HÁBLANOS
            </h2>
            <p style={{ fontFamily: B, fontSize: 15, lineHeight: 1.8, color: C.muted, maxWidth: 360, marginBottom: 48 }}>
              ¿Quieres rentar el espacio, colaborar en un evento o saber más
              sobre lo que viene? Escríbenos.
            </p>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                { lbl: "Instagram", val: "@soylabase",     href: "https://www.instagram.com/soylabase?igsh=M2V4c2RieG9kMG40",  icon: <IconInstagram size={18} color={C.gold} /> },
                { lbl: "TikTok",   val: "@soylabase",     href: "https://www.tiktok.com/@soylabase",    icon: <IconTikTok    size={18} color={C.gold} /> },
                { lbl: "Email",    val: "hola@basemx.com", href: "mailto:hola@basemx.com",           icon: <IconEmail     size={18} color={C.gold} /> },
              ].map(({ lbl, val, href, icon }) => (
                <div key={lbl} style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between",
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
                    fontFamily: H, fontWeight: 800, fontSize: 17,
                    color: C.gold, textDecoration: "none",
                  }}>{val}</a>
                </div>
              ))}
            </div>
          </div>

          {/* Right: form */}
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
            <form onSubmit={(e) => { e.preventDefault(); setSent(true); }}
              style={{
                backgroundColor: C.blackCard, border: `1px solid ${C.border}`,
                padding: "44px", display: "flex", flexDirection: "column", gap: 22,
              }}>
              {[
                { id: "name",  label: "Nombre", type: "text",  ph: "Tu nombre"    },
                { id: "email", label: "Email",  type: "email", ph: "tu@email.com" },
              ].map((f) => (
                <div key={f.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label htmlFor={f.id} style={{
                    fontFamily: H, fontWeight: 700, fontSize: 10,
                    letterSpacing: "0.22em", textTransform: "uppercase", color: C.muted,
                  }}>{f.label}</label>
                  <input id={f.id} type={f.type} required placeholder={f.ph} style={{
                    backgroundColor: C.blackSoft,
                    border: `1px solid ${C.border}`,
                    color: C.cream, fontFamily: B, fontSize: 14,
                    padding: "14px 16px", outline: "none",
                  }} />
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label htmlFor="msg" style={{
                  fontFamily: H, fontWeight: 700, fontSize: 10,
                  letterSpacing: "0.22em", textTransform: "uppercase", color: C.muted,
                }}>Mensaje</label>
                <textarea id="msg" rows={4} required placeholder="¿En qué podemos ayudarte?" style={{
                  backgroundColor: C.blackSoft, border: `1px solid ${C.border}`,
                  color: C.cream, fontFamily: B, fontSize: 14,
                  padding: "14px 16px", outline: "none", resize: "none",
                }} />
              </div>
              <button type="submit" style={{
                backgroundColor: C.gold, color: C.black,
                fontFamily: H, fontWeight: 900, fontSize: 13,
                letterSpacing: "0.14em", textTransform: "uppercase",
                border: "none", padding: "16px", cursor: "pointer",
                marginTop: 4, transition: "background 0.2s",
              }}>
                Enviar Mensaje
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
  const [email, setEmail] = useState("");
  const [sub, setSub] = useState(false);
  const { isMobile, isTablet } = useBreakpoint();

  const NAV = [
    { label: "Eventos",  href: "#eventos"  },
    { label: "Espacio",  href: "#sobre"    },
    { label: "Merch",    href: "#merch"    },
    { label: "Contacto", href: "#contacto" },
  ];
  const SOCIAL = [
    { label: "Instagram", href: "https://www.instagram.com/soylabase?igsh=M2V4c2RieG9kMG40",  handle: "@soylabase",      icon: <IconInstagram size={18} color={C.gold} /> },
    { label: "TikTok",    href: "https://www.tiktok.com/@soylabase",    handle: "@soylabase",      icon: <IconTikTok    size={18} color={C.gold} /> },
    { label: "Email",     href: "mailto:hola@basemx.com",           handle: "hola@basemx.com", icon: <IconEmail     size={18} color={C.gold} /> },
  ];

  return (
    <footer style={{ backgroundColor: C.black, borderTop: `1px solid ${C.border}` }}>

      {/* ── CTA strip ── */}
      <div style={{
        position: "relative",
        borderBottom: `1px solid ${C.border}`,
        padding: isMobile ? "56px 20px" : "80px 40px",
        overflow: "hidden",
        textAlign: "center",
      }}>
        {/* Ghost wordmark */}
        <div aria-hidden style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          fontFamily: H, fontWeight: 900,
          fontSize: "clamp(100px,18vw,220px)",
          color: "transparent",
          WebkitTextStroke: "1px rgba(223,159,0,0.05)",
          whiteSpace: "nowrap", pointerEvents: "none",
          userSelect: "none", letterSpacing: "-0.02em", lineHeight: 1,
        }}>BASE</div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{
            fontFamily: H, fontWeight: 700, fontSize: 11,
            letterSpacing: "0.3em", textTransform: "uppercase",
            color: C.gold, marginBottom: 20,
          }}>¿Listo para la experiencia?</p>

          <h2 style={{
            fontFamily: H, fontWeight: 900,
            fontSize: "clamp(52px,8vw,108px)",
            lineHeight: 0.88, textTransform: "uppercase",
            color: C.cream, marginBottom: 36,
          }}>
            ÚNETE A<br /><span style={{ color: C.gold }}>BASE</span>
          </h2>

          <GoldBtn onClick={openReservas}>Reservar tu lugar →</GoldBtn>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div style={{
        maxWidth: 1280, margin: "0 auto",
        padding: isMobile ? "40px 20px 0" : "64px 40px 0",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1.8fr 1fr 1fr 1.6fr",
        gap: isMobile ? 40 : 48,
        borderBottom: `1px solid ${C.border}`,
        paddingBottom: isMobile ? 40 : 64,
      }}>

        {/* Col 1 — Brand */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Wordmark />
          <p style={{ fontFamily: B, fontSize: 14, lineHeight: 1.75, color: C.muted, maxWidth: 260 }}>
            Espacio para eventos, música en vivo y cultura urbana. El lugar donde todo pasa.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            {[
              { label: "Instagram", href: "https://www.instagram.com/soylabase?igsh=M2V4c2RieG9kMG40", icon: <IconInstagram size={16} color={C.black} /> },
              { label: "TikTok",    href: "https://www.tiktok.com/@soylabase",   icon: <IconTikTok    size={16} color={C.black} /> },
            ].map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                title={s.label}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 38, height: 38,
                  backgroundColor: C.gold, textDecoration: "none",
                  transition: "background 0.2s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = C.goldHi; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = C.gold; }}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Col 2 — Nav */}
        <div>
          <p style={{
            fontFamily: H, fontWeight: 700, fontSize: 10,
            letterSpacing: "0.28em", textTransform: "uppercase",
            color: C.muted, marginBottom: 24,
          }}>Navegación</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="u-hover" style={{
                fontFamily: H, fontWeight: 800, fontSize: 16,
                letterSpacing: "0.04em", textTransform: "uppercase",
                color: C.cream, textDecoration: "none",
                opacity: 0.75, transition: "opacity 0.2s",
              }}>{n.label}</a>
            ))}
          </div>
        </div>

        {/* Col 3 — Contacto */}
        <div>
          <p style={{
            fontFamily: H, fontWeight: 700, fontSize: 10,
            letterSpacing: "0.28em", textTransform: "uppercase",
            color: C.muted, marginBottom: 24,
          }}>Contacto</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {SOCIAL.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  textDecoration: "none", padding: "10px 14px",
                  border: `1px solid ${C.border}`,
                  backgroundColor: C.blackCard,
                  transition: "border-color 0.2s, background 0.2s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = C.borderHi;
                  (e.currentTarget as HTMLElement).style.backgroundColor = C.blackHi;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = C.border;
                  (e.currentTarget as HTMLElement).style.backgroundColor = C.blackCard;
                }}
              >
                <span style={{ flexShrink: 0 }}>{s.icon}</span>
                <div>
                  <p style={{
                    fontFamily: H, fontWeight: 700, fontSize: 10,
                    letterSpacing: "0.2em", textTransform: "uppercase",
                    color: C.muted, opacity: 0.5, lineHeight: 1, marginBottom: 3,
                  }}>{s.label}</p>
                  <p style={{
                    fontFamily: H, fontWeight: 800, fontSize: 15,
                    color: C.cream, lineHeight: 1,
                  }}>{s.handle}</p>
                </div>
                <span style={{ marginLeft: "auto", color: C.muted, opacity: 0.3, fontSize: 12 }}>↗</span>
              </a>
            ))}
          </div>
        </div>

        {/* Col 4 — Newsletter */}
        <div>
          <p style={{
            fontFamily: H, fontWeight: 700, fontSize: 10,
            letterSpacing: "0.28em", textTransform: "uppercase",
            color: C.muted, marginBottom: 24,
          }}>Newsletter</p>

          {sub ? (
            <div style={{
              backgroundColor: C.blackCard,
              border: `1px solid ${C.borderHi}`,
              padding: "24px 20px",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{
                width: 36, height: 36, backgroundColor: C.gold,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: H, fontWeight: 900, fontSize: 18, color: C.black, flexShrink: 0,
              }}>✓</div>
              <p style={{ fontFamily: B, fontSize: 13, color: C.cream, lineHeight: 1.5 }}>
                ¡Listo! Te avisamos de cada evento y drop de merch.
              </p>
            </div>
          ) : (
            <>
              <p style={{ fontFamily: B, fontSize: 14, lineHeight: 1.7, color: C.muted, marginBottom: 20 }}>
                Entérate primero de cada evento, drop de merch y novedad de BASE.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); setSub(true); }}
                style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  type="email" required
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    backgroundColor: C.blackCard,
                    border: `1px solid ${C.border}`,
                    color: C.cream, fontFamily: B, fontSize: 14,
                    padding: "13px 16px", outline: "none",
                    transition: "border-color 0.2s",
                  }}
                />
                <button type="submit" style={{
                  backgroundColor: C.gold, color: C.black,
                  fontFamily: H, fontWeight: 900, fontSize: 12,
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  border: "none", padding: "13px", cursor: "pointer",
                  transition: "background 0.2s",
                }}>
                  Suscribirme
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{
        maxWidth: 1280, margin: "0 auto",
        padding: isMobile ? "20px 20px" : "24px 40px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <p style={{ fontFamily: B, fontSize: 12, color: C.muted, opacity: 0.38 }}>
          © {new Date().getFullYear()} BASE · Música & Cultura · Todos los derechos reservados.
        </p>
        <div style={{ display: "flex", gap: 24 }}>
          {[["Privacidad","#"],["Términos","#"]].map(([l,h]) => (
            <a key={l} href={h} className="u-hover" style={{
              fontFamily: H, fontWeight: 700, fontSize: 10,
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: C.muted, textDecoration: "none", opacity: 0.4,
            }}>{l}</a>
          ))}
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

/* ════════════════════════════ WORDMARK ════════════════════════════ */
function Wordmark({ dim }: { dim?: boolean }) {
  return (
    <div style={{
      fontFamily: H, fontWeight: 900, fontSize: 20,
      letterSpacing: "0.08em", textTransform: "uppercase",
      lineHeight: 1, opacity: dim ? 0.07 : 1, userSelect: "none",
    }}>
      <span style={{ color: C.gold }}>B</span>
      <span style={{ color: C.cream }}>ASE</span>
    </div>
  );
}

/* ════════════════════════════ PAGE ════════════════════════════ */
export default function Page() {
  return (
    <>
      <Grain />
      <ReservasModal />
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Bento />
        <Events />
        <Statement />
        <About />
        <Merch />
        <Location />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
