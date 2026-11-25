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
    id: 'hb1-lower-left',
    appearDay: 24,
    fullDay: 80,
    trunkT: 0.44,
    side: -1,
    dx: -76,
    dy: -40,
    cdx: -36,
    cdy: -14,
    w0: 6.4,
    w1: 2.2,
    twigs: [
      { appearDay: 50, fromT: 0.54, dx: -34, dy: -32, w: 1.9 },
      { appearDay: 64, fromT: 0.78, dx: -28, dy: 4, w: 1.5 },
    ],
  },
  {
    id: 'hb2-lower-right',
    appearDay: 28,
    fullDay: 84,
    trunkT: 0.5,
    side: 1,
    dx: 78,
    dy: -38,
    cdx: 38,
    cdy: -12,
    w0: 6.2,
    w1: 2.1,
    twigs: [
      { appearDay: 54, fromT: 0.56, dx: 36, dy: -32, w: 1.8 },
      { appearDay: 68, fromT: 0.78, dx: 30, dy: 4, w: 1.5 },
    ],
  },
  {
    id: 'hb3-mid-left',
    appearDay: 40,
    fullDay: 98,
    trunkT: 0.72,
    side: -1,
    dx: -64,
    dy: -48,
    cdx: -28,
    cdy: -22,
    w0: 5.2,
    w1: 1.8,
    twigs: [{ appearDay: 74, fromT: 0.58, dx: -26, dy: -32, w: 1.5 }],
  },
  {
    id: 'hb4-mid-right',
    appearDay: 44,
    fullDay: 102,
    trunkT: 0.76,
    side: 1,
    dx: 66,
    dy: -46,
    cdx: 30,
    cdy: -20,
    w0: 5.0,
    w1: 1.8,
    twigs: [{ appearDay: 78, fromT: 0.58, dx: 28, dy: -30, w: 1.5 }],
  },
  {
    id: 'hb5-upper-left',
    appearDay: 58,
    fullDay: 118,
    trunkT: 1.0,
    side: -1,
    dx: -42,
    dy: -46,
    cdx: -18,
    cdy: -24,
    w0: 3.8,
    w1: 1.4,
  },
  {
    id: 'hb6-upper-right',
    appearDay: 62,
    fullDay: 122,
    trunkT: 1.02,
    side: 1,
    dx: 44,
    dy: -46,
    cdx: 20,
    cdy: -24,
    w0: 3.7,
    w1: 1.4,
  },
  {
    id: 'hb7-crown-left',
    appearDay: 76,
    fullDay: 132,
    trunkT: 1.42,
    side: -1,
    dx: -20,
    dy: -34,
    cdx: -10,
    cdy: -18,
    w0: 2.8,
    w1: 1.2,
  },
  {
    id: 'hb8-crown-right',
    appearDay: 80,
    fullDay: 136,
    trunkT: 1.46,
    side: 1,
    dx: 22,
    dy: -32,
    cdx: 12,
    cdy: -18,
    w0: 2.7,
    w1: 1.2,
  },
];

