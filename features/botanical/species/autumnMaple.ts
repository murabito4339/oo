import type {
  BlossomNodeSpec,
  BranchSpec,
  CanopyClusterSpec,
  FoliagePalette,
  SpeciesConfig,
} from '../types';
import { clamp, lerpColor, tintForTime } from '../utils';

const BRANCHES: BranchSpec[] = [
  {
    id: 'mp1-lower-left',
    appearDay: 24,
    fullDay: 84,
    trunkT: 0.45,
    side: -1,
    dx: -80,
    dy: -22,
    cdx: -38,
    cdy: -6,
    w0: 5.4,
    w1: 1.6,
    twigs: [
      { appearDay: 50, fromT: 0.52, dx: -34, dy: -22, w: 1.5 },
      { appearDay: 64, fromT: 0.76, dx: -30, dy: 12, w: 1.3 },
    ],
  },
  {
    id: 'mp2-lower-right',
    appearDay: 28,
    fullDay: 88,
    trunkT: 0.52,
    side: 1,
    dx: 82,
    dy: -24,
    cdx: 40,
    cdy: -8,
    w0: 5.2,
    w1: 1.6,
    twigs: [
      { appearDay: 54, fromT: 0.55, dx: 34, dy: -24, w: 1.5 },
      { appearDay: 68, fromT: 0.78, dx: 28, dy: 10, w: 1.3 },
    ],
  },
  {
    id: 'mp3-mid-left',
    appearDay: 42,
    fullDay: 102,
    trunkT: 0.72,
    side: -1,
    dx: -66,
    dy: -34,
    cdx: -28,
    cdy: -14,
    w0: 4.4,
    w1: 1.4,
    twigs: [{ appearDay: 76, fromT: 0.58, dx: -28, dy: -26, w: 1.2 }],
  },
  {
    id: 'mp4-mid-right',
    appearDay: 46,
    fullDay: 106,
    trunkT: 0.78,
    side: 1,
    dx: 68,
    dy: -32,
    cdx: 30,
    cdy: -14,
    w0: 4.3,
    w1: 1.4,
    twigs: [{ appearDay: 80, fromT: 0.58, dx: 28, dy: -24, w: 1.2 }],
  },
  {
    id: 'mp5-upper-left',
    appearDay: 60,
    fullDay: 120,
    trunkT: 1.0,
    side: -1,
    dx: -42,
    dy: -38,
    cdx: -18,
    cdy: -18,
    w0: 3.2,
    w1: 1.1,
  },
  {
    id: 'mp6-upper-right',
    appearDay: 66,
    fullDay: 126,
    trunkT: 1.02,
    side: 1,
    dx: 44,
    dy: -38,
    cdx: 20,
    cdy: -18,
    w0: 3.1,
    w1: 1.1,
  },
  {
    id: 'mp7-crown-left',
    appearDay: 78,
    fullDay: 136,
    trunkT: 1.44,
    side: -1,
    dx: -20,
    dy: -30,
    cdx: -10,
    cdy: -16,
    w0: 2.3,
    w1: 0.9,
  },
  {
    id: 'mp8-crown-right',
    appearDay: 84,
    fullDay: 140,
    trunkT: 1.48,
    side: 1,
    dx: 22,
    dy: -28,
    cdx: 12,
    cdy: -14,
    w0: 2.2,
    w1: 0.9,
  },
];

