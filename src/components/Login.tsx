"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "gsap";

// ─────────────────────────────────────────────────────────────────────────────
// Login.tsx — Mosquito Kill Gate
// Answer: "bite" (case-insensitive). Kill the mosquito to enter.
// ─────────────────────────────────────────────────────────────────────────────

enum MosquitoState {
  Flying,
  Landing,
  Sitting,
  Escaping,
  Dead,
}

export default function Login({ onSuccess }: { onSuccess?: () => void }) {
  // ── DOM refs ──
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const leftHandRef = useRef<HTMLDivElement>(null); // wrapper div, not img
  const rightHandRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  // ── UI state ──
  const [answer, setAnswer] = useState("");
  const [missMsg, setMissMsg] = useState(false);
  const [busy, setBusy] = useState(false);
  const submitRef = useRef<() => void>(() => {});

  // ── Three.js refs ──
  const mosquitoRef = useRef<THREE.Object3D | null>(null);
  const wingsRef = useRef<THREE.Object3D[]>([]);
  const stateRef = useRef<MosquitoState>(MosquitoState.Flying);
  const flightTLRef = useRef<gsap.core.Timeline | null>(null);
  const wingTLRef = useRef<gsap.core.Timeline | null>(null);
  const rafRef = useRef<number>(0);
  const posRef = useRef({ x: 0, y: 0, z: 0 });
  const rotRef = useRef({ y: 0 });
  const baseScaleRef = useRef(1);
  const boundsRef = useRef({ x: 1.8, y: 1.1 });

  const particles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        opacity: 0.12 + ((i * 7) % 17) / 100,
        width: 1.5 + ((i * 13) % 25) / 10,
        height: 1.5 + ((i * 17) % 25) / 10,
        r: 110 + ((i * 19) % 80),
        g: 120 + ((i * 23) % 80),
        left: (i * 7) % 100,
        top: (i * 11) % 100,
        duration: 4 + ((i * 5) % 5),
        delay: (i * 3) % 5,
      })),
    [],
  );

  const startWingFlutter = useCallback(() => {
    wingTLRef.current?.kill();
    const tl = gsap.timeline({ repeat: -1 });
    wingsRef.current.forEach((wing, i) => {
      tl.to(
        wing.rotation,
        {
          z: i % 2 === 0 ? 0.6 : -0.6,
          duration: 0.04,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        },
        0,
      );
    });
    wingTLRef.current = tl;
  }, []);

  const startFlight = useCallback(() => {
    if (stateRef.current === MosquitoState.Dead) return;
    stateRef.current = MosquitoState.Flying;
    flightTLRef.current?.kill();
    gsap.killTweensOf(posRef.current);
    gsap.killTweensOf(rotRef.current);

    const bounds = boundsRef.current;
    const fly = () => {
      if (stateRef.current !== MosquitoState.Flying) return;
      const tx = (Math.random() - 0.5) * bounds.x * 2;
      const ty = (Math.random() - 0.5) * bounds.y * 2;
      // console.log("bounds", bounds);
      const dist = Math.hypot(tx - posRef.current.x, ty - posRef.current.y);
      const dur = 0.8 + dist * 0.55 + Math.random() * 0.7;
      const dx = tx - posRef.current.x;
      const ang = Math.atan2(dx, 1) * 0.8;

      const tl = gsap.timeline({
        onComplete: () => {
          if (stateRef.current !== MosquitoState.Flying) return;
          gsap.delayedCall(Math.random() * 0.5 + 0.1, fly);
        },
      });
      tl.to(
        posRef.current,
        { x: tx, y: ty, duration: dur, ease: "sine.inOut" },
        0,
      );
      tl.to(
        posRef.current,
        {
          z: (Math.random() - 0.5) * 0.3,
          duration: dur * 0.5,
          ease: "sine.inOut",
          yoyo: true,
          repeat: 1,
        },
        0,
      );
      tl.to(
        rotRef.current,
        { y: ang, duration: dur * 0.3, ease: "power2.out" },
        0,
      );
      flightTLRef.current = tl;
    };

    fly();
  }, []);

  // ── THREE.JS SETUP ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });

    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
    camera.position.set(0, 0, 8);
    camera.lookAt(0, 0, 0);

    // const helper = new THREE.AxesHelper(5);
    // scene.add(helper);
    const updateViewportBounds = () => {
      const distance = camera.position.z;

      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const visibleHeight = 2 * Math.tan(vFov / 2) * distance;
      const visibleWidth = visibleHeight * camera.aspect;

      boundsRef.current = {
        x: visibleWidth * 0.4,
        y: visibleHeight * 0.35,
      };
    };
    const resize = () => {
      // clientWidth/Height can be 0 on first call before layout — fall back to window
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      updateViewportBounds();
    };
    // Call immediately, then re-call after layout settles (fixes invisible mosquito on first load)
    resize();

    requestAnimationFrame(resize);
    const resizeTimer = setTimeout(resize, 150);
    window.addEventListener("resize", resize);

    // Lighting
    // scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xffeedd, 3);
    key.position.set(-2, 3, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x4488ff, 1.2);
    rim.position.set(2, -1, -3);
    scene.add(rim);
    // scene.add(new THREE.DirectionalLight(0xffffff, 0.6)).position.set(0, 4, 2);

    // Load GLB
    const loader = new GLTFLoader();
    const onModelReady = (model: THREE.Object3D) => {
      // ── Measure model ──
      const box = new THREE.Box3().setFromObject(model);

      const size = new THREE.Vector3();
      const center = new THREE.Vector3();

      box.getSize(size);
      box.getCenter(center);

      // ── Center model at origin ──
      model.position.sub(center);

      // ── Scale model to a sensible size ──
      const s = 0.45 / Math.max(size.x, size.y, size.z);

      model.scale.setScalar(s);

      baseScaleRef.current = s;

      // ── Collect wings ──
      const wings: THREE.Object3D[] = [];

      model.traverse((child) => {
        const name = child.name.toLowerCase();

        if (name.includes("plane") || name.includes("wing")) {
          wings.push(child);
        }

        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh)
            .material as THREE.MeshStandardMaterial;

          if (mat?.isMeshStandardMaterial) {
            mat.envMapIntensity = 1.5;
            mat.needsUpdate = true;
          }
        }
      });

      wingsRef.current = wings;

      // ── Environment lighting ──
      const pmrem = new THREE.PMREMGenerator(renderer);

      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

      pmrem.dispose();

      // ── Add to scene ──
      scene.add(model);

      mosquitoRef.current = model;

      startWingFlutter();

      // DON'T start flight yet
      startFlight();
    };

    loader.load(
      "/mosquito.glb",
      (gltf) => {
        // console.log("✅ MOSQUITO LOADED");
        onModelReady(gltf.scene);
      },
      undefined,
      () => {
        // Fallback sphere+wings
        const group = new THREE.Group();
        group.add(
          new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 12, 12),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.4 }),
          ),
        );
        const wg = new THREE.SphereGeometry(0.1, 8, 4);
        const wm = new THREE.MeshStandardMaterial({
          color: 0xaaccff,
          transparent: true,
          opacity: 0.4,
        });
        const wL = new THREE.Mesh(wg, wm);
        wL.position.set(-0.18, 0.06, 0);
        wL.scale.set(1.8, 0.3, 1);
        const wR = new THREE.Mesh(wg, wm);
        wR.position.set(0.18, 0.06, 0);
        wR.scale.set(1.8, 0.3, 1);
        group.add(wL, wR);
        wingsRef.current = [wL, wR];
        scene.add(group);
        mosquitoRef.current = group;
        baseScaleRef.current = 1;
        startWingFlutter();
        startFlight();
      },
    );

    // Render loop — mosquito position driven entirely by posRef/rotRef
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      const m = mosquitoRef.current;
      if (m) {
        m.position.x = posRef.current.x;
        m.position.y = posRef.current.y;
        m.position.z = posRef.current.z;
        m.rotation.y = rotRef.current.y;
      }
      renderer.render(scene, camera);
    };
    tick();

    const pos = { ...posRef.current };
    const rot = { ...rotRef.current };

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", resize);
      flightTLRef.current?.kill();
      wingTLRef.current?.kill();
      gsap.killTweensOf(pos);
      gsap.killTweensOf(rot);
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── LAND ON INPUT ─────────────────────────────────────────────────────────
  const landOnInput = useCallback(() => {
    if (stateRef.current !== MosquitoState.Flying) return;
    stateRef.current = MosquitoState.Landing;
    flightTLRef.current?.kill();
    gsap.killTweensOf(posRef.current);
    gsap.killTweensOf(rotRef.current);

    // Top-right corner of the input box in scene space
    const tx = 0;
    const ty = 1;
    gsap
      .timeline({
        onComplete: () => {
          stateRef.current = MosquitoState.Sitting;
        },
      })
      .to(posRef.current, {
        x: tx + 0.25,
        y: ty + 0.2,
        duration: 0.5,
        ease: "power2.in",
      })
      .to(posRef.current, {
        x: tx,
        y: ty,
        z: 0,
        duration: 0.3,
        ease: "power3.out",
      })
      .to(posRef.current, { y: ty + 0.05, duration: 0.08, ease: "power1.out" })
      .to(posRef.current, { y: ty, duration: 0.12, ease: "bounce.out" })
      .to(rotRef.current, { y: -0.3, duration: 0.2 }, "-=0.3");
  }, []);

  // ── HANDS — pixel-based GSAP, zero CSS transform conflict ────────────────
  const doClap = useCallback((onImpact: () => void) => {
    const L = leftHandRef.current;
    const R = rightHandRef.current;
    if (!L || !R) {
      onImpact();
      return;
    }

    // Reset: completely off-screen left and right, centred vertically
    gsap.set(L, {
      display: "flex",
      opacity: 1,
      left: "-260px",
      top: "50%",
      yPercent: -50,
      xPercent: 0,
      rotation: -10,
      scale: 1,
    });
    gsap.set(R, {
      display: "flex",
      opacity: 1,
      right: "-260px",
      top: "50%",
      yPercent: -50,
      xPercent: 0,
      rotation: 10,
      scale: 1,
    });

    const tl = gsap.timeline();

    // Slide in — anticipation
    tl.to(L, { left: "-80px", duration: 0.45, ease: "power2.out" }, 0)
      .to(R, { right: "-80px", duration: 0.45, ease: "power2.out" }, 0)

      // Rush inward
      .to(L, {
        left: "calc(50% - 130px)",
        rotation: 5,
        duration: 0.2,
        ease: "power4.in",
      })
      .to(
        R,
        {
          right: "calc(50% - 130px)",
          rotation: -5,
          duration: 0.2,
          ease: "power4.in",
        },
        "<",
      )

      // Impact
      .call(onImpact)

      // Hold briefly
      .to([L, R], { duration: 0.4 });

    return tl;
  }, []);

  const hideHands = useCallback(() => {
    const L = leftHandRef.current;
    const R = rightHandRef.current;
    if (!L || !R) return;
    gsap.to(L, {
      left: "-300px",
      opacity: 0,
      duration: 0.4,
      ease: "power3.in",
      onComplete: () => gsap.set(L, { display: "none" }),
    });
    gsap.to(R, {
      right: "-300px",
      opacity: 0,
      duration: 0.4,
      ease: "power3.in",
      onComplete: () => gsap.set(R, { display: "none" }),
    });
  }, []);

  // ── PARTICLES ────────────────────────────────────────────────────────────
  const spawnParticles = useCallback(() => {
    const c = particlesRef.current;
    if (!c) return;
    c.innerHTML = "";
    for (let i = 0; i < 22; i++) {
      const p = document.createElement("div");
      const sz = 4 + Math.random() * 9;
      p.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;border-radius:50%;
        background:hsl(${20 + Math.random() * 60},80%,60%);left:0;top:0;`;
      c.appendChild(p);
      const angle = (i / 22) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 50 + Math.random() * 90;
      gsap.fromTo(
        p,
        { x: 0, y: 0, opacity: 1, scale: 1 },
        {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          opacity: 0,
          scale: 0,
          duration: 0.55 + Math.random() * 0.3,
          ease: "power2.out",
          onComplete: () => p.remove(),
        },
      );
    }
  }, []);

  // ── SHAKE CARD ────────────────────────────────────────────────────────────
  const shakeCard = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    gsap
      .timeline()
      .to(card, { x: -16, rotation: -1.2, duration: 0.055, ease: "power2.out" })
      .to(card, { x: 16, rotation: 1.2, duration: 0.055 })
      .to(card, { x: -12, rotation: -0.8, duration: 0.055 })
      .to(card, { x: 12, rotation: 0.8, duration: 0.055 })
      .to(card, { x: -7, rotation: -0.4, duration: 0.055 })
      .to(card, { x: 7, rotation: 0.4, duration: 0.055 })
      .to(card, {
        x: 0,
        rotation: 0,
        duration: 0.12,
        ease: "elastic.out(1,0.4)",
      });
  }, []);

  // ── KILL MOSQUITO ─────────────────────────────────────────────────────────
  const killMosquito = useCallback(() => {
    stateRef.current = MosquitoState.Dead;
    flightTLRef.current?.kill();
    wingTLRef.current?.kill();
    gsap.killTweensOf(posRef.current);

    const m = mosquitoRef.current;
    if (m) {
      // Squash then disappear
      gsap
        .timeline()
        .to(m.scale, {
          x: m.scale.x * 2.8,
          y: m.scale.y * 0.1,
          z: m.scale.z * 2.8,
          duration: 0.07,
          ease: "power4.out",
        })
        .to(m.scale, { x: 0, y: 0, z: 0, duration: 0.18, ease: "power2.in" });
    }

    spawnParticles();

    // Flash
    gsap.fromTo(
      sectionRef.current,
      { filter: "brightness(3.5)" },
      { filter: "brightness(1)", duration: 0.5, ease: "power3.out" },
    );
  }, [spawnParticles]);

  // ── ESCAPE ────────────────────────────────────────────────────────────────
  const escapeMosquito = useCallback(() => {
    stateRef.current = MosquitoState.Escaping;
    flightTLRef.current?.kill();
    gsap.killTweensOf(posRef.current);
    gsap.killTweensOf(rotRef.current);

    const m = mosquitoRef.current;
    const base = baseScaleRef.current;

    gsap
      .timeline({
        onComplete: () => {
          // Always reset scale before resuming flight
          if (m) gsap.set(m.scale, { x: base, y: base, z: base });
          stateRef.current = MosquitoState.Flying;
          startFlight();
        },
      })
      // Freeze one frame then dart
      .to(posRef.current, { duration: 0.05 })
      // Stretch along direction of escape for motion-blur feel
      .to(
        m ? m.scale : {},
        {
          x: base * 3,
          y: base * 0.25,
          z: base * 3,
          duration: 0.08,
          ease: "power4.out",
        },
        0.02,
      )
      // Dart off-screen diagonally
      .to(
        posRef.current,
        { x: -2.6, y: 1.9, z: 0, duration: 0.16, ease: "power4.in" },
        0.05,
      )
      .to(rotRef.current, { y: -2.5, duration: 0.1 }, 0.05)
      // Instantly reposition off-screen for re-entry
      .call(() => {
        posRef.current.x = -2.2;
        posRef.current.y = 0.0;
      });
  }, [startFlight]);

  // ── SUBMIT ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (busy) return;
    if (stateRef.current !== MosquitoState.Sitting) {
      if (stateRef.current === MosquitoState.Flying) {
        landOnInput();
        window.setTimeout(() => submitRef.current(), 1200);
      }
      return;
    }

    setBusy(true);
    const correct = answer.trim().toLowerCase() === "1234";

    if (correct) {
      doClap(() => {
        killMosquito();
        window.setTimeout(() => {
          hideHands();
          window.setTimeout(() => {
            setBusy(false);
            onSuccess?.();
          }, 500);
        }, 450);
      });
    } else {
      doClap(() => {
        escapeMosquito();
        shakeCard();
        window.setTimeout(() => {
          hideHands();
          setBusy(false);
          setAnswer("");
          setMissMsg(true);
          window.setTimeout(() => setMissMsg(false), 3000);
        }, 650);
      });
    }
  }, [
    answer,
    busy,
    doClap,
    escapeMosquito,
    hideHands,
    killMosquito,
    landOnInput,
    onSuccess,
    shakeCard,
  ]);

  useEffect(() => {
    submitRef.current = handleSubmit;
  }, [handleSubmit]);

  // ── INPUT CHANGE ──────────────────────────────────────────────────────────
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAnswer(e.target.value);
      if (stateRef.current === MosquitoState.Flying) landOnInput();
    },
    [landOnInput],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSubmit();
    },
    [handleSubmit],
  );

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{
        height: "100svh",
        background:
          "radial-gradient(ellipse 130% 80% at 50% 55%, #08081a 0%, #000 70%)",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300&family=DM+Sans:wght@200;300;400&display=swap');
        @keyframes ambientPulse {
          0%,100%{ opacity:0.35; transform:translate(-50%,-50%) scale(1);   }
          50%    { opacity:0.6;  transform:translate(-50%,-50%) scale(1.08); }
        }
        @keyframes fadeUp {
          from{ opacity:0; transform:translateY(14px); filter:blur(4px); }
          to  { opacity:1; transform:translateY(0);    filter:blur(0); }
        }
        @keyframes particleDrift {
          0%  { transform: translateY(0)   scale(1);   opacity: var(--op); }
          50% { transform: translateY(-8px) scale(1.1); opacity: calc(var(--op) * 1.6); }
          100%{ transform: translateY(0)   scale(1);   opacity: var(--op); }
        }
        input::placeholder{ color:rgba(235,235,245,0.2); }
        input:focus{ outline:none; }
      `}</style>

      {/* ── Three.js canvas — mosquito ── */}
      {/* <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 10 }}
      /> */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 999,
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "55vw",
          height: "55vw",
          maxWidth: 580,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(70,90,200,0.13) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          animation: "ambientPulse 5s ease-in-out infinite",
          zIndex: 1,
        }}
      />

      {/* Floating background particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={
            {
              "--op": p.opacity,
              width: `${p.width}px`,
              height: `${p.height}px`,
              background: `rgba(${p.r},${p.g},255,1)`,
              left: `${p.left}%`,
              top: `${p.top}%`,
              opacity: p.opacity,
              animation: `particleDrift ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
              zIndex: 1,
            } as React.CSSProperties
          }
        />
      ))}

      {/* ── LEFT HAND WRAPPER ──
           Position: fixed left side, centred vertically.
           GSAP animates `left` pixel value only — no CSS transform conflict.
      */}
      <div
        ref={leftHandRef}
        className="absolute pointer-events-none select-none"
        style={{
          display: "none",
          width: 220,
          height: 220,
          top: "50%",
          left: "-260px",
          transform: "translateY(-50%)", // only translateY — GSAP only touches `left`
          zIndex: 30,
        }}
      >
        <Image
          src="/left.png"
          alt="left hand"
          width={220}
          height={220}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.5))",
          }}
        />
      </div>

      {/* ── RIGHT HAND WRAPPER ── */}
      <div
        ref={rightHandRef}
        className="absolute pointer-events-none select-none"
        style={{
          display: "none",
          width: 220,
          height: 220,
          top: "50%",
          right: "-260px",
          transform: "translateY(-50%) scaleX(-1)", // mirror + only translateY
          zIndex: 30,
        }}
      >
        <Image
          src="/right.png"
          alt="right hand"
          width={220}
          height={220}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.5))",
          }}
        />
      </div>

      {/* ── Particle burst origin ── */}
      <div
        ref={particlesRef}
        className="absolute pointer-events-none"
        style={{ left: "50%", top: "50%", width: 0, height: 0, zIndex: 25 }}
      />

      {/* ── Main UI ── */}
      <div
        className="relative flex flex-col items-center justify-center"
        style={{ minHeight: "100svh", padding: "4vh 6vw", zIndex: 5 }}
      >
        {/* Eyebrow */}
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            fontWeight: 300,
            letterSpacing: "0.42em",
            textTransform: "uppercase",
            color: "rgba(200,215,240,0.32)",
            marginBottom: "2.5rem",
            animation: "fadeUp 1s ease 0.3s both",
          }}
        >
          Before you Start
        </p>

        {/* ── Card ── */}
        <div
          ref={cardRef}
          style={{
            width: "100%",
            maxWidth: 420,
            background: "rgba(255,255,255,0.028)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 24,
            padding: "clamp(1.8rem,5vw,2.8rem)",
            backdropFilter: "blur(24px)",
            boxShadow:
              "0 32px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.055)",
            animation: "fadeUp 1s ease 0.5s both",
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* Question block */}
          <div style={{ marginBottom: "1.8rem", textAlign: "center" }}>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 9,
                fontWeight: 300,
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                color: "rgba(200,215,240,0.35)",
                marginBottom: "0.7rem",
              }}
            >
              Answer to enter
            </p>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(1.5rem,5vw,2.2rem)",
                fontWeight: 300,
                lineHeight: 1.2,
                color: "#f0ede8",
              }}
            >
              Murder of Mosquito?
            </h2>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                fontWeight: 300,
                color: "rgba(200,215,240,0.24)",
                marginTop: "0.45rem",
                letterSpacing: "0.04em",
              }}
            >
              (hint: it&apos;s what you two do best together 🦟)
            </p>
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Your answer..."
            autoComplete="off"
            spellCheck={false}
            disabled={busy}
            style={{
              display: "block",
              width: "92%",
              background: "rgba(255,255,255,0.045)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              padding: "13px 16px",
              marginBottom: "1rem",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 16,
              fontWeight: 300,
              color: "#f0ede8",
              letterSpacing: "0.02em",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "rgba(100,140,255,0.45)";
              e.target.style.boxShadow = "0 0 0 3px rgba(80,100,220,0.14)";
              if (stateRef.current === MosquitoState.Flying) landOnInput();
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(255,255,255,0.1)";
              e.target.style.boxShadow = "none";
            }}
          />

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={busy}
            style={{
              display: "block",
              width: "100%",
              background: busy
                ? "rgba(80,100,200,0.35)"
                : "linear-gradient(135deg, rgba(80,100,220,0.85), rgba(120,60,200,0.85))",
              border: "1px solid rgba(100,120,255,0.25)",
              borderRadius: 12,
              padding: "13px 16px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 400,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#fff",
              cursor: busy ? "not-allowed" : "pointer",
              boxShadow: busy ? "none" : "0 8px 24px rgba(80,100,220,0.22)",
              transition: "background 0.2s, box-shadow 0.2s",
            }}
          >
            {busy ? "..." : "Confirm Kill 🎯"}
          </button>

          {/* Miss message */}
          {missMsg && (
            <p
              style={{
                textAlign: "center",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                fontWeight: 300,
                color: "rgba(255,110,110,0.85)",
                marginTop: "0.9rem",
                letterSpacing: "0.05em",
                animation: "fadeUp 0.4s ease both",
              }}
            >
              Mosquito survived. Try again.
            </p>
          )}
        </div>

        {/* Caption */}
        <p
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(0.8rem,1.8vw,1rem)",
            fontWeight: 300,
            color: "rgba(200,215,240,0.2)",
            marginTop: "2rem",
            letterSpacing: "0.06em",
            animation: "fadeUp 1s ease 1s both",
          }}
        >
          only you two know this answer
        </p>
      </div>
    </div>
  );
}

