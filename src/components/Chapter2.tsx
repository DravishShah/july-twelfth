"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { b } from "framer-motion/client";

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────────────────────────────────────
// Chapter 02 — The Door
// Stack: Next.js · Tailwind · GSAP · Three.js
//
// Full-bleed 3D canvas. The door itself is shifted left in 3D world-space
// (not via CSS columns) so its screen position stays correct regardless of
// layout quirks. The whole section PINS while scrolling (same trick as
// Hero.tsx) so there's always genuine scroll distance for the sequence to
// play out, even though this is the last section on the page.
//
// Sequence (all driven by scroll — nothing autoplays):
//   1. Doors swing open toward the viewer
//   2. Warm glow + the figure (figure.png) rise up out of the doorway
//   3. Your note fades in on the right
//   4. Further scrolling: the door shrinks back and the figure grows,
//      giving the illusion the figure has stepped forward in front of it
//
// TUNING NOTES:
//   - camera.position.z         → door size (bigger number = smaller door)
//   - DOOR_X_OFFSET             → how far left the door sits (world units)
//   - OVERLAY_LEFT_PERCENT      → matching left-anchor for label/glow/figure
//   - ScrollTrigger end: "+=XXX%" → total scroll distance for the whole sequence
//   - Each openTl tween's start-time / duration → relative pacing
// ─────────────────────────────────────────────────────────────────────────────

const DOOR_X_OFFSET = -90;
const OVERLAY_LEFT_PERCENT = "30%";

