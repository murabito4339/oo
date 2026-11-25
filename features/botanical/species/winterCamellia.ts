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
    id: 'wc1-lower-left',
    appearDay: 24,
    fullDay: 80,
    trunkT: 0.42,
    side: -1,
    dx: -76,
    dy: -10,
    cdx: -36,
    cdy: 2,
    w0: 5.8,
    w1: 1.8,
    twigs: [
      { appearDay: 50, fromT: 0.52, dx: -28, dy: -16, w: 1.6 },
      { appearDay: 64, fromT: 0.76, dx: -26, dy: 10, w: 1.4 },
    ],
  },
  {
    id: 'wc2-lower-right',
    appearDay: 28,
    fullDay: 84,
    trunkT: 0.46,
    side: 1,
    dx: 76,
    dy: -12,
    cdx: 36,
    cdy: 0,
    w0: 5.6,
    w1: 1.8,
    twigs: [
      { appearDay: 54, fromT: 0.54, dx: 28, dy: -16, w: 1.6 },
      { appearDay: 68, fromT: 0.78, dx: 26, dy: 10, w: 1.4 },
    ],
  },
  {
    id: 'wc3-mid-left',
    appearDay: 40,
    fullDay: 98,
    trunkT: 0.7,
    side: -1,
    dx: -56,
    dy: -18,
    cdx: -26,
    cdy: -4,
    w0: 4.8,
    w1: 1.5,
    twigs: [{ appearDay: 72, fromT: 0.56, dx: -22, dy: -16, w: 1.3 }],
  },
  {
    id: 'wc4-mid-right',
    appearDay: 44,
    fullDay: 102,
    trunkT: 0.74,
    side: 1,
    dx: 58,
    dy: -18,
    cdx: 28,
    cdy: -4,
    w0: 4.6,
    w1: 1.5,
    twigs: [{ appearDay: 76, fromT: 0.56, dx: 22, dy: -16, w: 1.3 }],
  },
  {
    id: 'wc5-upper-left',
    appearDay: 58,
    fullDay: 118,
    trunkT: 1.0,
    side: -1,
    dx: -38,
    dy: -24,
    cdx: -18,
    cdy: -8,
    w0: 3.6,
    w1: 1.2,
  },
  {
    id: 'wc6-upper-right',
    appearDay: 62,
    fullDay: 122,
    trunkT: 1.02,
    side: 1,
    dx: 40,
    dy: -24,
    cdx: 18,
    cdy: -8,
    w0: 3.5,
    w1: 1.2,
  },
  {
    id: 'wc7-crown-left',
    appearDay: 76,
    fullDay: 134,
    trunkT: 1.44,
    side: -1,
    dx: -18,
    dy: -22,
    cdx: -8,
    cdy: -10,
    w0: 2.6,
    w1: 1.0,
  },
  {
    id: 'wc8-crown-right',
    appearDay: 80,
    fullDay: 138,
    trunkT: 1.48,
    side: 1,
    dx: 20,
    dy: -22,
    cdx: 10,
    cdy: -10,
    w0: 2.5,
    w1: 1.0,
  },
];

