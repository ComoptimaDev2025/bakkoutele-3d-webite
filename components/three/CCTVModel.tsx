"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { sceneState } from "@/lib/scene";

/**
 * Ceiling-style IP dome camera floating in space. The inner gimbal pans and
 * tilts while a volumetric scan cone sweeps the grid floor below.
 */
export default function CCTVModel(props: ThreeElements["group"]) {
  const root = useRef<THREE.Group>(null);
  const gimbal = useRef<THREE.Group>(null);
  const cone = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);

  const irLeds = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return [Math.cos(a) * 0.36, Math.sin(a) * 0.36] as const;
      }),
    [],
  );

  const coneGeo = useMemo(() => {
    // Apex at origin, opening along -Y after rotation
    const g = new THREE.ConeGeometry(1.5, 5.5, 48, 1, true);
    g.translate(0, -2.75, 0);
    return g;
  }, []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const still = sceneState.reducedMotion;
    const s = sceneState.stage;
    // Only spend effort sweeping when the dome is near the camera's focus
    const focus = 1 - Math.min(Math.abs(s - 2) / 1.2, 1);
    if (root.current) {
      root.current.rotation.y += still ? 0 : dt * 0.12;
      root.current.position.y = still ? 0 : Math.sin(t * 0.7) * 0.08;
    }
    if (gimbal.current) {
      gimbal.current.rotation.y = still ? 0.4 : Math.sin(t * 0.6) * 1.1;
      gimbal.current.rotation.x = still ? 0.55 : 0.55 + Math.sin(t * 0.9) * 0.18;
    }
    if (cone.current) {
      const m = cone.current.material as THREE.MeshBasicMaterial;
      m.opacity = (0.06 + (still ? 0 : Math.sin(t * 3) * 0.025)) * (0.35 + focus * 0.65);
    }
    if (ring.current) {
      const p = still ? 0.5 : (t * 0.6) % 1;
      ring.current.scale.setScalar(0.4 + p * 2.2);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.5 * focus;
    }
  });

  return (
    <group {...props}>
      <group ref={root}>
        {/* Mount base */}
        <mesh position={[0, 0.22, 0]} castShadow>
          <cylinderGeometry args={[1.05, 1.15, 0.28, 64]} />
          <meshStandardMaterial color="#d7deea" metalness={0.35} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.07, 0]}>
          <torusGeometry args={[1.02, 0.03, 12, 80]} />
          <meshBasicMaterial color="#00f3ff" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.38, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.08, 32]} />
          <meshStandardMaterial color="#9aa6b8" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Gimbal with lens + IR ring */}
        <group ref={gimbal} position={[0, -0.05, 0]}>
          <mesh>
            <sphereGeometry args={[0.62, 48, 32]} />
            <meshStandardMaterial color="#0f141d" metalness={0.7} roughness={0.25} />
          </mesh>
          <group position={[0, -0.18, 0.5]} rotation={[0.35, 0, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.28, 0.32, 0.22, 48]} />
              <meshStandardMaterial color="#05070b" metalness={0.9} roughness={0.15} />
            </mesh>
            <mesh position={[0, 0, 0.115]}>
              <circleGeometry args={[0.2, 48]} />
              <meshPhysicalMaterial color="#071a33" clearcoat={1} roughness={0.02} emissive="#00f3ff" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[0, 0, 0.118]}>
              <ringGeometry args={[0.07, 0.1, 32]} />
              <meshBasicMaterial color="#9ffcff" toneMapped={false} />
            </mesh>
            {irLeds.map(([x, y], i) => (
              <mesh key={i} position={[x * 0.75, y * 0.75, 0.1]}>
                <circleGeometry args={[0.025, 12]} />
                <meshBasicMaterial color="#ff7700" toneMapped={false} />
              </mesh>
            ))}
            {/* scan cone along the lens axis */}
            <mesh ref={cone} geometry={coneGeo} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
              <meshBasicMaterial
                color="#00f3ff"
                transparent
                opacity={0.08}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        </group>

        {/* Smoked acrylic dome */}
        <mesh position={[0, 0.08, 0]} rotation={[Math.PI, 0, 0]} raycast={() => null}>
          <sphereGeometry args={[0.95, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial
            color="#203248"
            transparent
            opacity={0.28}
            roughness={0.04}
            metalness={0.1}
            clearcoat={1}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
          <Edges color="#00f3ff" threshold={30} />
        </mesh>
      </group>

      {/* Detection ring on the floor */}
      <mesh ref={ring} position={[0, -3.48, 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.95, 1, 64]} />
        <meshBasicMaterial color="#00f3ff" transparent opacity={0.4} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}