const CLUSTERS: CanopyClusterSpec[] = [
  { id: 'hc-b1', branchId: 'hb1-lower-left', branchT: 0.85, ox: -4, oy: -10, r: 29, appearDay: 32, fallDay: 360, layer: 'back', toneOffset: 0.0, leafAngles: [175, 215, 250] },
  { id: 'hc-b2', branchId: 'hb2-lower-right', branchT: 0.85, ox: 4, oy: -10, r: 29, appearDay: 36, fallDay: 360, layer: 'back', toneOffset: 0.14, leafAngles: [-15, 25, 320] },
  { id: 'hc-b3', branchId: 'hb3-mid-left', branchT: 0.72, ox: -2, oy: -10, r: 30, appearDay: 48, fallDay: 360, layer: 'back', toneOffset: 0.28, leafAngles: [195, 235] },
  { id: 'hc-b4', branchId: 'hb4-mid-right', branchT: 0.72, ox: 2, oy: -10, r: 30, appearDay: 52, fallDay: 360, layer: 'back', toneOffset: 0.1, leafAngles: [305, 345] },
  { id: 'hc-b5', branchId: 'leader', branchT: 0.68, ox: 0, oy: -4, r: 32, appearDay: 62, fallDay: 360, layer: 'back', toneOffset: 0.22, leafAngles: [250, 290] },
  { id: 'hc-m1', branchId: 'hb1-lower-left', branchT: 1.0, ox: -10, oy: 0, r: 24, appearDay: 36, fallDay: 360, layer: 'mid', toneOffset: 0.24, leafAngles: [150, 190, 225] },
  { id: 'hc-m2', branchId: 'hb1-lower-left', branchT: 0.62, ox: -4, oy: -8, r: 26, appearDay: 30, fallDay: 360, layer: 'mid', toneOffset: 0.06, leafAngles: [140, 205] },
  { id: 'hc-m3', branchId: 'hb2-lower-right', branchT: 1.0, ox: 10, oy: 0, r: 24, appearDay: 40, fallDay: 360, layer: 'mid', toneOffset: 0.34, leafAngles: [-20, 15, 50] },
  { id: 'hc-m4', branchId: 'hb2-lower-right', branchT: 0.62, ox: 4, oy: -8, r: 26, appearDay: 34, fallDay: 360, layer: 'mid', toneOffset: 0.12, leafAngles: [20, 330] },
  { id: 'hc-m5', branchId: 'hb3-mid-left', branchT: 0.98, ox: -4, oy: -2, r: 27, appearDay: 46, fallDay: 360, layer: 'mid', toneOffset: 0.38, leafAngles: [185, 220, 255] },
  { id: 'hc-m6', branchId: 'hb4-mid-right', branchT: 0.98, ox: 4, oy: -2, r: 27, appearDay: 50, fallDay: 360, layer: 'mid', toneOffset: 0.18, leafAngles: [-35, 5, 35] },
  { id: 'hc-m7', branchId: 'hb5-upper-left', branchT: 0.95, ox: 2, oy: -4, r: 26, appearDay: 64, fallDay: 360, layer: 'mid', toneOffset: 0.26, leafAngles: [215, 250, 285] },
  { id: 'hc-m8', branchId: 'hb6-upper-right', branchT: 0.95, ox: -2, oy: -4, r: 26, appearDay: 68, fallDay: 360, layer: 'mid', toneOffset: 0.08, leafAngles: [275, 310, 345] },
  { id: 'hc-m9', branchId: 'leader', branchT: 1.0, ox: 0, oy: -6, r: 26, appearDay: 78, fallDay: 360, layer: 'mid', toneOffset: 0.2, leafAngles: [240, 270, 300] },
  { id: 'hc-f1', branchId: 'hb1-lower-left', branchT: 0.88, ox: -2, oy: -16, r: 22, appearDay: 54, fallDay: 360, layer: 'front', toneOffset: 0.32, leafAngles: [170, 215, 250] },
  { id: 'hc-f2', branchId: 'hb2-lower-right', branchT: 0.88, ox: 2, oy: -16, r: 22, appearDay: 58, fallDay: 360, layer: 'front', toneOffset: 0.14, leafAngles: [-25, 10, 315] },
  { id: 'hc-f3', branchId: 'hb3-mid-left', branchT: 0.48, ox: 4, oy: -12, r: 24, appearDay: 56, fallDay: 360, layer: 'front', toneOffset: 0.05, leafAngles: [200, 245] },
  { id: 'hc-f4', branchId: 'hb4-mid-right', branchT: 0.48, ox: -4, oy: -12, r: 24, appearDay: 60, fallDay: 360, layer: 'front', toneOffset: 0.38, leafAngles: [295, 340] },
  { id: 'hc-f5', branchId: 'leader', branchT: 0.56, ox: 2, oy: -2, r: 24, appearDay: 72, fallDay: 360, layer: 'front', toneOffset: 0.2, leafAngles: [230, 270, 310] },
  { id: 'hc-f6', branchId: 'hb8-crown-right', branchT: 0.92, ox: -2, oy: 0, r: 21, appearDay: 84, fallDay: 360, layer: 'front', toneOffset: 0.16, leafAngles: [260, 295, 330] },
];