export default function DoorChapter() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    let mounted = true;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 2000);
    camera.position.set(0, 15, 400);
    camera.lookAt(0, 0, 0);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xfff0dc, 2.2);
    key.position.set(150, 260, 220);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7ab8f5, 1.3);
    rim.position.set(-220, 140, -160);
    scene.add(rim);

    const innerGlow = new THREE.PointLight(0xffb87a, 0, 900, 2);
    innerGlow.position.set(DOOR_X_OFFSET, 60, -20);
    scene.add(innerGlow);

    const textureLoader = new THREE.TextureLoader();
    const woodMap = textureLoader.load("/door/mahogany.jpg");
    woodMap.colorSpace = THREE.SRGBColorSpace;

    const doorMaterial = new THREE.MeshStandardMaterial({
      map: woodMap,
      roughness: 0.45,
      metalness: 0.25,
      envMapIntensity: 0.9,
      transparent: true, // needed so the fade-out tween in Phase 4 can render
    });

    let leftHinge: THREE.Group | null = null;
    let rightHinge: THREE.Group | null = null;
    let doorGroup: THREE.Group | null = null;
    let scrollTriggerInstance: ScrollTrigger | null = null;
    let openTl: gsap.core.Timeline | null = null;

    const loader = new OBJLoader();
    loader.load(
      "/door/entrance-door.obj",
      (obj) => {
        if (!mounted) return;
        console.log("[DoorChapter] OBJ loaded successfully", obj);

        let leftLeaf: THREE.Object3D | null = null;
        let rightLeaf: THREE.Object3D | null = null;

        obj.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = doorMaterial;
            if (child.name.includes("002")) leftLeaf = child;
            if (child.name.includes("003")) rightLeaf = child;
          }
        });

        scene.add(obj);
        obj.updateMatrixWorld(true);

        // Anchor horizontally centered, but vertically at the FLOOR (the
        // bottom of the bounding box) rather than the vertical middle.
        // This matters for Phase 4 below: scaling happens around this local
        // origin, so anchoring at the floor makes the door recede straight
        // down into the ground plane (staying aligned with the figure's
        // feet) instead of shrinking toward its middle and floating upward.
        const mainBox = new THREE.Box3().setFromObject(obj);
        const mainCenter = mainBox.getCenter(new THREE.Vector3());
        const mainHeight = mainBox.getSize(new THREE.Vector3()).y;
        obj.position.x -= mainCenter.x;
        obj.position.z -= mainCenter.z;
        obj.position.y -= mainBox.min.y;
        obj.position.x += DOOR_X_OFFSET;
        obj.updateMatrixWorld(true);

        // The door's vertical center moved from y=0 to roughly mainHeight/2
        // — retarget the camera so it's still framed the same way (camera
        // stays looking straight ahead on X so the left-shift isn't skewed
        // by rotation; both its height and aim move up together to keep
        // the same subtle downward tilt as before).
        camera.position.y = mainHeight / 2 + 15;
        camera.lookAt(0, mainHeight / 2, 0);

        doorGroup = obj;

        const buildHinge = (
          leaf: THREE.Object3D | null,
          side: "left" | "right",
        ) => {
          if (!leaf) return null;
          const box = new THREE.Box3().setFromObject(leaf);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const edgeX =
            side === "left" ? center.x - size.x / 2 : center.x + size.x / 2;

          const hinge = new THREE.Group();
          obj.add(hinge);

          const hingeWorldPos = new THREE.Vector3(edgeX, center.y, center.z);
          obj.worldToLocal(hingeWorldPos);
          hinge.position.copy(hingeWorldPos);
          hinge.attach(leaf);

          return hinge;
        };

        leftHinge = buildHinge(leftLeaf, "left");
        rightHinge = buildHinge(rightLeaf, "right");

        // ── Pinned scroll-driven sequence ──────────────────────────────────
        // Mirrors the pinning technique used in Hero.tsx: pin: true makes
        // GSAP insert real scroll space into the page, so this works even
        // as the last section with nothing after it.
        openTl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=340%",
            scrub: 1.5,
            pin: true,
          },
        });
        scrollTriggerInstance = openTl.scrollTrigger ?? null;

        // Phase 1 — doors swing open toward the viewer (slow, smooth).
        if (leftHinge) {
          openTl.to(
            leftHinge.rotation,
            { y: -Math.PI / 2.1, duration: 1.6, ease: "power2.inOut" },
            0,
          );
        }
        if (rightHinge) {
          openTl.to(
            rightHinge.rotation,
            { y: Math.PI / 2.1, duration: 1.6, ease: "power2.inOut" },
            0,
          );
        }
        openTl.to(
          innerGlow,
          { intensity: 2.6, duration: 1.6, ease: "power2.out" },
          0.2,
        );

        // Phase 2 — glow, then figure, rise out of the doorway.
        if (glowRef.current) {
          openTl.fromTo(
            glowRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.8, ease: "power2.out" },
            0.9,
          );
        }
        if (figureRef.current) {
          openTl.fromTo(
            figureRef.current,
            { opacity: 0, y: 46, scale: 0.94 },
            { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "power2.out" },
            1.5,
          );
        }

        // Phase 3 — your note fades in on the right, only once the door is open.
        if (noteRef.current) {
          openTl.fromTo(
            noteRef.current,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.6 },
            2.3,
          );
        }

        // Phase 4 — further scrolling: door recedes, figure grows forward,
        // and the door fades out entirely once it's small. This is all part
        // of the same scrubbed timeline, so scrolling back up reverses it
        // exactly like every other phase — the door fades back in as it
        // grows back to full size.
        openTl.to(
          doorGroup.scale,
          { x: 0.5, y: 0.5, z: 0.5, duration: 1, ease: "power2.inOut" },
          3.0,
        );
        openTl.to(
          doorMaterial,
          { opacity: 0, duration: 1, ease: "power2.in" },
          3.3,
        );
        if (figureRef.current) {
          openTl.to(
            figureRef.current,
            { scale: 1.45, duration: 1, ease: "power2.inOut" },
            3.0,
          );
        }
      },
      (progress) => {
        if (progress.total) {
          console.log(
            `[DoorChapter] Loading OBJ: ${Math.round((progress.loaded / progress.total) * 100)}%`,
          );
        }
      },
      (error) => {
        console.error(
          "[DoorChapter] Failed to load /door/entrance-door.obj",
          error,
        );
      },
    );

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      mounted = false;
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
      scrollTriggerInstance?.kill();
      openTl?.kill();
      renderer.dispose();
      pmrem.dispose();
      woodMap.dispose();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-black"
      style={{ height: "100svh", maxHeight: "100svh" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@200;300;400&display=swap');

        .hero-text      { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        .font-cormorant { font-family: 'Cormorant Garamond', Georgia, serif; }
      `}</style>

      {/* Full-bleed 3D canvas — the door's screen position is controlled by
          DOOR_X_OFFSET in the world, not by this canvas's CSS size. */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 0 }}
      />

      {/* Cinematic vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 60% 45% at ${OVERLAY_LEFT_PERCENT} 100%, rgba(0,0,0,0.9) 0%, transparent 60%),
            radial-gradient(ellipse 60% 25% at ${OVERLAY_LEFT_PERCENT} 0%, rgba(0,0,0,0.75) 0%, transparent 55%)
          `,
          zIndex: 1,
        }}
      />

      <p
        ref={labelRef}
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
          zIndex: 2,
        }}
      >
        Chapter 02 &nbsp;·&nbsp; The Door
      </p>

      {/* Warm glow spilling from the doorway */}
      <div
        ref={glowRef}
        className="absolute pointer-events-none"
        style={{
          left: OVERLAY_LEFT_PERCENT,
          top: "52%",
          transform: "translate(-50%, -50%)",
          width: 200,
          height: 360,
          borderRadius: "50% 50% 40% 40%",
          background:
            "radial-gradient(ellipse at center, rgba(255,190,130,0.35) 0%, rgba(255,150,90,0.12) 45%, transparent 75%)",
          filter: "blur(6px)",
          opacity: 0,
          zIndex: 1,
        }}
      />

      {/* Figure cutout — positioning wrapper uses flex-centering (not a
          transform) so GSAP's later `scale` tween has sole ownership of
          figureRef's transform, with no conflict against React's inline
          styles. */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: OVERLAY_LEFT_PERCENT,
          bottom: "14%",
          width: 0,
          display: "flex",
          justifyContent: "center",
          zIndex: 2,
        }}
      >
        <div
          ref={figureRef}
          style={{
            opacity: 0,
            filter: "drop-shadow(0 12px 30px rgba(0,0,0,0.6))",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/pn.png"
            alt=""
            style={{
              height: "min(64vh, 560px)",
              width: "auto",
              display: "block",
            }}
          />
        </div>
      </div>

      {/* Your note — right side, only visible once the door has opened */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: "20%",
          top: "50%",
          transform: "translateY(-50%)",
          maxWidth: 380,
          zIndex: 2,
        }}
      >
        <div ref={noteRef} style={{ opacity: 0 }}>
          <p
            className="hero-text"
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "rgba(122,184,245,0.5)",
              marginBottom: "1.2em",
            }}
          >
            A Note
          </p>
          <p
            className="font-cormorant"
            style={{
              fontSize: 22,
              fontStyle: "italic",
              fontWeight: 400,
              lineHeight: 1.6,
              color: "rgba(230,235,245,0.85)",
            }}
          >
            {/* Replace this placeholder with your own note. */}
            Write what you want to say here — this is the space for your note,
            revealed only once the door has opened.
          </p>
          <img
            src="/us.png"
            alt=""
            style={{
              width: "100%",
              maxWidth: 320,
              aspectRatio: "1 / 1",
              objectFit: "cover",
              borderRadius: 4,
              display: "block",
            }}
          />
          <div></div>
        </div>
      </div>
    </section>
  );
}
