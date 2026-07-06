"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { gsap } from "gsap";

// ─────────────────────────────────────────────────────────────────────────────
// Envelope3D — a small, self-contained Three.js envelope built entirely from
// primitives (no imported model), so the flap is a genuinely separate mesh
// from the start — this is what let us give it a working hinge, unlike the
// two uploaded envelope files, which had the flap fused into the same mesh
// as the body.
//
// Exposes open()/close() via ref, so a parent component (Chapter3) can
// trigger the animation on click.
//
// WHY OPEN_ANGLE IS 130° (NOT SOMETHING LARGER):
// The flap hinges along the top edge. When it swings open, its tip sweeps
// UP AND BACK — the more it opens, the higher the tip reaches above the
// envelope's own top edge. At the previous 165°, the math works out to the
// tip reaching more than 2x the envelope's height above center, which is
// exactly why it was clipping at the top of the small canvas — the camera
// was framed for the closed envelope's size, not the much taller silhouette
// the open flap sweeps through. 130° plus a slightly pulled-back camera
// gives comfortable headroom without looking closed-off.
//
// TUNING NOTES:
//   - ENVELOPE_WIDTH / HEIGHT   → proportions of the envelope
//   - bodyColor / flapColor     → the light-brown kraft-paper tones
//   - OPEN_ANGLE                → how far the flap swings open (radians) —
//     if you increase this, also increase camera distance (see comment
//     at the camera.position.set call) or it will clip again
//   - letter slide target (y/z) → how far the peeking letter rises out
// ─────────────────────────────────────────────────────────────────────────────

const ENVELOPE_WIDTH = 2.2;
const ENVELOPE_HEIGHT = 1.5;
const OPEN_ANGLE = (130 * Math.PI) / 180;

export type EnvelopeHandle = {
  open: () => void;
  close: () => void;
};

