"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { gsap } from "gsap";

// ─────────────────────────────────────────────────────────────────────────────
// Chapter 03: The Door
// Stack: Next.js · Tailwind · GSAP · Three.js
// ─────────────────────────────────────────────────────────────────────────────

export default function DoorSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hingeRef = useRef<THREE.Group | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // ── THREE.JS SETUP ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();

    // Position camera so we can see the door
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    camera.position.set(0, 2, 5);

    // Basic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    // Load the GLB file
    const loader = new GLTFLoader();
    loader.load(
      "/Door.glb", // <-- Ensure your file path is correct
      (gltf) => {
        const model = gltf.scene;

        // 1. Add the ENTIRE model to the scene so we see the frame
        scene.add(model);

        // Force the scene to update its math before we measure things
        model.updateMatrixWorld(true);

        // 2. Find the door
        const doorMesh = model.getObjectByName("Cylinder008");

        if (doorMesh) {
          // 3. Measure the exact Bounding Box (size and center) of the door
          const box = new THREE.Box3().setFromObject(doorMesh);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          // 4. Create our invisible hinge group
          const hingeGroup = new THREE.Group();

          // Add the hinge to the main model so it stays attached to the frame
          model.add(hingeGroup);

          // 5. Position the hinge at the edge of the door
          // Note: If the door swings from the right side instead of the left,
          // change `- size.x / 2` to `+ size.x / 2`
          const hingeWorldPosition = new THREE.Vector3(
            center.x + size.x / 1.5,
            center.y,
            center.z,
          );

          // Convert absolute world math to the model's local math
          model.worldToLocal(hingeWorldPosition);
          hingeGroup.position.copy(hingeWorldPosition);

          // 6. The Magic Trick: .attach() reparents the door into the hinge folder
          // without visually moving it out of the frame!
          hingeGroup.attach(doorMesh);

          // Save the hinge for GSAP to animate
          hingeRef.current = hingeGroup;
        } else {
          console.warn("Could not find Cylinder008.");
        }

        // Center the entire model (frame + door) in the camera's view
        const mainBox = new THREE.Box3().setFromObject(model);
        const mainCenter = mainBox.getCenter(new THREE.Vector3());
        model.position.sub(mainCenter);
      },
    );

    // Handle Window Resize
    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    // Render Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, []);

  // ── GSAP ANIMATION TRIGGER ────────────────────────────────────────────────
  const toggleDoor = () => {
    if (!hingeRef.current) return;

    // The angle you want the door to open to (e.g., 90 degrees)
    // If it swings "into" the wall or the wrong way, change this to -Math.PI / 2
    const targetRotation = isOpen ? 0 : Math.PI / 2;

    gsap.to(hingeRef.current.rotation, {
      y: targetRotation,
      duration: 1.5,
      ease: "power3.inOut",
    });

    setIsOpen(!isOpen);
  };

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <section
      className="relative flex items-center justify-center overflow-hidden bg-black"
      style={{ height: "100svh", width: "100vw" }}
    >
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />

      {/* UI Overlay */}
      <div
        className="relative flex flex-col items-center gap-6"
        style={{ zIndex: 2, marginTop: "60vh" }}
      >
        <button
          onClick={toggleDoor}
          style={{
            padding: "12px 32px",
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(122,184,245,0.45)",
            borderRadius: "30px",
            color: "rgba(122,184,245,0.8)",
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: "14px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(122,184,245,0.2)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)")
          }
        >
          {isOpen ? "Close Door" : "Open Door"}
        </button>
      </div>
    </section>
  );
}
