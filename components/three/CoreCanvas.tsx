"use client";

import { Canvas } from "@react-three/fiber";
import AICore from "./AICore";

/** Small standalone hologram of the AI core for the diagnostics header. */
export default function CoreCanvas() {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 6.5], fov: 40 }} gl={{ alpha: true, antialias: true }} aria-hidden>
      <ambientLight intensity={0.4} />
      <AICore />
    </Canvas>
  );
}