// "use client";

// import { useEffect, useRef, useState, useCallback, useMemo } from "react";
// import Image from "next/image";
// import * as THREE from "three";
// import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// import { gsap } from "gsap";

// // ─────────────────────────────────────────────────────────────────────────────
// // Login.tsx — Mosquito Kill Gate
// // Answer: "bite" (case-insensitive). Kill the mosquito to enter.
// // ─────────────────────────────────────────────────────────────────────────────

// enum MosquitoState {
//   Flying,
//   Landing,
//   Sitting,
//   Escaping,
//   Dead,
// }

// export default function Login({ onSuccess }: { onSuccess?: () => void }) {
//   // ── DOM refs ──
//   const sectionRef = useRef<HTMLDivElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const inputRef = useRef<HTMLInputElement>(null);
//   const cardRef = useRef<HTMLDivElement>(null);
//   const leftHandRef = useRef<HTMLDivElement>(null); // wrapper div, not img
//   const rightHandRef = useRef<HTMLDivElement>(null);
//   const particlesRef = useRef<HTMLDivElement>(null);

//   // ── UI state ──
//   const [answer, setAnswer] = useState("");
//   const [missMsg, setMissMsg] = useState(false);
//   const [busy, setBusy] = useState(false);
//   const submitRef = useRef<() => void>(() => {});

