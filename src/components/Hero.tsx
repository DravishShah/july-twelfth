"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const text1Ref = useRef<HTMLDivElement>(null);
  const text2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Force the browser to start at the very top of the page on refresh
    if (typeof window !== "undefined") {
      window.history.scrollRestoration = "manual";
      window.scrollTo({ top: 0, behavior: "auto" });
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // 1. Initial hidden state for the story lines
      gsap.set([text1Ref.current, text2Ref.current], {
        opacity: 0,
        y: 32,
      });

      // 2. Gentle independent pulse for "Scroll to Begin" on load
      const pulseAnim = gsap.to(scrollHintRef.current, {
        opacity: 0.4,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });

      // 3. The Master Scroll Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=200%",
          scrub: true, // Smooth, instant tracking to the mouse wheel
          pin: true,
          onUpdate: (self) => {
            // Stop the idle pulse animation the exact millisecond they start scrolling
            if (self.progress > 0.01) {
              pulseAnim.pause();
            } else {
              pulseAnim.play();
            }
          },
        },
      });

      // Timeline Flow:
      // Fade out the Scroll Hint
      tl.to(scrollHintRef.current, {
        opacity: 0,
        y: -20,
        duration: 1,
        overwrite: "auto",
      })

        // Bring in Line 1
        .to(text1Ref.current, { opacity: 1, y: 0, duration: 1 }, "-=0.5")
        .to(text1Ref.current, { opacity: 0, y: -20, duration: 1, delay: 0.5 })

        // Bring in Line 2
        .to(text2Ref.current, { opacity: 1, y: 0, duration: 1 }, "-=0.5")
        .to(text2Ref.current, { opacity: 0, y: -20, duration: 1, delay: 0.5 })

        // A tiny empty buffer to hold the black screen for a split second before scrolling down
        .to({}, { duration: 0.5 });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-screen bg-[#050505] flex items-center justify-center overflow-hidden z-10"
    >
      <style>{`
        .hero-text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      `}</style>

      {/* Landing State: Scroll Hint */}
      <div
        ref={scrollHintRef}
        className="absolute hero-text opacity-100 text-[14px] md:text-[16px] font-medium text-gray-500 tracking-[0.3em] uppercase text-center px-4"
      >
        Scroll to Begin
      </div>

      {/* Line 1 (Bigger, Bold, Italic) */}
      <div
        ref={text1Ref}
        className="absolute hero-text opacity-0 translate-y-8 text-[3rem] md:text-6xl font-bold italic text-gray-200 tracking-wide text-center px-6"
      >
        Some stories start with a grand gesture.
      </div>

      {/* Line 2 (Bigger, Bold, Italic) */}
      <div
        ref={text2Ref}
        className="absolute hero-text opacity-0 translate-y-8 text-[3rem] md:text-6xl font-bold italic text-gray-200 tracking-wide text-center px-6"
      >
        Ours started with....
      </div>
    </section>
  );
}