const CLUSTERS: CanopyClusterSpec[] = [
  { id: 'mc-b1', branchId: 'mp1-lower-left', branchT: 0.85, ox: -6, oy: -10, r: 28, appearDay: 34, fallDay: 298, layer: 'back', toneOffset: 0.0, leafAngles: [180, 220, 255] },
  { id: 'mc-b2', branchId: 'mp2-lower-right', branchT: 0.85, ox: 6, oy: -10, r: 28, appearDay: 38, fallDay: 302, layer: 'back', toneOffset: 0.25, leafAngles: [-10, 30, 320] },
  { id: 'mc-b3', branchId: 'mp3-mid-left', branchT: 0.72, ox: -2, oy: -8, r: 28, appearDay: 50, fallDay: 306, layer: 'back', toneOffset: 0.45, leafAngles: [195, 240] },
  { id: 'mc-b4', branchId: 'mp4-mid-right', branchT: 0.72, ox: 2, oy: -8, r: 28, appearDay: 54, fallDay: 310, layer: 'back', toneOffset: 0.15, leafAngles: [310, 350] },
  { id: 'mc-b5', branchId: 'leader', branchT: 0.65, ox: 0, oy: -4, r: 30, appearDay: 64, fallDay: 314, layer: 'back', toneOffset: 0.35, leafAngles: [255, 285] },
  { id: 'mc-m1', branchId: 'mp1-lower-left', branchT: 1.0, ox: -12, oy: 2, r: 23, appearDay: 38, fallDay: 294, layer: 'mid', toneOffset: 0.42, leafAngles: [155, 195, 230] },
  { id: 'mc-m2', branchId: 'mp1-lower-left', branchT: 0.62, ox: -4, oy: -8, r: 25, appearDay: 32, fallDay: 298, layer: 'mid', toneOffset: 0.12, leafAngles: [140, 210] },
  { id: 'mc-m3', branchId: 'mp2-lower-right', branchT: 1.0, ox: 12, oy: 2, r: 23, appearDay: 42, fallDay: 298, layer: 'mid', toneOffset: 0.38, leafAngles: [-20, 15, 50] },
  { id: 'mc-m4', branchId: 'mp2-lower-right', branchT: 0.62, ox: 4, oy: -8, r: 25, appearDay: 36, fallDay: 304, layer: 'mid', toneOffset: 0.08, leafAngles: [20, 330] },
  { id: 'mc-m5', branchId: 'mp3-mid-left', branchT: 0.98, ox: -6, oy: -2, r: 26, appearDay: 48, fallDay: 308, layer: 'mid', toneOffset: 0.52, leafAngles: [185, 220, 255] },
  { id: 'mc-m6', branchId: 'mp4-mid-right', branchT: 0.98, ox: 6, oy: -2, r: 26, appearDay: 52, fallDay: 312, layer: 'mid', toneOffset: 0.22, leafAngles: [-35, 5, 35] },
  { id: 'mc-m7', branchId: 'mp5-upper-left', branchT: 0.95, ox: 0, oy: -4, r: 24, appearDay: 66, fallDay: 316, layer: 'mid', toneOffset: 0.32, leafAngles: [215, 250, 285] },
  { id: 'mc-m8', branchId: 'mp6-upper-right', branchT: 0.95, ox: 0, oy: -4, r: 24, appearDay: 70, fallDay: 318, layer: 'mid', toneOffset: 0.16, leafAngles: [275, 310, 345] },
  { id: 'mc-m9', branchId: 'leader', branchT: 1.0, ox: 0, oy: -6, r: 25, appearDay: 80, fallDay: 324, layer: 'mid', toneOffset: 0.48, leafAngles: [240, 270, 300] },
  { id: 'mc-f1', branchId: 'mp1-lower-left', branchT: 0.88, ox: -4, oy: -14, r: 21, appearDay: 56, fallDay: 302, layer: 'front', toneOffset: 0.44, leafAngles: [170, 215, 250] },
  { id: 'mc-f2', branchId: 'mp2-lower-right', branchT: 0.88, ox: 4, oy: -14, r: 21, appearDay: 60, fallDay: 306, layer: 'front', toneOffset: 0.18, leafAngles: [-25, 10, 315] },
  { id: 'mc-f3', branchId: 'mp3-mid-left', branchT: 0.48, ox: 4, oy: -10, r: 22, appearDay: 58, fallDay: 312, layer: 'front', toneOffset: 0.06, leafAngles: [200, 245] },
  { id: 'mc-f4', branchId: 'mp4-mid-right', branchT: 0.48, ox: -4, oy: -10, r: 22, appearDay: 62, fallDay: 316, layer: 'front', toneOffset: 0.36, leafAngles: [295, 340] },
  { id: 'mc-f5', branchId: 'leader', branchT: 0.55, ox: 2, oy: -2, r: 22, appearDay: 74, fallDay: 320, layer: 'front', toneOffset: 0.28, leafAngles: [230, 270, 310] },
  { id: 'mc-f6', branchId: 'mp8-crown-right', branchT: 0.92, ox: -2, oy: 0, r: 20, appearDay: 86, fallDay: 326, layer: 'front', toneOffset: 0.2, leafAngles: [260, 295, 330] },
];