const CLUSTERS: CanopyClusterSpec[] = [
  { id: 'wc-b1', branchId: 'wc1-lower-left', branchT: 0.78, ox: -4, oy: -8, r: 28, appearDay: 32, fallDay: 360, layer: 'back', toneOffset: 0.0, leafAngles: [175, 205, 240] },
  { id: 'wc-b2', branchId: 'wc2-lower-right', branchT: 0.78, ox: 4, oy: -8, r: 28, appearDay: 36, fallDay: 360, layer: 'back', toneOffset: 0.14, leafAngles: [-5, 25, 325] },
  { id: 'wc-b3', branchId: 'wc3-mid-left', branchT: 0.68, ox: -2, oy: -8, r: 26, appearDay: 48, fallDay: 360, layer: 'back', toneOffset: 0.26, leafAngles: [185, 225] },
  { id: 'wc-b4', branchId: 'wc4-mid-right', branchT: 0.68, ox: 2, oy: -8, r: 26, appearDay: 52, fallDay: 360, layer: 'back', toneOffset: 0.1, leafAngles: [315, 355] },
  { id: 'wc-b5', branchId: 'leader', branchT: 0.58, ox: 0, oy: -4, r: 28, appearDay: 62, fallDay: 360, layer: 'back', toneOffset: 0.2, leafAngles: [250, 290] },
  { id: 'wc-m1', branchId: 'wc1-lower-left', branchT: 1.0, ox: -8, oy: -2, r: 24, appearDay: 36, fallDay: 360, layer: 'mid', toneOffset: 0.22, leafAngles: [160, 195, 230] },
  { id: 'wc-m2', branchId: 'wc1-lower-left', branchT: 0.52, ox: -4, oy: -6, r: 26, appearDay: 30, fallDay: 360, layer: 'mid', toneOffset: 0.08, leafAngles: [155, 200] },
  { id: 'wc-m3', branchId: 'wc2-lower-right', branchT: 1.0, ox: 8, oy: -2, r: 24, appearDay: 40, fallDay: 360, layer: 'mid', toneOffset: 0.3, leafAngles: [-15, 15, 45] },
  { id: 'wc-m4', branchId: 'wc2-lower-right', branchT: 0.52, ox: 4, oy: -6, r: 26, appearDay: 34, fallDay: 360, layer: 'mid', toneOffset: 0.12, leafAngles: [15, 340] },
  { id: 'wc-m5', branchId: 'wc3-mid-left', branchT: 0.96, ox: -4, oy: -2, r: 24, appearDay: 46, fallDay: 360, layer: 'mid', toneOffset: 0.34, leafAngles: [180, 215, 250] },
  { id: 'wc-m6', branchId: 'wc4-mid-right', branchT: 0.96, ox: 4, oy: -2, r: 24, appearDay: 50, fallDay: 360, layer: 'mid', toneOffset: 0.16, leafAngles: [-30, 5, 35] },
  { id: 'wc-m7', branchId: 'wc5-upper-left', branchT: 0.92, ox: 0, oy: -4, r: 22, appearDay: 64, fallDay: 360, layer: 'mid', toneOffset: 0.24, leafAngles: [210, 245, 280] },
  { id: 'wc-m8', branchId: 'wc6-upper-right', branchT: 0.92, ox: 0, oy: -4, r: 22, appearDay: 68, fallDay: 360, layer: 'mid', toneOffset: 0.06, leafAngles: [280, 315, 350] },
  { id: 'wc-m9', branchId: 'leader', branchT: 1.0, ox: 0, oy: -8, r: 22, appearDay: 78, fallDay: 360, layer: 'mid', toneOffset: 0.2, leafAngles: [245, 270, 295] },
  { id: 'wc-f1', branchId: 'wc1-lower-left', branchT: 0.84, ox: -2, oy: -12, r: 22, appearDay: 54, fallDay: 360, layer: 'front', toneOffset: 0.28, leafAngles: [170, 210, 245] },
  { id: 'wc-f2', branchId: 'wc2-lower-right', branchT: 0.84, ox: 2, oy: -12, r: 22, appearDay: 58, fallDay: 360, layer: 'front', toneOffset: 0.14, leafAngles: [-20, 15, 320] },
  { id: 'wc-f3', branchId: 'wc3-mid-left', branchT: 0.48, ox: 4, oy: -10, r: 22, appearDay: 56, fallDay: 360, layer: 'front', toneOffset: 0.05, leafAngles: [200, 240] },
  { id: 'wc-f4', branchId: 'wc4-mid-right', branchT: 0.48, ox: -4, oy: -10, r: 22, appearDay: 60, fallDay: 360, layer: 'front', toneOffset: 0.32, leafAngles: [300, 340] },
  { id: 'wc-f5', branchId: 'leader', branchT: 0.52, ox: 0, oy: -2, r: 22, appearDay: 72, fallDay: 360, layer: 'front', toneOffset: 0.18, leafAngles: [230, 270, 310] },
  { id: 'wc-f6', branchId: 'wc8-crown-right', branchT: 0.88, ox: -2, oy: -2, r: 18, appearDay: 84, fallDay: 360, layer: 'front', toneOffset: 0.16, leafAngles: [260, 295, 330] },
];