//   // ── Three.js refs ──
//   const mosquitoRef = useRef<THREE.Object3D | null>(null);
//   const wingsRef = useRef<THREE.Object3D[]>([]);
//   const stateRef = useRef<MosquitoState>(MosquitoState.Flying);
//   const flightTLRef = useRef<gsap.core.Timeline | null>(null);
//   const wingTLRef = useRef<gsap.core.Timeline | null>(null);
//   const rafRef = useRef<number>(0);
//   const posRef = useRef({ x: 0, y: 0, z: 0 });
//   const rotRef = useRef({ y: 0 });
//   const baseScaleRef = useRef(1);

//   const particles = useMemo(
//     () =>
//       Array.from({ length: 28 }, (_, i) => ({
//         opacity: 0.12 + ((i * 7) % 17) / 100,
//         width: 1.5 + ((i * 13) % 25) / 10,
//         height: 1.5 + ((i * 17) % 25) / 10,
//         r: 110 + ((i * 19) % 80),
//         g: 120 + ((i * 23) % 80),
//         left: (i * 7) % 100,
//         top: (i * 11) % 100,
//         duration: 4 + ((i * 5) % 5),
//         delay: (i * 3) % 5,
//       })),
//     [],
//   );

//   const startWingFlutter = useCallback(() => {
//     wingTLRef.current?.kill();
//     const tl = gsap.timeline({ repeat: -1 });
//     wingsRef.current.forEach((wing, i) => {
//       tl.to(
//         wing.rotation,
//         {
//           z: i % 2 === 0 ? 0.6 : -0.6,
//           duration: 0.04,
//           ease: "sine.inOut",
//           yoyo: true,
//           repeat: -1,
//         },
//         0,
//       );
//     });
//     wingTLRef.current = tl;
//   }, []);