const BLOSSOMS: BlossomNodeSpec[] = [
  { id: 'mp-bl-1', branchId: 'mp1-lower-left', branchT: 1.0, ox: -10, oy: 2, scale: 0.85, rot: -18, dayOffset: 0, hasBerry: true },
  { id: 'mp-bl-2', branchId: 'mp1-lower-left', branchT: 0.72, ox: -4, oy: -10, scale: 0.9, rot: 14, dayOffset: -1, hasBerry: true },
  { id: 'mp-bl-3', branchId: 'mp2-lower-right', branchT: 0.98, ox: 10, oy: 2, scale: 0.85, rot: 22, dayOffset: 1, hasBerry: true },
  { id: 'mp-bl-4', branchId: 'mp2-lower-right', branchT: 0.7, ox: 4, oy: -8, scale: 0.9, rot: -16, dayOffset: 0, hasBerry: true },
  { id: 'mp-bl-5', branchId: 'mp3-mid-left', branchT: 0.96, ox: -4, oy: -4, scale: 0.95, rot: -12, dayOffset: 0, hasBerry: true },
  { id: 'mp-bl-6', branchId: 'mp3-mid-left', branchT: 0.62, ox: 0, oy: -6, scale: 0.82, rot: 18, dayOffset: 2, hasBerry: true },
  { id: 'mp-bl-7', branchId: 'mp4-mid-right', branchT: 0.96, ox: 4, oy: -2, scale: 0.95, rot: 16, dayOffset: -1, hasBerry: true },
  { id: 'mp-bl-8', branchId: 'mp4-mid-right', branchT: 0.6, ox: 0, oy: -6, scale: 0.82, rot: -20, dayOffset: 2, hasBerry: true },
  { id: 'mp-bl-9', branchId: 'mp5-upper-left', branchT: 0.95, ox: 0, oy: -4, scale: 0.92, rot: 8, dayOffset: -2, hasBerry: true },
  { id: 'mp-bl-10', branchId: 'mp6-upper-right', branchT: 0.95, ox: 0, oy: -2, scale: 0.92, rot: -10, dayOffset: 1, hasBerry: true },
  { id: 'mp-bl-11', branchId: 'mp7-crown-left', branchT: 0.95, ox: -2, oy: -2, scale: 0.88, rot: -15, dayOffset: 0, hasBerry: true },
  { id: 'mp-bl-12', branchId: 'leader', branchT: 1.0, ox: 0, oy: -10, scale: 0.98, rot: 6, dayOffset: -1, hasBerry: true },
  { id: 'mp-bl-13', branchId: 'mp8-crown-right', branchT: 0.95, ox: 2, oy: -2, scale: 0.88, rot: 24, dayOffset: 1, hasBerry: true },
  { id: 'mp-bl-14', branchId: 'leader', branchT: 0.65, ox: 2, oy: -2, scale: 0.9, rot: 22, dayOffset: 0, hasBerry: true },
];

