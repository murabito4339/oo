'use client';

import { useEffect, useRef, useState } from 'react';
import { BLOSSOM_NODES, CANOPY_CLUSTERS, TREE_BRANCHES } from './constants';
import type { CanopyClusterSpec } from './types';
import { clamp, getSeasonMeta, lerp, lerpColor } from './utils';

type Props = {
  days: number;
  isWateredToday: boolean;
};

type FoliagePalette = {
  back: string;
  mid1: string;
  mid2: string;
  front1: string;
  front2: string;
  vein: string;
};

type Point = { x: number; y: number };

type ComputedBranch = {
  start: Point;
  ctrl: Point;
  end: Point;
  g: number;
  w0: number;
  w1: number;
  twigs: {
    origin: Point;
    end: Point;
    w: number;
  }[];
};

type SeagullAgent = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  dir: 1 | -1;
  cruiseSpeed: number;
  baseY: number;
  flapPhase: number;
  flapRate: number;
  glideCooldown: number;
  turnCooldown: number;
  isGliding: boolean;
  scale: number;
  baseOpacity: number;
  seed: number;
};

const INITIAL_SEAGULLS: SeagullAgent[] = [
  {
    x: 118,
    y: 78,
    vx: 22,
    vy: -1.5,
    dir: 1,
    cruiseSpeed: 23,
    baseY: 76,
    flapPhase: 0.4,
    flapRate: 10.5,
    glideCooldown: 1.8,
    turnCooldown: 11.5,
    isGliding: false,
    scale: 1.0,
    baseOpacity: 0.72,
    seed: 1.1,
  },
  {
    x: 162,
    y: 94,
    vx: 19,
    vy: 1.2,
    dir: 1,
    cruiseSpeed: 19,
    baseY: 92,
    flapPhase: 2.1,
    flapRate: 11.4,
    glideCooldown: 2.9,
    turnCooldown: 15.0,
    isGliding: true,
    scale: 0.82,
    baseOpacity: 0.6,
    seed: 2.7,
  },
  {
    x: 348,
    y: 66,
    vx: -23,
    vy: 0.8,
    dir: -1,
    cruiseSpeed: 24,
    baseY: 68,
    flapPhase: 1.2,
    flapRate: 9.8,
    glideCooldown: 2.2,
    turnCooldown: 9.5,
    isGliding: true,
    scale: 0.9,
    baseOpacity: 0.66,
    seed: 4.3,
  },
  {
    x: 410,
    y: 108,
    vx: -17,
    vy: -1.0,
    dir: -1,
    cruiseSpeed: 17,
    baseY: 104,
    flapPhase: 3.5,
    flapRate: 12.1,
    glideCooldown: 1.4,
    turnCooldown: 13.2,
    isGliding: false,
    scale: 0.68,
    baseOpacity: 0.5,
    seed: 6.1,
  },
];

function getTreeFoliagePalette(dayInCycle: number, toneOffset: number): FoliagePalette {
  const shiftedDay =
    dayInCycle >= 215 && dayInCycle <= 315 ? dayInCycle + toneOffset * 20 - 8 : dayInCycle;

  if (shiftedDay <= 50) {
    const t = clamp(shiftedDay / 50, 0, 1);
    return {
      back: lerpColor('#4D7C0F', '#166534', t),
      mid1: lerpColor('#A3E635', '#4ADE80', t),
      mid2: lerpColor('#65A30D', '#15803D', t),
      front1: lerpColor('#D9F99D', '#86EFAC', t),
      front2: lerpColor('#84CC16', '#22C55E', t),
      vein: '#ECFCCB',
    };
  }
  if (shiftedDay <= 215) {
    const t = clamp((shiftedDay - 50) / 165, 0, 1);
    return {
      back: lerpColor('#166534', '#14532D', t),
      mid1: lerpColor('#4ADE80', '#2E8B57', t),
      mid2: lerpColor('#15803D', '#166534', t),
      front1: lerpColor('#86EFAC', '#4ADE80', t),
      front2: lerpColor('#22C55E', '#1E7A46', t),
      vein: '#BBF7D0',
    };
  }
  if (shiftedDay <= 258) {
    const t = clamp((shiftedDay - 215) / 43, 0, 1);
    return {
      back: lerpColor('#14532D', '#854D0E', t),
      mid1: lerpColor('#2E8B57', '#FACC15', t),
      mid2: lerpColor('#166534', '#CA8A04', t),
      front1: lerpColor('#4ADE80', '#FEF08A', t),
      front2: lerpColor('#1E7A46', '#EAB308', t),
      vein: '#FEF9C3',
    };
  }
  if (shiftedDay <= 292) {
    const t = clamp((shiftedDay - 258) / 34, 0, 1);
    return {
      back: lerpColor('#854D0E', '#7C2D12', t),
      mid1: lerpColor('#FACC15', '#EA580C', t),
      mid2: lerpColor('#CA8A04', '#B91C1C', t),
      front1: lerpColor('#FEF08A', '#FB923C', t),
      front2: lerpColor('#EAB308', '#DC2626', t),
      vein: '#FED7AA',
    };
  }
  const t = clamp((shiftedDay - 292) / 40, 0, 1);
  return {
    back: lerpColor('#7C2D12', '#52443A', t),
    mid1: lerpColor('#EA580C', '#8C6248', t),
    mid2: lerpColor('#B91C1C', '#634836', t),
    front1: lerpColor('#FB923C', '#A67C5B', t),
    front2: lerpColor('#DC2626', '#76523A', t),
    vein: '#D6D3D1',
  };
}

function cubicPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x:
      mt * mt * mt * p0.x +
      3 * mt * mt * t * p1.x +
      3 * mt * t * t * p2.x +
      t * t * t * p3.x,
    y:
      mt * mt * mt * p0.y +
      3 * mt * mt * t * p1.y +
      3 * mt * t * t * p2.y +
      t * t * t * p3.y,
  };
}