const BLOSSOMS: BlossomNodeSpec[] = [
  { id: 'hb-fl-1', branchId: 'hb1-lower-left', branchT: 1.0, ox: -14, oy: 0, scale: 1.12, rot: -24, dayOffset: 0, hasBerry: true },
  { id: 'hb-fl-2', branchId: 'hb1-lower-left', branchT: 0.78, ox: -6, oy: -18, scale: 1.24, rot: 12, dayOffset: -2 },
  { id: 'hb-fl-3', branchId: 'hb2-lower-right', branchT: 0.98, ox: 14, oy: 2, scale: 1.15, rot: 28, dayOffset: 1, hasBerry: true },
  { id: 'hb-fl-4', branchId: 'hb2-lower-right', branchT: 0.74, ox: 8, oy: -16, scale: 1.22, rot: -16, dayOffset: -1 },
  { id: 'hb-fl-5', branchId: 'hb3-mid-left', branchT: 0.98, ox: -6, oy: -6, scale: 1.3, rot: -18, dayOffset: 0, hasBerry: true },
  { id: 'hb-fl-6', branchId: 'hb3-mid-left', branchT: 0.62, ox: 0, oy: -12, scale: 1.08, rot: 18, dayOffset: 2 },
  { id: 'hb-fl-7', branchId: 'hb4-mid-right', branchT: 0.98, ox: 6, oy: -4, scale: 1.28, rot: 22, dayOffset: -1, hasBerry: true },
  { id: 'hb-fl-8', branchId: 'hb4-mid-right', branchT: 0.6, ox: 0, oy: -14, scale: 1.1, rot: -20, dayOffset: 2 },
  { id: 'hb-fl-9', branchId: 'hb5-upper-left', branchT: 0.96, ox: -2, oy: -6, scale: 1.26, rot: -8, dayOffset: -2, hasBerry: true },
  { id: 'hb-fl-10', branchId: 'hb6-upper-right', branchT: 0.96, ox: 2, oy: -4, scale: 1.24, rot: 14, dayOffset: 1 },
  { id: 'hb-fl-11', branchId: 'hb7-crown-left', branchT: 0.94, ox: -4, oy: -4, scale: 1.14, rot: -15, dayOffset: 0, hasBerry: true },
  { id: 'hb-fl-12', branchId: 'leader', branchT: 1.0, ox: 0, oy: -14, scale: 1.36, rot: 4, dayOffset: -2 },
  { id: 'hb-fl-13', branchId: 'hb8-crown-right', branchT: 0.94, ox: 4, oy: -2, scale: 1.16, rot: 24, dayOffset: 1, hasBerry: true },
  { id: 'hb-fl-14', branchId: 'leader', branchT: 0.64, ox: 2, oy: -2, scale: 1.18, rot: 18, dayOffset: 0 },
  { id: 'hb-fl-15', branchId: 'hb1-lower-left', branchT: 0.56, ox: -4, oy: -6, scale: 1.05, rot: -32, dayOffset: 2, hasBerry: true },
  { id: 'hb-fl-16', branchId: 'hb2-lower-right', branchT: 0.56, ox: 4, oy: -6, scale: 1.05, rot: 30, dayOffset: 2 },
];

