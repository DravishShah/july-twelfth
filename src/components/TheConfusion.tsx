"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────────────────────────────────────
// HeroSection — Chapter 01: The Beginning
// Stack: Next.js · Tailwind · GSAP · Three.js
// ─────────────────────────────────────────────────────────────────────────────

export default function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phoneCanvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<HTMLDivElement>(null);
  const msg1Ref = useRef<HTMLDivElement>(null);
  const msg2Ref = useRef<HTMLDivElement>(null);
  const msg3Ref = useRef<HTMLDivElement>(null);
  const typing2Ref = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  // ── THREE.JS STARFIELD ────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
    camera.position.z = 5;

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      renderer.dispose();
    };
  }, []);

  // ── THREE.JS 3D PHONE MODEL ───────────────────────────────────────────────
  useEffect(() => {
    const canvas = phoneCanvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(300, 620); // Matches the phoneRef container

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 300 / 620, 0.1, 100);
    camera.position.z = 5;

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    let phoneModel: THREE.Group;

    const loader = new GLTFLoader();
    loader.load("/phone.glb", (gltf) => {
      phoneModel = gltf.scene;

      phoneModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const meshName = child.name.toLowerCase();
          const matName = child.material.name
            ? child.material.name.toLowerCase()
            : "";
          if (
            meshName.includes("screen") ||
            meshName.includes("display") ||
            matName.includes("screen")
          ) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0x1c1c1e,
              roughness: 0.9,
              metalness: 0.1,
            });
          }
        }
      });

      // Auto-scale to fit 300x620 bounds
      const box = new THREE.Box3().setFromObject(phoneModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const targetScale = 3.8 / maxDim;
      phoneModel.scale.set(targetScale, targetScale, targetScale);

      phoneModel.position.sub(center.multiplyScalar(targetScale));
      scene.add(phoneModel);
    });

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (phoneModel) {
        phoneModel.rotation.y = Math.sin(Date.now() * 0.001) * 0.0;
        phoneModel.rotation.x = Math.cos(Date.now() * 0.0008) * 0.0;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, []);

  // ── GSAP TIMELINE ─────────────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      tl.eventCallback("onStart", () => {
        document.body.style.overflow = "hidden";
      });

      tl.eventCallback("onComplete", () => {
        document.body.style.overflow = "";
      });
      tl.pause(0);
      // ScrollTrigger.create({
      //   trigger: sectionRef.current,
      //   start: "top 85%",
      //   once: false,
      //   onEnter: () => tl.restart(),
      //   onEnterBack: () => tl.restart(),
      // });
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 5%",
        once: true,
        onEnter: () => {
          document.body.style.overflow = "hidden";

          tl.restart();

          tl.eventCallback("onComplete", () => {
            document.body.style.overflow = "";
          });
        },
      });
      // Glow ring pulse before phone
      tl.fromTo(
        glowRef.current,
        { opacity: 0, scale: 0.88 },
        { opacity: 1, scale: 1, duration: 1.2 },
        0.5,
      );

      // Phone frame
      tl.fromTo(
        phoneRef.current,
        { opacity: 0, y: 60, scale: 0.92 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.3,
          ease: "expo.out",
        },
        0.7,
      );

      // Msg 1 — incoming
      tl.fromTo(
        msg1Ref.current,
        { opacity: 0, scale: 0.75, x: -12 },
        { opacity: 1, scale: 1, x: 0, duration: 0.6, ease: "back.out(2.2)" },
        1.8,
      );

      // Typing indicator
      tl.fromTo(
        typingRef.current,
        { opacity: 0, scale: 0.75, x: -12 },
        { opacity: 1, scale: 1, x: 0, duration: 0.45, ease: "back.out(2)" },
        2.55,
      );

      // Typing fades, outgoing appears
      tl.to(
        typingRef.current,
        { opacity: 0, scale: 0.85, duration: 0.28, ease: "power2.in" },
        3.5,
      );
      tl.fromTo(
        msg2Ref.current,
        { opacity: 0, scale: 0.75, x: 12 },
        { opacity: 1, scale: 1, x: 0, duration: 0.6, ease: "back.out(2.2)" },
        3.7,
      );

      // Typing2 — Patther replies
      tl.fromTo(
        typing2Ref.current,
        { opacity: 0, scale: 0.75, x: -12 },
        { opacity: 1, scale: 1, x: 0, duration: 0.45, ease: "back.out(2)" },
        4.5,
      );
      tl.to(
        typing2Ref.current,
        { opacity: 0, scale: 0.85, duration: 0.28, ease: "power2.in" },
        5.5,
      );

      // Msg 3 — Patther's reply
      tl.fromTo(
        msg3Ref.current,
        { opacity: 0, scale: 0.75, x: -12 },
        { opacity: 1, scale: 1, x: 0, duration: 0.6, ease: "back.out(2.2)" },
        5.7,
      );

      // Caption
      tl.fromTo(
        captionRef.current,
        { opacity: 0, y: 16, filter: "blur(4px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8 },
        6.4,
      );

      // Scroll parallax
      gsap.to(phoneRef.current, {
        yPercent: -12,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.5,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-black"
      style={{ height: "100svh", maxHeight: "100svh" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@200;300;400&display=swap');

        .hero-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        .font-cormorant { font-family: 'Cormorant Garamond', Georgia, serif; }
        .font-dm        { font-family: 'DM Sans', system-ui, sans-serif; }

        @keyframes dotBounce {
          0%,55%,100% { transform: translateY(0);   opacity: 0.38; }
          27%          { transform: translateY(-5px); opacity: 1;    }
        }
        @keyframes glowPulse {
          0%,100% { box-shadow: 0 0 0px  0px rgba(255,255,255,0);    opacity: 0.06; }
          50%     { box-shadow: 0 0 40px 4px rgba(255,255,255,0.04); opacity: 0.12; }
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Three.js starfield */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 100% 40% at 50% 100%, rgba(0,0,0,0.85) 0%, transparent 60%),
            radial-gradient(ellipse 100% 20% at 50% 0%,   rgba(0,0,0,0.7)  0%, transparent 50%)
          `,
          zIndex: 1,
        }}
      />

      <div
        ref={glowRef}
        className="absolute pointer-events-none"
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 360,
          height: 620,
          borderRadius: 50,
          border: "1px solid rgba(255,255,255,0.06)",
          animation: "glowPulse 5s ease-in-out infinite",
          zIndex: 2,
        }}
      />

      {/* ── Content ── */}
      <div
        className="relative flex flex-col items-center justify-center"
        style={{
          height: "100svh",
          maxHeight: "100svh",
          paddingTop: "2vh",
          paddingBottom: "2vh",
          zIndex: 3,
        }}
      >
        <p
          ref={labelRef}
          className="hero-text"
          style={{
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: "0.38em",
            textTransform: "uppercase",
            color: "rgba(122,184,245,0.45)",
            marginBottom: "2vh",
            opacity: 1,
          }}
        >
          Chapter 01 &nbsp;·&nbsp; A Misunderstanding
        </p>

        {/* ── 3D Phone + UI Overlay Wrapper ── */}
        <div
          ref={phoneRef}
          style={{
            position: "relative",
            width: 300,
            height: 620,
            maxWidth: "calc(100vw - 32px)",
            transform: "scale(0.95)",
            transformOrigin: "top center",
            opacity: 0,
          }}
        >
          <canvas
            ref={phoneCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
          />

          {/* 2. UI Overlay Alignment
            If the HTML overflows the 3D model bezel, adjust these percentages!
            Increase top/left and decrease width/height to make it smaller.
          */}
          <div
            className="absolute z-10 flex flex-col overflow-hidden"
            style={{
              top: "4.5%", // Pushed down from the top edge
              left: "6.5%", // Pushed in from the left edge
              width: "87%", // Shrunk width to fit inside bezels
              height: "91%", // Shrunk height to fit inside bezels
              borderRadius: 38, // Smoother corners
              background: "transparent",
            }}
          >
            {/* Status bar — (Icons updated to black) */}
            <div
              style={{
                padding: "14px 17px 0px",
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 5,
              }}
            >
              <svg width="17" height="12" viewBox="0 0 17 12" fill="black">
                <rect x="0" y="4" width="3" height="8" rx="1" opacity="0.45" />
                <rect
                  x="4.5"
                  y="2.5"
                  width="3"
                  height="9.5"
                  rx="1"
                  opacity="0.65"
                />
                <rect x="9" y="1" width="3" height="11" rx="1" />
                <rect
                  x="13.5"
                  y="0"
                  width="2"
                  height="12"
                  rx="1"
                  opacity="0.35"
                />
              </svg>
              <svg width="16" height="12" viewBox="0 0 16 12" fill="black">
                <path
                  d="M8 2.2C10.3 2.2 12.4 3.1 13.9 4.6L15.5 3C13.6 1.1 10.9 0 8 0S2.4 1.1 .5 3L2.1 4.6C3.6 3.1 5.7 2.2 8 2.2z"
                  opacity="0.55"
                />
                <path d="M8 5.5c1.4 0 2.6.6 3.5 1.5L13.1 5.4C11.8 4.2 10 3.4 8 3.4S4.2 4.2 2.9 5.4L4.5 7C5.4 6.1 6.6 5.5 8 5.5z" />
                <circle cx="8" cy="9.5" r="1.5" />
              </svg>
              <svg width="26" height="13" viewBox="0 0 26 13" fill="none">
                <rect
                  x="0.5"
                  y="1"
                  width="21"
                  height="11"
                  rx="3.5"
                  stroke="black"
                  strokeWidth="1"
                  opacity="0.55"
                />
                <rect x="2" y="2.5" width="14" height="8" rx="2" fill="black" />
                <rect
                  x="22.5"
                  y="4.5"
                  width="2.5"
                  height="4"
                  rx="1.5"
                  fill="black"
                  opacity="0.5"
                />
              </svg>
            </div>

            {/* Contact header */}
            <div
              style={{
                background: "transparent",
                borderBottom: "0.5px solid rgba(0,0,0,0.1)", // Darkened border
                padding: "10px 14px 12px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  minWidth: 44,
                }}
              >
                <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                  <path
                    d="M8 2L2 8L8 14"
                    stroke="#0a84ff"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span
                  style={{
                    color: "#0a84ff",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 17,
                    fontWeight: 300,
                    letterSpacing: -0.3,
                  }}
                >
                  3
                </span>
              </div>

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    padding: 2,
                    background: "linear-gradient(135deg, #5e5ce6, #bf5af2)",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #4a47c4, #9b44d0)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14,
                      fontWeight: 400,
                      color: "#fff",
                      letterSpacing: 0.5,
                    }}
                  >
                    P
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#000",
                    letterSpacing: -0.1,
                  }}
                >
                  Patther
                </span>
              </div>

              <div
                style={{
                  minWidth: 44,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
                  <path
                    d="M1 2.5C1 1.67 1.67 1 2.5 1H13.5C14.33 1 15 1.67 15 2.5V13.5C15 14.33 14.33 15 13.5 15H2.5C1.67 15 1 14.33 1 13.5V2.5Z"
                    stroke="#0a84ff"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M15 5.5L21 3V13L15 10.5V5.5Z"
                    stroke="#0a84ff"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Messages */}
            <div
              className="no-scrollbar"
              style={{
                flex: 1,
                padding: "14px 12px 8px",
                display: "flex",
                flexDirection: "column",
                gap: 0,
                overflowY: "auto",
              }}
            >
              <p
                style={{
                  textAlign: "center",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 500,
                  color: "rgba(0,0,0,0.45)",
                  letterSpacing: "0.02em",
                  marginBottom: 7,
                  marginTop: -5,
                }}
              >
                Friday, January 11, 2013
              </p>

              <div
                ref={msg1Ref}
                style={{
                  opacity: 0,
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 8,
                  marginBottom: 3,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: "linear-gradient(135deg, #5e5ce6, #bf5af2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    fontWeight: 400,
                    color: "#fff",
                  }}
                >
                  P
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    maxWidth: 210,
                  }}
                >
                  <div
                    style={{
                      background: "#262628",
                      color: "#f5f5f7",
                      padding: "10px 14px",
                      borderRadius: 20,
                      borderBottomLeftRadius: 4,
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14.5,
                      fontWeight: 300,
                      lineHeight: 1.5,
                      letterSpacing: -0.15,
                      wordBreak: "break-word",
                    }}
                  >
                    Hey... why did you stop talking to me? Is everything okay?
                  </div>
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 10,
                      fontWeight: 500,
                      color: "rgba(0,0,0,0.4)",
                      marginTop: 5,
                      letterSpacing: "0.03em",
                    }}
                  >
                    9:40 PM
                  </span>
                </div>
              </div>

              <div
                ref={typingRef}
                style={{
                  opacity: 0,
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 8,
                  marginBottom: 5,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: "linear-gradient(135deg, #5e5ce6, #bf5af2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    fontWeight: 400,
                    color: "#fff",
                  }}
                >
                  P
                </div>
                <div
                  style={{
                    background: "#262628",
                    padding: "11px 16px",
                    borderRadius: 20,
                    borderBottomLeftRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  {[0, 160, 320].map((d, i) => (
                    <div
                      key={i}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "rgba(235,235,245,0.42)",
                        animation: `dotBounce 1.25s ease ${d}ms infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div
                ref={msg2Ref}
                style={{
                  opacity: 0,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    maxWidth: 210,
                  }}
                >
                  <div
                    style={{
                      background: "#0a84ff",
                      color: "#fff",
                      padding: "10px 14px",
                      borderRadius: 20,
                      borderBottomRightRadius: 4,
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14.5,
                      fontWeight: 300,
                      lineHeight: 1.5,
                      letterSpacing: -0.15,
                    }}
                  >
                    I felt bad about something...
                  </div>
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 10,
                      fontWeight: 500,
                      color: "rgba(0,0,0,0.4)",
                      marginTop: 5,
                      letterSpacing: "0.03em",
                    }}
                  >
                    10:20 PM &nbsp;·&nbsp; Delivered
                  </span>
                </div>
              </div>

              <div
                ref={typing2Ref}
                style={{
                  opacity: 0,
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 8,
                  marginTop: 2,
                  marginBottom: 3,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: "linear-gradient(135deg, #5e5ce6, #bf5af2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    fontWeight: 400,
                    color: "#fff",
                  }}
                >
                  P
                </div>
                <div
                  style={{
                    background: "#262628",
                    padding: "11px 16px",
                    borderRadius: 20,
                    borderBottomLeftRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  {[0, 160, 320].map((d, i) => (
                    <div
                      key={i}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "rgba(235,235,245,0.42)",
                        animation: `dotBounce 1.25s ease ${d}ms infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div
                ref={msg3Ref}
                style={{
                  opacity: 0,
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 8,
                  marginTop: 2,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: "linear-gradient(135deg, #5e5ce6, #bf5af2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    fontWeight: 400,
                    color: "#fff",
                  }}
                >
                  P
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    maxWidth: 210,
                  }}
                >
                  <div
                    style={{
                      background: "#262628",
                      color: "#f5f5f7",
                      padding: "10px 14px",
                      borderRadius: 20,
                      borderBottomLeftRadius: 4,
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14.5,
                      fontWeight: 300,
                      lineHeight: 1.5,
                      letterSpacing: -0.15,
                      wordBreak: "break-word",
                    }}
                  >
                    Umm... I am sure it is just a misunderstanding... We can
                    clear it out.
                  </div>
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 10,
                      fontWeight: 500,
                      color: "rgba(0,0,0,0.4)",
                      marginTop: 5,
                      letterSpacing: "0.03em",
                    }}
                  >
                    10:24 PM
                  </span>
                </div>
              </div>
            </div>

            {/* Input bar */}
            <div
              style={{
                background: "transparent",
                borderTop: "0.5px solid rgba(0,0,0,0.1)", // Darkened border
                padding: "8px 12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  border: "1.5px solid rgba(0,0,0,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M6 1V11M1 6H11"
                    stroke="rgba(0,0,0,0.4)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div
                style={{
                  flex: 1,
                  background: "rgba(0,0,0,0.05)",
                  border: "0.5px solid rgba(0,0,0,0.1)",
                  borderRadius: 22,
                  padding: "8px 16px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "rgba(0,0,0,0.4)",
                  letterSpacing: -0.1,
                }}
              >
                iMessage
              </div>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "#0a84ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path
                    d="M6.5 11V2M6.5 2L2 6.5M6.5 2L11 6.5"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
        {/* ── End 3D Phone ── */}

        {/* Caption */}
        <div
          ref={captionRef}
          className="flex flex-col items-center"
          style={{ marginTop: "2vh", opacity: 0, gap: "1vh" }}
        >
          <h2
            className="hero-text"
            style={{
              fontSize: 18,
              fontStyle: "italic",
              fontWeight: 500,
              color: "rgba(122,184,245,0.38)",
              letterSpacing: "0.08em",
              textAlign: "center",
            }}
          >
            One message that changed everything in 2013
          </h2>
          <p
            className="hero-text"
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: "rgba(122,184,245,0.38)",
              letterSpacing: "0.08em",
              textAlign: "center",
            }}
          >
            The silence was absolute. No reason given. Most would have walked
            away, but she stayed. He almost let the connection fade.
            <br /> <span style={{ fontWeight: 800 }}>
              &quot;Almost&quot;
            </span>{" "}
            <br />
            But one small reply in 2013 changed the trajectory of forever.
          </p>
        </div>
      </div>
      {/* ── End content ── */}
    </section>
  );
}
