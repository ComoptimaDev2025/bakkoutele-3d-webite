"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Grid, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import MotherboardModel from "./MotherboardModel";
import CCTVModel from "./CCTVModel";
import AICore from "./AICore";
import LabScene from "./LabScene";
import { makeDotSprite } from "./textures";
import { sceneState, type DeviceTier } from "@/lib/scene";

type V3 = [number, number, number];
/** Camera keyframes per stage: [position, look-at, horizontal UI-avoidance factor]. */
const KEYS: { pos: V3; target: V3; shift: number }[] = [
  { pos: [0, 0.2, 7.2], target: [0, 0, 0], shift: 1 }, // hero: phone
  { pos: [0, 1.3, 10.2], target: [0, 0.1, 0], shift: 1.2 }, // module A: exploded phone
  { pos: [9, 2.6, -2.6], target: [9, -0.4, -12], shift: 1.7 }, // module B: CCTV dome
  { pos: [-9, 1.2, -15], target: [-9, 0.4, -24], shift: 1.1 }, // Bakkou AI core
  { pos: [0, 8, -21], target: [0, -1.5, -36], shift: 0 }, // store: lab platform
  { pos: [0, 9, -39], target: [0, -2.6, -52], shift: 0 }, // contact: aerial over the grid
];

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

function CameraRig() {
  const { camera, size } = useThree();
  const pos = useMemo(() => new THREE.Vector3(), []);
  const tgt = useMemo(() => new THREE.Vector3(), []);
  const look = useRef(new THREE.Vector3(0, 0, 0));
  const a = useMemo(() => new THREE.Vector3(), []);
  const b = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const s = THREE.MathUtils.clamp(sceneState.stage, 0, KEYS.length - 1);
    const i = Math.min(Math.floor(s), KEYS.length - 2);
    const f = ease(s - i);
    const k0 = KEYS[i];
    const k1 = KEYS[i + 1];

    pos.copy(a.fromArray(k0.pos)).lerp(b.fromArray(k1.pos), f);
    tgt.copy(a.fromArray(k0.target)).lerp(b.fromArray(k1.target), f);

    // Desktop: slide the subject away from the text column (text sits on the inline-start side).
    const aspect = size.width / size.height;
    const shift = THREE.MathUtils.lerp(k0.shift, k1.shift, f);
    if (aspect > 1.05) {
      const amount = Math.min(2.1, (aspect - 1) * 2.6) * shift * (sceneState.rtl ? 1 : -1);
      pos.x += amount;
      tgt.x += amount;
    } else {
      // Portrait: pull back and lift the subject into the upper half above the copy.
      const back = a.copy(pos).sub(tgt).normalize().multiplyScalar(5.6 * (1 - aspect * 0.4));
      pos.add(back);
      tgt.y -= 1.5;
    }

    // subtle parallax from the pointer
    if (!sceneState.reducedMotion) {
      pos.x += state.pointer.x * 0.25;
      pos.y += state.pointer.y * 0.15;
    }

    const k = 1 - Math.exp(-dt * 3.2);
    camera.position.lerp(pos, k);
    look.current.lerp(tgt, k);
    camera.lookAt(look.current);
  });
  return null;
}

/** Renders children only while the scroll stage is inside [from, to] (saves fill-rate, avoids clutter). */
function StageGroup({ from, to, children }: { from: number; to: number; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.visible = sceneState.stage >= from && sceneState.stage <= to;
  });
  return <group ref={ref}>{children}</group>;
}

function Particles({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const sprite = useMemo(() => makeDotSprite(), []);
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 44;
      positions[i * 3 + 1] = -2.5 + Math.random() * 13;
      positions[i * 3 + 2] = 10 - Math.random() * 70;
      speeds[i] = 0.05 + Math.random() * 0.2;
    }
    return { positions, speeds };
  }, [count]);

  useEffect(() => () => sprite.dispose(), [sprite]);

  useFrame((_, dt) => {
    if (sceneState.reducedMotion || !ref.current) return;
    const attr = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      let y = arr[i * 3 + 1] + speeds[i] * dt;
      if (y > 10.5) y = -2.5;
      arr[i * 3 + 1] = y;
    }
    attr.needsUpdate = true;
    ref.current.rotation.y += dt * 0.004;
  });

  return (
    <points ref={ref} raycast={() => null}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={sprite}
        size={0.07}
        sizeAttenuation
        color="#8ff8ff"
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function Scene3D({ tier, onReady }: { tier: Exclude<DeviceTier, "none">; onReady?: () => void }) {
  const [degraded, setDegraded] = useState(tier === "low");
  const high = !degraded;

  return (
    <Canvas
      className="!fixed inset-0 !h-[100lvh] !w-full"
      style={{ position: "fixed" }}
      eventSource={typeof document !== "undefined" ? document.body : undefined}
      eventPrefix="client"
      dpr={high ? [1, 1.75] : 1}
      camera={{ position: [0, 0.2, 7.2], fov: 40, near: 0.1, far: 120 }}
      gl={{ antialias: !high, powerPreference: "high-performance", alpha: false, stencil: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        onReady?.();
      }}
      aria-hidden
    >
      <PerformanceMonitor onDecline={() => setDegraded(true)} flipflops={2} />
      <color attach="background" args={["#050814"]} />
      <fog attach="fog" args={["#050814", 12, 40]} />

      <ambientLight intensity={0.35} color="#9fb8ff" />
      <directionalLight position={[5, 8, 6]} intensity={1.3} color="#dbeaff" />
      <pointLight position={[-3.5, 2, 3]} color="#00f3ff" intensity={30} distance={16} />
      <pointLight position={[3.5, -1.5, 2.5]} color="#ff7700" intensity={9} distance={12} />
      <pointLight position={[11, 3, -9]} color="#00f3ff" intensity={30} distance={14} />

      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3} color="#bff8ff" position={[0, 4, 5]} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={2} color="#ff9a4a" position={[-6, 0, -2]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
        <Lightformer form="ring" intensity={2} color="#00f3ff" position={[6, 2, 0]} rotation-y={-Math.PI / 2} scale={3} />
      </Environment>

      <Suspense fallback={null}>
        <StageGroup from={-1} to={2.2}>
          <MotherboardModel lowDetail={!high} />
        </StageGroup>
        <StageGroup from={1.5} to={3.2}>
          <CCTVModel position={[9, 0.9, -12]} />
        </StageGroup>
        <StageGroup from={2.1} to={4.3}>
          <AICore position={[-9, 0.4, -24]} />
        </StageGroup>
        <StageGroup from={3.3} to={9}>
          <LabScene position={[0, -1, -36]} />
        </StageGroup>
      </Suspense>

      <Grid
        position={[0, -2.6, 0]}
        infiniteGrid
        cellSize={0.6}
        cellThickness={0.6}
        cellColor="#0f3b4d"
        sectionSize={3}
        sectionThickness={1.1}
        sectionColor="#00b8d4"
        fadeDistance={45}
        fadeStrength={1.6}
        followCamera
      />
      <Particles count={high ? 1400 : 500} />
      <CameraRig />

      {high && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.55} luminanceSmoothing={0.25} />
          <Vignette eskil={false} offset={0.2} darkness={0.75} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
