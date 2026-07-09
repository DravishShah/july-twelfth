// "use client";

// import { useEffect, useRef, useState } from "react";
// import { gsap } from "gsap";
// import { ScrollTrigger } from "gsap/ScrollTrigger";

// gsap.registerPlugin(ScrollTrigger);

// // ─────────────────────────────────────────────────────────────────────────────
// // Chapter 05 — Last Birthday
// // Stack: Next.js · Tailwind · GSAP
// //
// // A deliberately quiet chapter — the opposite of the door/cards/storm that
// // came before it. A starry night backdrop, one line of text revealing at a
// // time as you scroll (slow, unhurried, pinned like the door/storm chapters),
// // ending on a timeline (2013 → 2026 → 2027 ∞) whose connecting line
// // physically draws itself in as you reach it — the one dedicated "hero"
// // animation in an otherwise still chapter.
// //
// // HOW TO CUSTOMIZE:
// //   - Every line of text lives in the CONTENT object below — title, the
// //     three paragraphs, the timeline dates, and the closing caption.
// //   - STAR_COUNT controls how many background stars are generated.
// //
// // TUNING NOTES:
// //   - ScrollTrigger `end: "+=XXX%"` → total scroll distance for the reveal
// //   - Each block's position in the master timeline (the numbers passed as
// //     the third argument to each .fromTo/.to call) → pacing between lines
// // ─────────────────────────────────────────────────────────────────────────────

// const CONTENT = {
//   titleLine1: "Last birthday",
//   titleLine2Prefix: "as my ",
//   titleLine2Emphasis: "Patther.",
//   paragraph1:
//     "Twelve years ago, a confused boy almost didn't reply to your message. Thank everything in the universe that he did.",
//   paragraph2:
//     "You have been my Train Ride, my Vada Pav, my Patther... My Home.",
//   paragraph3: "Next July, you won't just be my Patther. You'll be my wife.",
//   timeline: [
//     { year: "2013", suffix: "" },
//     { year: "2026", suffix: "" },
//     { year: "2027", suffix: "∞" },
//   ],
//   caption: "✦ Stay tuned for what comes next ✦",
// };

// const STAR_COUNT = 100;

// export default function LastBirthday() {
//   const sectionRef = useRef<HTMLElement>(null);
//   const starLayerRef = useRef<HTMLDivElement>(null);

//   const titleRef = useRef<HTMLDivElement>(null);
//   const para1Ref = useRef<HTMLParagraphElement>(null);
//   const dividerRef = useRef<HTMLDivElement>(null);
//   const para2Ref = useRef<HTMLParagraphElement>(null);
//   const para3Ref = useRef<HTMLParagraphElement>(null);
//   const timelineWrapRef = useRef<HTMLDivElement>(null);
//   const timelineLineRef = useRef<SVGLineElement>(null);
//   const dotRefs = useRef<Array<HTMLDivElement | null>>([]);
//   const captionRef = useRef<HTMLDivElement>(null);

//   // Stars — generated once via useState's lazy initializer (the correct
//   // place for one-time Math.random() calls; doing this in useMemo or the
//   // render body directly is flagged as impure by React's newer lint rules,
//   // and we hit that exact issue building Chapter 4).
//   const [stars] = useState(() =>
//     Array.from({ length: STAR_COUNT }, () => ({
//       left: Math.random() * 100,
//       top: Math.random() * 100,
//       size: 1 + Math.random() * 2,
//       delay: Math.random() * 4,
//       duration: 2.5 + Math.random() * 2.5,
//       minOpacity: 0.1 + Math.random() * 0.15,
//       maxOpacity: 0.6 + Math.random() * 0.4,
//     })),
//   );

//   useEffect(() => {
//     const section = sectionRef.current;
//     if (!section) return;

