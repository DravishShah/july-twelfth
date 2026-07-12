"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
const CARD_WIDTH = 380;
const CARD_HEIGHT = 200;
const RAIN_COUNT = 90;

const PHASES = [
  {
    tag: "The First Storm | 2014",
    text: '"I was told to stop talking to you.\n\nBut how do you remove someone who had already become a part of you?"',
    resolve: "So... we didn't.\n\nWe loved each other quietly.",
    clicksNeeded: 6,
    breakDur: 0.8,
  },
  {
    tag: "The Second Storm | 2022 - 2024",
    text: '"They said no again.\n\nBut I had already decided.\n\nIt was always going to be you."',
    resolve: "November 2024.\n\nThey finally said yes.",
    clicksNeeded: 6,
    breakDur: 1.2,
  },
];

const FINAL_PHOTO_SRC = "/we.png";
const FINAL_CAPTION = "And then, things started to fall into place.";

const SHARD_POLYGONS = [
  "polygon(0 0, 60% 0, 40% 100%, 0 100%)",
  "polygon(60% 0, 100% 0, 100% 40%, 30% 100%, 40% 100%)",
  "polygon(0 100%, 40% 100%, 60% 40%, 20% 60%)",
  "polygon(100% 40%, 100% 100%, 60% 100%, 60% 40%)",
  "polygon(40% 0, 60% 0, 100% 40%, 60% 40%)",
];
const SHARD_ANGLES = [
  { x: -160, y: -80, rotate: -60 },
  { x: 170, y: -100, rotate: 70 },
  { x: -130, y: 120, rotate: -80 },
  { x: 140, y: 130, rotate: 50 },
  { x: 10, y: -150, rotate: 25 },
];

function jitter(range: number) {
  return (Math.random() - 0.5) * range;
}

// Distance from (ox, oy) to the card's edge, travelling at angleDeg — used
// to cap crack length so spokes stop at the glass edge instead of running
// past it.
function distanceToEdge(
  ox: number,
  oy: number,
  angleDeg: number,
  w: number,
  h: number
) {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  let tMax = Infinity;
  if (dx > 0) tMax = Math.min(tMax, (w - ox) / dx);
  if (dx < 0) tMax = Math.min(tMax, (0 - ox) / dx);
  if (dy > 0) tMax = Math.min(tMax, (h - oy) / dy);
  if (dy < 0) tMax = Math.min(tMax, (0 - oy) / dy);
  return tMax;
}

function buildSpoke(
  x: number,
  y: number,
  angleDeg: number,
  maxLen: number,
  segments: number
) {
  const points: [number, number][] = [[x, y]];
  let angle = angleDeg;
  let px = x;
  let py = y;
  for (let i = 0; i < segments; i++) {
    angle += jitter(30);
    const segLen =
      (maxLen / segments) * (1 - i * 0.1) * (0.7 + Math.random() * 0.6);
    px += Math.cos((angle * Math.PI) / 180) * segLen;
    py += Math.sin((angle * Math.PI) / 180) * segLen;
    // Safety clamp — guarantees the crack never visually exits the card,
    // even if jitter pushed a segment past the pre-computed edge distance.
    px = Math.max(2, Math.min(CARD_WIDTH - 2, px));
    py = Math.max(2, Math.min(CARD_HEIGHT - 2, py));
    points.push([px, py]);
  }
  return points;
}

function pointsToPath(points: [number, number][]) {
  return (
    "M" + points.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" L")
  );
}