export const autumnMapleSpecies: SpeciesConfig = {
  id: 'autumn',
  labelJa: '山楓',
  labelEn: 'Japanese Maple',
  shortTag: '秋〜開始種',
  descTheme: '切れ込みのある葉が黄金と深紅に色づく山楓',
  leafShape: 'maple',
  flowerStyle: 'mapleBlossom',
  fruitStyle: 'acorn',
  isEvergreen: false,
  trunkHeightScale: 0.96,
  trunkThicknessScale: 0.94,
  sproutColors: {
    stem: '#65A30D',
    cotyledon: '#A3E635',
    cotyledonStroke: '#4D7C0F',
    leaf: '#FB923C',
    leafStroke: '#9A3412',
    tipLeaf: '#FDBA74',
  },
  branches: BRANCHES,
  clusters: CLUSTERS,
  blossoms: BLOSSOMS,
  bloomSchedule: {
    budStart: 132,
    flowerStart: 178,
    flowerWitherStart: 210,
    flowerEnd: 234,
    fruitStart: 222,
    fruitEnd: 304,
  },
  getBarkPalette(cd, env) {
    let dark = '#4A3830';
    let light = '#7C6255';
    if (cd <= 36) {
      const t = cd / 36;
      dark = lerpColor('#65A30D', '#4A3830', t);
      light = lerpColor('#A3E635', '#7C6255', t);
    } else if (cd >= 295) {
      const t = clamp((cd - 295) / 65, 0, 1);
      dark = lerpColor('#4A3830', '#3C3532', t);
      light = lerpColor('#7C6255', '#685F59', t);
    }
    return {
      dark: tintForTime(dark, env.nightFactor, '#141B29', 0.72),
      light: tintForTime(light, env.nightFactor, '#475569', 0.62),
    };
  },
  getFoliagePalette(cd, toneOffset, env) {
    const shiftedDay =
      cd >= 165 && cd <= 315 ? cd + toneOffset * 28 - 10 : cd;

    let pal: FoliagePalette;
    if (shiftedDay <= 45) {
      const t = clamp(shiftedDay / 45, 0, 1);
      pal = {
        back: lerpColor('#7C2D12', '#3F6212', t),
        mid1: lerpColor('#FB923C', '#84CC16', t),
        mid2: lerpColor('#C2410C', '#4D7C0F', t),
        front1: lerpColor('#FED7AA', '#BEF264', t),
        front2: lerpColor('#EA580C', '#65A30D', t),
        vein: '#FEF3C7',
      };
    } else if (shiftedDay <= 170) {
      const t = clamp((shiftedDay - 45) / 125, 0, 1);
      pal = {
        back: lerpColor('#3F6212', '#166534', t),
        mid1: lerpColor('#84CC16', '#4ADE80', t),
        mid2: lerpColor('#4D7C0F', '#15803D', t),
        front1: lerpColor('#BEF264', '#86EFAC', t),
        front2: lerpColor('#65A30D', '#22C55E', t),
        vein: '#ECFCCB',
      };
    } else if (shiftedDay <= 228) {
      const t = clamp((shiftedDay - 170) / 58, 0, 1);
      pal = {
        back: lerpColor('#166534', '#92400E', t),
        mid1: lerpColor('#4ADE80', '#FBBF24', t),
        mid2: lerpColor('#15803D', '#D97706', t),
        front1: lerpColor('#86EFAC', '#FDE047', t),
        front2: lerpColor('#22C55E', '#F59E0B', t),
        vein: '#FEF9C3',
      };
    } else if (shiftedDay <= 284) {
      const t = clamp((shiftedDay - 228) / 56, 0, 1);
      pal = {
        back: lerpColor('#92400E', '#7F1D1D', t),
        mid1: lerpColor('#FBBF24', '#EF4444', t),
        mid2: lerpColor('#D97706', '#B91C1C', t),
        front1: lerpColor('#FDE047', '#FB923C', t),
        front2: lerpColor('#F59E0B', '#DC2626', t),
        vein: '#FECACA',
      };
    } else {
      const t = clamp((shiftedDay - 284) / 48, 0, 1);
      pal = {
        back: lerpColor('#7F1D1D', '#523B32', t),
        mid1: lerpColor('#EF4444', '#9A5B3C', t),
        mid2: lerpColor('#B91C1C', '#6E3F2C', t),
        front1: lerpColor('#FB923C', '#B47856', t),
        front2: lerpColor('#DC2626', '#7F4A33', t),
        vein: '#D6D3D1',
      };
    }

    if (env.autumnWarmth > 0.12 && cd < 235) {
      const w = env.autumnWarmth * (0.55 + toneOffset * 0.45);
      pal = {
        back: lerpColor(pal.back, '#7F1D1D', w * 0.55),
        mid1: lerpColor(pal.mid1, '#F97316', w * 0.65),
        mid2: lerpColor(pal.mid2, '#B91C1C', w * 0.6),
        front1: lerpColor(pal.front1, '#FACC15', w * 0.6),
        front2: lerpColor(pal.front2, '#DC2626', w * 0.62),
        vein: lerpColor(pal.vein, '#FED7AA', w * 0.6),
      };
    }
    if (env.snowLevel > 0.3) {
      const w = env.snowLevel * 0.3;
      pal = {
        back: lerpColor(pal.back, '#574B46', w),
        mid1: lerpColor(pal.mid1, '#A88978', w),
        mid2: lerpColor(pal.mid2, '#785E52', w),
        front1: lerpColor(pal.front1, '#C4A492', w),
        front2: lerpColor(pal.front2, '#8E6D5D', w),
        vein: pal.vein,
      };
    }
    if (env.twilightFactor > 0) {
      pal = {
        back: lerpColor(pal.back, '#431407', env.twilightFactor * 0.24),
        mid1: lerpColor(pal.mid1, '#FB923C', env.twilightFactor * 0.26),
        mid2: lerpColor(pal.mid2, '#9A3412', env.twilightFactor * 0.24),
        front1: lerpColor(pal.front1, '#FDE68A', env.twilightFactor * 0.32),
        front2: lerpColor(pal.front2, '#EA580C', env.twilightFactor * 0.25),
        vein: lerpColor(pal.vein, '#FEF3C7', env.twilightFactor * 0.36),
      };
    }
    if (env.nightFactor > 0) {
      pal = {
        back: lerpColor(pal.back, '#0B1320', env.nightFactor * 0.74),
        mid1: lerpColor(pal.mid1, '#3B2F4A', env.nightFactor * 0.66),
        mid2: lerpColor(pal.mid2, '#241F33', env.nightFactor * 0.7),
        front1: lerpColor(pal.front1, '#755B75', env.nightFactor * 0.58),
        front2: lerpColor(pal.front2, '#4D3B54', env.nightFactor * 0.64),
        vein: lerpColor(pal.vein, '#93C5FD', env.nightFactor * 0.6),
      };
    }
    return pal;
  },
  getClusterGrowth(cd, cluster) {
    if (cd < cluster.appearDay) {
      return { visible: false, grow: 0, fold: 1, droop: 0, shrink: 0, opacity: 0, fallingProgress: null };
    }
    const afterFall = cd - cluster.fallDay;
    if (afterFall >= 0) {
      if (cluster.layer === 'back' || afterFall > 22) {
        return { visible: false, grow: 1, fold: 0, droop: 0, shrink: 1, opacity: 0, fallingProgress: null };
      }
      return {
        visible: true,
        grow: 1,
        fold: 0,
        droop: 0,
        shrink: 0,
        opacity: 1,
        fallingProgress: afterFall,
      };
    }
    const grow = clamp((cd - cluster.appearDay) / 22, 0.18, 1);
    const fold = clamp(1 - (cd - cluster.appearDay) / 18, 0, 1);
    const witherT = clamp((cd - (cluster.fallDay - 26)) / 26, 0, 1);
    return {
      visible: true,
      grow,
      fold,
      droop: witherT * 5.2,
      shrink: witherT * 0.22,
      opacity: 1 - witherT * 0.16,
      fallingProgress: null,
    };
  },
};