export const summerHibiscusSpecies: SpeciesConfig = {
  id: 'summer',
  labelJa: 'ハイビスカス',
  labelEn: 'Tropical Hibiscus',
  shortTag: '夏〜開始種',
  descTheme: '太陽を浴びて艶やかな広葉と大輪の花を咲かせる南国花木',
  leafShape: 'tropical',
  flowerStyle: 'hibiscus',
  fruitStyle: 'hibiscusPod',
  isEvergreen: true,
  trunkHeightScale: 0.88,
  trunkThicknessScale: 1.08,
  sproutColors: {
    stem: '#15803D',
    cotyledon: '#22C55E',
    cotyledonStroke: '#14532D',
    leaf: '#10B981',
    leafStroke: '#065F46',
    tipLeaf: '#6EE7B7',
  },
  branches: BRANCHES,
  clusters: CLUSTERS,
  blossoms: BLOSSOMS,
  bloomSchedule: {
    budStart: 120,
    flowerStart: 170,
    flowerWitherStart: 224,
    flowerEnd: 252,
    fruitStart: 238,
    fruitEnd: 312,
  },
  getBarkPalette(cd, env) {
    let dark = '#4B3A2C';
    let light = '#856B53';
    if (cd <= 36) {
      const t = cd / 36;
      dark = lerpColor('#15803D', '#4B3A2C', t);
      light = lerpColor('#4ADE80', '#856B53', t);
    }
    return {
      dark: tintForTime(dark, env.nightFactor, '#141B29', 0.72),
      light: tintForTime(light, env.nightFactor, '#475569', 0.62),
    };
  },
  getFoliagePalette(cd, toneOffset, env) {
    let pal: FoliagePalette;
    if (cd <= 48) {
      const t = clamp(cd / 48, 0, 1);
      pal = {
        back: lerpColor('#15803D', '#065F46', t),
        mid1: lerpColor('#4ADE80', '#10B981', t),
        mid2: lerpColor('#16A34A', '#047857', t),
        front1: lerpColor('#86EFAC', '#34D399', t),
        front2: lerpColor('#22C55E', '#059669', t),
        vein: '#D1FAE5',
      };
    } else if (cd <= 285) {
      const t = clamp((cd - 48) / 237, 0, 1);
      pal = {
        back: lerpColor('#065F46', '#064E3B', t),
        mid1: lerpColor('#10B981', '#22C55E', t * 0.5 + toneOffset * 0.2),
        mid2: lerpColor('#047857', '#065F46', t),
        front1: lerpColor('#34D399', '#4ADE80', t * 0.4),
        front2: lerpColor('#059669', '#15803D', t),
        vein: '#A7F3D0',
      };
    } else {
      const t = clamp((cd - 285) / 75, 0, 1);
      pal = {
        back: lerpColor('#064E3B', '#14532D', t),
        mid1: lerpColor('#10B981', '#4D7C0F', t * 0.55),
        mid2: lerpColor('#065F46', '#166534', t),
        front1: lerpColor('#34D399', '#65A30D', t * 0.5),
        front2: lerpColor('#059669', '#3F6212', t * 0.6),
        vein: '#BEF264',
      };
    }

    if (env.snowLevel > 0.25) {
      const w = env.snowLevel * 0.28;
      pal = {
        back: lerpColor(pal.back, '#1E3A2F', w),
        mid1: lerpColor(pal.mid1, '#3F6E58', w),
        mid2: lerpColor(pal.mid2, '#274E3E', w),
        front1: lerpColor(pal.front1, '#6B9982', w),
        front2: lerpColor(pal.front2, '#345E4C', w),
        vein: pal.vein,
      };
    }
    if (env.twilightFactor > 0) {
      pal = {
        back: lerpColor(pal.back, '#3B2314', env.twilightFactor * 0.22),
        mid1: lerpColor(pal.mid1, '#F59E0B', env.twilightFactor * 0.22),
        mid2: lerpColor(pal.mid2, '#78350F', env.twilightFactor * 0.2),
        front1: lerpColor(pal.front1, '#FDE68A', env.twilightFactor * 0.32),
        front2: lerpColor(pal.front2, '#D97706', env.twilightFactor * 0.22),
        vein: lerpColor(pal.vein, '#FEF3C7', env.twilightFactor * 0.35),
      };
    }
    if (env.nightFactor > 0) {
      pal = {
        back: lerpColor(pal.back, '#0B1320', env.nightFactor * 0.74),
        mid1: lerpColor(pal.mid1, '#1E4652', env.nightFactor * 0.65),
        mid2: lerpColor(pal.mid2, '#122B36', env.nightFactor * 0.7),
        front1: lerpColor(pal.front1, '#4C808E', env.nightFactor * 0.56),
        front2: lerpColor(pal.front2, '#2B5663', env.nightFactor * 0.64),
        vein: lerpColor(pal.vein, '#93C5FD', env.nightFactor * 0.62),
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
    const restT = cd >= 310 ? clamp((cd - 310) / 50, 0, 1) : 0;
    return {
      visible: true,
      grow,
      fold,
      droop: restT * 2.2,
      shrink: restT * 0.14,
      opacity: 1 - restT * 0.08,
      fallingProgress: null,
    };
  },
};