//   const startFlight = useCallback(() => {
//     if (stateRef.current === MosquitoState.Dead) return;
//     stateRef.current = MosquitoState.Flying;
//     flightTLRef.current?.kill();
//     gsap.killTweensOf(posRef.current);
//     gsap.killTweensOf(rotRef.current);

//     const bounds = { x: 1.8, y: 1.1 };
//     const fly = () => {
//       if (stateRef.current !== MosquitoState.Flying) return;
//       const tx = (Math.random() - 0.5) * bounds.x * 2;
//       const ty = (Math.random() - 0.5) * bounds.y * 2;
//       const dist = Math.hypot(tx - posRef.current.x, ty - posRef.current.y);
//       const dur = 0.8 + dist * 0.55 + Math.random() * 0.7;
//       const dx = tx - posRef.current.x;
//       const ang = Math.atan2(dx, 1) * 0.8;

//       const tl = gsap.timeline({
//         onComplete: () => {
//           if (stateRef.current !== MosquitoState.Flying) return;
//           gsap.delayedCall(Math.random() * 0.5 + 0.1, fly);
//         },
//       });
//       tl.to(
//         posRef.current,
//         { x: tx, y: ty, duration: dur, ease: "sine.inOut" },
//         0,
//       );
//       tl.to(
//         posRef.current,
//         {
//           z: (Math.random() - 0.5) * 0.3,
//           duration: dur * 0.5,
//           ease: "sine.inOut",
//           yoyo: true,
//           repeat: 1,
//         },
//         0,
//       );
//       tl.to(
//         rotRef.current,
//         { y: ang, duration: dur * 0.3, ease: "power2.out" },
//         0,
//       );
//       flightTLRef.current = tl;
//     };

