import * as THREE from "three";

/** Seeded PRNG so the procedural board looks identical on every load. */
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Procedural PCB: dark solder mask with orthogonal copper traces and vias.
 * Returns a diffuse map and a matching emissive map (traces only) for bloom.
 */
export function makeBoardTextures(size = 1024) {
  const rand = mulberry32(28);
  const base = document.createElement("canvas");
  const glow = document.createElement("canvas");
  base.width = base.height = glow.width = glow.height = size;
  const b = base.getContext("2d")!;
  const g = glow.getContext("2d")!;

  b.fillStyle = "#07121c";
  b.fillRect(0, 0, size, size);
  g.fillStyle = "#000";
  g.fillRect(0, 0, size, size);

  // fine silkscreen grid
  b.strokeStyle = "rgba(80,140,170,0.07)";
  b.lineWidth = 1;
  for (let i = 0; i < size; i += 16) {
    b.beginPath();
    b.moveTo(i, 0);
    b.lineTo(i, size);
    b.moveTo(0, i);
    b.lineTo(size, i);
    b.stroke();
  }

  const step = 12;
  for (let n = 0; n < 230; n++) {
    let x = Math.round((rand() * size) / step) * step;
    let y = Math.round((rand() * size) / step) * step;
    const bright = rand() > 0.82;
    const w = bright ? 2.5 : 1.5 + rand() * 1.5;
    b.strokeStyle = bright ? "rgba(0,243,255,0.9)" : "rgba(40,170,190,0.45)";
    g.strokeStyle = bright ? "rgba(0,243,255,1)" : "rgba(0,120,140,0.35)";
    b.lineWidth = g.lineWidth = w;
    b.beginPath();
    g.beginPath();
    b.moveTo(x, y);
    g.moveTo(x, y);
    const segs = 2 + Math.floor(rand() * 4);
    for (let s = 0; s < segs; s++) {
      const len = (3 + Math.floor(rand() * 14)) * step;
      const dir = Math.floor(rand() * 4);
      // 45° jogs read as real routing
      if (rand() > 0.7) {
        x += dir % 2 ? len * 0.5 : -len * 0.5;
        y += dir > 1 ? len * 0.5 : -len * 0.5;
      } else if (dir === 0) x += len;
      else if (dir === 1) x -= len;
      else if (dir === 2) y += len;
      else y -= len;
      b.lineTo(x, y);
      g.lineTo(x, y);
    }
    b.stroke();
    g.stroke();
    // via at trace end
    b.fillStyle = "#c9a227";
    b.beginPath();
    b.arc(x, y, w + 2, 0, Math.PI * 2);
    b.fill();
    if (bright) {
      g.fillStyle = "#00f3ff";
      g.beginPath();
      g.arc(x, y, w + 2, 0, Math.PI * 2);
      g.fill();
    }
  }

  const map = new THREE.CanvasTexture(base);
  const emissiveMap = new THREE.CanvasTexture(glow);
  map.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = emissiveMap.anisotropy = 4;
  return { map, emissiveMap };
}

/** Chip top marking, e.g. "A17 / BAKKOU". */
export function makeChipLabel(top: string, bottom: string, accent = "#00f3ff") {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d")!;
  x.fillStyle = "#0d1117";
  x.fillRect(0, 0, 256, 256);
  x.strokeStyle = "rgba(255,255,255,0.08)";
  x.strokeRect(10, 10, 236, 236);
  x.fillStyle = accent;
  x.font = "700 54px monospace";
  x.textAlign = "center";
  x.fillText(top, 128, 128);
  x.fillStyle = "rgba(200,215,230,0.55)";
  x.font = "500 22px monospace";
  x.fillText(bottom, 128, 172);
  x.beginPath();
  x.arc(34, 34, 8, 0, Math.PI * 2);
  x.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Soft round sprite for particles (avoids square GL points). */
export function makeDotSprite() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d")!;
  const grd = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.35, "rgba(255,255,255,0.55)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = grd;
  x.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