function generateCrackWeb(originX: number, originY: number) {
  const pathStrings: string[] = [];
  const spokeCount = 6 + Math.floor(Math.random() * 3);
  const spokes: [number, number][][] = [];

  for (let i = 0; i < spokeCount; i++) {
    const angle = (360 / spokeCount) * i + jitter(18);
    const edgeDist = distanceToEdge(
      originX,
      originY,
      angle,
      CARD_WIDTH,
      CARD_HEIGHT
    );
    const maxLen = Math.min(50 + Math.random() * 70, edgeDist * 0.85);
    const pts = buildSpoke(originX, originY, angle, maxLen, 4);
    spokes.push(pts);
    pathStrings.push(pointsToPath(pts));

    if (Math.random() < 0.55 && pts.length > 2) {
      const branchFrom = pts[1 + Math.floor(Math.random() * (pts.length - 2))];
      const branchAngle =
        angle + (Math.random() < 0.5 ? 1 : -1) * (28 + Math.random() * 26);
      const branchEdgeDist = distanceToEdge(
        branchFrom[0],
        branchFrom[1],
        branchAngle,
        CARD_WIDTH,
        CARD_HEIGHT
      );
      const branchLen = Math.min(maxLen * 0.5, branchEdgeDist * 0.85);
      const branchPts = buildSpoke(
        branchFrom[0],
        branchFrom[1],
        branchAngle,
        branchLen,
        2
      );
      pathStrings.push(pointsToPath(branchPts));
    }
  }

  [0.4, 0.75].forEach((frac) => {
    if (Math.random() > 0.75) return;
    const ringPts = spokes.map((pts) => {
      const idx = Math.min(pts.length - 1, Math.round((pts.length - 1) * frac));
      return pts[idx];
    });
    if (ringPts.length > 2) pathStrings.push(pointsToPath(ringPts));
  });

  return pathStrings;
}

