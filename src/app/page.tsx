"use client";

import { useState } from "react";
import Login from "../components/Login";
import HeroSection from "../components/Hero";
import TheConfusion from "../components/TheConfusion";
import DoorChapter from "../components/Chapter2";
import FourLetters from "../components/Chapter3";
import TwoStorms from "../components/Chapter4";
// import LastBirthday from "../components/Chapter5";

export default function Home() {
  const [isUnlocked, setIsUnlocked] = useState(false);

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
          {/* <LastBirthday /> */}
        </>
      )}
    </main>
  );
}
