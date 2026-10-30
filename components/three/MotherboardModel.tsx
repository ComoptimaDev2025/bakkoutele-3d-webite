"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Edges, Html, RoundedBox, useCursor } from "@react-three/drei";
import { makeBoardTextures, makeChipLabel, mulberry32 } from "./textures";
import { htmlPortal, sceneState } from "@/lib/scene";
import { useI18n } from "@/lib/i18n";

type PartId = "cpu" | "pmic" | "nand" | "camera" | "battery";
type LayerId = "glass" | "camera" | "board" | "battery" | "frame" | "display";

const W = 2.0;
const H = 4.1;

/** Resting z and exploded z-offset for each layer (phone back faces the camera). */
const LAYERS: Record<LayerId, { z: number; off: number }> = {
  glass: { z: 0.17, off: 1.55 },
  camera: { z: 0.2, off: 1.05 },
  board: { z: 0.06, off: 0.5 },
  battery: { z: 0.03, off: 0 },
  frame: { z: 0, off: -0.45 },
  display: { z: -0.17, off: -1.05 },
};

const smooth = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function Chip({
  id,
  size,
  position,
  label,
  hovered,
  selected,
  onHover,
  onSelect,
}: {
  id: PartId;
  size: [number, number, number];
  position: [number, number, number];
  label: THREE.Texture;
  hovered: boolean;
  selected: boolean;
  onHover: (id: PartId | null) => void;
  onSelect: (id: PartId) => void;
}) {
  const active = hovered || selected;
  return (
    <group position={position}>
      <mesh
        castShadow
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onHover(id);
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect(id);
        }}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color="#11161f"
          metalness={0.6}
          roughness={0.35}
          emissive={active ? "#00f3ff" : "#0a2a33"}
          emissiveIntensity={active ? 0.55 : 0.15}
        />
        {active && <Edges color="#00f3ff" />}
      </mesh>
      <mesh position={[0, 0, size[2] / 2 + 0.002]}>
        <planeGeometry args={[size[0] * 0.92, size[1] * 0.92]} />
        <meshStandardMaterial map={label} emissiveMap={label} emissive="#ffffff" emissiveIntensity={active ? 0.9 : 0.35} />
      </mesh>
    </group>
  );
}