const Envelope3D = forwardRef<EnvelopeHandle>(function Envelope3D(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hingeRef = useRef<THREE.Group | null>(null);
  const letterRef = useRef<THREE.Mesh | null>(null);

  useImperativeHandle(ref, () => ({
    open: () => {
      if (hingeRef.current) {
        gsap.to(hingeRef.current.rotation, {
          x: OPEN_ANGLE,
          duration: 0.6,
          ease: "power2.inOut",
        });
      }
      if (letterRef.current) {
        gsap.to(letterRef.current.position, {
          y: 0.55,
          z: 0.15,
          duration: 0.5,
          delay: 0.35,
          ease: "power2.out",
        });
      }
    },
    close: () => {
      if (hingeRef.current) {
        gsap.to(hingeRef.current.rotation, {
          x: 0,
          duration: 0.5,
          ease: "power2.inOut",
          delay: 0.1,
        });
      }
      if (letterRef.current) {
        gsap.to(letterRef.current.position, {
          y: -0.35,
          z: 0.02,
          duration: 0.4,
          ease: "power2.in",
        });
      }
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
    // Pulled back from 4.4 to 5.4, and aimed slightly above the envelope's
    // own center (0.18 instead of 0) — the open flap needs more headroom
    // above the envelope than below it, so centering the camera a bit
    // higher uses the frame more efficiently than just zooming out further.
    camera.position.set(0, 0.45, 5.4);
    camera.lookAt(0, 0.18, 0);

    // Soft studio environment for a bit of gentle sheen — same technique
    // used for the door's brass hardware — kept subtle since paper isn't
    // reflective, just enough to avoid a flat/plasticky look.
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.06).texture;

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xfff2e0, 1.4);
    key.position.set(3, 4, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9fc4ff, 0.4);
    fill.position.set(-3, 1, 2);
    scene.add(fill);

    // Kraft-paper light-brown tones — flap made noticeably darker than the
    // body (not just a subtle tint) so it reads clearly as a distinct shape
    // regardless of lighting angle.
    const bodyColor = 0xc9a877;
    const flapColor = 0x8a6a45;
    const flapEdgeColor = 0x5c4529;
    const sealColor = 0x7ab8f5;
    const letterColor = 0xf4ecd8;

    const group = new THREE.Group();
    scene.add(group);

    // Soft contact shadow beneath the envelope — a simple radial-gradient
    // texture on a flat circle, for a grounded, less "floating" look.
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const shadowCtx = shadowCanvas.getContext("2d")!;
    const gradient = shadowCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, "rgba(0,0,0,0.45)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    shadowCtx.fillStyle = gradient;
    shadowCtx.fillRect(0, 0, 256, 256);
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(ENVELOPE_WIDTH * 1.5, ENVELOPE_HEIGHT * 0.9),
      new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        depthWrite: false,
      }),
    );
    shadow.position.set(0, -ENVELOPE_HEIGHT / 2 - 0.05, -0.2);
    group.add(shadow);

    // Envelope body — rounded edges instead of a sharp box, for a more
    // premium, tangible feel.
    const body = new THREE.Mesh(
      new RoundedBoxGeometry(ENVELOPE_WIDTH, ENVELOPE_HEIGHT, 0.08, 4, 0.05),
      new THREE.MeshStandardMaterial({
        color: bodyColor,
        roughness: 0.7,
        metalness: 0.08,
        envMapIntensity: 0.6,
      }),
    );
    group.add(body);

    // Letter — a cream rectangle tucked mostly behind/below the flap,
    // revealed by sliding upward when open() is called.
    const letter = new THREE.Mesh(
      new THREE.PlaneGeometry(ENVELOPE_WIDTH * 0.74, ENVELOPE_HEIGHT * 0.62),
      new THREE.MeshStandardMaterial({
        color: letterColor,
        roughness: 0.9,
        side: THREE.DoubleSide,
      }),
    );
    letter.position.set(0, -0.35, 0.03);
    group.add(letter);
    letterRef.current = letter;

    // Flap — a triangular shape, hinged along the envelope's top edge.
    // Extruded with a slight bevel (rather than a flat plane) so it reads
    // as an actual fold of paper with real thickness, not a flat cutout.
    const flapShape = new THREE.Shape();
    flapShape.moveTo(-ENVELOPE_WIDTH / 2, 0);
    flapShape.lineTo(ENVELOPE_WIDTH / 2, 0);
    flapShape.lineTo(0, -ENVELOPE_HEIGHT * 0.58);
    flapShape.lineTo(-ENVELOPE_WIDTH / 2, 0);

    const flapGeometry = new THREE.ExtrudeGeometry(flapShape, {
      depth: 0.02,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 2,
    });
    const flap = new THREE.Mesh(
      flapGeometry,
      new THREE.MeshStandardMaterial({
        color: flapColor,
        roughness: 0.7,
        metalness: 0.08,
        envMapIntensity: 0.6,
        side: THREE.DoubleSide,
      }),
    );

    // Outline around the flap's front edge — guarantees the flap's shape
    // reads clearly even under lighting that might otherwise flatten the
    // color contrast.
    const flapOutline = new THREE.LineSegments(
      new THREE.EdgesGeometry(flapGeometry),
      new THREE.LineBasicMaterial({ color: flapEdgeColor }),
    );
    flap.add(flapOutline);

    // Positioned clearly (not just fractionally) in front of the body face
    // (body front face is at local z = +0.04) to remove any ambiguity in
    // draw order between the flap and the body.
    const hinge = new THREE.Group();
    hinge.position.set(0, ENVELOPE_HEIGHT / 2, 0.1);
    hinge.add(flap);
    group.add(hinge);
    hingeRef.current = hinge;

    // Seal — a circle at the flap's tip, matching the blue accent used
    // throughout the rest of the site, positioned clearly in front of the
    // flap itself.
    const seal = new THREE.Mesh(
      new THREE.CircleGeometry(0.22, 24),
      new THREE.MeshStandardMaterial({
        color: sealColor,
        roughness: 0.4,
        metalness: 0.25,
        envMapIntensity: 0.8,
      }),
    );
    seal.position.set(0, -ENVELOPE_HEIGHT * 0.58, 0.05);
    hinge.add(seal);

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
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      pmrem.dispose();
      shadowTexture.dispose();
      shadow.geometry.dispose();
      (shadow.material as THREE.Material).dispose();
      body.geometry.dispose();
      (body.material as THREE.Material).dispose();
      letter.geometry.dispose();
      (letter.material as THREE.Material).dispose();
      flap.geometry.dispose();
      (flap.material as THREE.Material).dispose();
      flapOutline.geometry.dispose();
      (flapOutline.material as THREE.Material).dispose();
      seal.geometry.dispose();
      (seal.material as THREE.Material).dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
});

export default Envelope3D;
