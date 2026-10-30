"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { sceneState } from "@/lib/scene";

/** Pulsing neural core: wireframe icosahedron shell, molten centre, orbit rings. */
export default function AICore(props: ThreeElements["group"]) {
  const shell = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const sats = useRef<THREE.Group>(null);

  useFrame((state, dt) => {
    if (sceneState.reducedMotion) return;
    const t = state.clock.elapsedTime;
    if (shell.current) {
      shell.current.rotation.y += dt * 0.25;
      shell.current.rotation.x += dt * 0.1;
    }
    if (core.current) core.current.scale.setScalar(1 + Math.sin(t * 2.2) * 0.08);
    if (ringA.current) ringA.current.rotation.z += dt * 0.6;
    if (ringB.current) ringB.current.rotation.x += dt * 0.45;
    if (sats.current) sats.current.rotation.y -= dt * 0.8;
  });

  return (
    <group {...props}>
      <mesh ref={shell}>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshBasicMaterial color="#00f3ff" wireframe transparent opacity={0.55} toneMapped={false} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.05, 2]} />
        <meshStandardMaterial color="#0a1424" metalness={0.8} roughness={0.2} transparent opacity={0.55} />
      </mesh>
      <mesh ref={core}>
        <sphereGeometry args={[0.5, 48, 32]} />
        <meshBasicMaterial color="#ff7a1a" toneMapped={false} />
      </mesh>
      <mesh ref={ringA} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[2, 0.012, 8, 160]} />
        <meshBasicMaterial color="#00f3ff" toneMapped={false} />
      </mesh>
      <mesh ref={ringB} rotation={[0, Math.PI / 3, 0]}>
        <torusGeometry args={[2.4, 0.01, 8, 160]} />
        <meshBasicMaterial color="#ff7700" transparent opacity={0.8} toneMapped={false} />
      </mesh>
      <group ref={sats}>
        {[0, 2.1, 4.2].map((a) => (
          <mesh key={a} position={[Math.cos(a) * 2.2, Math.sin(a * 1.3) * 0.5, Math.sin(a) * 2.2]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshBasicMaterial color="#bdfcff" toneMapped={false} />
          </mesh>
        ))}
      </group>
      <pointLight color="#ff7700" intensity={12} distance={8} />
    </group>
  );
}