export default function MotherboardModel({ lowDetail = false }: { lowDetail?: boolean }) {
  const { t } = useI18n();
  const root = useRef<THREE.Group>(null);
  const layerRefs = useRef<Partial<Record<LayerId, THREE.Group>>>({});
  const layerLabels = useRef<Partial<Record<LayerId, HTMLDivElement>>>({});
  const [hovered, setHovered] = useState<PartId | null>(null);
  const [selected, setSelected] = useState<PartId | null>(null);
  useCursor(!!hovered);

  const board = useMemo(() => makeBoardTextures(lowDetail ? 512 : 1024), [lowDetail]);
  const labels = useMemo(
    () => ({
      cpu: makeChipLabel("A-SoC", "BAKKOU"),
      pmic: makeChipLabel("PMIC", "343S", "#ff7700"),
      nand: makeChipLabel("NAND", "256GB"),
    }),
    [],
  );
  const frameGeo = useMemo(() => {
    const outer = roundedRect(W + 0.06, H + 0.06, 0.32);
    outer.holes.push(roundedRect(W - 0.08, H - 0.08, 0.26) as unknown as THREE.Path);
    const g = new THREE.ExtrudeGeometry(outer, { depth: 0.34, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3, curveSegments: 16 });
    g.translate(0, 0, -0.17);
    return g;
  }, []);

  const panelGeo = useMemo(() => new THREE.ShapeGeometry(roundedRect(W, H, 0.3), 16), []);

  // Passive SMD components scattered on the board
  const smd = useMemo(() => {
    const rand = mulberry32(7);
    const count = lowDetail ? 70 : 170;
    const mats: THREE.Matrix4[] = [];
    const m = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const x = (rand() - 0.5) * 1.6;
      const y = (rand() - 0.5) * 1.55;
      // keep chip footprints clear
      if (Math.abs(x - 0.25) < 0.36 && Math.abs(y - 0.12) < 0.36) continue;
      if (Math.abs(x + 0.5) < 0.24 && Math.abs(y + 0.45) < 0.22) continue;
      if (Math.abs(x - 0.45) < 0.3 && Math.abs(y + 0.5) < 0.2) continue;
      const s = 0.4 + rand() * 0.9;
      m.compose(
        new THREE.Vector3(x, y, 0.035),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rand() > 0.5 ? 0 : Math.PI / 2),
        new THREE.Vector3(s, s, s),
      );
      mats.push(m.clone());
    }
    return mats;
  }, [lowDetail]);
  const smdRef = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const mesh = smdRef.current;
    if (!mesh) return;
    smd.forEach((mat, i) => mesh.setMatrixAt(i, mat));
    mesh.instanceMatrix.needsUpdate = true;
  }, [smd]);

  useEffect(
    () => () => {
      board.map.dispose();
      board.emissiveMap.dispose();
      Object.values(labels).forEach((l) => l.dispose());
      frameGeo.dispose();
      panelGeo.dispose();
    },
    [board, labels, frameGeo, panelGeo],
  );

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;
    const s = sceneState.stage;
    const explode = smooth(0.25, 1.0, s) * (1 - smooth(1.55, 2.1, s));
    const time = state.clock.elapsedTime;
    const still = sceneState.reducedMotion;
    // portrait screens get a gentler turn so the exploded stack stays in frame
    const side = (sceneState.rtl ? 1 : -1) * (state.size.width < state.size.height ? 0.55 : 1);

    const idleY = still ? 0 : Math.sin(time * 0.35) * 0.32;
    const targetY = THREE.MathUtils.lerp(idleY + state.pointer.x * 0.35, side * 0.8, explode);
    const targetX = THREE.MathUtils.lerp(-state.pointer.y * 0.22, 0.28, explode);
    const k = 1 - Math.exp(-dt * 4);
    g.rotation.y += (targetY - g.rotation.y) * k;
    g.rotation.x += (targetX - g.rotation.x) * k;
    g.rotation.z = THREE.MathUtils.lerp(still ? 0 : Math.sin(time * 0.5) * 0.04, 0, explode);
    g.position.y = still ? 0 : Math.sin(time * 0.8) * 0.06;

    (Object.keys(LAYERS) as LayerId[]).forEach((id) => {
      const ref = layerRefs.current[id];
      if (ref) ref.position.z = LAYERS[id].z + LAYERS[id].off * explode;
      const label = layerLabels.current[id];
      if (label) label.style.opacity = String(smooth(0.6, 0.95, explode) * (1 - smooth(1.5, 1.8, s)));
    });
  });

  const select = (id: PartId) => setSelected((cur) => (cur === id ? null : id));
  const chipProps = (id: PartId) => ({
    id,
    hovered: hovered === id,
    selected: selected === id,
    onHover: setHovered,
    onSelect: select,
  });

  const layerLabel = (id: LayerId, text: string, pos: [number, number, number]) => (
    <Html portal={htmlPortal} position={pos} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      <div
        ref={(el) => {
          if (el) layerLabels.current[id] = el;
        }}
        className="label-tech whitespace-nowrap rounded-md border border-cyan/40 bg-void/85 px-2.5 py-1 text-[11px] text-cyan opacity-0"
      >
        {text}
      </div>
    </Html>
  );

  const callout = (id: PartId, pos: [number, number, number]) =>
    selected === id && (
      <Html portal={htmlPortal} position={pos} zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
        <div className="glass-strong hud w-56 -translate-y-full rounded-lg p-3 text-start shadow-[0_0_28px_-6px_oklch(0.885_0.152_197/0.55)]">
          <p className="font-display text-sm font-semibold text-cyan">{t.parts[id].name}</p>
          <p className="mt-1 text-xs leading-relaxed text-mute">{t.parts[id].info}</p>
        </div>
      </Html>
    );

  return (
    <group ref={root} scale={0.92} onPointerMissed={() => setSelected(null)}>
      {/* Display (front of the phone, facing away) */}
      <group ref={(el) => void (el && (layerRefs.current.display = el))}>
        <mesh geometry={panelGeo} rotation={[0, Math.PI, 0]}>
          <meshStandardMaterial color="#050a12" emissive="#00b8d4" emissiveIntensity={0.25} roughness={0.15} side={THREE.DoubleSide} />
        </mesh>
        {layerLabel("display", t.training.moduleA.layers.display, [0.75, -2.95, 0])}
      </group>

      {/* Titanium frame */}
      <group ref={(el) => void (el && (layerRefs.current.frame = el))}>
        <mesh geometry={frameGeo} castShadow>
          <meshStandardMaterial color="#2a3446" metalness={0.95} roughness={0.28} />
        </mesh>
        {/* inner chassis plate hides the display from behind */}
        <mesh geometry={panelGeo} position={[0, 0, -0.06]} scale={0.985}>
          <meshStandardMaterial color="#121822" metalness={0.85} roughness={0.4} />
        </mesh>
      </group>

      {/* Battery */}
      <group ref={(el) => void (el && (layerRefs.current.battery = el))} position={[0, -0.98, 0]}>
        <RoundedBox
          args={[1.62, 1.95, 0.07]}
          radius={0.03}
          smoothness={2}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered("battery");
          }}
          onPointerOut={() => setHovered(null)}
          onClick={(e) => {
            e.stopPropagation();
            select("battery");
          }}
        >
          <meshStandardMaterial
            color="#3a4352"
            metalness={0.8}
            roughness={0.3}
            emissive="#ff7700"
            emissiveIntensity={hovered === "battery" || selected === "battery" ? 0.35 : 0}
          />
        </RoundedBox>
        <mesh position={[0, 0.35, 0.04]}>
          <planeGeometry args={[1.2, 0.05]} />
          <meshBasicMaterial color="#ff7700" toneMapped={false} />
        </mesh>
        {callout("battery", [0.3, 0.4, 0.1])}
        {layerLabel("battery", t.training.moduleA.layers.battery, [1.05, -0.55, 0])}
      </group>

      {/* Logic board */}
      <group ref={(el) => void (el && (layerRefs.current.board = el))} position={[0, 0.98, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[1.8, 1.75, 0.04]} />
          <meshStandardMaterial
            map={board.map}
            emissiveMap={board.emissiveMap}
            emissive="#ffffff"
            emissiveIntensity={1.4}
            roughness={0.55}
            metalness={0.25}
          />
        </mesh>
        <instancedMesh ref={smdRef} args={[undefined, undefined, smd.length]} castShadow>
          <boxGeometry args={[0.05, 0.026, 0.026]} />
          <meshStandardMaterial color="#8a6b3a" metalness={0.7} roughness={0.4} />
        </instancedMesh>
        <Chip {...chipProps("cpu")} size={[0.56, 0.56, 0.07]} position={[0.25, 0.12, 0.055]} label={labels.cpu} />
        <Chip {...chipProps("pmic")} size={[0.36, 0.32, 0.05]} position={[-0.5, -0.45, 0.045]} label={labels.pmic} />
        <Chip {...chipProps("nand")} size={[0.48, 0.3, 0.05]} position={[0.45, -0.5, 0.045]} label={labels.nand} />
        {callout("cpu", [0.4, 0.3, 0.12])}
        {callout("pmic", [-0.4, -0.3, 0.12])}
        {callout("nand", [0.55, -0.35, 0.12])}
        {layerLabel("board", t.training.moduleA.layers.board, [1.0, 0.75, 0])}
      </group>

      {/* Rear camera module */}
      <group ref={(el) => void (el && (layerRefs.current.camera = el))} position={[-0.43, 1.45, 0]}>
        <RoundedBox
          args={[0.92, 0.92, 0.08]}
          radius={0.18}
          smoothness={3}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered("camera");
          }}
          onPointerOut={() => setHovered(null)}
          onClick={(e) => {
            e.stopPropagation();
            select("camera");
          }}
        >
          <meshStandardMaterial color="#1a2130" metalness={0.85} roughness={0.2} />
          {(hovered === "camera" || selected === "camera") && <Edges color="#00f3ff" threshold={20} />}
        </RoundedBox>
        {(
          [
            [-0.2, 0.2],
            [-0.2, -0.2],
            [0.2, 0.0],
          ] as const
        ).map(([x, y], i) => (
          <group key={i} position={[x, y, 0.06]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.16, 0.17, 0.08, 40]} />
              <meshStandardMaterial color="#0b0f16" metalness={0.9} roughness={0.15} />
            </mesh>
            <mesh position={[0, 0, 0.042]}>
              <circleGeometry args={[0.11, 40]} />
              <meshPhysicalMaterial
                color="#0a1530"
                metalness={0.2}
                roughness={0.05}
                clearcoat={1}
                emissive="#00f3ff"
                emissiveIntensity={hovered === "camera" || selected === "camera" ? 0.6 : 0.12}
              />
            </mesh>
          </group>
        ))}
        <mesh position={[0.22, 0.3, 0.05]}>
          <circleGeometry args={[0.05, 24]} />
          <meshBasicMaterial color="#ffb070" toneMapped={false} />
        </mesh>
        {callout("camera", [0.25, 0.35, 0.15])}
        {layerLabel("camera", t.training.moduleA.layers.camera, [-1.0, 0.1, 0])}
      </group>

      {/* Smoked back glass */}
      <group ref={(el) => void (el && (layerRefs.current.glass = el))}>
        <mesh geometry={panelGeo} raycast={() => null}>
          <meshPhysicalMaterial
            color="#0c1c2c"
            transparent
            opacity={0.18}
            roughness={0.05}
            metalness={0.1}
            clearcoat={1}
            depthWrite={false}
          />
          <Edges color="#00f3ff" threshold={1} />
        </mesh>
        {layerLabel("glass", t.training.moduleA.layers.glass, [-0.8, -2.2, 0])}
      </group>
    </group>
  );
}