//     const ctx = gsap.context(() => {
//       const blocks = [
//         titleRef.current,
//         para1Ref.current,
//         dividerRef.current,
//         para2Ref.current,
//         para3Ref.current,
//       ];
//       blocks.forEach((el) => {
//         if (el) gsap.set(el, { opacity: 0, y: 24 });
//       });
//       if (timelineWrapRef.current)
//         gsap.set(timelineWrapRef.current, { opacity: 0, y: 16 });
//       if (captionRef.current) gsap.set(captionRef.current, { opacity: 0 });
//       if (timelineLineRef.current) {
//         try {
//           const len = timelineLineRef.current.getTotalLength();
//           timelineLineRef.current.style.strokeDasharray = String(len);
//           timelineLineRef.current.style.strokeDashoffset = String(len);
//         } catch {
//           // If this ever fails, the line just won't have the draw-in
//           // effect — but critically, the pin/timeline setup below still
//           // runs, since a thrown error here would otherwise silently abort
//           // everything after it in this same callback.
//         }
//       }
//       dotRefs.current.forEach((dot) => {
//         if (dot) gsap.set(dot, { scale: 0, opacity: 0 });
//       });

//       const tl = gsap.timeline({
//         scrollTrigger: {
//           trigger: section,
//           start: "top top",
//           end: "+=450%",
//           scrub: 1,
//           // pin: true,
//         },
//       });

//       // One block at a time, unhurried — each holds before the next starts.
//       tl.to(titleRef.current, { opacity: 1, y: 0, duration: 1 }, 0.3)
//         .to(para1Ref.current, { opacity: 1, y: 0, duration: 1 }, 1.6)
//         .to(dividerRef.current, { opacity: 1, y: 0, duration: 0.7 }, 2.8)
//         .to(para2Ref.current, { opacity: 1, y: 0, duration: 1 }, 3.6)
//         .to(para3Ref.current, { opacity: 1, y: 0, duration: 1 }, 4.9)
//         .to(timelineWrapRef.current, { opacity: 1, y: 0, duration: 0.8 }, 6.2);

//       // The timeline's line draws itself in, with each dot lighting up as
//       // the line reaches it — the one dedicated "hero" moment here.
//       if (timelineLineRef.current) {
//         tl.to(
//           timelineLineRef.current,
//           { strokeDashoffset: 0, duration: 1.6, ease: "power1.inOut" },
//           6.6,
//         );
//       }
//       dotRefs.current.forEach((dot, i) => {
//         if (!dot) return;
//         tl.to(
//           dot,
//           { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)" },
//           6.8 + i * 0.55,
//         );
//       });

//       tl.to(captionRef.current, { opacity: 1, duration: 1 }, 8.6);

//       // Chapter3 and Chapter4 create their own ScrollTriggers in the same
//       // synchronous mount batch as this one (all three are siblings that
//       // mount together). In dev, React Strict Mode double-invokes every
//       // effect — mount, cleanup, mount again — and while that's happening,
//       // GSAP can transiently measure other triggers' positions against a
//       // page layout that doesn't yet include (or briefly double-counts)
//       // this section's large pin-spacer. Since this component mounts last
//       // among the three, refreshing here — after its own setup is fully
//       // in place — recalculates everyone's positions against the final,
//       // settled layout.
//       requestAnimationFrame(() => ScrollTrigger.refresh());
//     }, section);

//     return () => ctx.revert();
//   }, []);

//   return (
//     <section
//       ref={sectionRef}
//       className="relative w-full overflow-hidden"
//       style={{ height: "100vh", maxHeight: "100vh", background: "#03040a" }}
//     >
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
//         .hero-text      { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
//         .font-cormorant { font-family: 'Cormorant Garamond', Georgia, serif; }

//         @keyframes chapter5Twinkle {
//           0%, 100% { opacity: var(--star-min, 0.15); }
//           50%      { opacity: var(--star-max, 0.9); }
//         }
//         @keyframes chapter5InfinityGlow {
//           0%, 100% { text-shadow: 0 0 6px rgba(122,184,245,0.4); }
//           50%      { text-shadow: 0 0 16px rgba(122,184,245,0.9); }
//         }
//       `}</style>

//       {/* Starry background */}
//       <div
//         ref={starLayerRef}
//         style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
//       >
//         {stars.map((s, i) => (
//           <div
//             key={i}
//             style={
//               {
//                 position: "absolute",
//                 left: s.left + "%",
//                 top: s.top + "%",
//                 width: s.size,
//                 height: s.size,
//                 borderRadius: "50%",
//                 background: "rgba(210,225,255,0.9)",
//                 "--star-min": s.minOpacity,
//                 "--star-max": s.maxOpacity,
//                 animationName: "chapter5Twinkle",
//                 animationDuration: `${s.duration}s`,
//                 animationTimingFunction: "ease-in-out",
//                 animationIterationCount: "infinite",
//                 animationDelay: `${s.delay}s`,
//               } as React.CSSProperties
//             }
//           />
//         ))}
//       </div>