const BLOSSOMS: BlossomNodeSpec[] = [
  { id: 'wc-fl-1', branchId: 'wc1-lower-left', branchT: 0.96, ox: -10, oy: -2, scale: 1.05, rot: -16, dayOffset: 0, hasBerry: true },
  { id: 'wc-fl-2', branchId: 'wc1-lower-left', branchT: 0.65, ox: -4, oy: -10, scale: 1.0, rot: 14, dayOffset: -1 },
  { id: 'wc-fl-3', branchId: 'wc2-lower-right', branchT: 0.96, ox: 10, oy: -2, scale: 1.08, rot: 18, dayOffset: 1, hasBerry: true },
  { id: 'wc-fl-4', branchId: 'wc2-lower-right', branchT: 0.65, ox: 4, oy: -10, scale: 0.96, rot: -14, dayOffset: 0 },
  { id: 'wc-fl-5', branchId: 'wc3-mid-left', branchT: 0.92, ox: -4, oy: -4, scale: 1.12, rot: -12, dayOffset: 0, hasBerry: true },
  { id: 'wc-fl-6', branchId: 'wc3-mid-left', branchT: 0.56, ox: 0, oy: -8, scale: 0.92, rot: 20, dayOffset: 2 },
  { id: 'wc-fl-7', branchId: 'wc4-mid-right', branchT: 0.92, ox: 4, oy: -4, scale: 1.12, rot: 16, dayOffset: -1, hasBerry: true },
  { id: 'wc-fl-8', branchId: 'wc4-mid-right', branchT: 0.56, ox: 0, oy: -8, scale: 0.92, rot: -18, dayOffset: 2 },
  { id: 'wc-fl-9', branchId: 'wc5-upper-left', branchT: 0.92, ox: -2, oy: -4, scale: 1.06, rot: -8, dayOffset: -2, hasBerry: true },
  { id: 'wc-fl-10', branchId: 'wc6-upper-right', branchT: 0.92, ox: 2, oy: -4, scale: 1.06, rot: 12, dayOffset: 1 },
  { id: 'wc-fl-11', branchId: 'wc7-crown-left', branchT: 0.9, ox: -2, oy: -2, scale: 0.98, rot: -12, dayOffset: 0, hasBerry: true },
  { id: 'wc-fl-12', branchId: 'leader', branchT: 0.95, ox: 0, oy: -8, scale: 1.16, rot: 6, dayOffset: -1 },
  { id: 'wc-fl-13', branchId: 'wc8-crown-right', branchT: 0.9, ox: 2, oy: -2, scale: 0.98, rot: 22, dayOffset: 1, hasBerry: true },
  { id: 'wc-fl-14', branchId: 'leader', branchT: 0.54, ox: 2, oy: -2, scale: 1.02, rot: 18, dayOffset: 0 },
];

