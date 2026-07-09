"use client";

import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Login from "../components/Login";
import HeroSection from "../components/Hero";
import TheConfusion from "../components/TheConfusion";
import DoorChapter from "../components/Chapter2";
import FourLetters from "../components/Chapter3";
import TwoStorms from "../components/Chapter4";
import LastBirthday from "../components/Chapter5";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Every chapter independently loads the same Google Font, and a couple
  // load 3D models asynchronously. Any ScrollTrigger measured before a web
  // font finishes swapping in (causing text reflow) or before an async
  // model's pin-spacer gets inserted ends up with stale positions and no
  // automatic correction. document.fonts.ready + window's load event are
  // the real signals for "the page has actually settled" — refreshing at
  // both points corrects everyone's measurements against the final layout.
  useEffect(() => {
    if (!isUnlocked) return;

    let cancelled = false;
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(() => {
        if (!cancelled) ScrollTrigger.refresh();
      });
    }
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);

    return () => {
      cancelled = true;
      window.removeEventListener("load", onLoad);
    };
  }, [isUnlocked]);

  return (
    <main className="w-full bg-[#050505] min-h-screen text-white">
      {!isUnlocked ? (
        <Login onSuccess={() => setIsUnlocked(true)} />
      ) : (
        <>
          <HeroSection />
          <TheConfusion />
          <DoorChapter />
          <FourLetters />
          <TwoStorms />
          <LastBirthday />
        </>
      )}
    </main>
  );
}