//     fly();
//   }, []);

//   // ── THREE.JS SETUP ────────────────────────────────────────────────────────
//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const renderer = new THREE.WebGLRenderer({
//       canvas,
//       alpha: true,
//       antialias: true,
//     });
//     renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
//     renderer.setClearColor(0x000000, 0);
//     renderer.toneMapping = THREE.ACESFilmicToneMapping;
//     renderer.toneMappingExposure = 1.2;
//     renderer.outputColorSpace = THREE.SRGBColorSpace;

//     const scene = new THREE.Scene();
//     const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
//     camera.position.set(0, 0, 3.2);
//     camera.lookAt(0, 0, 0);

//     const resize = () => {
//       // clientWidth/Height can be 0 on first call before layout — fall back to window
//       const w = canvas.clientWidth || window.innerWidth;
//       const h = canvas.clientHeight || window.innerHeight;
//       if (!w || !h) return;
//       renderer.setSize(w, h, false);
//       camera.aspect = w / h;
//       camera.updateProjectionMatrix();
//     };
//     // Call immediately, then re-call after layout settles (fixes invisible mosquito on first load)
//     resize();
//     requestAnimationFrame(resize);
//     const resizeTimer = setTimeout(resize, 150);
//     window.addEventListener("resize", resize);

//     // Lighting
//     scene.add(new THREE.AmbientLight(0xffffff, 0.5));
//     const key = new THREE.DirectionalLight(0xffeedd, 3);
//     key.position.set(-2, 3, 4);
//     scene.add(key);
//     const rim = new THREE.DirectionalLight(0x4488ff, 1.2);
//     rim.position.set(2, -1, -3);
//     scene.add(rim);
//     scene.add(new THREE.DirectionalLight(0xffffff, 0.6)).position.set(0, 4, 2);

//     // Load GLB
//     const loader = new GLTFLoader();
//     const onModelReady = (model: THREE.Object3D) => {
//       const box = new THREE.Box3().setFromObject(model);
//       const size = new THREE.Vector3();
//       const centre = new THREE.Vector3();
//       box.getSize(size);
//       box.getCenter(centre);
//       model.position.sub(centre);
//       const s = 1.4 / Math.max(size.x, size.y, size.z);
//       model.scale.setScalar(s);
//       baseScaleRef.current = s;

//       const wings: THREE.Object3D[] = [];
//       model.traverse((child) => {
//         const name = child.name.toLowerCase();
//         if (name.includes("plane") || name.includes("wing")) wings.push(child);
//         if ((child as THREE.Mesh).isMesh) {
//           const mat = (child as THREE.Mesh)
//             .material as THREE.MeshStandardMaterial;
//           if (mat?.isMeshStandardMaterial) {
//             mat.envMapIntensity = 1.5;
//             mat.needsUpdate = true;
//           }
//         }
//       });
//       wingsRef.current = wings;

//       const pmrem = new THREE.PMREMGenerator(renderer);
//       scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
//       pmrem.dispose();

//       scene.add(model);
//       mosquitoRef.current = model;
//       startWingFlutter();
//       startFlight();
//     };

//     loader.load(
//       "/mosquito.glb",
//       (gltf) => onModelReady(gltf.scene),
//       undefined,
//       () => {
//         // Fallback sphere+wings
//         const group = new THREE.Group();
//         group.add(
//           new THREE.Mesh(
//             new THREE.SphereGeometry(0.12, 12, 12),
//             new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.4 }),
//           ),
//         );
//         const wg = new THREE.SphereGeometry(0.1, 8, 4);
//         const wm = new THREE.MeshStandardMaterial({
//           color: 0xaaccff,
//           transparent: true,
//           opacity: 0.4,
//         });
//         const wL = new THREE.Mesh(wg, wm);
//         wL.position.set(-0.18, 0.06, 0);
//         wL.scale.set(1.8, 0.3, 1);
//         const wR = new THREE.Mesh(wg, wm);
//         wR.position.set(0.18, 0.06, 0);
//         wR.scale.set(1.8, 0.3, 1);
//         group.add(wL, wR);
//         wingsRef.current = [wL, wR];
//         scene.add(group);
//         mosquitoRef.current = group;
//         baseScaleRef.current = 1;
//         startWingFlutter();
//         startFlight();
//       },
//     );

//     // Render loop — mosquito position driven entirely by posRef/rotRef
//     const tick = () => {
//       rafRef.current = requestAnimationFrame(tick);
//       const m = mosquitoRef.current;
//       if (m) {
//         m.position.x = posRef.current.x;
//         m.position.y = posRef.current.y;
//         m.position.z = posRef.current.z;
//         m.rotation.y = rotRef.current.y;
//       }
//       renderer.render(scene, camera);
//     };
//     tick();

//     const pos = { ...posRef.current };
//     const rot = { ...rotRef.current };

