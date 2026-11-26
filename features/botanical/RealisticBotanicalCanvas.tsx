'use client';

import { useEffect, useRef, useState } from 'react';
import { INITIAL_SEAGULLS } from './constants';
import { EnvironmentLayer } from './EnvironmentLayer';
import { computeEnvironmentState } from './seasonEnvironment';
import { getSpeciesConfig } from './species';
import { TreeLayer } from './TreeLayer';
import { buildSeagullPath } from './treeGeometry';
import type { SeagullAgent, SpeciesId } from './types';
import { clamp, getGrowthStageMeta, getTreeBaseX, tintForTime } from './utils';

type Props = {
  days: number;
  isWateredToday: boolean;
  simulatedDate?: Date | null;
  /** 樹種。育て始めた季節で決まるので、表示中の日付からは決めない */
  speciesId: SpeciesId;
};

export function RealisticBotanicalCanvas({
  days,
  isWateredToday,
  simulatedDate = null,
  speciesId,
}: Props) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeDate = simulatedDate ?? now;
  const displayTimeText = activeDate
    ? `${String(activeDate.getHours()).padStart(2, '0')}:${String(activeDate.getMinutes()).padStart(2, '0')}`
    : null;

  const env = computeEnvironmentState(activeDate);
  const resolvedSpeciesId: SpeciesId = speciesId;
  const species = getSpeciesConfig(resolvedSpeciesId);
  const growthMeta = getGrowthStageMeta(days, resolvedSpeciesId);

  const cycle = days === 0 ? 1 : Math.floor((days - 1) / 360) + 1;
  const cd = days === 0 ? 0 : ((days - 1) % 360) + 1;
  // 木は一生同じ場所に立ち、次の世代は切り株の隣から芽吹く
  const treeBaseX = getTreeBaseX(cycle);
  const bark = species.getBarkPalette(cd, env);

  const gullGroupRefs = useRef<(SVGGElement | null)[]>([]);
  const gullPathRefs = useRef<(SVGPathElement | null)[]>([]);
  const gullsRef = useRef<SeagullAgent[]>(INITIAL_SEAGULLS.map((g) => ({ ...g })));

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const step = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      const tSec = time / 1000;

      const gulls = gullsRef.current;
      for (let i = 0; i < gulls.length; i++) {
        const g = gulls[i];

        g.turnCooldown -= dt;
        if (g.x < 34 && g.dir === -1) {
          g.dir = 1;
          g.turnCooldown = 8 + ((Math.sin(tSec + g.seed) + 1) * 0.5) * 8;
        } else if (g.x > 486 && g.dir === 1) {
          g.dir = -1;
          g.turnCooldown = 8 + ((Math.cos(tSec + g.seed) + 1) * 0.5) * 8;
        } else if (g.turnCooldown <= 0) {
          g.dir = g.dir === 1 ? -1 : 1;
          g.turnCooldown = 9 + ((Math.sin(tSec * 1.3 + g.seed) + 1) * 0.5) * 10;
          g.isGliding = false;
          g.glideCooldown = 1.4;
        }

        const windDrift =
          Math.sin(tSec * 0.42 + g.seed) * 3.2 + Math.cos(tSec * 0.19 + g.seed * 1.7) * 2.4;
        const desiredVx = g.dir * g.cruiseSpeed + windDrift;
        g.vx += (desiredVx - g.vx) * Math.min(1, dt * 0.9);

        g.baseY = clamp(
          g.baseY + Math.sin(tSec * 0.28 + g.seed * 2.1) * 4.2 * dt,
          36,
          132
        );
        const targetY =
          g.baseY +
          Math.sin(tSec * 0.85 + g.seed) * 9 +
          Math.cos(tSec * 0.47 + g.seed * 1.4) * 6;
        const desiredVy = (targetY - g.y) * 1.1;
        g.vy += (desiredVy - g.vy) * Math.min(1, dt * 1.8);

        g.x += g.vx * dt;
        g.y = clamp(g.y + g.vy * dt, 26, 146);

        g.glideCooldown -= dt;
        if (g.glideCooldown <= 0) {
          g.isGliding = !g.isGliding;
          g.glideCooldown = g.isGliding
            ? 2.0 + ((Math.sin(tSec + g.seed) + 1) * 0.5) * 2.5
            : 1.4 + ((Math.cos(tSec + g.seed) + 1) * 0.5) * 1.8;
        }

        const activeFlapping = !g.isGliding || g.vy < -3.2;
        let wingPos = -0.22;
        if (activeFlapping) {
          g.flapPhase += g.flapRate * dt;
          wingPos = Math.sin(g.flapPhase) * 0.92;
        } else {
          const targetPhase = Math.round(g.flapPhase / (Math.PI * 2)) * Math.PI * 2 - 0.25;
          g.flapPhase += (targetPhase - g.flapPhase) * Math.min(1, dt * 4);
          wingPos = -0.22 + Math.sin(tSec * 2.1 + g.seed) * 0.06;
        }

        const tiltDeg = clamp(g.vy * 1.15 + (g.vx / g.cruiseSpeed) * 4, -18, 18);
        const bankSkew = clamp(g.vx / g.cruiseSpeed, -1, 1);

        const groupEl = gullGroupRefs.current[i];
        const pathEl = gullPathRefs.current[i];
        if (groupEl) {
          groupEl.setAttribute(
            'transform',
            `translate(${g.x.toFixed(1)}, ${g.y.toFixed(1)}) rotate(${tiltDeg.toFixed(1)}) scale(${g.scale})`
          );
        }
        if (pathEl) {
          pathEl.setAttribute('d', buildSeagullPath(wingPos, bankSkew));
        }
      }

      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden transition-colors duration-700"
      style={{
        background: `linear-gradient(180deg, ${env.skyFrom} 0%, ${env.skyTo} 100%)`,
      }}
    >
      <style>{`
        @keyframes mountainTreeSway {
          0%, 100% { transform: rotate(-1.15deg); }
          50% { transform: rotate(1.35deg); }
        }
        @keyframes leafSway {
          0%, 100% { transform: rotate(calc(var(--sway-amp, 1.4deg) * -0.7)); }
          50% { transform: rotate(var(--sway-amp, 1.4deg)); }
        }
        @keyframes mistDrift {
          0%, 100% { transform: translateX(-10px); }
          50% { transform: translateX(12px); }
        }
        @keyframes petalFallA {
          0% { transform: translate(0px, 0px) rotate(0deg); opacity: 0; }
          15% { opacity: 0.92; }
          85% { opacity: 0.85; }
          100% { transform: translate(-36px, 92px) rotate(140deg); opacity: 0; }
        }
        @keyframes petalFallB {
          0% { transform: translate(0px, 0px) rotate(0deg); opacity: 0; }
          20% { opacity: 0.88; }
          80% { opacity: 0.82; }
          100% { transform: translate(-24px, 104px) rotate(-120deg); opacity: 0; }
        }
        @keyframes sunPulse {
          0%, 100% { opacity: 0.26; }
          50% { opacity: 0.48; }
        }
        @keyframes butterflyHover {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(7px, -7px) scale(1.06); }
        }
        @keyframes waterShimmer {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.9; }
        }
        .mountain-tree-sway {
          animation: mountainTreeSway 6.2s ease-in-out infinite;
          transform-origin: 0px 0px;
        }
        .leaf-sway,
        .leaf-flutter {
          animation-name: leafSway;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        /* 落ちていくもの：外側が道すじ、内側が舞い方 */
        @keyframes fallFlutter {
          0% { transform: translate(0px, 0px); opacity: 0; }
          6% { opacity: 1; }
          18% { transform: translate(calc(var(--drift) * 0.55), calc(var(--drop) * 0.14)); }
          34% { transform: translate(calc(var(--drift) * -0.35), calc(var(--drop) * 0.32)); }
          50% { transform: translate(calc(var(--drift) * 0.45), calc(var(--drop) * 0.5)); }
          66% { transform: translate(calc(var(--drift) * -0.25), calc(var(--drop) * 0.68)); }
          80% { transform: translate(calc(var(--drift) * 0.2), var(--drop)); }
          90% { transform: translate(calc(var(--drift) * 0.2), var(--drop)); opacity: 1; }
          100% { transform: translate(calc(var(--drift) * 0.2), var(--drop)); opacity: 0; }
        }
        @keyframes fallFlip {
          0%, 100% { transform: rotate(calc(var(--spin) * -0.5)) scaleX(1); }
          25% { transform: rotate(0deg) scaleX(0.3); }
          50% { transform: rotate(calc(var(--spin) * 0.5)) scaleX(-1); }
          75% { transform: rotate(0deg) scaleX(0.3); }
        }
        @keyframes fallDrop {
          0% { transform: translate(0px, 0px); opacity: 0; animation-timing-function: ease-in; }
          3% { opacity: 1; }
          26% { transform: translate(var(--drift), var(--drop)); }
          86% { transform: translate(var(--drift), var(--drop)); opacity: 1; }
          100% { transform: translate(var(--drift), var(--drop)); opacity: 0; }
        }
        @keyframes fallTumble {
          0% { transform: rotate(0deg); animation-timing-function: ease-in; }
          26%, 100% { transform: rotate(var(--spin)); }
        }
        @keyframes fallSpinPath {
          0% { transform: translate(0px, 0px); opacity: 0; }
          5% { opacity: 1; }
          70% { transform: translate(var(--drift), var(--drop)); }
          90% { transform: translate(var(--drift), var(--drop)); opacity: 1; }
          100% { transform: translate(var(--drift), var(--drop)); opacity: 0; }
        }
        @keyframes fallWhirl {
          from { transform: rotate(0deg); }
          to { transform: rotate(var(--spin)); }
        }
        .fall-flutter { animation: fallFlutter 8s ease-in-out infinite; }
        .fall-flip { animation: fallFlip 2s ease-in-out infinite; }
        .fall-drop { animation: fallDrop 10s linear infinite; }
        .fall-tumble { animation: fallTumble 10s linear infinite; }
        .fall-spin-path { animation: fallSpinPath 8s linear infinite; }
        .fall-whirl { animation: fallWhirl 0.6s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .mountain-tree-sway,
          .leaf-sway,
          .leaf-flutter {
            animation: none;
          }
          .fallers {
            display: none;
          }
        }
        .mist-drift {
          animation: mistDrift 12s ease-in-out infinite;
        }
        .petal-fall-a {
          animation: petalFallA 6.5s linear infinite;
        }
        .petal-fall-b {
          animation: petalFallB 8s linear infinite;
        }
        .sun-pulse {
          animation: sunPulse 5.5s ease-in-out infinite;
        }
        .butterfly-hover {
          animation: butterflyHover 3.4s ease-in-out infinite;
        }
        .water-shimmer {
          animation: waterShimmer 3.2s ease-in-out infinite;
        }
      `}</style>

      <svg
        viewBox="0 0 520 320"
        preserveAspectRatio="xMidYMid slice"
        className="w-full aspect-[13/8] min-h-[265px] max-h-[360px] select-none"
        fill="none"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={env.skyFrom} />
            <stop offset="100%" stopColor={env.skyTo} />
          </linearGradient>

          <radialGradient id="sunHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={env.sunColor} stopOpacity={env.snowLevel > 0.5 ? '0.45' : '0.72'} />
            <stop offset="55%" stopColor={env.sunColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={env.sunColor} stopOpacity="0" />
          </radialGradient>

          <radialGradient id="moonHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#94A3B8" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#94A3B8" stopOpacity="0" />
          </radialGradient>

          <linearGradient
            id="sunBeam"
            x1={env.sunX}
            y1={env.sunY}
            x2={treeBaseX}
            y2={235}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={env.sunColor} stopOpacity="0.42" />
            <stop offset="100%" stopColor={env.sunColor} stopOpacity="0" />
          </linearGradient>

          <linearGradient
            id="moonBeam"
            x1={env.moonX}
            y1={env.moonY}
            x2={treeBaseX}
            y2={235}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.28" />
            <stop offset="65%" stopColor="#93C5FD" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#93C5FD" stopOpacity="0" />
          </linearGradient>

          <radialGradient id="moonKnollGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.24" />
            <stop offset="60%" stopColor="#60A5FA" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={bark.dark} />
            <stop offset="65%" stopColor={bark.light} />
            <stop offset="100%" stopColor={bark.dark} />
          </linearGradient>

          <linearGradient id="oldTrunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={tintForTime('#524A44', env.nightFactor, '#1E293B', 0.65)} />
            <stop offset="60%" stopColor={tintForTime('#786F66', env.nightFactor, '#475569', 0.6)} />
            <stop offset="100%" stopColor={tintForTime('#4A433E', env.nightFactor, '#1E293B', 0.65)} />
          </linearGradient>

          <linearGradient id="hillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={env.hillTop} />
            <stop offset="45%" stopColor={env.hillMid} />
            <stop offset="100%" stopColor={env.hillDeep} />
          </linearGradient>

          <linearGradient id="mistBand" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop
              offset="50%"
              stopColor="#FFFFFF"
              stopOpacity={env.nightFactor > 0.5 ? '0.16' : env.snowLevel > 0.5 ? '0.42' : '0.58'}
            />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="petalOuter" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={tintForTime('#FBCFE8', env.nightFactor, '#475569', 0.62)} />
            <stop offset="55%" stopColor={tintForTime('#FDF2F8', env.nightFactor, '#64748B', 0.56)} />
            <stop offset="100%" stopColor={tintForTime('#FFFFFF', env.nightFactor, '#94A3B8', 0.48)} />
          </linearGradient>

          <linearGradient id="streamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop
              offset="0%"
              stopColor={tintForTime(isWateredToday ? '#7DD3FC' : '#BAE6FD', env.nightFactor, '#60A5FA', 0.68)}
              stopOpacity={env.nightFactor > 0.4 ? '0.68' : '0.82'}
            />
            <stop
              offset="100%"
              stopColor={tintForTime(isWateredToday ? '#0284C7' : '#38BDF8', env.nightFactor, '#1E3A5F', 0.78)}
              stopOpacity="0.72"
            />
          </linearGradient>

          <radialGradient id="soilPocket" cx="50%" cy="45%" r="55%">
            <stop
              offset="0%"
              stopColor={tintForTime(isWateredToday ? '#2E1F16' : '#5C493E', env.nightFactor, '#0F172A', 0.72)}
            />
            <stop
              offset="100%"
              stopColor={tintForTime(isWateredToday ? '#1A110B' : '#3E3028', env.nightFactor, '#090E18', 0.78)}
            />
          </radialGradient>
        </defs>

        <EnvironmentLayer
          env={env}
          isWateredToday={isWateredToday}
          treeBaseX={treeBaseX}
          gullGroupRefs={gullGroupRefs}
          gullPathRefs={gullPathRefs}
        />

        <TreeLayer
          days={days}
          species={species}
          env={env}
          isWateredToday={isWateredToday}
          treeBaseX={treeBaseX}
        />
      </svg>

      <div className="absolute top-3.5 left-3.5 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-xs ${env.badgeClass}`}
          >
            <span>{env.seasonEn}</span>
          </span>
          <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/75 text-slate-700 border border-slate-200/70 backdrop-blur-xs">
            {species.labelJa}
          </span>
        </div>
        <span
          className={`text-[11px] font-medium pl-1 ${
            env.nightFactor > 0.5
              ? 'text-slate-100/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]'
              : 'text-slate-700/90 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]'
          }`}
        >
          {growthMeta.stageJa}
        </span>
      </div>

      <div className="absolute top-3.5 right-3.5 text-right bg-white/75 backdrop-blur-xs px-2.5 py-1.5 rounded-xl border border-slate-200/70">
        <div className="text-[10px] font-medium text-slate-400">
          Cycle {String(cycle).padStart(2, '0')}
        </div>
        <div className="text-xs font-semibold text-slate-900 tabular-nums">
          {days === 0 ? 'Day 0 / 360' : `Day ${cd} / 360`}
          {displayTimeText ? ` · ${displayTimeText}` : ''}
        </div>
      </div>
    </div>
  );
}