//       {/* Content */}
//       <div
//         style={{
//           position: "relative",
//           height: "100vh",
//           maxHeight: "100vh",
//           display: "flex",
//           flexDirection: "column",
//           alignItems: "center",
//           justifyContent: "center",
//           padding: "6vh 6vw",
//           overflow: "hidden",
//         }}
//       >
//         <div
//           style={{
//             width: "min(90vw, 640px)",
//             maxHeight: "88vh",
//             overflowY: "auto",
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "center",
//             gap: "3vh",
//           }}
//         >
//           <div
//             ref={titleRef}
//             className="font-cormorant"
//             style={{ textAlign: "center" }}
//           >
//             <div
//               style={{
//                 fontSize: "clamp(32px, 5vw, 48px)",
//                 color: "rgba(240,240,245,0.95)",
//                 lineHeight: 1.25,
//               }}
//             >
//               {CONTENT.titleLine1}
//             </div>
//             <div
//               style={{ fontSize: "clamp(32px, 5vw, 48px)", lineHeight: 1.25 }}
//             >
//               <span style={{ color: "rgba(240,240,245,0.95)" }}>
//                 {CONTENT.titleLine2Prefix}
//               </span>
//               <span
//                 style={{ fontStyle: "italic", color: "rgba(122,184,245,0.9)" }}
//               >
//                 {CONTENT.titleLine2Emphasis}
//               </span>
//             </div>
//           </div>

//           <p
//             ref={para1Ref}
//             className="font-cormorant"
//             style={{
//               fontSize: "clamp(16px, 2vw, 19px)",
//               fontStyle: "italic",
//               lineHeight: 1.7,
//               textAlign: "center",
//               color: "rgba(200,206,220,0.75)",
//               maxWidth: 520,
//             }}
//           >
//             {CONTENT.paragraph1}
//           </p>

//           <div
//             ref={dividerRef}
//             style={{
//               width: 16,
//               height: 16,
//               borderRadius: "50%",
//               border: "1px solid rgba(122,184,245,0.5)",
//             }}
//           />

//           <p
//             ref={para2Ref}
//             className="font-cormorant"
//             style={{
//               fontSize: "clamp(16px, 2vw, 19px)",
//               fontStyle: "italic",
//               lineHeight: 1.7,
//               textAlign: "center",
//               color: "rgba(200,206,220,0.75)",
//               maxWidth: 520,
//             }}
//           >
//             {CONTENT.paragraph2}
//           </p>

//           <p
//             ref={para3Ref}
//             className="font-cormorant"
//             style={{
//               fontSize: "clamp(16px, 2vw, 19px)",
//               fontStyle: "italic",
//               lineHeight: 1.7,
//               textAlign: "center",
//               color: "rgba(200,206,220,0.75)",
//               maxWidth: 520,
//             }}
//           >
//             {CONTENT.paragraph3}
//           </p>