//     return () => {
//       cancelAnimationFrame(rafRef.current);
//       clearTimeout(resizeTimer);
//       window.removeEventListener("resize", resize);
//       flightTLRef.current?.kill();
//       wingTLRef.current?.kill();
//       gsap.killTweensOf(pos);
//       gsap.killTweensOf(rot);
//       renderer.dispose();
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // ── LAND ON INPUT ─────────────────────────────────────────────────────────
//   const landOnInput = useCallback(() => {
//     if (stateRef.current !== MosquitoState.Flying) return;
//     stateRef.current = MosquitoState.Landing;
//     flightTLRef.current?.kill();
//     gsap.killTweensOf(posRef.current);
//     gsap.killTweensOf(rotRef.current);

//     // Top-right corner of the input box in scene space
//     const tx = 1.05,
//       ty = -0.08;

//     gsap
//       .timeline({
//         onComplete: () => {
//           stateRef.current = MosquitoState.Sitting;
//         },
//       })
//       .to(posRef.current, {
//         x: tx + 0.25,
//         y: ty + 0.2,
//         duration: 0.5,
//         ease: "power2.in",
//       })
//       .to(posRef.current, {
//         x: tx,
//         y: ty,
//         z: 0,
//         duration: 0.3,
//         ease: "power3.out",
//       })
//       .to(posRef.current, { y: ty + 0.05, duration: 0.08, ease: "power1.out" })
//       .to(posRef.current, { y: ty, duration: 0.12, ease: "bounce.out" })
//       .to(rotRef.current, { y: -0.3, duration: 0.2 }, "-=0.3");
//   }, []);

//   // ── HANDS — pixel-based GSAP, zero CSS transform conflict ────────────────
//   const doClap = useCallback((onImpact: () => void) => {
//     const L = leftHandRef.current;
//     const R = rightHandRef.current;
//     if (!L || !R) {
//       onImpact();
//       return;
//     }

//     // Reset: completely off-screen left and right, centred vertically
//     gsap.set(L, {
//       display: "flex",
//       opacity: 1,
//       left: "-260px",
//       top: "50%",
//       yPercent: -50,
//       xPercent: 0,
//       rotation: -10,
//       scale: 1,
//     });
//     gsap.set(R, {
//       display: "flex",
//       opacity: 1,
//       right: "-260px",
//       top: "50%",
//       yPercent: -50,
//       xPercent: 0,
//       rotation: 10,
//       scale: 1,
//     });

//     const tl = gsap.timeline();

//     // Slide in — anticipation
//     tl.to(L, { left: "-80px", duration: 0.45, ease: "power2.out" }, 0)
//       .to(R, { right: "-80px", duration: 0.45, ease: "power2.out" }, 0)

//       // Rush inward
//       .to(L, {
//         left: "calc(50% - 130px)",
//         rotation: 5,
//         duration: 0.2,
//         ease: "power4.in",
//       })
//       .to(
//         R,
//         {
//           right: "calc(50% - 130px)",
//           rotation: -5,
//           duration: 0.2,
//           ease: "power4.in",
//         },
//         "<",
//       )

//       // Impact
//       .call(onImpact)

//       // Hold briefly
//       .to([L, R], { duration: 0.4 });

//     return tl;
//   }, []);

//   const hideHands = useCallback(() => {
//     const L = leftHandRef.current;
//     const R = rightHandRef.current;
//     if (!L || !R) return;
//     gsap.to(L, {
//       left: "-300px",
//       opacity: 0,
//       duration: 0.4,
//       ease: "power3.in",
//       onComplete: () => gsap.set(L, { display: "none" }),
//     });
//     gsap.to(R, {
//       right: "-300px",
//       opacity: 0,
//       duration: 0.4,
//       ease: "power3.in",
//       onComplete: () => gsap.set(R, { display: "none" }),
//     });
//   }, []);

//   // ── PARTICLES ────────────────────────────────────────────────────────────
//   const spawnParticles = useCallback(() => {
//     const c = particlesRef.current;
//     if (!c) return;
//     c.innerHTML = "";
//     for (let i = 0; i < 22; i++) {
//       const p = document.createElement("div");
//       const sz = 4 + Math.random() * 9;
//       p.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;border-radius:50%;
//         background:hsl(${20 + Math.random() * 60},80%,60%);left:0;top:0;`;
//       c.appendChild(p);
//       const angle = (i / 22) * Math.PI * 2 + Math.random() * 0.4;
//       const dist = 50 + Math.random() * 90;
//       gsap.fromTo(
//         p,
//         { x: 0, y: 0, opacity: 1, scale: 1 },
//         {
//           x: Math.cos(angle) * dist,
//           y: Math.sin(angle) * dist,
//           opacity: 0,
//           scale: 0,
//           duration: 0.55 + Math.random() * 0.3,
//           ease: "power2.out",
//           onComplete: () => p.remove(),
//         },
//       );
//     }
//   }, []);

//   // ── SHAKE CARD ────────────────────────────────────────────────────────────
//   const shakeCard = useCallback(() => {
//     const card = cardRef.current;
//     if (!card) return;
//     gsap
//       .timeline()
//       .to(card, { x: -16, rotation: -1.2, duration: 0.055, ease: "power2.out" })
//       .to(card, { x: 16, rotation: 1.2, duration: 0.055 })
//       .to(card, { x: -12, rotation: -0.8, duration: 0.055 })
//       .to(card, { x: 12, rotation: 0.8, duration: 0.055 })
//       .to(card, { x: -7, rotation: -0.4, duration: 0.055 })
//       .to(card, { x: 7, rotation: 0.4, duration: 0.055 })
//       .to(card, {
//         x: 0,
//         rotation: 0,
//         duration: 0.12,
//         ease: "elastic.out(1,0.4)",
//       });
//   }, []);

//   // ── KILL MOSQUITO ─────────────────────────────────────────────────────────
//   const killMosquito = useCallback(() => {
//     stateRef.current = MosquitoState.Dead;
//     flightTLRef.current?.kill();
//     wingTLRef.current?.kill();
//     gsap.killTweensOf(posRef.current);

//     const m = mosquitoRef.current;
//     if (m) {
//       // Squash then disappear
//       gsap
//         .timeline()
//         .to(m.scale, {
//           x: m.scale.x * 2.8,
//           y: m.scale.y * 0.1,
//           z: m.scale.z * 2.8,
//           duration: 0.07,
//           ease: "power4.out",
//         })
//         .to(m.scale, { x: 0, y: 0, z: 0, duration: 0.18, ease: "power2.in" });
//     }

//     spawnParticles();

//     // Flash
//     gsap.fromTo(
//       sectionRef.current,
//       { filter: "brightness(3.5)" },
//       { filter: "brightness(1)", duration: 0.5, ease: "power3.out" },
//     );
//   }, [spawnParticles]);

//   // ── ESCAPE ────────────────────────────────────────────────────────────────
//   const escapeMosquito = useCallback(() => {
//     stateRef.current = MosquitoState.Escaping;
//     flightTLRef.current?.kill();
//     gsap.killTweensOf(posRef.current);
//     gsap.killTweensOf(rotRef.current);

