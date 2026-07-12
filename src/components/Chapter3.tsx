"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────────────────────────────────────
// Chapter 03 — The Ordinary Magic
// Stack: Next.js · Tailwind · GSAP
//
// A 2x2 grid of glassmorphism cards, each with a second card peeking out
// from behind it. Clicking slides the back card out — growing from the
// exact clicked position into a centered, dimmed glass panel with the note.
//
// PREMIUM TOUCHES:
//   - Cursor-tilt: front card tilts in 3D following the mouse (mousemove
//     handlers below), with a lift + subtle scale.
//   - Light sheen sweep on hover (see the `.card-front::before` CSS rule).
//   - Frosted entrance: cards resolve from blurred to sharp as they
//     scroll in, alongside the existing rise/scale/rotate stagger.
//   - Grain texture overlay on the opened panel (SVG turbulence, very
//     low opacity) so it doesn't read as flat CSS.
//   - Tactile click feedback: a quick press-down pulse before the card
//     slides out.
//
// HOW TO CUSTOMIZE:
//   - Edit the CARDS array below — image (shown on the card) and
//     letter (the full text shown once opened).
//   - Image files live in public/cards/.
//
// TUNING NOTES:
//   - CARD_WIDTH/CARD_HEIGHT   → card size
//   - grid `gap` (in the JSX)  → spacing between cards
//   - TILT_MAX_DEG             → how far the cursor-tilt goes
// ─────────────────────────────────────────────────────────────────────────────

const CARDS = [
  {
    roman: "I",
    image: "/letters/stone.png",
    letter: `Patther.

    Of all the names I could have called you, somehow this ridiculous little nickname was the one that stayed. It never made much sense to anyone else, and honestly, it probably didn't make much sense to us either. But somewhere between school corridors, endless conversations, growing up, and growing together... it quietly became yours.
    
    You still pretend to dislike it every now and then, but I think we've both accepted that it isn't going anywhere. Somewhere along the way, Patther stopped being just a nickname. It became everything that came with it... the comfort, the laughter, the arguments, the memories, and every version of us that existed before we even knew we'd end up here.
    
    You've been my calm when life felt chaotic, my reason when I overthought everything, my biggest comfort, my safest place, and somehow... the one person who has always made the world feel a little lighter.
    
    Funny how a silly nickname from school ended up becoming the most meaningful name I know.
    
    To everyone else, you're Pranali.
    
    But to me... you'll always be my Patther.`,
  },
  {
    roman: "II",
    image: "/letters/train.png",
    letter: `Some people remember Mumbai Locals for the rush, the noise, or the endless crowd.
    I'll always remember them because they remind me of you.
    
    Every trip from Dahanu to Churchgate was never just a journey to the city. It became our little escape from the rest of the world. We shared earphones, watched movies on a tiny phone screen, talked about everything and nothing, and somehow those hours always disappeared faster than they should have.
    
    People spend thousands searching for the perfect date. We found ours somewhere between two stations in the Train.
    
    The funniest part, though, was never the journey to Mumbai. It was the journey back home. We had mastered an entire system by then. We planned our arrival, we planned our exit, and somehow made sure our parents never met at the station. Arriving was usually the easier part, but leaving required military-level planning. One of us would get picked up first while the other patiently waited before making that final call home. At the time, it all felt completely normal. Looking back now, it feels like we were directing our own little secret love story.

    And maybe that's why trains will always mean more to us than they ever should. Because somewhere on those railway tracks, I didn't just fall in love with you... I asked you to spend your life with me (if you could guess what I mean).
      
    But my favourite part is knowing that the next time we step onto one together, we won't have to worry about who arrives first, who leaves later, or whether our parents might see us.
    We'll simply get off at Dahanu... together.`,
  },
  {
    roman: "III",
    image: "/letters/scooter.png",
    letter: `Scooter Rides.
    Some people have a favourite café. Some have a favourite place to escape.

    We always had our scooter.

    Whenever life felt a little too heavy, or one of us simply wanted to spend time together, we'd just ride. No destination, no plans... just the road ahead and the comfort of having each other.

    Sometimes we'd talk about everything that was on our minds. Sometimes we'd say almost nothing at all. Somehow, by the time we turned back home, the problems always felt a little smaller.

    I'll never forget the way you'd hold onto me, sometimes lean on me which almost feels like a warm hug, occasionally tickling my stomach, calling me "Aye Dravlluu," and somehow making me laugh even when I didn't feel like it.

    Looking back now, I don't remember every road we took.
    I just remember how every ride ended with us feeling happier than when it began.
    And maybe that's why...

    Whenever I ride a scooter alone, the road suddenly feels much longer.
    `,
  },
  {
    roman: "IV",
    image: "/letters/home.png",
    letter: `Home.
    
    It was never just your house.

    Somewhere along the way, it quietly became mine too.

    Most afternoons were wonderfully ordinary. We'd lie on your bed, endlessly scrolling through our phones, watch movies while sharing a packet of chips, complain about work, cook something when we felt like it, or simply order food because neither of us wanted to move. There was never a plan, and somehow those became some of my favourite days.

    Your parents never made me feel like a guest either. There was always a cup of coffee, cupcakes, vada pav, or simply the feeling that I belonged there.

    Funny how a place you've never lived in can start feeling like home.
    Because home was never the four walls around us.

    It was the life we quietly built inside them.
    
    `,
  },
];