export const winterCamelliaSpecies: SpeciesConfig = {
  id: 'winter',
  labelJa: '常緑松・寒椿',
  labelEn: 'Evergreen & Camellia',
  shortTag: '冬〜開始種',
  descTheme: '雪の中でも青々と茂り、真紅の寒椿を咲かせる常緑樹',
  leafShape: 'needle',
  flowerStyle: 'camellia',
  fruitStyle: 'camelliaNut',
  isEvergreen: true,
  trunkHeightScale: 1.06,
  trunkThicknessScale: 1.02,
  sproutColors: {
    stem: '#14532D',
    cotyledon: '#10B981',
    cotyledonStroke: '#064E3B',
    leaf: '#059669',
    leafStroke: '#064E3B',
    tipLeaf: '#34D399',
  },
  branches: BRANCHES,
  clusters: CLUSTERS,
  blossoms: BLOSSOMS,
  bloomSchedule: {
    budStart: 128,
    flowerStart: 175,
    flowerWitherStart: 220,
    flowerEnd: 245,
    fruitStart: 232,
    fruitEnd: 315,
  },
  getBarkPalette(cd, env) {
    let dark = '#3E2E26';
    let light = '#6B5244';
    if (cd <= 36) {
      const t = cd / 36;
      dark = lerpColor('#14532D', '#3E2E26', t);
      light = lerpColor('#10B981', '#6B5244', t);
    } else if (cd >= 295) {
      const t = clamp((cd - 295) / 65, 0, 1);
      dark = lerpColor('#3E2E26', '#332B26', t);
      light = lerpColor('#6B5244', '#5C5048', t);
    }
    return {
      dark: tintForTime(dark, env.nightFactor, '#141B29', 0.72),
      light: tintForTime(light, env.nightFactor, '#475569', 0.62),
    };
  },
  getFoliagePalette(cd, toneOffset, env) {
    let pal: FoliagePalette;
    if (cd <= 52) {
      const t = clamp(cd / 52, 0, 1);
      pal = {
        back: lerpColor('#14532D', '#064E3B', t),
        mid1: lerpColor('#34D399', '#10B981', t),
        mid2: lerpColor('#166534', '#065F46', t),
        front1: lerpColor('#6EE7B7', '#34D399', t),
        front2: lerpColor('#10B981', '#047857', t),
        vein: '#D1FAE5',
      };
    } else {
      const t = clamp((cd - 52) / 240, 0, 1);
      pal = {
        back: lerpColor('#064E3B', '#052E16', t * 0.6),
        mid1: lerpColor('#10B981', '#059669', t * 0.5 + toneOffset * 0.2),
        mid2: lerpColor('#065F46', '#064E3B', t * 0.6),
        front1: lerpColor('#34D399', '#10B981', t * 0.45),
        front2: lerpColor('#047857', '#065F46', t * 0.5),
        vein: '#A7F3D0',
      };
    }

    if (env.snowLevel > 0.2) {
      const w = env.snowLevel * 0.26;
      pal = {
        back: lerpColor(pal.back, '#0F2922', w),
        mid1: lerpColor(pal.mid1, '#4B8B7B', w),
        mid2: lerpColor(pal.mid2, '#1E4A3F', w),
        front1: lerpColor(pal.front1, '#99C2B6', w),
        front2: lerpColor(pal.front2, '#2D6354', w),
        vein: lerpColor(pal.vein, '#E2E8F0', w),
      };
    }
    if (env.twilightFactor > 0) {
      pal = {
        back: lerpColor(pal.back, '#1E293B', env.twilightFactor * 0.22),
        mid1: lerpColor(pal.mid1, '#D97706', env.twilightFactor * 0.16),
        mid2: lerpColor(pal.mid2, '#334155', env.twilightFactor * 0.18),
        front1: lerpColor(pal.front1, '#FDE68A', env.twilightFactor * 0.24),
        front2: lerpColor(pal.front2, '#B45309', env.twilightFactor * 0.16),
        vein: lerpColor(pal.vein, '#FEF3C7', env.twilightFactor * 0.3),
      };
    }
    if (env.nightFactor > 0) {
      pal = {
        back: lerpColor(pal.back, '#0B1320', env.nightFactor * 0.74),
        mid1: lerpColor(pal.mid1, '#1E3F4A', env.nightFactor * 0.64),
        mid2: lerpColor(pal.mid2, '#102730', env.nightFactor * 0.7),
        front1: lerpColor(pal.front1, '#4A7582', env.nightFactor * 0.54),
        front2: lerpColor(pal.front2, '#234D59', env.nightFactor * 0.62),
        vein: lerpColor(pal.vein, '#93C5FD', env.nightFactor * 0.6),
      };
    }
    return pal;
  },
  getClusterGrowth(cd, cluster) {
    if (cd < cluster.appearDay) {
      return { visible: false, grow: 0, fold: 1, droop: 0, shrink: 0, opacity: 0, fallingProgress: null };
    }
    const grow = clamp((cd - cluster.appearDay) / 20, 0.2, 1);
    const fold = clamp(1 - (cd - cluster.appearDay) / 16, 0, 1);
    const restT = cd >= 315 ? clamp((cd - 315) / 45, 0, 1) : 0;
    return {
      visible: true,
      grow,
      fold,
      droop: restT * 1.8,
      shrink: restT * 0.1,
      opacity: 1 - restT * 0.06,
      fallingProgress: null,
    };
  },
};