//     const m = mosquitoRef.current;
//     const base = baseScaleRef.current;

//     gsap
//       .timeline({
//         onComplete: () => {
//           // Always reset scale before resuming flight
//           if (m) gsap.set(m.scale, { x: base, y: base, z: base });
//           stateRef.current = MosquitoState.Flying;
//           startFlight();
//         },
//       })
//       // Freeze one frame then dart
//       .to(posRef.current, { duration: 0.05 })
//       // Stretch along direction of escape for motion-blur feel
//       .to(
//         m ? m.scale : {},
//         {
//           x: base * 3,
//           y: base * 0.25,
//           z: base * 3,
//           duration: 0.08,
//           ease: "power4.out",
//         },
//         0.02,
//       )
//       // Dart off-screen diagonally
//       .to(
//         posRef.current,
//         { x: -2.6, y: 1.9, z: 0, duration: 0.16, ease: "power4.in" },
//         0.05,
//       )
//       .to(rotRef.current, { y: -2.5, duration: 0.1 }, 0.05)
//       // Instantly reposition off-screen for re-entry
//       .call(() => {
//         posRef.current.x = -2.2;
//         posRef.current.y = 0.0;
//       });
//   }, [startFlight]);

//   // ── SUBMIT ────────────────────────────────────────────────────────────────
//   const handleSubmit = useCallback(() => {
//     if (busy) return;
//     if (stateRef.current !== MosquitoState.Sitting) {
//       if (stateRef.current === MosquitoState.Flying) {
//         landOnInput();
//         window.setTimeout(() => submitRef.current(), 1200);
//       }
//       return;
//     }

//     setBusy(true);
//     const correct = answer.trim().toLowerCase() === "bite";

//     if (correct) {
//       doClap(() => {
//         killMosquito();
//         window.setTimeout(() => {
//           hideHands();
//           window.setTimeout(() => {
//             setBusy(false);
//             onSuccess?.();
//           }, 500);
//         }, 450);
//       });
//     } else {
//       doClap(() => {
//         escapeMosquito();
//         shakeCard();
//         window.setTimeout(() => {
//           hideHands();
//           setBusy(false);
//           setAnswer("");
//           setMissMsg(true);
//           window.setTimeout(() => setMissMsg(false), 3000);
//         }, 650);
//       });
//     }
//   }, [
//     answer,
//     busy,
//     doClap,
//     escapeMosquito,
//     hideHands,
//     killMosquito,
//     landOnInput,
//     onSuccess,
//     shakeCard,
//   ]);

//   useEffect(() => {
//     submitRef.current = handleSubmit;
//   }, [handleSubmit]);

//   // ── INPUT CHANGE ──────────────────────────────────────────────────────────
//   const handleChange = useCallback(
//     (e: React.ChangeEvent<HTMLInputElement>) => {
//       setAnswer(e.target.value);
//       if (stateRef.current === MosquitoState.Flying) landOnInput();
//     },
//     [landOnInput],
//   );

//   const handleKeyDown = useCallback(
//     (e: React.KeyboardEvent) => {
//       if (e.key === "Enter") handleSubmit();
//     },
//     [handleSubmit],
//   );

//   // ── JSX ───────────────────────────────────────────────────────────────────
//   return (
//     <div
//       ref={sectionRef}
//       className="relative w-full overflow-hidden"
//       style={{
//         minHeight: "100svh",
//         background:
//           "radial-gradient(ellipse 130% 80% at 50% 55%, #08081a 0%, #000 70%)",
//       }}
//     >
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300&family=DM+Sans:wght@200;300;400&display=swap');
//         @keyframes ambientPulse {
//           0%,100%{ opacity:0.35; transform:translate(-50%,-50%) scale(1);   }
//           50%    { opacity:0.6;  transform:translate(-50%,-50%) scale(1.08); }
//         }
//         @keyframes fadeUp {
//           from{ opacity:0; transform:translateY(14px); filter:blur(4px); }
//           to  { opacity:1; transform:translateY(0);    filter:blur(0); }
//         }
//         @keyframes particleDrift {
//           0%  { transform: translateY(0)   scale(1);   opacity: var(--op); }
//           50% { transform: translateY(-8px) scale(1.1); opacity: calc(var(--op) * 1.6); }
//           100%{ transform: translateY(0)   scale(1);   opacity: var(--op); }
//         }
//         input::placeholder{ color:rgba(235,235,245,0.2); }
//         input:focus{ outline:none; }
//       `}</style>

//       {/* ── Three.js canvas — mosquito ── */}
//       <canvas
//         ref={canvasRef}
//         className="absolute inset-0 w-full h-full pointer-events-none"
//         style={{ zIndex: 10 }}
//       />

//       {/* Ambient glow */}
//       <div
//         className="absolute pointer-events-none"
//         style={{
//           width: "55vw",
//           height: "55vw",
//           maxWidth: 580,
//           borderRadius: "50%",
//           background:
//             "radial-gradient(circle, rgba(70,90,200,0.13) 0%, transparent 70%)",
//           top: "50%",
//           left: "50%",
//           animation: "ambientPulse 5s ease-in-out infinite",
//           zIndex: 1,
//         }}
//       />

//       {/* Floating background particles */}
//       {particles.map((p, i) => (
//         <div
//           key={i}
//           className="absolute rounded-full pointer-events-none"
//           style={
//             {
//               "--op": p.opacity,
//               width: `${p.width}px`,
//               height: `${p.height}px`,
//               background: `rgba(${p.r},${p.g},255,1)`,
//               left: `${p.left}%`,
//               top: `${p.top}%`,
//               opacity: p.opacity,
//               animation: `particleDrift ${p.duration}s ease-in-out infinite`,
//               animationDelay: `${p.delay}s`,
//               zIndex: 1,
//             } as React.CSSProperties
//           }
//         />
//       ))}

//       {/* ── LEFT HAND WRAPPER ──
//            Position: fixed left side, centred vertically.
//            GSAP animates `left` pixel value only — no CSS transform conflict.
//       */}
//       <div
//         ref={leftHandRef}
//         className="absolute pointer-events-none select-none"
//         style={{
//           display: "none",
//           width: 220,
//           height: 220,
//           top: "50%",
//           left: "-260px",
//           transform: "translateY(-50%)", // only translateY — GSAP only touches `left`
//           zIndex: 30,
//         }}
//       >
//         <Image
//           src="/left.png"
//           alt="left hand"
//           width={220}
//           height={220}
//           style={{
//             width: "100%",
//             height: "100%",
//             objectFit: "contain",
//             filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.5))",
//           }}
//         />
//       </div>

