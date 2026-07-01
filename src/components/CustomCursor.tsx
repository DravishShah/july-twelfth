"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const circle = circleRef.current;

    if (!dot || !circle) return;

    // FIX: Changed duration from 0 to 0.05.
    // This forces GSAP to render it without any delay feeling.
    const xMoveDot = gsap.quickTo(dot, "x", { duration: 0.05, ease: "none" });
    const yMoveDot = gsap.quickTo(dot, "y", { duration: 0.05, ease: "none" });

    const xMoveCircle = gsap.quickTo(circle, "x", {
      duration: 0.6,
      ease: "power3.out",
    });
    const yMoveCircle = gsap.quickTo(circle, "y", {
      duration: 0.6,
      ease: "power3.out",
    });

    // Hide cursor initially so it doesn't sit in the top left corner
    gsap.set([dot, circle], { opacity: 0 });

    let hasMoved = false;

    const onMouseMove = (e: MouseEvent) => {
      // Reveal the cursor on the very first mouse move
      if (!hasMoved) {
        gsap.to([dot, circle], { opacity: 1, duration: 0.3 });
        hasMoved = true;
      }

      xMoveDot(e.clientX - 4);
      yMoveDot(e.clientY - 4);

      xMoveCircle(e.clientX - 20);
      yMoveCircle(e.clientY - 20);
    };

    window.addEventListener("mousemove", onMouseMove);

    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  return (
    <>
      {/* Bright Inner Dot */}
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: "rgba(138, 180, 248, 1)",
          boxShadow: "0 0 10px rgba(138, 180, 248, 0.8)",
          pointerEvents: "none",
          zIndex: 9999,
        }}
      />

      {/* Smooth Outer Circle */}
      <div
        ref={circleRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          border: "1.5px solid rgba(138, 180, 248, 0.5)",
          backgroundColor: "transparent",
          pointerEvents: "none",
          zIndex: 9998,
        }}
      />
    </>
  );
}