//           {/* Timeline */}
//           <div
//             ref={timelineWrapRef}
//             style={{ width: "100%", maxWidth: 420, marginTop: "1vh" }}
//           >
//             <svg
//               width="100%"
//               height="10"
//               viewBox="0 0 400 10"
//               style={{ display: "block", overflow: "visible" }}
//             >
//               <line
//                 ref={timelineLineRef}
//                 x1="10"
//                 y1="5"
//                 x2="390"
//                 y2="5"
//                 stroke="rgba(122,184,245,0.5)"
//                 strokeWidth="1"
//               />
//             </svg>
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 marginTop: 10,
//               }}
//             >
//               {CONTENT.timeline.map((t, i) => (
//                 <div
//                   key={t.year}
//                   style={{
//                     display: "flex",
//                     flexDirection: "column",
//                     alignItems: "center",
//                     gap: 8,
//                   }}
//                 >
//                   <div
//                     ref={(el) => {
//                       dotRefs.current[i] = el;
//                     }}
//                     style={{
//                       width: 8,
//                       height: 8,
//                       borderRadius: "50%",
//                       background: "rgba(122,184,245,0.9)",
//                     }}
//                   />
//                   <span
//                     className="hero-text"
//                     style={{
//                       fontSize: 13,
//                       letterSpacing: "0.1em",
//                       color: "rgba(200,206,220,0.7)",
//                       animation: t.suffix
//                         ? "chapter5InfinityGlow 3s ease-in-out infinite"
//                         : undefined,
//                     }}
//                   >
//                     {t.year}
//                     {t.suffix}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div ref={captionRef} style={{ marginTop: "1vh" }}>
//             {/* <p
//               className="hero-text"
//               style={{
//                 fontSize: 11,
//                 letterSpacing: "0.25em",
//                 textTransform: "uppercase",
//                 color: "rgba(200,206,220,0.4)",
//               }}
//             >
//               {CONTENT.caption}
//             </p> */}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────────────────────────────────────
// Chapter 05 — Last Birthday
// Stack: Next.js · Tailwind · GSAP
//
// A deliberately quiet chapter — the opposite of the door/cards/storm that
// came before it. A starry night backdrop, one line of text revealing at a
// time as you scroll (slow, unhurried), ending on a timeline
// (2013 → 2026 → 2027 ∞) whose connecting line physically draws itself in
// as you reach it — the one dedicated "hero" animation in an otherwise
// still chapter.
//
// Uses position: sticky for the "stays in place while revealing" effect,
// NOT GSAP's pin: true. A genuinely tall wrapper div (WRAPPER_HEIGHT_VH)
// creates real scroll distance in the normal document flow, and the
// visible content sticks to the top of the viewport as the user scrolls
// through that extra height — this is a native browser mechanism, so
// there's no GSAP-managed pin-spacer whose insertion timing other
// ScrollTriggers on the page could measure around incorrectly. That
// exact class of stale-measurement bug (traced through Chapter 2's async
// door model and this chapter's own pin) was responsible for several
// scroll issues elsewhere on this page — sticky sidesteps it entirely.
//
// HOW TO CUSTOMIZE:
//   - Every line of text lives in the CONTENT object below — title, the
//     three paragraphs, the timeline dates, and the closing caption.
//   - STAR_COUNT controls how many background stars are generated.
//
// TUNING NOTES:
//   - WRAPPER_HEIGHT_VH → total scroll distance for the whole reveal
//   - Each block's position in the master timeline (the numbers passed as
//     the third argument to each .fromTo/.to call) → pacing between lines.
//     These are on the same 0–9.6ish scale as before; WRAPPER_HEIGHT_VH is
//     what determines how much real scrolling maps to that whole range.
// ─────────────────────────────────────────────────────────────────────────────

const WRAPPER_HEIGHT_VH = 550;

const CONTENT = {
  titleLine1: "Last birthday",
  titleLine2Prefix: "as my ",
  titleLine2Emphasis: "Patther.",
  paragraph1:
    "Twelve years ago, a confused boy almost didn't reply to your message. Thank everything in the universe that he did.",
  paragraph2:
    "You have been my Train Ride, my Vada Pav, my Patther... My Home.",
  paragraph3: "Next July, you won't just be my Patther. You'll be my wife.",
  timeline: [
    { year: "2013", suffix: "" },
    { year: "2026", suffix: "" },
    { year: "2027", suffix: "∞" },
  ],
  caption: "✦ Stay tuned for what comes next ✦",
};

const STAR_COUNT = 100;