//       {/* ── RIGHT HAND WRAPPER ── */}
//       <div
//         ref={rightHandRef}
//         className="absolute pointer-events-none select-none"
//         style={{
//           display: "none",
//           width: 220,
//           height: 220,
//           top: "50%",
//           right: "-260px",
//           transform: "translateY(-50%) scaleX(-1)", // mirror + only translateY
//           zIndex: 30,
//         }}
//       >
//         <Image
//           src="/right.png"
//           alt="right hand"
//           width={220}
//           height={220}
//           style={{
//             width: "100%",
//             height: "100%",
//             objectFit: "contain",
//             filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.5))",
//           }}
//         />
//       </div>

//       {/* ── Particle burst origin ── */}
//       <div
//         ref={particlesRef}
//         className="absolute pointer-events-none"
//         style={{ left: "50%", top: "50%", width: 0, height: 0, zIndex: 25 }}
//       />

//       {/* ── Main UI ── */}
//       <div
//         className="relative flex flex-col items-center justify-center"
//         style={{ minHeight: "100svh", padding: "4vh 6vw", zIndex: 5 }}
//       >
//         {/* Eyebrow */}
//         <p
//           style={{
//             fontFamily: "'DM Sans', sans-serif",
//             fontSize: 10,
//             fontWeight: 300,
//             letterSpacing: "0.42em",
//             textTransform: "uppercase",
//             color: "rgba(200,215,240,0.32)",
//             marginBottom: "2.5rem",
//             animation: "fadeUp 1s ease 0.3s both",
//           }}
//         >
//           Before you enter
//         </p>

//         {/* ── Card ── */}
//         <div
//           ref={cardRef}
//           style={{
//             width: "100%",
//             maxWidth: 420,
//             background: "rgba(255,255,255,0.028)",
//             border: "1px solid rgba(255,255,255,0.07)",
//             borderRadius: 24,
//             padding: "clamp(1.8rem,5vw,2.8rem)",
//             backdropFilter: "blur(24px)",
//             boxShadow:
//               "0 32px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.055)",
//             animation: "fadeUp 1s ease 0.5s both",
//             position: "relative",
//           }}
//         >
//           {/* Question block */}
//           <div style={{ marginBottom: "1.8rem", textAlign: "center" }}>
//             <p
//               style={{
//                 fontFamily: "'DM Sans', sans-serif",
//                 fontSize: 9,
//                 fontWeight: 300,
//                 letterSpacing: "0.4em",
//                 textTransform: "uppercase",
//                 color: "rgba(200,215,240,0.35)",
//                 marginBottom: "0.7rem",
//               }}
//             >
//               Answer to enter
//             </p>
//             <h2
//               style={{
//                 fontFamily: "'Cormorant Garamond', Georgia, serif",
//                 fontSize: "clamp(1.5rem,5vw,2.2rem)",
//                 fontWeight: 300,
//                 lineHeight: 1.2,
//                 color: "#f0ede8",
//               }}
//             >
//               Murder of Mosquito?
//             </h2>
//             <p
//               style={{
//                 fontFamily: "'DM Sans', sans-serif",
//                 fontSize: 11,
//                 fontWeight: 300,
//                 color: "rgba(200,215,240,0.24)",
//                 marginTop: "0.45rem",
//                 letterSpacing: "0.04em",
//               }}
//             >
//               (hint: it&apos;s what you two do best together 🦟)
//             </p>
//           </div>

//           {/* Input */}
//           <input
//             ref={inputRef}
//             type="text"
//             value={answer}
//             onChange={handleChange}
//             onKeyDown={handleKeyDown}
//             placeholder="Your answer..."
//             autoComplete="off"
//             spellCheck={false}
//             disabled={busy}
//             style={{
//               display: "block",
//               width: "100%",
//               background: "rgba(255,255,255,0.045)",
//               border: "1px solid rgba(255,255,255,0.1)",
//               borderRadius: 12,
//               padding: "13px 16px",
//               marginBottom: "1rem",
//               fontFamily: "'DM Sans', sans-serif",
//               fontSize: 16,
//               fontWeight: 300,
//               color: "#f0ede8",
//               letterSpacing: "0.02em",
//               transition: "border-color 0.2s, box-shadow 0.2s",
//             }}
//             onFocus={(e) => {
//               e.target.style.borderColor = "rgba(100,140,255,0.45)";
//               e.target.style.boxShadow = "0 0 0 3px rgba(80,100,220,0.14)";
//               if (stateRef.current === MosquitoState.Flying) landOnInput();
//             }}
//             onBlur={(e) => {
//               e.target.style.borderColor = "rgba(255,255,255,0.1)";
//               e.target.style.boxShadow = "none";
//             }}
//           />

//           {/* Submit */}
//           <button
//             onClick={handleSubmit}
//             disabled={busy}
//             style={{
//               display: "block",
//               width: "100%",
//               background: busy
//                 ? "rgba(80,100,200,0.35)"
//                 : "linear-gradient(135deg, rgba(80,100,220,0.85), rgba(120,60,200,0.85))",
//               border: "1px solid rgba(100,120,255,0.25)",
//               borderRadius: 12,
//               padding: "13px 16px",
//               fontFamily: "'DM Sans', sans-serif",
//               fontSize: 13,
//               fontWeight: 400,
//               letterSpacing: "0.1em",
//               textTransform: "uppercase",
//               color: "#fff",
//               cursor: busy ? "not-allowed" : "pointer",
//               boxShadow: busy ? "none" : "0 8px 24px rgba(80,100,220,0.22)",
//               transition: "background 0.2s, box-shadow 0.2s",
//             }}
//           >
//             {busy ? "..." : "Confirm Kill 🎯"}
//           </button>

//           {/* Miss message */}
//           {missMsg && (
//             <p
//               style={{
//                 textAlign: "center",
//                 fontFamily: "'DM Sans', sans-serif",
//                 fontSize: 12,
//                 fontWeight: 300,
//                 color: "rgba(255,110,110,0.85)",
//                 marginTop: "0.9rem",
//                 letterSpacing: "0.05em",
//                 animation: "fadeUp 0.4s ease both",
//               }}
//             >
//               Mosquito survived. Try again.
//             </p>
//           )}
//         </div>

//         {/* Caption */}
//         <p
//           style={{
//             fontFamily: "'Cormorant Garamond', Georgia, serif",
//             fontStyle: "italic",
//             fontSize: "clamp(0.8rem,1.8vw,1rem)",
//             fontWeight: 300,
//             color: "rgba(200,215,240,0.2)",
//             marginTop: "2rem",
//             letterSpacing: "0.06em",
//             animation: "fadeUp 1s ease 1s both",
//           }}
//         >
//           only you two know this answer
//         </p>
//       </div>
//     </div>
//   );
// }
