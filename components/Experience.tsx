"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { htmlPortal, sceneState, STAGE_ANCHORS, useDeviceTier, useReducedMotion } from "@/lib/scene";
import { useI18n } from "@/lib/i18n";

const Scene3D = dynamic(() => import("./three/Scene3D"), { ssr: false });

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * Maps page scroll to a continuous camera stage (0…5) using one ScrollTrigger.
 * Each anchor section reaches its stage when its top is ~35% down the viewport.
 */
function useScrollDirector() {
  useEffect(() => {
    let anchors: number[] = [];
    const measure = () => {
      const max = ScrollTrigger.maxScroll(window);
      const vh = window.innerHeight;
      anchors = STAGE_ANCHORS.map((id, i) => {
        if (i === 0) return 0;
        const el = document.getElementById(id);
        if (!el) return Infinity;
        const top = el.getBoundingClientRect().top + window.scrollY;
        return Math.min(Math.max(top - vh * 0.35, 0), max);
      });
      // keep anchors strictly increasing so the last stage is always reachable
      for (let i = 1; i < anchors.length; i++) anchors[i] = Math.max(anchors[i], anchors[i - 1] + 1);
    };
    const toStage = (y: number) => {
      for (let i = 0; i < anchors.length - 1; i++) {
        if (y < anchors[i + 1]) return i + (y - anchors[i]) / (anchors[i + 1] - anchors[i]);
      }
      return anchors.length - 1;
    };

    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onRefresh: (self) => {
        measure();
        sceneState.stage = toStage(self.scroll());
      },
      onUpdate: (self) => {
        sceneState.stage = toStage(self.scroll());
      },
    });
    measure();
    sceneState.stage = toStage(window.scrollY);
    const ro = new ResizeObserver(() => ScrollTrigger.refresh());
    ro.observe(document.body);
    return () => {
      st.kill();
      ro.disconnect();
    };
  }, []);
}

function Fallback2D() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-0 overflow-hidden bg-void">
      <div className="bg-blueprint absolute inset-0 opacity-70" />
      <div className="absolute -top-40 start-[-10%] h-[60vh] w-[60vh] rounded-full bg-cyan/15 blur-[120px]" />
      <div className="absolute bottom-[-20%] end-[-10%] h-[50vh] w-[50vh] rounded-full bg-orange/15 blur-[120px]" />
      {/* Static circuit board illustration standing in for the 3D phone */}
      <svg
        viewBox="0 0 200 400"
        className="float-y absolute top-[12vh] end-[6vw] h-[62vh] opacity-80 max-md:end-1/2 max-md:top-[8vh] max-md:h-[40vh] max-md:translate-x-1/2 max-md:opacity-40 rtl:max-md:-translate-x-1/2"
      >
        <rect x="6" y="6" width="188" height="388" rx="30" fill="#0b1422" stroke="#00f3ff" strokeOpacity=".5" />
        <rect x="22" y="24" width="70" height="70" rx="16" fill="#111a28" stroke="#2a3446" />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={[42, 42, 72][i]} cy={[44, 74, 59][i]} r="11" fill="#071a33" stroke="#00f3ff" strokeOpacity=".6" />
        ))}
        <rect x="104" y="110" width="52" height="52" rx="4" fill="#11161f" stroke="#00f3ff" />
        <text x="130" y="140" textAnchor="middle" fill="#00f3ff" fontSize="10" fontFamily="monospace">A-SoC</text>
        <rect x="34" y="150" width="34" height="28" rx="3" fill="#11161f" stroke="#ff7700" />
        <path
          d="M24 120h60v20h20M156 136h24v40M70 164h34v40h60M24 200h40v-22M120 162v60"
          stroke="#00f3ff"
          strokeOpacity=".55"
          fill="none"
          strokeWidth="1.5"
        />
        <rect x="22" y="236" width="156" height="140" rx="8" fill="#141b28" stroke="#ff7700" strokeOpacity=".5" />
        <rect x="52" y="268" width="96" height="3" fill="#ff7700" />
      </svg>
    </div>
  );
}

export default function Experience() {
  const tier = useDeviceTier();
  const { dir, t } = useI18n();
  useReducedMotion();
  useScrollDirector();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    sceneState.rtl = dir === "rtl";
  }, [dir]);

  if (tier === null) return <div aria-hidden className="fixed inset-0 bg-void" />;
  if (tier === "none")
    return (
      <>
        <Fallback2D />
        <p className="sr-only">{t.fallback}</p>
      </>
    );

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1] bg-void transition-opacity duration-700 ease-[var(--ease-out-strong)]"
        style={{ opacity: ready ? 0 : 1 }}
      />
      <Scene3D tier={tier} onReady={() => setReady(true)} />
      <div
        ref={(el) => {
          if (el) htmlPortal.current = el;
        }}
        className="pointer-events-none fixed inset-0 z-[2] overflow-hidden"
      />
    </>
  );
}