export default function LastBirthday() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const starLayerRef = useRef<HTMLDivElement>(null);

  const titleRef = useRef<HTMLDivElement>(null);
  const para1Ref = useRef<HTMLParagraphElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const para2Ref = useRef<HTMLParagraphElement>(null);
  const para3Ref = useRef<HTMLParagraphElement>(null);
  const timelineWrapRef = useRef<HTMLDivElement>(null);
  const timelineLineRef = useRef<SVGLineElement>(null);
  const dotRefs = useRef<Array<HTMLDivElement | null>>([]);
  const captionRef = useRef<HTMLDivElement>(null);

  // Stars — generated once via useState's lazy initializer (the correct
  // place for one-time Math.random() calls; doing this in useMemo or the
  // render body directly is flagged as impure by React's newer lint rules,
  // and we hit that exact issue building Chapter 4).
  const [stars] = useState(() =>
    Array.from({ length: STAR_COUNT }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 4,
      duration: 2.5 + Math.random() * 2.5,
      minOpacity: 0.1 + Math.random() * 0.15,
      maxOpacity: 0.6 + Math.random() * 0.4,
    })),
  );

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const ctx = gsap.context(() => {
      const blocks = [
        titleRef.current,
        para1Ref.current,
        dividerRef.current,
        para2Ref.current,
        para3Ref.current,
      ];
      blocks.forEach((el) => {
        if (el) gsap.set(el, { opacity: 0, y: 24 });
      });
      if (timelineWrapRef.current)
        gsap.set(timelineWrapRef.current, { opacity: 0, y: 16 });
      if (captionRef.current) gsap.set(captionRef.current, { opacity: 0 });
      if (timelineLineRef.current) {
        try {
          const len = timelineLineRef.current.getTotalLength();
          timelineLineRef.current.style.strokeDasharray = String(len);
          timelineLineRef.current.style.strokeDashoffset = String(len);
        } catch {
          // If this fails, the line just won't have the draw-in effect —
          // the rest of the sequence still runs.
        }
      }
      dotRefs.current.forEach((dot) => {
        if (dot) gsap.set(dot, { scale: 0, opacity: 0 });
      });

      // No pin: true here — the wrapper's own real height (WRAPPER_HEIGHT_VH)
      // IS the scroll distance, and CSS position:sticky (see the JSX below)
      // keeps the content in view natively while the user scrolls through
      // it. start/end span the wrapper's actual top and bottom, so this is
      // scrubbing against genuine document height rather than a GSAP-
      // managed virtual range.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapper,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      // One block at a time, unhurried — each holds before the next starts.
      tl.to(titleRef.current, { opacity: 1, y: 0, duration: 1 }, 0.3)
        .to(para1Ref.current, { opacity: 1, y: 0, duration: 1 }, 1.6)
        .to(dividerRef.current, { opacity: 1, y: 0, duration: 0.7 }, 2.8)
        .to(para2Ref.current, { opacity: 1, y: 0, duration: 1 }, 3.6)
        .to(para3Ref.current, { opacity: 1, y: 0, duration: 1 }, 4.9)
        .to(timelineWrapRef.current, { opacity: 1, y: 0, duration: 0.8 }, 6.2);

      // The timeline's line draws itself in, with each dot lighting up as
      // the line reaches it — the one dedicated "hero" moment here.
      if (timelineLineRef.current) {
        tl.to(
          timelineLineRef.current,
          { strokeDashoffset: 0, duration: 1.6, ease: "power1.inOut" },
          6.6,
        );
      }
      dotRefs.current.forEach((dot, i) => {
        if (!dot) return;
        tl.to(
          dot,
          { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)" },
          6.8 + i * 0.55,
        );
      });

      tl.to(captionRef.current, { opacity: 1, duration: 1 }, 8.6);
    }, wrapper);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{ position: "relative", height: `${WRAPPER_HEIGHT_VH}vh` }}
    >
      <section
        className="relative w-full overflow-hidden"
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          maxHeight: "100vh",
          background: "#03040a",
        }}
      >
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
        .hero-text      { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        .font-cormorant { font-family: 'Cormorant Garamond', Georgia, serif; }

        @keyframes chapter5Twinkle {
          0%, 100% { opacity: var(--star-min, 0.15); }
          50%      { opacity: var(--star-max, 0.9); }
        }
        @keyframes chapter5InfinityGlow {
          0%, 100% { text-shadow: 0 0 6px rgba(122,184,245,0.4); }
          50%      { text-shadow: 0 0 16px rgba(122,184,245,0.9); }
        }
      `}</style>

        {/* Starry background */}
        <div
          ref={starLayerRef}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          {stars.map((s, i) => (
            <div
              key={i}
              style={
                {
                  position: "absolute",
                  left: s.left + "%",
                  top: s.top + "%",
                  width: s.size,
                  height: s.size,
                  borderRadius: "50%",
                  background: "rgba(210,225,255,0.9)",
                  "--star-min": s.minOpacity,
                  "--star-max": s.maxOpacity,
                  animationName: "chapter5Twinkle",
                  animationDuration: `${s.duration}s`,
                  animationTimingFunction: "ease-in-out",
                  animationIterationCount: "infinite",
                  animationDelay: `${s.delay}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        {/* Content */}
        <div
          style={{
            position: "relative",
            height: "100vh",
            maxHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "6vh 6vw",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "min(90vw, 640px)",
              maxHeight: "88vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3vh",
            }}
          >
            <div
              ref={titleRef}
              className="font-cormorant"
              style={{ textAlign: "center" }}
            >
              <div
                style={{
                  fontSize: "clamp(32px, 5vw, 48px)",
                  color: "rgba(240,240,245,0.95)",
                  lineHeight: 1.25,
                }}
              >
                {CONTENT.titleLine1}
              </div>
              <div
                style={{ fontSize: "clamp(32px, 5vw, 48px)", lineHeight: 1.25 }}
              >
                <span style={{ color: "rgba(240,240,245,0.95)" }}>
                  {CONTENT.titleLine2Prefix}
                </span>
                <span
                  style={{
                    fontStyle: "italic",
                    color: "rgba(122,184,245,0.9)",
                  }}
                >
                  {CONTENT.titleLine2Emphasis}
                </span>
              </div>
            </div>

            <p
              ref={para1Ref}
              className="font-cormorant"
              style={{
                fontSize: "clamp(16px, 2vw, 19px)",
                fontStyle: "italic",
                lineHeight: 1.7,
                textAlign: "center",
                color: "rgba(200,206,220,0.75)",
                maxWidth: 520,
              }}
            >
              {CONTENT.paragraph1}
            </p>

            <div
              ref={dividerRef}
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: "1px solid rgba(122,184,245,0.5)",
              }}
            />

            <p
              ref={para2Ref}
              className="font-cormorant"
              style={{
                fontSize: "clamp(16px, 2vw, 19px)",
                fontStyle: "italic",
                lineHeight: 1.7,
                textAlign: "center",
                color: "rgba(200,206,220,0.75)",
                maxWidth: 520,
              }}
            >
              {CONTENT.paragraph2}
            </p>

            <p
              ref={para3Ref}
              className="font-cormorant"
              style={{
                fontSize: "clamp(16px, 2vw, 19px)",
                fontStyle: "italic",
                lineHeight: 1.7,
                textAlign: "center",
                color: "rgba(200,206,220,0.75)",
                maxWidth: 520,
              }}
            >
              {CONTENT.paragraph3}
            </p>

            {/* Timeline */}
            <div
              ref={timelineWrapRef}
              style={{ width: "100%", maxWidth: 420, marginTop: "1vh" }}
            >
              <svg
                width="100%"
                height="10"
                viewBox="0 0 400 10"
                style={{ display: "block", overflow: "visible" }}
              >
                <line
                  ref={timelineLineRef}
                  x1="10"
                  y1="5"
                  x2="390"
                  y2="5"
                  stroke="rgba(122,184,245,0.5)"
                  strokeWidth="1"
                />
              </svg>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 10,
                }}
              >
                {CONTENT.timeline.map((t, i) => (
                  <div
                    key={t.year}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      ref={(el) => {
                        dotRefs.current[i] = el;
                      }}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "rgba(122,184,245,0.9)",
                      }}
                    />
                    <span
                      className="hero-text"
                      style={{
                        fontSize: 13,
                        letterSpacing: "0.1em",
                        color: "rgba(200,206,220,0.7)",
                        animation: t.suffix
                          ? "chapter5InfinityGlow 3s ease-in-out infinite"
                          : undefined,
                      }}
                    >
                      {t.year}
                      {t.suffix}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div ref={captionRef} style={{ marginTop: "1vh" }}>
              {/* <p
              className="hero-text"
              style={{
                fontSize: 11,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "rgba(200,206,220,0.4)",
              }}
            >
              {CONTENT.caption}
            </p> */}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
