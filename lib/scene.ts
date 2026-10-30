"use client";

import { useEffect, useState } from "react";

/**
 * Mutable scene state shared between the DOM (GSAP ScrollTrigger) and the
 * R3F render loop. Kept outside React so scrolling never triggers re-renders.
 */
export const sceneState = {
  /** Float stage: 0 = hero, 1 = phone exploded, 2 = CCTV, 3 = AI core, 4 = store lab, 5 = contact */
  stage: 0,
  rtl: true,
  reducedMotion: false,
};

/**
 * Fixed, clipped overlay that drei <Html> callouts portal into. Without it they
 * mount on the event source (document.body) and scroll with the page.
 */
export const htmlPortal: { current: HTMLElement } = { current: null as unknown as HTMLElement };

/** DOM ids that anchor each camera stage, in scroll order. */
export const STAGE_ANCHORS = ["hero", "module-phone", "module-cctv", "ai", "store", "contact"] as const;

export type DeviceTier = "high" | "low" | "none";

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * high: full scene with bloom. low: fewer particles, no post-processing, dpr 1.
 * none: no WebGL (or forced with ?2d / Save-Data) → 2D fallback.
 */
export function useDeviceTier(): DeviceTier | null {
  const [tier, setTier] = useState<DeviceTier | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    if (params.has("2d") || nav.connection?.saveData || !hasWebGL()) {
      setTier("none");
      return;
    }
    const cores = nav.hardwareConcurrency ?? 4;
    const memory = nav.deviceMemory ?? 8;
    const small = window.matchMedia("(max-width: 767px)").matches;
    setTier(params.has("low") || cores <= 4 || memory <= 4 || small ? "low" : "high");
  }, []);

  return tier;
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReduced(mq.matches);
      sceneState.reducedMotion = mq.matches;
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}
