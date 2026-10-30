"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { sceneState } from "@/lib/scene";

const TOOLS = [
  { geo: <boxGeometry args={[0.9, 0.6, 0.6]} />, color: "#ff7700" },
  { geo: <cylinderGeometry args={[0.3, 0.45, 1, 20]} />, color: "#00f3ff" },
  { geo: <torusKnotGeometry args={[0.35, 0.1, 80, 12]} />, color: "#00f3ff" },
  { geo: <octahedronGeometry args={[0.55]} />, color: "#ff7700" },
  { geo: <coneGeometry args={[0.45, 0.9, 6]} />, color: "#00f3ff" },
  { geo: <dodecahedronGeometry args={[0.5]} />, color: "#ff7700" },
];

/** Training lab platform: holographic tool silhouettes orbiting a light pillar. */
export default function LabScene(props: ThreeElements["group"]) {
  const orbit = useRef<THREE.Group>(null);
  const items = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state, dt) => {
    if (sceneState.reducedMotion) return;
    const t = state.clock.elapsedTime;
    if (orbit.current) orbit.current.rotation.y += dt * 0.12;
    items.current.forEach((m, i) => {
      if (!m) return;
      m.rotation.y += dt * 0.5;
      m.rotation.x += dt * 0.2;
      m.position.y = 0.9 + Math.sin(t * 1.1 + i) * 0.2;
    });
  });

  return (
    <group {...props}>
      <mesh position={[0, -1.55, 0]} receiveShadow>
        <cylinderGeometry args={[6, 6.2, 0.12, 96]} />
        <meshStandardMaterial color="#0a1220" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0, -1.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.85, 6, 128]} />
        <meshBasicMaterial color="#00f3ff" toneMapped={false} />
      </mesh>
      <mesh position={[0, -1.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.4, 2.45, 96]} />
        <meshBasicMaterial color="#ff7700" toneMapped={false} />
      </mesh>
      {/* light pillar */}
      <mesh position={[0, 1.5, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.5, 0.9, 6, 32, 1, true]} />
        <meshBasicMaterial
          color="#00f3ff"
          transparent
          opacity={0.07}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <group ref={orbit}>
        {TOOLS.map((tool, i) => {
          const a = (i / TOOLS.length) * Math.PI * 2;
          return (
            <mesh
              key={i}
              ref={(el) => {
                items.current[i] = el;
              }}
              position={[Math.cos(a) * 4, 0.9, Math.sin(a) * 4]}
            >
              {tool.geo}
              <meshBasicMaterial color={tool.color} wireframe transparent opacity={0.75} toneMapped={false} />
            </mesh>
          );
        })}
      </group>
      <pointLight position={[0, 2, 0]} color="#00f3ff" intensity={20} distance={14} />
    </group>
  );
}