const CARD_WIDTH = 220;
const CARD_HEIGHT = 150;
const TILT_MAX_DEG = 10;

// A very subtle SVG-turbulence grain texture, inlined as a data URI so the
// opened panel doesn't read as flat CSS. Kept at low opacity, blended over
// the glass surface.
const GRAIN_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
      <filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter>
      <rect width='100%' height='100%' filter='url(#n)'/>
    </svg>`
  );

export default function FourLetters() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const frontRefs = useRef<Array<HTMLDivElement | null>>([]);
  const backdropRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const originRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Entrance — frosted (blur-to-sharp) + rise/scale/rotate stagger.
  useEffect(() => {
    const section = sectionRef.current;
    const cards = cardRefs.current.filter(Boolean);
    if (!section || cards.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.set(cards, {
        opacity: 0,
        y: 50,
        scale: 0.85,
        rotate: (i) => (i % 2 === 0 ? -8 : 8),
        filter: "blur(14px)",
      });
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotate: 0,
        filter: "blur(0px)",
        duration: 0.9,
        stagger: 0.15,
        ease: "back.out(1.6)",
        scrollTrigger: {
          trigger: section,
          start: "top 75%",
          toggleActions: "play none none reverse",
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  // Cursor-tilt on the front card, driven directly (no React re-render).
  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    el: HTMLDivElement | null
  ) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * TILT_MAX_DEG * 2;
    const rotateX = (0.5 - py) * TILT_MAX_DEG * 2;
    el.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px) scale(1.02)`;
  };
  const handleMouseLeave = (el: HTMLDivElement | null) => {
    if (!el) return;
    el.style.transform =
      "perspective(700px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)";
  };

  // Open/close the note panel — animates from (or back to) the exact card
  // that was clicked, using its real screen position.
  useEffect(() => {
    const letter = letterRef.current;
    const backdrop = backdropRef.current;
    if (!letter || !backdrop) return;

    if (openIndex !== null) {
      const origin = originRef.current;
      gsap.set([letter, backdrop], { pointerEvents: "auto" });
      gsap.fromTo(
        backdrop,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power2.out" }
      );
      gsap.fromTo(
        letter,
        {
          xPercent: -50,
          yPercent: -50,
          x: origin.x,
          y: origin.y,
          scale: 0.15,
          opacity: 0,
          rotate: -10,
        },
        {
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          rotate: 0,
          duration: 0.85,
          ease: "power3.out",
        }
      );
    } else {
      const origin = originRef.current;
      gsap.to(backdrop, {
        opacity: 0,
        duration: 0.35,
        ease: "power2.in",
        onComplete: () => gsap.set(backdrop, { pointerEvents: "none" }),
      });
      gsap.to(letter, {
        xPercent: -50,
        yPercent: -50,
        x: origin.x,
        y: origin.y,
        scale: 0.15,
        opacity: 0,
        rotate: -10,
        duration: 0.55,
        ease: "power3.in",
        onComplete: () => gsap.set(letter, { pointerEvents: "none" }),
      });
    }
  }, [openIndex]);

  const handleOpen = (index: number) => {
    const el = cardRefs.current[index];
    const front = frontRefs.current[index];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    originRef.current = {
      x: rect.left + rect.width / 2 - window.innerWidth / 2,
      y: rect.top + rect.height / 2 - window.innerHeight / 2,
    };
    // Tactile press-down pulse before the reveal.
    if (front) {
      gsap
        .timeline()
        .to(front, { scale: 0.93, duration: 0.08, ease: "power1.out" })
        .to(front, { scale: 1.02, duration: 0.12, ease: "power1.out" });
    }
    setOpenIndex(index);
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-black flex flex-col items-center justify-center"
      style={{ height: "100vh", overflow: "hidden" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&display=swap');

        .hero-text      { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        .font-cormorant { font-family: 'Cormorant Garamond', Georgia, serif; }

        .card-front {
          transition: box-shadow 0.3s ease;
          cursor: pointer;
          transform-style: preserve-3d;
        }
        .card-front:hover {
          box-shadow: 0 12px 40px rgba(0,0,0,0.45), 0 0 30px rgba(122,184,245,0.25);
        }
        .card-front::before {
          content: "";
          position: absolute;
          inset: -60%;
          background: linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.16) 50%, transparent 60%);
          transform: translateX(-120%);
          transition: transform 0.7s ease;
          pointer-events: none;
        }
        .card-front:hover::before {
          transform: translateX(120%);
        }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "100px",
        }}
      >
        <p
          className="hero-text"
          style={{
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: "0.34em",
            textTransform: "uppercase",
            color: "rgba(122,184,245,0.45)",
            marginBottom: "5vh",
            textAlign: "center",
          }}
        >
          Chapter 03 &nbsp;·&nbsp; The Ordinary Magic
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gridTemplateRows: "repeat(2, 1fr)",
            gap: "6vh 6vw",
            justifyItems: "center",
            alignItems: "center",
          }}
        >
          {CARDS.map((card, i) => (
            <div
              key={card.roman}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                position: "relative",
              }}
            >
              {/* Back card — peeks out from behind, hinting there's more */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: "translate(10px, 10px)",
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(10px)",
                }}
              />

              {/* Front card — the interactive glass panel */}
              <div
                ref={(el) => {
                  frontRefs.current[i] = el;
                }}
                className="card-front"
                onClick={() => handleOpen(i)}
                onMouseMove={(e) => handleMouseMove(e, frontRefs.current[i])}
                onMouseLeave={() => handleMouseLeave(frontRefs.current[i])}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.16)",
                  backdropFilter: "blur(18px)",
                  boxShadow:
                    "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.image}
                  alt=""
                  style={{
                    width: 48,
                    height: 48,
                    objectFit: "contain",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dimmed backdrop, shown while a card is open */}
      <div
        ref={backdropRef}
        onClick={() => setOpenIndex(null)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(12px)",
          opacity: 0,
          pointerEvents: "none",
          zIndex: 10,
        }}
      />

      {/* The opened note — a larger glass panel matching the cards */}
      <div
        ref={letterRef}
        style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          width: "80vw",
          maxHeight: "85vh",
          overflowY: "auto",
          borderRadius: 20,
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.2)",
          backdropFilter: "blur(30px)",
          boxShadow:
            "0 30px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
          padding: "40px 36px",
          opacity: 0,
          pointerEvents: "none",
          zIndex: 11,
        }}
      >
        {/* Grain overlay — subtle, so the glass doesn't read as flat CSS */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("${GRAIN_SVG}")`,
            opacity: 0.05,
            mixBlendMode: "overlay",
            pointerEvents: "none",
            borderRadius: 20,
          }}
        />

        <button
          onClick={() => setOpenIndex(null)}
          aria-label="Close"
          className="hero-text"
          style={{
            position: "absolute",
            top: 12,
            right: 14,
            background: "none",
            border: "none",
            fontSize: 20,
            color: "rgba(230,235,245,0.5)",
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          ×
        </button>
        <p
          className="font-cormorant"
          style={{
            position: "relative",
            fontSize: 20,
            lineHeight: 1.6,
            color: "rgba(235,238,245,0.92)",
            whiteSpace: "pre-wrap",
          }}
        >
          {openIndex !== null ? CARDS[openIndex].letter : ""}
        </p>
      </div>
    </section>
  );
}