export default function TwoStorms() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cloudLayerRef = useRef<HTMLDivElement>(null);
  const rainLayerRef = useRef<HTMLDivElement>(null);
  const lightningFlashRef = useRef<HTMLDivElement>(null);
  const doubtCardRef = useRef<HTMLDivElement>(null);
  const doubtTextRef = useRef<HTMLParagraphElement>(null);
  const resolveTextRef = useRef<HTMLParagraphElement>(null);
  const phaseTagRef = useRef<HTMLDivElement>(null);
  const shardContainerRef = useRef<HTMLDivElement>(null);
  const crackSvgRef = useRef<SVGSVGElement>(null);
  const finalCardRef = useRef<HTMLDivElement>(null);
  const finalGlowRef = useRef<HTMLDivElement>(null);

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [rainIntense, setRainIntense] = useState(false);
  const readyRef = useRef(true);
  const clickCountRef = useRef(0);
  const storyCompletedRef = useRef(false);

  // Generated once on mount (not during render — Math.random() during
  // render is impure and React's newer lint rules correctly flag it) and
  // then stable for the component's whole lifetime, same as any other
  // piece of state. React owns these elements from here on; nothing
  // imperatively creates or destroys DOM nodes for them.
  const [cloudSpecs] = useState(() => [
    { w: 700, h: 260, top: -8, left: -15, speed: 70, dir: 1 },
    { w: 900, h: 300, top: 2, left: 10, speed: 95, dir: -1 },
    { w: 600, h: 220, top: 10, left: 35, speed: 55, dir: 1 },
    { w: 800, h: 280, top: -4, left: 60, speed: 120, dir: -1 },
  ]);

  const [rainSpecs] = useState(() =>
    Array.from({ length: RAIN_COUNT }, () => ({
      left: Math.random() * 100,
      height: 60 + Math.random() * 90,
      opacity: 0.3 + Math.random() * 0.5,
      baseDur: 0.7 + Math.random() * 0.6,
      delay: Math.random() * 1.3,
    }))
  );

  // Entrance — simple fade/rise when scrolled into view (no heavy pin,
  // this section's main interaction is click-driven, not scroll-driven).
  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content) return;

    const ctx = gsap.context(() => {
      gsap.set(content, { opacity: 0, y: 40 });
      gsap.to(content, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: "top 75%",
          toggleActions: "play none none reverse",
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  // Scroll lock — once this chapter comes into view, scrolling past it is
  // blocked until both phases have been broken and the final photo reveal
  // has finished.
  //
  // Uses document.body.style.overflow = "hidden" — the same mechanism
  // TheConfusion (Chapter 1) already uses successfully for its own gated
  // reveal — rather than trying to preventDefault() individual wheel/touch
  // events, which turned out to be unreliable here (momentum scrolling and
  // browser-native smooth-scroll interpolation don't consistently respect
  // per-event preventDefault()).
  //
  // Position is checked via a continuously-running requestAnimationFrame
  // loop instead of a GSAP ScrollTrigger with a pre-calculated position:
  // this page has other async-loaded content (Chapter 2's door model)
  // whose pin-spacer can insert itself into the document after some
  // triggers have already measured their positions, leaving those
  // measurements stale — which could fire this lock before the user can
  // ever reach this section, permanently deadlocking the page. A raf loop
  // reads the section's actual live position every frame, so there's
  // nothing to go stale.
  //
  // Sequencing: once the section is reasonably close, it's snapped into
  // exact alignment first (scrollIntoView), and the lock only engages
  // once that snap has actually finished moving — locking immediately
  // would fight the snap's own scroll animation.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let hasSnapped = false;
    let rafId: number;
    let cancelled = false;

    function engageLock() {
      if (!storyCompletedRef.current) {
        document.body.style.overflow = "hidden";
      }
    }

    function poll() {
      if (cancelled || !section) return;

      if (!storyCompletedRef.current) {
        const rect = section.getBoundingClientRect();

        if (!hasSnapped) {
          // Wide window — virtually guaranteed to catch the section
          // during any scroll speed, since this is checked every frame
          // rather than only on discrete scroll/wheel events.
          if (
            rect.top < window.innerHeight * 0.65 &&
            rect.top > -rect.height * 0.5
          ) {
            hasSnapped = true;
            section.scrollIntoView({ behavior: "smooth", block: "start" });
            if ("onscrollend" in window) {
              window.addEventListener("scrollend", engageLock, { once: true });
            } else {
              // Fallback for browsers without the scrollend event —
              // matches a typical smooth-scroll duration.
              setTimeout(engageLock, 700);
            }
          }
        } else if (rect.top > window.innerHeight || rect.bottom < 0) {
          // Scrolled far enough away without completing — reset so a
          // future re-approach snaps (and locks) again.
          hasSnapped = false;
          document.body.style.overflow = "";
        }
      }

      rafId = requestAnimationFrame(poll);
    }
    rafId = requestAnimationFrame(poll);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("scrollend", engageLock);
      // Defensive: never leave the whole site stuck unscrollable if this
      // component unmounts while still locked.
      document.body.style.overflow = "";
    };
  }, []);

  // Lightning flash trigger — the one piece of the storm that genuinely
  // needs JS (random ambient timing, plus flashes synced to clicks/breaks).
  // Rain and clouds are rendered declaratively below instead (see
  // rainSpecs/cloudSpecs + the JSX) — this used to imperatively create
  // ~94 DOM elements by hand, which turned out to be fragile under dev-mode
  // hot reload. Letting React own the DOM for those removes that whole
  // category of bug.
  useEffect(() => {
    const lightningFlash = lightningFlashRef.current;
    if (!lightningFlash) return;

    let mounted = true;
    function flashLightning(peakOpacity: number) {
      if (!lightningFlash) return;
      gsap
        .timeline()
        .to(lightningFlash, { opacity: peakOpacity, duration: 0.06 })
        .to(lightningFlash, { opacity: 0.05, duration: 0.08 })
        .to(lightningFlash, { opacity: peakOpacity * 0.7, duration: 0.05 })
        .to(lightningFlash, { opacity: 0, duration: 0.3 });
    }
    function scheduleAmbient() {
      gsap.delayedCall(4 + Math.random() * 6, () => {
        if (!mounted) return;
        flashLightning(0.35);
        scheduleAmbient();
      });
    }
    scheduleAmbient();
    flashLightningRef.current = flashLightning;

    return () => {
      mounted = false;
    };
  }, []);

  const flashLightningRef = useRef<(peak: number) => void>(() => {});

  function makeShards() {
    const container = shardContainerRef.current;
    if (!container) return [];
    container.innerHTML = "";
    return SHARD_POLYGONS.map((poly) => {
      const s = document.createElement("div");
      s.style.position = "absolute";
      s.style.inset = "0";
      s.style.background = "rgba(255,255,255,0.06)";
      s.style.border = "1px solid rgba(255,255,255,0.14)";
      s.style.opacity = "0";
      s.style.clipPath = poly;
      container.appendChild(s);
      return s;
    });
  }

  function setupPhase(index: number) {
    const p = PHASES[index];
    if (phaseTagRef.current) phaseTagRef.current.textContent = p.tag;
    if (doubtTextRef.current) doubtTextRef.current.textContent = p.text;
    if (resolveTextRef.current) resolveTextRef.current.textContent = p.resolve;
    if (doubtCardRef.current)
      gsap.set(doubtCardRef.current, { opacity: 1, scale: 1, x: 0 });
    if (resolveTextRef.current)
      gsap.set(resolveTextRef.current, { opacity: 0 });
    if (crackSvgRef.current) crackSvgRef.current.innerHTML = "";
    makeShards();
    clickCountRef.current = 0;
    readyRef.current = true;
  }

  useEffect(() => {
    setupPhase(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function drawCrackWeb(originX: number, originY: number) {
    const svg = crackSvgRef.current;
    if (!svg) return;
    const paths = generateCrackWeb(originX, originY);
    const svgNS = "http://www.w3.org/2000/svg";

    paths.forEach((d, i) => {
      const dark = document.createElementNS(svgNS, "path");
      dark.setAttribute("d", d);
      dark.setAttribute("stroke", "rgba(10,10,15,0.55)");
      dark.setAttribute("fill", "none");
      dark.setAttribute("stroke-linecap", "round");
      dark.setAttribute("stroke-width", "1.4");
      dark.setAttribute("transform", "translate(0.6,0.8)");
      svg.appendChild(dark);

      const light = document.createElementNS(svgNS, "path");
      light.setAttribute("d", d);
      light.setAttribute("stroke", "rgba(255,255,255,0.6)");
      light.setAttribute("fill", "none");
      light.setAttribute("stroke-linecap", "round");
      light.setAttribute("stroke-width", "0.6");
      svg.appendChild(light);

      [dark, light].forEach((el) => {
        const len = el.getTotalLength();
        el.style.strokeDasharray = String(len);
        el.style.strokeDashoffset = String(len);
        gsap.to(el, {
          strokeDashoffset: 0,
          duration: 0.22 + Math.random() * 0.12,
          ease: "power1.out",
          delay: i * 0.015,
        });
      });
    });

    const flash = document.createElementNS(svgNS, "circle");
    flash.setAttribute("cx", String(originX));
    flash.setAttribute("cy", String(originY));
    flash.setAttribute("r", "3");
    flash.setAttribute("fill", "rgba(255,255,255,0.9)");
    svg.appendChild(flash);
    gsap.fromTo(
      flash,
      { opacity: 1, attr: { r: 2 } },
      { opacity: 0, attr: { r: 22 }, duration: 0.35, ease: "power2.out" }
    );
  }

  function triggerBreak() {
    readyRef.current = false;
    const p = PHASES[phaseIndex];
    const shards =
      shardContainerRef.current?.querySelectorAll<HTMLDivElement>("div") ?? [];
    setRainIntense(true);

    const tl = gsap.timeline({
      onComplete: () => {
        setRainIntense(false);
        if (phaseIndex < PHASES.length - 1) {
          gsap.delayedCall(0.4, () => {
            setPhaseIndex((i) => {
              const next = i + 1;
              setupPhase(next);
              return next;
            });
          });
        } else {
          finishStory();
        }
      },
    });

    tl.call(() => flashLightningRef.current(0.9))
      .to(doubtCardRef.current, { opacity: 0, duration: 0.15 })
      .set(shards, { opacity: 1 });

    shards.forEach((shard, i) => {
      tl.to(
        shard,
        {
          ...SHARD_ANGLES[i],
          opacity: 0,
          duration: p.breakDur,
          ease: "power2.in",
        },
        "<"
      );
    });

    tl.call(() => {
      setRainIntense(false);
    })
      .to(resolveTextRef.current, { opacity: 1, duration: 0.6 }, "-=0.2")
      .to(resolveTextRef.current, { opacity: 0, duration: 0.5, delay: 1.1 });
  }

  function finishStory() {
    const tl = gsap.timeline();
    if (cloudLayerRef.current && rainLayerRef.current) {
      tl.to([cloudLayerRef.current, rainLayerRef.current], {
        opacity: 0,
        duration: 1.6,
      });
    }
    if (phaseTagRef.current) {
      tl.to(phaseTagRef.current, { opacity: 0, duration: 0.6 }, "<");
    }
    if (finalGlowRef.current) {
      tl.to(finalGlowRef.current, { opacity: 1, duration: 1.4 }, "-=1.2");
    }
    if (finalCardRef.current) {
      tl.fromTo(
        finalCardRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 1, ease: "power2.out" },
        "-=0.8"
      );
    }

    tl.call(() => {
      storyCompletedRef.current = true;
      document.body.style.overflow = "";
    });
  }

  function handleCardClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!readyRef.current || !doubtCardRef.current) return;
    const rect = doubtCardRef.current.getBoundingClientRect();
    const originX = ((e.clientX - rect.left) / rect.width) * CARD_WIDTH;
    const originY = ((e.clientY - rect.top) / rect.height) * CARD_HEIGHT;

    clickCountRef.current += 1;
    gsap.to(doubtCardRef.current, {
      x: jitter(6),
      duration: 0.05,
      yoyo: true,
      repeat: 1,
    });
    drawCrackWeb(originX, originY);

    const p = PHASES[phaseIndex];
    if (clickCountRef.current >= p.clicksNeeded) {
      triggerBreak();
    }
  }

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-black overflow-hidden"
      style={{ height: "100vh", maxHeight: "100vh", scrollSnapAlign: "start" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&display=swap');
        .hero-text      { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        .font-cormorant { font-family: 'Cormorant Garamond', Georgia, serif; }

        @keyframes chapter4Fall {
          from { transform: translateY(-10vh) rotate(12deg); }
          to   { transform: translateY(110vh) rotate(12deg); }
        }
        @keyframes chapter4Drift {
          from { transform: translateX(0); }
          to   { transform: translateX(var(--drift-x, 200px)); }
        }
      `}</style>

      <div
        ref={contentRef}
        className="relative flex flex-col items-center justify-center"
        style={{ height: "100vh", maxHeight: "100vh", padding: "8vh 6vw" }}
      >
        {/* Storm layers — rendered declaratively (see cloudSpecs/rainSpecs
            above), animated with the CSS keyframes in the <style> block
            below, instead of hand-created/destroyed DOM elements. */}
        <div
          ref={cloudLayerRef}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          {cloudSpecs.map((c, i) => (
            <div
              key={i}
              style={
                {
                  position: "absolute",
                  width: c.w,
                  height: c.h,
                  top: c.top + "%",
                  left: c.left + "%",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(ellipse at center, rgba(60,66,80,0.55) 0%, rgba(40,44,54,0.25) 45%, transparent 75%)",
                  filter: "blur(18px)",
                  "--drift-x": `${c.dir * 200}px`,
                  animation: `chapter4Drift ${c.speed}s ease-in-out infinite alternate`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        <div
          ref={rainLayerRef}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          {rainSpecs.map((r, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "-10%",
                width: 1,
                height: r.height,
                left: r.left + "%",
                opacity: r.opacity,
                transform: "rotate(12deg)",
                background:
                  "linear-gradient(180deg, transparent, rgba(180,200,230,0.35), rgba(180,200,230,0.05))",
                animationName: "chapter4Fall",
                animationDuration: `${r.baseDur * (rainIntense ? 0.45 : 1)}s`,
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
                animationDelay: `${r.delay}s`,
              }}
            />
          ))}
        </div>
        <div
          ref={lightningFlashRef}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(200,220,255,0.9) 0%, rgba(150,180,230,0.3) 40%, transparent 75%)",
            opacity: 0,
          }}
        />

        <p
          className="hero-text absolute"
          style={{
            top: "6vh",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: "0.34em",
            textTransform: "uppercase",
            color: "rgba(122,184,245,0.45)",
            whiteSpace: "nowrap",
            zIndex: 5,
          }}
        >
          Chapter 04 &nbsp;·&nbsp; Two Storms
        </p>
        <div
          ref={phaseTagRef}
          className="hero-text absolute"
          style={{
            top: "12vh",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(230,235,245,0.35)",
            zIndex: 5,
          }}
        >
          Phase one
        </div>

        {/* Doubt card */}
        <div
          style={{
            position: "relative",
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            zIndex: 5,
          }}
        >
          <div
            ref={doubtCardRef}
            onClick={handleCardClick}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 16,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.14)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 40px",
              textAlign: "center",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <p
              ref={doubtTextRef}
              className="font-cormorant"
              style={{
                fontSize: 26,
                fontStyle: "italic",
                lineHeight: 1.4,
                color: "rgba(235,238,245,0.9)",
              }}
            >
              &quot;This will never work.&quot;
            </p>
            <svg
              ref={crackSvgRef}
              viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                overflow: "visible",
              }}
            />
          </div>
          <div
            ref={shardContainerRef}
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          />
          <p
            ref={resolveTextRef}
            className="font-cormorant"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: 24,
              fontStyle: "italic",
              color: "rgba(122,184,245,0.75)",
              opacity: 0,
              textAlign: "center",
              width: 420,
              pointerEvents: "none",
            }}
          >
            We made it through.
          </p>
        </div>

        {/* Warm glow blooming behind the final card — from the original
            concept preview, carried over here. */}
        <div
          ref={finalGlowRef}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,190,130,0.25) 0%, rgba(255,150,90,0.08) 45%, transparent 75%)",
            filter: "blur(4px)",
            opacity: 0,
            zIndex: 5,
            pointerEvents: "none",
          }}
        />

        {/* Final reveal — photo card, replaces the old text-only ending.
            The OUTER wrapper handles centering via a plain transform (a
            well-tested, standard technique) and GSAP never touches it.
            The INNER card (finalCardRef) has no transform of its own at
            all, so GSAP can freely animate its opacity/y without fighting
            anything — same principle as before, implemented more simply
            after the zero-width flex version turned out to collapse the
            card's width in practice. */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 6,
            pointerEvents: "none",
          }}
        >
          <div
            ref={finalCardRef}
            style={{
              opacity: 0,
              width: "min(90vw, 420px)",
              maxHeight: "88vh",
              overflowY: "auto",
              borderRadius: 20,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.16)",
              boxShadow: "0 30px 70px rgba(0,0,0,0.5)",
              padding: 20,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={FINAL_PHOTO_SRC}
              alt=""
              style={{
                width: "100%",
                maxHeight: "38vh",
                borderRadius: 12,
                display: "block",
                objectFit: "contain",
              }}
            />
            <p
              className="font-cormorant"
              style={{
                marginTop: 18,
                fontSize: 22,
                fontStyle: "italic",
                textAlign: "center",
                color: "rgba(235,238,245,0.9)",
              }}
            >
              {FINAL_CAPTION}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