function quadPoint(p0: Point, p1: Point, p2: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

function buildScallopedClusterPath(cx: number, cy: number, r: number, fold = 0) {
  const lobes = 7;
  const pts: Point[] = [];
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * Math.PI * 2;
    const rad = r * (0.86 + (i % 3) * 0.08);
    pts.push({
      x: cx + Math.cos(a) * rad * (1 - fold * 0.25),
      y: cy + Math.sin(a) * rad * 0.84,
    });
  }
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < lobes; i++) {
    const p2 = pts[(i + 1) % lobes];
    const midAngle = ((i + 0.5) / lobes) * Math.PI * 2;
    const bulge = r * (1.18 - fold * 0.18);
    const ctrlX = cx + Math.cos(midAngle) * bulge * (1 - fold * 0.2);
    const ctrlY = cy + Math.sin(midAngle) * bulge * 0.88;
    d += ` Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return `${d} Z`;
}

function buildTaperedBranchPath(
  sx: number,
  sy: number,
  cx: number,
  cy: number,
  ex: number,
  ey: number,
  w0: number,
  w1: number
) {
  const dx = ex - sx;
  const dy = ey - sy;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const wm = (w0 + w1) * 0.5;

  return `M ${(sx + nx * w0).toFixed(1)} ${(sy + ny * w0).toFixed(1)}
    Q ${(cx + nx * wm).toFixed(1)} ${(cy + ny * wm).toFixed(1)}, ${(ex + nx * w1).toFixed(1)} ${(ey + ny * w1).toFixed(1)}
    L ${(ex - nx * w1).toFixed(1)} ${(ey - ny * w1).toFixed(1)}
    Q ${(cx - nx * wm).toFixed(1)} ${(cy - ny * wm).toFixed(1)}, ${(sx - nx * w0).toFixed(1)} ${(sy - ny * w0).toFixed(1)} Z`;
}

function computeTreeSkeleton(cd: number, isSecondGenChild = false) {
  const trunkG = clamp((cd - 22) / 118, 0, 1);
  const trunkScaleH = lerp(0.28, 1.0, Math.pow(trunkG, 0.78));
  const trunkScaleW = lerp(0.32, 1.0, Math.pow(trunkG, 1.05));

  const youthWave = Math.sin(trunkG * Math.PI);
  const growSway1 = Math.sin(trunkG * Math.PI * 2.5) * 7.5 * youthWave;
  const growSway2 = -Math.sin(trunkG * Math.PI * 2.1) * 6.5 * youthWave;

  const ageLean = cd >= 312 ? clamp((cd - 312) / 48, 0, 1) * -6.5 : 0;
  const genClear = isSecondGenChild ? lerp(7, 0, clamp((cd - 20) / 80, 0, 1)) : 0;

  const p0: Point = { x: 0, y: 0 };
  const p1: Point = {
    x: -4 * trunkScaleW + growSway1 * 0.6 + genClear * 0.55,
    y: -38 * trunkScaleH,
  };
  const p2: Point = {
    x: 5 * trunkScaleW + growSway2 + ageLean * 0.4 + genClear,
    y: -78 * trunkScaleH,
  };
  const p3: Point = {
    x: -2 + growSway1 * 0.4 + ageLean * 0.8 + genClear * 0.65,
    y: -116 * trunkScaleH,
  };

  const pLeadCtrl: Point = {
    x: p3.x - 4 + growSway2 * 0.45,
    y: -144 * trunkScaleH,
  };
  const pTip: Point = {
    x: p3.x + 2 + ageLean * 1.15,
    y: -172 * trunkScaleH,
  };

  function pointOnTrunk(t: number): Point {
    if (t <= 1) {
      return cubicPoint(p0, p1, p2, p3, clamp(t, 0, 1));
    }
    return quadPoint(p3, pLeadCtrl, pTip, clamp(t - 1, 0, 1));
  }

  const winterBow = cd >= 288 ? clamp((cd - 288) / 58, 0, 1) * 5.2 : 0;
  const twigWeather = cd >= 340 ? clamp((cd - 340) / 20, 0, 1) : 0;

  const branches: Record<string, ComputedBranch> = {};

  for (const br of TREE_BRANCHES) {
    if (cd < br.appearDay) continue;
    const g = clamp((cd - br.appearDay) / (br.fullDay - br.appearDay), 0, 1);
    const reach = Math.pow(g, 0.84);

    const brYouth = Math.sin(g * Math.PI);
    const brWaveY = -Math.sin(g * Math.PI * 2.0) * 7.5 * brYouth;
    const brWaveX = br.side * Math.sin(g * Math.PI * 1.6) * 4.0 * brYouth;

    const start = pointOnTrunk(br.trunkT);
    const end: Point = {
      x: start.x + br.dx * reach + brWaveX,
      y: start.y + br.dy * reach + brWaveY + winterBow,
    };
    const ctrl: Point = {
      x: start.x + br.cdx * reach - brWaveX * 0.45,
      y: start.y + br.cdy * reach + brWaveY * 0.4 + winterBow * 0.45,
    };

    const twigs = (br.twigs ?? [])
      .filter((tw) => cd >= tw.appearDay)
      .map((tw) => {
        const tg = clamp((cd - tw.appearDay) / 28, 0.15, 1) * (1 - twigWeather * 0.45);
        const origin = quadPoint(start, ctrl, end, tw.fromT);
        const twWave = Math.sin(tg * Math.PI) * 3.5;
        return {
          origin,
          end: {
            x: origin.x + tw.dx * tg,
            y: origin.y + tw.dy * tg - twWave + winterBow * 0.35,
          },
          w: tw.w,
        };
      });

    branches[br.id] = {
      start,
      ctrl,
      end,
      g,
      w0: br.w0 * (0.45 + 0.55 * trunkScaleW),
      w1: br.w1 * (0.65 + 0.35 * g),
      twigs,
    };
  }

  return {
    trunkScaleH,
    trunkScaleW,
    p0,
    p1,
    p2,
    p3,
    pLeadCtrl,
    pTip,
    pointOnTrunk,
    branches,
    winterBow,
  };
}

function buildSeagullPath(wingPos: number, bankSkew: number) {
  const leftSpan = 10.5 * (1 - bankSkew * 0.16);
  const rightSpan = 10.5 * (1 + bankSkew * 0.16);
  const elbowLift = -2.8 + wingPos * 2.4;
  const tipY = -0.6 + wingPos * 5.2;

  return `M ${(-leftSpan).toFixed(2)} ${tipY.toFixed(2)} Q ${(-leftSpan * 0.52).toFixed(2)} ${elbowLift.toFixed(2)}, 0 0 Q ${(rightSpan * 0.52).toFixed(2)} ${elbowLift.toFixed(2)}, ${rightSpan.toFixed(2)} ${tipY.toFixed(2)}`;
}

function getRealTimeCelestialState(date: Date | null) {
  const hours = date
    ? date.getHours() +
      date.getMinutes() / 60 +
      date.getSeconds() / 3600 +
      date.getMilliseconds() / 3600000
    : 12;

  // 06:00 -> 東(左 x=45), 12:00 -> 南中(中央 x=260, y=36), 18:00 -> 西(右 x=475)
  const hourAngle = ((hours - 12) / 24) * Math.PI * 2;
  const sunElevation = Math.cos(hourAngle);
  const sunX = 260 + Math.sin(hourAngle) * 215;
  const sunY = 164 - sunElevation * 128;
  const sunOpacity = clamp((sunElevation + 0.14) / 0.24, 0, 1);

  const moonAngle = hourAngle + Math.PI;
  const moonElevation = -sunElevation;
  const moonX = 260 + Math.sin(moonAngle) * 200;
  const moonY = 164 - moonElevation * 116;
  const moonOpacity = clamp((moonElevation - 0.02) / 0.2, 0, 0.9);

  const twilightFactor = clamp(1 - Math.abs(sunElevation) / 0.24, 0, 1);
  const nightFactor = clamp((-sunElevation - 0.04) / 0.26, 0, 1);

  return {
    sunX,
    sunY,
    sunOpacity,
    moonX,
    moonY,
    moonOpacity,
    twilightFactor,
    nightFactor,
  };
}

export function RealisticBotanicalCanvas({ days, isWateredToday }: Props) {
  const cycle = days === 0 ? 1 : Math.floor((days - 1) / 360) + 1;
  const cd = days === 0 ? 0 : ((days - 1) % 360) + 1;
  const meta = getSeasonMeta(days);

  // 現実の時間と同期するタイマー（SSRハイドレーション対策済み）
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const { sunX, sunY, sunOpacity, moonX, moonY, moonOpacity, twilightFactor, nightFactor } =
    getRealTimeCelestialState(now);

  // カモメの自律飛行ループ（再レンダリングなしで60fps描画）
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

  let skyFrom = meta.bgFrom;
  let skyTo = meta.bgTo;
  let activeSunColor = meta.sunColor;

  if (twilightFactor > 0) {
    skyFrom = lerpColor(skyFrom, '#94A3B8', twilightFactor * 0.35);
    skyTo = lerpColor(skyTo, '#FDBA74', twilightFactor * 0.45);
    activeSunColor = lerpColor(activeSunColor, '#FB923C', twilightFactor * 0.75);
  }
  if (nightFactor > 0) {
    skyFrom = lerpColor(skyFrom, '#0F172A', nightFactor * 0.88);
    skyTo = lerpColor(skyTo, '#1E3A5F', nightFactor * 0.82);
  }

  const winterSnow = cd >= 296 ? clamp((cd - 296) / 32, 0, 1) : 0;
  const autumnWarmth =
    cd >= 228 && cd <= 305
      ? cd <= 270
        ? clamp((cd - 228) / 42, 0, 1)
        : clamp(1 - (cd - 270) / 35, 0, 1)
      : 0;

  let farMountain = '#9BB8CD';
  let midMountain = '#6C9488';
  let hillTop = '#65A30D';
  let hillMid = '#3F7D20';
  let hillDeep = '#1B4332';

  if (autumnWarmth > 0) {
    farMountain = lerpColor(farMountain, '#B9A3A8', autumnWarmth);
    midMountain = lerpColor(midMountain, '#8C6D5A', autumnWarmth);
    hillTop = lerpColor(hillTop, '#A16207', autumnWarmth);
    hillMid = lerpColor(hillMid, '#78350F', autumnWarmth);
    hillDeep = lerpColor(hillDeep, '#451A03', autumnWarmth);
  }
  if (winterSnow > 0) {
    farMountain = lerpColor(farMountain, '#CBD5E1', winterSnow);
    midMountain = lerpColor(midMountain, '#94A3B8', winterSnow);
    hillTop = lerpColor(hillTop, '#F8FAFC', winterSnow);
    hillMid = lerpColor(hillMid, '#E2E8F0', winterSnow);
    hillDeep = lerpColor(hillDeep, '#CBD5E1', winterSnow);
  }

  if (nightFactor > 0) {
    farMountain = lerpColor(farMountain, '#1E293B', nightFactor * 0.56);
    midMountain = lerpColor(midMountain, '#162436', nightFactor * 0.54);
    hillTop = lerpColor(hillTop, '#1E293B', nightFactor * 0.48);
    hillMid = lerpColor(hillMid, '#132030', nightFactor * 0.5);
    hillDeep = lerpColor(hillDeep, '#0B1320', nightFactor * 0.52);
  }

  let barkDark = '#4A3525';
  let barkLight = '#7C5A3E';
  if (cd <= 38) {
    const t = cd / 38;
    barkDark = lerpColor('#3F7D20', '#4A3525', t);
    barkLight = lerpColor('#84CC16', '#7C5A3E', t);
  } else if (cd >= 295) {
    const t = clamp((cd - 295) / 65, 0, 1);
    barkDark = lerpColor('#4A3525', '#3D3834', t);
    barkLight = lerpColor('#7C5A3E', '#6B645D', t);
  }

  const isSproutPhase = days >= 1 && cd <= 23;
  const sproutG = clamp((cd - 1) / 22, 0, 1);
  const sproutH = lerp(8, 46, Math.pow(sproutG, 0.85));
  const sproutWave = Math.sin(sproutG * Math.PI * 2.1) * 4.5 * Math.sin(sproutG * Math.PI);
  const sproutHook = cd <= 10 ? lerp(8, 0, clamp((cd - 1) / 9, 0, 1)) : 0;

  const isSecondGen = cycle >= 2;
  const treeBaseX = isSecondGen ? lerp(268, 260, clamp((cd - 45) / 65, 0, 1)) : 260;

  const skel = !isSproutPhase && days >= 1 ? computeTreeSkeleton(cd, isSecondGen) : null;

  const oldTreeUpperFade = isSecondGen ? clamp(1 - (cd - 1) / 13, 0, 1) : 0;
  const oldSkel = isSecondGen && oldTreeUpperFade > 0.02 ? computeTreeSkeleton(360, false) : null;
  const oldStumpOpacity = isSecondGen ? clamp(1 - (cd - 42) / 33, 0, 1) : 0;

  const isBudStage = cd >= 125 && cd < 180;
  const budProgress = clamp((cd - 125) / 55, 0, 1);
  const isFlowerStage = cd >= 178 && cd <= 238;
  const isBerryStage = cd >= 228 && cd <= 298;
  const berryMaturity = clamp((cd - 228) / 45, 0, 1);

  const swayClass = cd >= 314 ? '' : 'mountain-tree-sway';

  const beamTargetX = treeBaseX;
  const beamTargetY = 235;
  const rayDx = beamTargetX - sunX;
  const rayDy = beamTargetY - sunY;
  const rayLen = Math.hypot(rayDx, rayDy) || 1;
  const perpX = -rayDy / rayLen;
  const perpY = rayDx / rayLen;
  const sunbeamOpacity = sunOpacity * (cd < 305 ? 1 : 0.45);

  function getAnchorPoint(
    skeleton: ReturnType<typeof computeTreeSkeleton>,
    branchId: string,
    branchT: number,
    ox: number,
    oy: number,
    scaleFactor = 1
  ): Point | null {
    if (branchId === 'leader') {
      const base = skeleton.pointOnTrunk(1 + branchT * 0.8);
      return { x: base.x + ox * scaleFactor, y: base.y + oy * scaleFactor };
    }
    const br = skeleton.branches[branchId];
    if (!br) return null;
    const base = quadPoint(br.start, br.ctrl, br.end, clamp(branchT, 0, 1));
    return { x: base.x + ox * scaleFactor, y: base.y + oy * scaleFactor };
  }

  function renderTrunkAndBranches(
    skeleton: ReturnType<typeof computeTreeSkeleton>,
    trunkFill: string,
    darkStroke: string,
    snowOpacity: number,
    upperWeatherRatio = 0
  ) {
    const wBase = 9.2 * skeleton.trunkScaleW;
    const wMid = 6.2 * skeleton.trunkScaleW;
    const wFork = 3.8 * skeleton.trunkScaleW;

    return (
      <g>
        <path
          d={`M ${-wBase * 2.1} 3.5 C ${-wBase * 1.2} 1, ${-wBase * 1.05} -12, ${-wBase * 0.9} -32
              C ${skeleton.p1.x - wMid} ${skeleton.p1.y}, ${skeleton.p2.x - wMid * 0.8} ${skeleton.p2.y}, ${skeleton.p3.x - wFork} ${skeleton.p3.y}
              L ${skeleton.pLeadCtrl.x - 2.2 * skeleton.trunkScaleW} ${skeleton.pLeadCtrl.y}
              L ${skeleton.pTip.x} ${skeleton.pTip.y}
              L ${skeleton.pLeadCtrl.x + 2.2 * skeleton.trunkScaleW} ${skeleton.pLeadCtrl.y}
              L ${skeleton.p3.x + wFork} ${skeleton.p3.y}
              C ${skeleton.p2.x + wMid * 0.8} ${skeleton.p2.y}, ${skeleton.p1.x + wMid} ${skeleton.p1.y}, ${wBase * 0.92} -32
              C ${wBase * 1.08} -12, ${wBase * 1.25} 1, ${wBase * 2.15} 3.5 Z`}
          fill={trunkFill}
        />

        <path
          d={`M -1.5 -10 Q ${skeleton.p1.x} ${skeleton.p1.y * 0.9}, ${skeleton.p2.x * 0.7} ${skeleton.p2.y * 0.88}`}
          stroke={darkStroke}
          strokeOpacity="0.38"
          strokeWidth="1.1"
          strokeLinecap="round"
        />

        {TREE_BRANCHES.map((br) => {
          const cb = skeleton.branches[br.id];
          if (!cb) return null;
          const isUpper = br.trunkT >= 0.95;
          const op = isUpper ? clamp(1 - upperWeatherRatio * 1.25, 0, 1) : 1;
          if (op <= 0.04) return null;

          return (
            <g key={br.id} opacity={op}>
              <path
                d={buildTaperedBranchPath(
                  cb.start.x,
                  cb.start.y,
                  cb.ctrl.x,
                  cb.ctrl.y,
                  cb.end.x,
                  cb.end.y,
                  cb.w0,
                  cb.w1
                )}
                fill={trunkFill}
              />
              {cb.twigs.map((tw, idx) => (
                <line
                  key={`${br.id}-tw-${idx}`}
                  x1={tw.origin.x}
                  y1={tw.origin.y}
                  x2={tw.end.x}
                  y2={tw.end.y}
                  stroke={darkStroke}
                  strokeWidth={tw.w}
                  strokeLinecap="round"
                  opacity={1 - upperWeatherRatio * 0.85}
                />
              ))}
              {snowOpacity > 0.04 && (
                <path
                  d={`M ${(cb.start.x + (cb.end.x - cb.start.x) * 0.14).toFixed(1)} ${(
                    cb.start.y +
                    (cb.end.y - cb.start.y) * 0.14 -
                    cb.w0 * 0.55
                  ).toFixed(1)} Q ${cb.ctrl.x.toFixed(1)} ${(cb.ctrl.y - cb.w0 * 0.45).toFixed(1)}, ${(
                    cb.start.x +
                    (cb.end.x - cb.start.x) * 0.88
                  ).toFixed(1)} ${(cb.start.y + (cb.end.y - cb.start.y) * 0.88 - cb.w1 * 0.6).toFixed(1)}`}
                  stroke="#FFFFFF"
                  strokeWidth={Math.max(1.5, cb.w0 * 0.44)}
                  strokeLinecap="round"
                  opacity={snowOpacity * op}
                />
              )}
            </g>
          );
        })}
      </g>
    );
  }

  function renderClusterLayer(layer: CanopyClusterSpec['layer']) {
    if (!skel || cd < 28) return null;

    return CANOPY_CLUSTERS.filter((c) => c.layer === layer).map((cluster) => {
      if (cd < cluster.appearDay) return null;

      const grow = clamp((cd - cluster.appearDay) / 22, 0.18, 1);
      const unfurlFold = clamp(1 - (cd - cluster.appearDay) / 18, 0, 1);

      const pos = getAnchorPoint(skel, cluster.branchId, cluster.branchT, cluster.ox, cluster.oy, grow);
      if (!pos) return null;

      const pal = getTreeFoliagePalette(cd, cluster.toneOffset);
      const mainFill = layer === 'back' ? pal.back : layer === 'mid' ? pal.mid2 : pal.front1;
      const highlightFill = layer === 'mid' ? pal.mid1 : pal.front2;

      const witherT = clamp((cd - (cluster.fallDay - 26)) / 26, 0, 1);
      const afterFall = cd - cluster.fallDay;

      if (afterFall >= 0) {
        if (layer === 'back' || afterFall > 22) return null;
        return (
          <g key={`${cluster.id}-falling`}>
            {cluster.leafAngles.slice(0, 2).map((deg, idx) => {
              const ft = clamp((afterFall - idx * 2.5) / 18, 0, 1);
              if (ft <= 0 || ft >= 1) return null;
              const dropDist = (6 - pos.y) * Math.pow(ft, 1.08);
              const lx = pos.x + Math.sin(ft * Math.PI * 2.6 + idx * 1.4) * 18 - ft * 14;
              const ly = pos.y + dropDist;
              const rot = deg + ft * 280 * (idx % 2 === 0 ? 1 : -1);
              const op = ft > 0.84 ? (1 - ft) / 0.16 : 0.92;
              return (
                <g
                  key={`${cluster.id}-fall-lf-${idx}`}
                  transform={`translate(${lx.toFixed(1)}, ${ly.toFixed(1)}) rotate(${rot.toFixed(0)})`}
                  opacity={op}
                >
                  <path
                    d="M0 0 C4 -3.8, 9 -2.8, 11 0 C9 2.8, 4 3.8, 0 0 Z"
                    fill={idx === 0 ? pal.mid1 : pal.front1}
                  />
                </g>
              );
            })}
          </g>
        );
      }

      const droopOffset = witherT * 5.5;
      const r = cluster.r * grow * (1 - witherT * 0.24);
      const clusterOpacity = 1 - witherT * 0.18;

      return (
        <g
          key={cluster.id}
          transform={`translate(0, ${droopOffset.toFixed(1)})`}
          opacity={clusterOpacity}
        >
          <path d={buildScallopedClusterPath(pos.x, pos.y, r, unfurlFold * 0.55)} fill={mainFill} />
          {layer !== 'back' && (
            <path
              d={buildScallopedClusterPath(
                pos.x + r * 0.12,
                pos.y - r * 0.14,
                r * 0.72,
                unfurlFold * 0.5
              )}
              fill={highlightFill}
              opacity="0.82"
            />
          )}
          {cluster.leafAngles.map((deg, idx) => {
            const rad = (deg * Math.PI) / 180;
            const droopAngle = deg + (deg > 90 && deg < 270 ? -1 : 1) * witherT * 36;
            const foldAngle = droopAngle - unfurlFold * 28;
            const lx = pos.x + Math.cos(rad) * (r * (0.76 - unfurlFold * 0.2));
            const ly = pos.y + Math.sin(rad) * (r * (0.64 - unfurlFold * 0.15));
            const leafLen = (9 + (idx % 2) * 3) * (0.55 + 0.45 * grow);
            const leafW = 4.2 * (1 - witherT * 0.35);

            return (
              <g
                key={`${cluster.id}-lf-${idx}`}
                transform={`translate(${lx.toFixed(1)}, ${ly.toFixed(1)}) rotate(${foldAngle.toFixed(1)})`}
              >
                <path
                  d={`M0 0 C ${leafLen * 0.35} ${-leafW}, ${leafLen * 0.8} ${-leafW * 0.75}, ${leafLen} 0 C ${leafLen * 0.8} ${leafW * 0.75}, ${leafLen * 0.35} ${leafW}, 0 0 Z`}
                  fill={layer === 'back' ? pal.back : pal.front1}
                />
                <path
                  d={`M1 0 L ${leafLen * 0.75} 0`}
                  stroke={pal.vein}
                  strokeOpacity="0.45"
                  strokeWidth="0.6"
                  strokeLinecap="round"
                />
                {isWateredToday && layer === 'front' && cd < 245 && idx === 0 && (
                  <circle cx={leafLen * 0.78} cy="1.2" r="1.1" fill="#E0F2FE" opacity="0.9" />
                )}
              </g>
            );
          })}
        </g>
      );
    });
  }

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-slate-200/80 transition-colors duration-700"
      style={{
        background: `linear-gradient(180deg, ${skyFrom} 0%, ${skyTo} 100%)`,
      }}
    >
      <style>{`
        @keyframes mountainTreeSway {
          0%, 100% { transform: rotate(-1.15deg); }
          50% { transform: rotate(1.35deg); }
        }
        @keyframes canopyBreath {
          0%, 100% { transform: translate(0px, 0px) rotate(-0.4deg); }
          50% { transform: translate(1.2px, -0.8px) rotate(0.6deg); }
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
        .canopy-breath {
          animation: canopyBreath 4.6s ease-in-out infinite;
          transform-origin: 0px -80px;
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
            <stop offset="0%" stopColor={skyFrom} />
            <stop offset="100%" stopColor={skyTo} />
          </linearGradient>

          <radialGradient id="sunHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={activeSunColor} stopOpacity={cd > 295 ? '0.45' : '0.72'} />
            <stop offset="55%" stopColor={activeSunColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={activeSunColor} stopOpacity="0" />
          </radialGradient>

          <radialGradient id="moonHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#94A3B8" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#94A3B8" stopOpacity="0" />
          </radialGradient>

          <linearGradient
            id="sunBeam"
            x1={sunX}
            y1={sunY}
            x2={beamTargetX}
            y2={beamTargetY}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={activeSunColor} stopOpacity="0.42" />
            <stop offset="100%" stopColor={activeSunColor} stopOpacity="0" />
          </linearGradient>

          <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={barkDark} />
            <stop offset="65%" stopColor={barkLight} />
            <stop offset="100%" stopColor={barkDark} />
          </linearGradient>

          <linearGradient id="oldTrunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#524A44" />
            <stop offset="60%" stopColor="#786F66" />
            <stop offset="100%" stopColor="#4A433E" />
          </linearGradient>

          <linearGradient id="hillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={hillTop} />
            <stop offset="45%" stopColor={hillMid} />
            <stop offset="100%" stopColor={hillDeep} />
          </linearGradient>

          <linearGradient id="mistBand" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop
              offset="50%"
              stopColor="#FFFFFF"
              stopOpacity={nightFactor > 0.5 ? '0.16' : cd >= 295 ? '0.42' : '0.58'}
            />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="petalOuter" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FBCFE8" />
            <stop offset="55%" stopColor="#FDF2F8" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>

          <linearGradient id="streamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isWateredToday ? '#7DD3FC' : '#BAE6FD'} stopOpacity="0.82" />
            <stop offset="100%" stopColor={isWateredToday ? '#0284C7' : '#38BDF8'} stopOpacity="0.65" />
          </linearGradient>

          <radialGradient id="soilPocket" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor={isWateredToday ? '#2E1F16' : '#5C493E'} />
            <stop offset="100%" stopColor={isWateredToday ? '#1A110B' : '#3E3028'} />
          </radialGradient>
        </defs>

        {/* 空 */}
        <rect x="-20" y="-20" width="560" height="360" fill="url(#skyGrad)" />

        {/* 夜空の星 */}
        {(nightFactor > 0.1 || cd >= 315) && (
          <g
            fill="#FFFFFF"
            opacity={Math.max(
              nightFactor * 0.72,
              cd >= 315 ? clamp((cd - 315) / 25, 0, 0.45) : 0
            )}
          >
            <circle cx="88" cy="42" r="1.2" />
            <circle cx="152" cy="28" r="1.0" />
            <circle cx="292" cy="34" r="1.3" />
            <circle cx="426" cy="52" r="1.1" />
            <circle cx="64" cy="92" r="0.9" />
            <circle cx="378" cy="26" r="1.1" />
          </g>
        )}

        {/* 現実時間と同期する太陽 */}
        {sunOpacity > 0.02 && (
          <g opacity={sunOpacity}>
            <circle cx={sunX} cy={sunY} r="78" fill="url(#sunHalo)" />
            <circle
              cx={sunX}
              cy={sunY}
              r="14"
              fill={activeSunColor}
              opacity={cd > 295 ? '0.62' : '0.92'}
            />
          </g>
        )}

        {/* 夜間の月 */}
        {moonOpacity > 0.02 && (
          <g opacity={moonOpacity}>
            <circle cx={moonX} cy={moonY} r="44" fill="url(#moonHalo)" />
            <path
              d={`M ${(moonX + 3).toFixed(1)} ${(moonY - 10).toFixed(1)} A 10 10 0 1 0 ${(moonX + 10).toFixed(1)} ${(moonY + 4).toFixed(1)} A 8.5 8.5 0 1 1 ${(moonX + 3).toFixed(1)} ${(moonY - 10).toFixed(1)} Z`}
              fill="#F8FAFC"
            />
          </g>
        )}

        {/* 雲 */}
        <g fill="#FFFFFF" opacity={nightFactor > 0.5 ? '0.16' : cd > 295 ? '0.35' : '0.58'}>
          <path d="M52 54 C62 44, 84 44, 94 52 C104 48, 122 52, 126 60 L46 60 C44 57, 48 54, 52 54 Z" />
          <path d="M312 42 C320 35, 336 35, 344 41 C352 38, 364 41, 368 47 L306 47 C305 45, 308 42, 312 42 Z" />
        </g>

        {/* 太陽の位置に追従する光線 */}
        {sunbeamOpacity > 0.05 && (
          <g className="sun-pulse" opacity={sunbeamOpacity}>
            <polygon
              points={`${(sunX - perpX * 14).toFixed(1)},${(sunY - perpY * 14).toFixed(1)} ${(sunX + perpX * 16).toFixed(1)},${(sunY + perpY * 16).toFixed(1)} ${(beamTargetX + perpX * 48).toFixed(1)},${(beamTargetY + perpY * 48).toFixed(1)} ${(beamTargetX - perpX * 42).toFixed(1)},${(beamTargetY - perpY * 42).toFixed(1)}`}
              fill="url(#sunBeam)"
            />
            <polygon
              points={`${(sunX - perpX * 4).toFixed(1)},${(sunY - perpY * 4).toFixed(1)} ${(sunX + perpX * 22).toFixed(1)},${(sunY + perpY * 22).toFixed(1)} ${(beamTargetX + 54 + perpX * 32).toFixed(1)},${(beamTargetY + 14 + perpY * 32).toFixed(1)} ${(beamTargetX + 18 - perpX * 16).toFixed(1)},${(beamTargetY + 6 - perpY * 16).toFixed(1)}`}
              fill="url(#sunBeam)"
              opacity="0.6"
            />
          </g>
        )}

        {/* 遠景の山並み */}
        <path
          d="M-20 235 L45 154 L96 176 L176 122 L248 168 L338 116 L418 162 L486 132 L540 168 L540 265 L-20 265 Z"
          fill={farMountain}
        />

        {winterSnow > 0.05 && (
          <g fill="#FFFFFF" opacity={0.85 * winterSnow}>
            <path d="M176 122 L152 142 L166 138 L178 148 L190 139 L204 146 Z" />
            <path d="M338 116 L310 138 L328 134 L340 145 L354 135 L368 142 Z" />
            <path d="M45 154 L28 170 L44 166 L54 173 L64 166 Z" />
          </g>
        )}

        {/* 谷霧 */}
        <g className="mist-drift">
          <rect x="-40" y="164" width="600" height="44" fill="url(#mistBand)" />
        </g>

        {/* 中景の尾根 */}
        <path
          d="M-20 250 Q70 185 168 206 Q268 228 362 192 Q450 162 540 208 L540 280 L-20 280 Z"
          fill={midMountain}
        />

        <g fill={midMountain} opacity="0.88">
          <path d="M24 206 L30 186 L36 206 Z M42 200 L49 178 L56 200 Z M62 198 L68 181 L74 198 Z" />
          <path d="M402 184 L409 164 L416 184 Z M422 181 L428 160 L434 181 Z M442 184 L449 166 L456 184 Z" />
        </g>

        {/* 自律的に飛び回るカモメ */}
        <g
          stroke={nightFactor > 0.45 ? '#CBD5E1' : '#334155'}
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          {INITIAL_SEAGULLS.map((g, idx) => (
            <g
              key={idx}
              ref={(el) => {
                gullGroupRefs.current[idx] = el;
              }}
              transform={`translate(${g.x}, ${g.y}) scale(${g.scale})`}
              opacity={g.baseOpacity}
            >
              <path
                ref={(el) => {
                  gullPathRefs.current[idx] = el;
                }}
                d={buildSeagullPath(-0.2, g.vx / g.cruiseSpeed)}
              />
            </g>
          ))}
        </g>

        {/* 近景の丘 */}
        <path
          d="M-20 278 Q105 244 256 248 Q390 252 540 276 L540 340 L-20 340 Z"
          fill="url(#hillGrad)"
        />
        <path d="M128 264 Q256 242 384 268 Q256 254 128 264 Z" fill="#000000" opacity="0.06" />

        {/* 小川 */}
        {cd < 322 && (
          <g>
            <path
              d="M362 272 C384 278, 370 292, 404 300 C432 307, 464 306, 512 326 L528 326 C476 300, 444 300, 416 294 C388 287, 398 276, 368 271 Z"
              fill="url(#streamGrad)"
            />
            {isWateredToday && (
              <g className="water-shimmer" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round">
                <path d="M388 286 Q396 289 406 292" />
                <path d="M432 301 Q444 304 456 307" />
              </g>
            )}
          </g>
        )}

        {/* 岩と苔 */}
        <g>
          <path d="M188 260 C190 247, 214 244, 224 257 C226 263, 190 264, 188 260 Z" fill="#64748B" />
          <path
            d="M192 254 C198 247, 214 246, 220 253 C212 250, 199 251, 192 254 Z"
            fill={winterSnow > 0.3 ? '#F8FAFC' : '#4D7C0F'}
            opacity="0.88"
          />
          <path d="M298 262 C302 250, 326 248, 334 261 C332 266, 300 266, 298 262 Z" fill="#475569" />
          <path
            d="M303 256 C309 250, 324 250, 330 256 C322 253, 310 254, 303 256 Z"
            fill={winterSnow > 0.3 ? '#F8FAFC' : '#65A30D'}
            opacity="0.88"
          />
        </g>

        {/* 土壌 */}
        <ellipse cx="263" cy="253" rx="36" ry="6.5" fill="url(#soilPocket)" />
        {isWateredToday && cd < 318 && (
          <g fill="#BAE6FD" opacity="0.88">
            <circle cx="244" cy="252" r="1.2" />
            <circle cx="276" cy="254" r="1.4" />
            <circle cx="257" cy="255" r="1.0" />
          </g>
        )}

        {/* 草花 */}
        {cd < 325 && (
          <g stroke={autumnWarmth > 0.4 ? '#92400E' : '#3F7D20'} strokeWidth="1.3" strokeLinecap="round">
            <path d="M164 264 Q160 254 156 250 M166 264 Q167 253 171 249" />
            <path d="M230 256 Q227 248 223 245 M233 256 Q235 247 239 245" />
            <path d="M290 256 Q293 247 297 244 M293 256 Q298 249 302 247" />
            <path d="M348 268 Q345 258 341 254 M351 268 Q354 257 358 253" />
          </g>
        )}
        {cd >= 20 && cd <= 235 && (
          <g>
            <circle cx="155" cy="256" r="2.2" fill="#FEF08A" />
            <circle cx="172" cy="260" r="2.0" fill="#F5D0FE" />
            <circle cx="342" cy="261" r="2.2" fill="#FFFFFF" />
            <circle cx="356" cy="265" r="1.8" fill="#E0E7FF" />
          </g>
        )}

        {/* サイクル2以降：春先のみ薄く残る前年の名残(cd 1..14) ＋ 苔むした古株(cd 1..75) */}
        {isSecondGen && oldSkel && (
          <g transform="translate(256, 253)" opacity={oldTreeUpperFade * 0.68}>
            {renderTrunkAndBranches(
              oldSkel,
              'url(#oldTrunkGrad)',
              '#4A433E',
              lerp(0.75, 0, clamp(cd / 10, 0, 1)),
              clamp((cd - 1) / 10, 0, 1)
            )}
          </g>
        )}

        {isSecondGen && oldStumpOpacity > 0.02 && (
          <g transform="translate(255, 253)" opacity={oldStumpOpacity}>
            <path
              d="M -14 3 C -8.5 0.5, -7 -7, -6 -17 L -2 -19 L 2 -15.5 L 5.8 -18 C 7 -7.5, 8.5 0.5, 13.5 3 Z"
              fill="url(#oldTrunkGrad)"
            />
            <path
              d="M -2 -3 Q -3 -9.5 -1 -15 M 2 -2 Q 3 -8.5 2 -14"
              stroke="#3F3934"
              strokeWidth="0.9"
              strokeOpacity="0.45"
              strokeLinecap="round"
            />
            {cd >= 4 && (
              <g fill="#65A30D" opacity={clamp((cd - 4) / 14, 0.25, 0.85)}>
                <ellipse cx="-5" cy="-6.5" rx="3.2" ry="4.4" />
                <ellipse cx="4.2" cy="-4.8" rx="2.6" ry="3.6" />
                <ellipse cx="-1.5" cy="-15.5" rx="2.5" ry="1.7" fill="#84CC16" />
              </g>
            )}
          </g>
        )}

        {/* Day 0: 種 */}
        {days === 0 && (
          <g>
            <path
              d="M254 252 C254 244, 266 244, 266 252 C266 256, 254 256, 254 252 Z"
              fill="#78350F"
              stroke="#451A03"
              strokeWidth="1"
            />
            <path d="M260 246 L260 254" stroke="#D97706" strokeWidth="0.9" opacity="0.7" />
          </g>
        )}

        {/* 発芽フェーズ (cd 1..23) */}
        {isSproutPhase && (
          <g transform={`translate(${treeBaseX.toFixed(1)}, 253)`}>
            <g className={swayClass}>
              <path
                d={`M -1.6 0 Q ${(-2 + sproutWave).toFixed(1)} ${(-sproutH * 0.5).toFixed(1)}, ${(
                  (isSecondGen ? 4 : 0) + sproutHook * 0.5
                ).toFixed(1)} ${(-sproutH).toFixed(1)}
                L ${((isSecondGen ? 4 : 0) + 1.4 + sproutHook * 0.5).toFixed(1)} ${(-sproutH).toFixed(1)}
                Q ${(1.2 + sproutWave).toFixed(1)} ${(-sproutH * 0.5).toFixed(1)}, 1.6 0 Z`}
                fill="#4D7C0F"
              />
              <g
                transform={`translate(${((isSecondGen ? 2 : 0) + sproutWave * 0.5).toFixed(1)}, ${(
                  -sproutH * 0.48
                ).toFixed(1)}) rotate(${sproutHook * 3.5})`}
              >
                <path
                  d="M0 0 C-7 -7, -18 -5, -19 0 C-16 5, -5 4, 0 0 Z"
                  fill="#84CC16"
                  stroke="#3F6212"
                  strokeWidth="0.6"
                />
                <path
                  d="M0 0 C7 -7, 18 -5, 19 0 C16 5, 5 4, 0 0 Z"
                  fill="#84CC16"
                  stroke="#3F6212"
                  strokeWidth="0.6"
                />
              </g>
              {cd >= 8 && (
                <g
                  transform={`translate(${((isSecondGen ? 4 : 0) + sproutHook * 0.5).toFixed(1)}, ${(
                    -sproutH
                  ).toFixed(1)}) scale(${clamp((cd - 7) / 14, 0.3, 1)})`}
                >
                  <path
                    d="M0 0 C-9 -12, -22 -10, -24 -2 C-19 5, -7 4, 0 0 Z"
                    fill="#4ADE80"
                    stroke="#15803D"
                    strokeWidth="0.6"
                  />
                  <path
                    d="M0 0 C9 -12, 22 -10, 24 -2 C19 5, 7 4, 0 0 Z"
                    fill="#4ADE80"
                    stroke="#15803D"
                    strokeWidth="0.6"
                  />
                  <path
                    d="M0 0 C-4 -10, -3 -20, 0 -24 C3 -20, 4 -10, 0 0 Z"
                    fill="#86EFAC"
                    stroke="#15803D"
                    strokeWidth="0.5"
                  />
                </g>
              )}
            </g>
          </g>
        )}

        {/* 樹木フェーズ (cd >= 24) */}
        {days >= 1 && !isSproutPhase && skel && (
          <g transform={`translate(${treeBaseX.toFixed(1)}, 253)`}>
            <g className={swayClass}>
              <g className={cd < 305 ? 'canopy-breath' : undefined}>{renderClusterLayer('back')}</g>

              {renderTrunkAndBranches(
                skel,
                'url(#trunkGrad)',
                barkDark,
                cd >= 306 ? clamp((cd - 306) / 22, 0, 0.92) : 0
              )}

              <g className={cd < 305 ? 'canopy-breath' : undefined}>
                {renderClusterLayer('mid')}
                {renderClusterLayer('front')}
              </g>

              {isBudStage &&
                BLOSSOM_NODES.map((node) => {
                  const pos = getAnchorPoint(skel, node.branchId, node.branchT, node.ox, node.oy);
                  if (!pos) return null;
                  const localProgress = clamp(budProgress * 1.15 - (node.dayOffset + 2) * 0.04, 0.15, 1);
                  return (
                    <g
                      key={`bud-${node.id}`}
                      transform={`translate(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}) rotate(${node.rot}) scale(${(
                        node.scale *
                        (0.35 + localProgress * 0.65)
                      ).toFixed(2)})`}
                    >
                      <path
                        d="M0 0 C-3.8 -3.5, -3.5 -9, 0 -11.5 C3.5 -9, 3.8 -3.5, 0 0 Z"
                        fill={localProgress > 0.55 ? '#FBCFE8' : '#DCFCE7'}
                        stroke="#F472B6"
                        strokeOpacity="0.4"
                        strokeWidth="0.5"
                      />
                      <path d="M-2.8 0 Q0 2.5 2.8 0 L0 -2 Z" fill="#15803D" />
                    </g>
                  );
                })}

              {isFlowerStage &&
                BLOSSOM_NODES.map((node) => {
                  const pos = getAnchorPoint(skel, node.branchId, node.branchT, node.ox, node.oy);
                  if (!pos) return null;
                  const startDay = 178 + node.dayOffset;
                  if (cd < startDay) return null;
                  const open = clamp((cd - startDay) / 6, 0.25, 1);
                  const wither =
                    cd > 214 + node.dayOffset ? clamp((cd - (214 + node.dayOffset)) / 20, 0, 1) : 0;
                  const op = 1 - wither * 0.9;
                  if (op <= 0.05) return null;

                  return (
                    <g
                      key={`fl-${node.id}`}
                      transform={`translate(${pos.x.toFixed(1)}, ${(pos.y + wither * 3).toFixed(1)}) rotate(${
                        node.rot + wither * 12
                      }) scale(${(node.scale * (0.55 + open * 0.48)).toFixed(2)})`}
                      opacity={op}
                    >
                      {[0, 72, 144, 216, 288].map((deg) => (
                        <g key={deg} transform={`rotate(${deg + wither * 10}) translate(0, ${-2.4 * open})`}>
                          <path
                            d="M0 1.2 C-4.2 -2.8, -4.8 -9.5, -1.2 -11.2 L0 -9.6 L1.2 -11.2 C4.8 -9.5, 4.2 -2.8, 0 1.2 Z"
                            fill="url(#petalOuter)"
                            stroke="#F9A8D4"
                            strokeOpacity="0.45"
                            strokeWidth="0.4"
                          />
                        </g>
                      ))}
                      <circle cx="0" cy="0" r="2.6" fill="#FDE047" />
                      <circle cx="0" cy="0" r="1.1" fill="#CA8A04" />
                    </g>
                  );
                })}

              {isBerryStage &&
                BLOSSOM_NODES.filter((n) => n.hasBerry).map((node) => {
                  const pos = getAnchorPoint(skel, node.branchId, node.branchT, node.ox, node.oy);
                  if (!pos) return null;
                  return (
                    <g key={`berry-${node.id}`} transform={`translate(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})`}>
                      <line x1="0" y1="0" x2="0" y2="4" stroke="#78350F" strokeWidth="0.8" />
                      <circle
                        cx="0"
                        cy="5.5"
                        r={lerp(2.0, 3.1, berryMaturity)}
                        fill={lerpColor('#65A30D', '#DC2626', berryMaturity)}
                      />
                      <circle cx="-0.8" cy="4.6" r="0.7" fill="#FFFFFF" opacity="0.5" />
                    </g>
                  );
                })}
            </g>
          </g>
        )}

        {/* 蝶 */}
        {cd >= 178 && cd <= 232 && (
          <g transform="translate(332, 108)">
            <g className="butterfly-hover">
              <path d="M0 0 C-7 -8, -11 0, -4 4 C-9 6, -5 11, 0 5 Z" fill="#FDE047" opacity="0.88" />
              <path d="M0 0 C7 -8, 11 0, 4 4 C9 6, 5 11, 0 5 Z" fill="#FEF08A" opacity="0.88" />
              <line x1="0" y1="-2" x2="0" y2="6" stroke="#78350F" strokeWidth="1" strokeLinecap="round" />
            </g>
          </g>
        )}

        {/* 光の粒子 */}
        {cd >= 1 && cd <= 165 && (
          <g fill={cd <= 75 ? '#BEF264' : '#FEF08A'} opacity="0.72">
            <circle cx="204" cy="182" r="1.8" />
            <circle cx="316" cy="156" r="2.1" />
            <circle cx="288" cy="204" r="1.4" />
            <circle cx="176" cy="148" r="1.6" />
          </g>
        )}

        {/* 舞う花びら */}
        {cd >= 180 && cd <= 238 && (
          <g>
            <g className="petal-fall-a">
              <path d="M220 112 C226 108, 230 116, 223 120 C219 119, 217 115, 220 112 Z" fill="#FDF2F8" />
              <path d="M312 138 C318 134, 322 142, 315 146 C311 145, 309 141, 312 138 Z" fill="#FBCFE8" />
            </g>
            <g className="petal-fall-b">
              <path d="M276 92 C282 88, 286 96, 279 100 C275 99, 273 95, 276 92 Z" fill="#FFFFFF" />
              <path d="M188 148 C194 144, 198 152, 191 156 C187 155, 185 151, 188 148 Z" fill="#FBCFE8" />
            </g>
          </g>
        )}

        {/* 落ち葉 */}
        {cd >= 265 && cd <= 352 && (
          <g opacity={cd > 330 ? clamp(1 - (cd - 330) / 25, 0.25, 0.85) : 0.9}>
            {[
              { day: 265, x: 174, y: 263, c: '#EA580C' },
              { day: 272, x: 202, y: 265, c: '#CA8A04' },
              { day: 278, x: 228, y: 256, c: '#DC2626' },
              { day: 284, x: 248, y: 258, c: '#B45309' },
              { day: 290, x: 276, y: 257, c: '#EA580C' },
              { day: 296, x: 294, y: 261, c: '#CA8A04' },
              { day: 304, x: 326, y: 266, c: '#9A3412' },
              { day: 312, x: 344, y: 268, c: '#B45309' },
            ]
              .filter((lf) => cd >= lf.day)
              .map((lf, idx) => (
                <path
                  key={`ground-leaf-${idx}`}
                  d={`M ${lf.x} ${lf.y} C ${lf.x + 5} ${lf.y - 3}, ${lf.x + 11} ${lf.y - 2}, ${lf.x + 13} ${lf.y} C ${lf.x + 9} ${lf.y + 3}, ${lf.x + 4} ${lf.y + 2}, ${lf.x} ${lf.y} Z`}
                  fill={cd > 318 ? '#786B5E' : lf.c}
                />
              ))}
          </g>
        )}

        {/* 降雪 */}
        {cd >= 302 && (
          <g fill="#FFFFFF">
            <g className="petal-fall-a" opacity="0.85">
              <circle cx="118" cy="72" r="2.1" />
              <circle cx="224" cy="54" r="1.8" />
              <circle cx="332" cy="86" r="2.3" />
              <circle cx="408" cy="112" r="1.6" />
            </g>
            <g className="petal-fall-b" opacity="0.75">
              <circle cx="164" cy="96" r="1.7" />
              <circle cx="284" cy="68" r="2.2" />
              <circle cx="366" cy="58" r="1.5" />
              <circle cx="96" cy="136" r="1.9" />
            </g>
          </g>
        )}

        {cd >= 325 && (
          <g>
            <path d="M234 259 L246 256 M241 257 L245 253" stroke="#574C43" strokeWidth="1.2" strokeLinecap="round" />
            <ellipse cx="268" cy="254" rx="2.8" ry="1.8" fill="#78350F" />
            <ellipse cx="248" cy="255" rx="2.0" ry="1.3" fill="#451A03" />
          </g>
        )}
      </svg>

      {/* 季節バッジ */}
      <div className="absolute top-3.5 left-3.5 flex flex-col gap-1">
        <span
          className={`inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-xs ${meta.badgeClass}`}
        >
          <span>{meta.seasonEn}</span>
        </span>
        <span
          className={`text-[11px] font-medium pl-1 ${
            nightFactor > 0.5
              ? 'text-slate-100/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]'
              : 'text-slate-700/90 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]'
          }`}
        >
          {meta.seasonJa}
        </span>
      </div>

      {/* サイクル・日数カウンター */}
      <div className="absolute top-3.5 right-3.5 text-right bg-white/75 backdrop-blur-xs px-2.5 py-1.5 rounded-xl border border-slate-200/70">
        <div className="text-[10px] font-medium text-slate-400">
          Cycle {String(cycle).padStart(2, '0')}
        </div>
        <div className="text-xs font-semibold text-slate-900 tabular-nums">
          {days === 0 ? 'Day 0 / 360' : `Day ${cd} / 360`}
        </div>
      </div>
    </div>
  );
}