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
    id: 'b1-lower-left',
    appearDay: 24,
    fullDay: 82,
    trunkT: 0.48,
    side: -1,
    dx: -70,
    dy: -30,
    cdx: -30,
    cdy: -10,
    w0: 6.0,
    w1: 1.9,
    twigs: [
      { appearDay: 52, fromT: 0.56, dx: -32, dy: -28, w: 1.7 },
      { appearDay: 66, fromT: 0.74, dx: -30, dy: 8, w: 1.4 },
    ],
  },
  {
    id: 'b2-lower-right',
    appearDay: 30,
    fullDay: 88,
    trunkT: 0.54,
    side: 1,
    dx: 72,
    dy: -29,
    cdx: 32,
    cdy: -9,
    w0: 5.6,
    w1: 1.8,
    twigs: [
      { appearDay: 58, fromT: 0.58, dx: 34, dy: -30, w: 1.7 },
      { appearDay: 72, fromT: 0.75, dx: 32, dy: 8, w: 1.4 },
    ],
  },
  {
    id: 'b3-mid-left',
    appearDay: 42,
    fullDay: 102,
    trunkT: 0.74,
    side: -1,
    dx: -58,
    dy: -40,
    cdx: -24,
    cdy: -18,
    w0: 4.8,
    w1: 1.5,
    twigs: [{ appearDay: 78, fromT: 0.55, dx: -28, dy: -30, w: 1.3 }],
  },
  {
    id: 'b4-mid-right',
    appearDay: 48,
    fullDay: 108,
    trunkT: 0.8,
    side: 1,
    dx: 60,
    dy: -37,
    cdx: 26,
    cdy: -16,
    w0: 4.6,
    w1: 1.5,
    twigs: [{ appearDay: 84, fromT: 0.56, dx: 28, dy: -28, w: 1.3 }],
  },
  {
    id: 'b5-upper-left',
    appearDay: 62,
    fullDay: 122,
    trunkT: 1.0,
    side: -1,
    dx: -36,
    dy: -42,
    cdx: -16,
    cdy: -20,
    w0: 3.4,
    w1: 1.2,
  },
  {
    id: 'b6-upper-right',
    appearDay: 68,
    fullDay: 128,
    trunkT: 1.0,
    side: 1,
    dx: 40,
    dy: -42,
    cdx: 18,
    cdy: -20,
    w0: 3.3,
    w1: 1.2,
  },
  {
    id: 'b7-crown-left',
    appearDay: 80,
    fullDay: 138,
    trunkT: 1.45,
    side: -1,
    dx: -16,
    dy: -33,
    cdx: -9,
    cdy: -18,
    w0: 2.5,
    w1: 1.0,
  },
  {
    id: 'b8-crown-right',
    appearDay: 86,
    fullDay: 142,
    trunkT: 1.48,
    side: 1,
    dx: 20,
    dy: -30,
    cdx: 11,
    cdy: -16,
    w0: 2.4,
    w1: 1.0,
  },
];

const CLUSTERS: CanopyClusterSpec[] = [
  { id: 'c-b1', branchId: 'b1-lower-left', branchT: 0.85, ox: -4, oy: -12, r: 27, appearDay: 34, fallDay: 292, layer: 'back', toneOffset: 0.0, leafAngles: [185, 225, 260] },
  { id: 'c-b2', branchId: 'b2-lower-right', branchT: 0.85, ox: 4, oy: -12, r: 27, appearDay: 38, fallDay: 296, layer: 'back', toneOffset: 0.15, leafAngles: [-5, 35, 315] },
  { id: 'c-b3', branchId: 'b3-mid-left', branchT: 0.72, ox: 0, oy: -10, r: 28, appearDay: 50, fallDay: 302, layer: 'back', toneOffset: 0.3, leafAngles: [200, 240] },
  { id: 'c-b4', branchId: 'b4-mid-right', branchT: 0.72, ox: 0, oy: -10, r: 28, appearDay: 56, fallDay: 306, layer: 'back', toneOffset: 0.1, leafAngles: [310, 350] },
  { id: 'c-b5', branchId: 'leader', branchT: 0.65, ox: 0, oy: -4, r: 30, appearDay: 66, fallDay: 312, layer: 'back', toneOffset: 0.2, leafAngles: [255, 285] },
  { id: 'c-m1', branchId: 'b1-lower-left', branchT: 1.0, ox: -10, oy: 2, r: 22, appearDay: 38, fallDay: 290, layer: 'mid', toneOffset: 0.25, leafAngles: [155, 195, 230] },
  { id: 'c-m2', branchId: 'b1-lower-left', branchT: 0.65, ox: -4, oy: -8, r: 24, appearDay: 32, fallDay: 294, layer: 'mid', toneOffset: 0.05, leafAngles: [140, 210] },
  { id: 'c-m3', branchId: 'b2-lower-right', branchT: 1.0, ox: 10, oy: 2, r: 22, appearDay: 44, fallDay: 294, layer: 'mid', toneOffset: 0.35, leafAngles: [-20, 15, 50] },
  { id: 'c-m4', branchId: 'b2-lower-right', branchT: 0.65, ox: 4, oy: -8, r: 24, appearDay: 36, fallDay: 300, layer: 'mid', toneOffset: 0.12, leafAngles: [20, 330] },
  { id: 'c-m5', branchId: 'b3-mid-left', branchT: 0.98, ox: -4, oy: -2, r: 25, appearDay: 48, fallDay: 304, layer: 'mid', toneOffset: 0.4, leafAngles: [185, 220, 255] },
  { id: 'c-m6', branchId: 'b4-mid-right', branchT: 0.98, ox: 4, oy: -2, r: 25, appearDay: 54, fallDay: 308, layer: 'mid', toneOffset: 0.18, leafAngles: [-35, 5, 35] },
  { id: 'c-m7', branchId: 'b5-upper-left', branchT: 0.95, ox: 2, oy: -4, r: 24, appearDay: 68, fallDay: 314, layer: 'mid', toneOffset: 0.28, leafAngles: [215, 250, 285] },
  { id: 'c-m8', branchId: 'b6-upper-right', branchT: 0.95, ox: -2, oy: -4, r: 24, appearDay: 72, fallDay: 316, layer: 'mid', toneOffset: 0.08, leafAngles: [275, 310, 345] },
  { id: 'c-m9', branchId: 'leader', branchT: 1.0, ox: 0, oy: -6, r: 25, appearDay: 82, fallDay: 322, layer: 'mid', toneOffset: 0.22, leafAngles: [240, 270, 300] },
  { id: 'c-f1', branchId: 'b1-lower-left', branchT: 0.88, ox: -2, oy: -18, r: 20, appearDay: 58, fallDay: 298, layer: 'front', toneOffset: 0.32, leafAngles: [170, 215, 250] },
  { id: 'c-f2', branchId: 'b2-lower-right', branchT: 0.88, ox: 2, oy: -18, r: 20, appearDay: 64, fallDay: 303, layer: 'front', toneOffset: 0.14, leafAngles: [-25, 10, 315] },
  { id: 'c-f3', branchId: 'b3-mid-left', branchT: 0.48, ox: 4, oy: -12, r: 22, appearDay: 60, fallDay: 310, layer: 'front', toneOffset: 0.05, leafAngles: [200, 245] },
  { id: 'c-f4', branchId: 'b4-mid-right', branchT: 0.48, ox: -4, oy: -12, r: 22, appearDay: 66, fallDay: 314, layer: 'front', toneOffset: 0.38, leafAngles: [295, 340] },
  { id: 'c-f5', branchId: 'leader', branchT: 0.55, ox: 2, oy: -2, r: 22, appearDay: 76, fallDay: 318, layer: 'front', toneOffset: 0.2, leafAngles: [230, 270, 310] },
  { id: 'c-f6', branchId: 'b8-crown-right', branchT: 0.92, ox: -2, oy: 0, r: 19, appearDay: 90, fallDay: 324, layer: 'front', toneOffset: 0.16, leafAngles: [260, 295, 330] },
];

const BLOSSOMS: BlossomNodeSpec[] = [
  { id: 'bl-1', branchId: 'b1-lower-left', branchT: 1.0, ox: -12, oy: 2, scale: 0.9, rot: -20, dayOffset: 0, hasBerry: true },
  { id: 'bl-2', branchId: 'b1-lower-left', branchT: 0.88, ox: -6, oy: -18, scale: 1.05, rot: 14, dayOffset: -1 },
  { id: 'bl-3', branchId: 'b1-lower-left', branchT: 0.65, ox: -4, oy: -8, scale: 0.85, rot: 35, dayOffset: 2, hasBerry: true },
  { id: 'bl-4', branchId: 'b1-lower-left', branchT: 0.95, ox: -4, oy: 10, scale: 0.8, rot: -40, dayOffset: 1 },
  { id: 'bl-5', branchId: 'b3-mid-left', branchT: 0.98, ox: -4, oy: -4, scale: 1.1, rot: -12, dayOffset: 0, hasBerry: true },
  { id: 'bl-6', branchId: 'b3-mid-left', branchT: 0.68, ox: -2, oy: -4, scale: 0.9, rot: 22, dayOffset: 2 },
  { id: 'bl-7', branchId: 'b3-mid-left', branchT: 0.95, ox: 0, oy: -18, scale: 0.95, rot: -26, dayOffset: 1, hasBerry: true },
  { id: 'bl-8', branchId: 'b5-upper-left', branchT: 0.98, ox: 0, oy: -4, scale: 1.12, rot: 8, dayOffset: -2 },
  { id: 'bl-9', branchId: 'b7-crown-left', branchT: 0.95, ox: -2, oy: -2, scale: 1.0, rot: -15, dayOffset: 1, hasBerry: true },
  { id: 'bl-10', branchId: 'leader', branchT: 1.0, ox: 0, oy: -12, scale: 1.18, rot: 6, dayOffset: -1 },
  { id: 'bl-11', branchId: 'b8-crown-right', branchT: 0.95, ox: 2, oy: -2, scale: 1.05, rot: 24, dayOffset: 0, hasBerry: true },
  { id: 'bl-12', branchId: 'b6-upper-right', branchT: 0.98, ox: 0, oy: -2, scale: 1.1, rot: -10, dayOffset: 1 },
  { id: 'bl-13', branchId: 'b4-mid-right', branchT: 0.95, ox: 0, oy: -14, scale: 0.92, rot: 30, dayOffset: 2, hasBerry: true },
  { id: 'bl-14', branchId: 'b4-mid-right', branchT: 0.98, ox: 0, oy: 2, scale: 1.08, rot: 16, dayOffset: -1 },
  { id: 'bl-15', branchId: 'b4-mid-right', branchT: 0.56, ox: 2, oy: -10, scale: 0.88, rot: -22, dayOffset: 2, hasBerry: true },
  { id: 'bl-16', branchId: 'b2-lower-right', branchT: 0.92, ox: 10, oy: -16, scale: 1.0, rot: 18, dayOffset: 0 },
  { id: 'bl-17', branchId: 'b2-lower-right', branchT: 0.96, ox: 2, oy: 2, scale: 1.05, rot: -14, dayOffset: 1, hasBerry: true },
  { id: 'bl-18', branchId: 'b2-lower-right', branchT: 1.0, ox: 14, oy: 10, scale: 0.84, rot: 42, dayOffset: 3 },
  { id: 'bl-19', branchId: 'b2-lower-right', branchT: 0.65, ox: 4, oy: -4, scale: 0.86, rot: -32, dayOffset: 2, hasBerry: true },
  { id: 'bl-20', branchId: 'b5-upper-left', branchT: 0.56, ox: -4, oy: -6, scale: 0.96, rot: 12, dayOffset: 0 },
  { id: 'bl-21', branchId: 'b6-upper-right', branchT: 0.56, ox: 4, oy: -4, scale: 0.94, rot: -18, dayOffset: 1, hasBerry: true },
  { id: 'bl-22', branchId: 'leader', branchT: 0.68, ox: 2, oy: -2, scale: 1.04, rot: 28, dayOffset: -1 },
  { id: 'bl-23', branchId: 'b3-mid-left', branchT: 0.45, ox: -2, oy: -12, scale: 0.82, rot: -8, dayOffset: 3, hasBerry: true },
  { id: 'bl-24', branchId: 'b6-upper-right', branchT: 0.78, ox: 2, oy: -6, scale: 0.86, rot: 15, dayOffset: 2 },
  { id: 'bl-25', branchId: 'leader', branchT: 0.16, ox: 0, oy: 0, scale: 0.9, rot: -25, dayOffset: 1, hasBerry: true },
];

export const springSakuraSpecies: SpeciesConfig = {
  id: 'spring',
  labelJa: '山桜',
  labelEn: 'Mountain Sakura',
  shortTag: '春〜開始種',
  descTheme: '桜色の5弁花と四季折々の表情を見せる山桜',
  leafShape: 'rounded',
  flowerStyle: 'sakura',
  fruitStyle: 'cherry',
  isEvergreen: false,
  trunkHeightScale: 1.0,
  trunkThicknessScale: 1.0,
  sproutColors: {
    stem: '#4D7C0F',
    cotyledon: '#84CC16',
    cotyledonStroke: '#3F6212',
    leaf: '#4ADE80',
    leafStroke: '#15803D',
    tipLeaf: '#86EFAC',
  },
  branches: BRANCHES,
  clusters: CLUSTERS,
  blossoms: BLOSSOMS,
  bloomSchedule: {
    budStart: 125,
    flowerStart: 178,
    flowerWitherStart: 214,
    flowerEnd: 238,
    fruitStart: 228,
    fruitEnd: 298,
  },
  getBarkPalette(cd, env) {
    let dark = '#4A3525';
    let light = '#7C5A3E';
    if (cd <= 38) {
      const t = cd / 38;
      dark = lerpColor('#3F7D20', '#4A3525', t);
      light = lerpColor('#84CC16', '#7C5A3E', t);
    } else if (cd >= 295) {
      const t = clamp((cd - 295) / 65, 0, 1);
      dark = lerpColor('#4A3525', '#3D3834', t);
      light = lerpColor('#7C5A3E', '#6B645D', t);
    }
    return {
      dark: tintForTime(dark, env.nightFactor, '#141B29', 0.72),
      light: tintForTime(light, env.nightFactor, '#475569', 0.62),
    };
  },
  getFoliagePalette(cd, toneOffset, env) {
    const shiftedDay =
      cd >= 215 && cd <= 315 ? cd + toneOffset * 20 - 8 : cd;

    let pal: FoliagePalette;
    if (shiftedDay <= 50) {
      const t = clamp(shiftedDay / 50, 0, 1);
      pal = {
        back: lerpColor('#4D7C0F', '#166534', t),
        mid1: lerpColor('#A3E635', '#4ADE80', t),
        mid2: lerpColor('#65A30D', '#15803D', t),
        front1: lerpColor('#D9F99D', '#86EFAC', t),
        front2: lerpColor('#84CC16', '#22C55E', t),
        vein: '#ECFCCB',
      };
    } else if (shiftedDay <= 215) {
      const t = clamp((shiftedDay - 50) / 165, 0, 1);
      pal = {
        back: lerpColor('#166534', '#14532D', t),
        mid1: lerpColor('#4ADE80', '#2E8B57', t),
        mid2: lerpColor('#15803D', '#166534', t),
        front1: lerpColor('#86EFAC', '#4ADE80', t),
        front2: lerpColor('#22C55E', '#1E7A46', t),
        vein: '#BBF7D0',
      };
    } else if (shiftedDay <= 258) {
      const t = clamp((shiftedDay - 215) / 43, 0, 1);
      pal = {
        back: lerpColor('#14532D', '#854D0E', t),
        mid1: lerpColor('#2E8B57', '#FACC15', t),
        mid2: lerpColor('#166534', '#CA8A04', t),
        front1: lerpColor('#4ADE80', '#FEF08A', t),
        front2: lerpColor('#1E7A46', '#EAB308', t),
        vein: '#FEF9C3',
      };
    } else if (shiftedDay <= 292) {
      const t = clamp((shiftedDay - 258) / 34, 0, 1);
      pal = {
        back: lerpColor('#854D0E', '#7C2D12', t),
        mid1: lerpColor('#FACC15', '#EA580C', t),
        mid2: lerpColor('#CA8A04', '#B91C1C', t),
        front1: lerpColor('#FEF08A', '#FB923C', t),
        front2: lerpColor('#EAB308', '#DC2626', t),
        vein: '#FED7AA',
      };
    } else {
      const t = clamp((shiftedDay - 292) / 40, 0, 1);
      pal = {
        back: lerpColor('#7C2D12', '#52443A', t),
        mid1: lerpColor('#EA580C', '#8C6248', t),
        mid2: lerpColor('#B91C1C', '#634836', t),
        front1: lerpColor('#FB923C', '#A67C5B', t),
        front2: lerpColor('#DC2626', '#76523A', t),
        vein: '#D6D3D1',
      };
    }

    if (env.autumnWarmth > 0.15 && cd < 245) {
      const w = env.autumnWarmth * (0.35 + toneOffset * 0.4);
      pal = {
        back: lerpColor(pal.back, '#854D0E', w * 0.5),
        mid1: lerpColor(pal.mid1, '#F59E0B', w * 0.55),
        mid2: lerpColor(pal.mid2, '#B45309', w * 0.5),
        front1: lerpColor(pal.front1, '#FDE047', w * 0.45),
        front2: lerpColor(pal.front2, '#EA580C', w * 0.5),
        vein: lerpColor(pal.vein, '#FEF3C7', w * 0.5),
      };
    }
    if (env.snowLevel > 0.3) {
      const w = env.snowLevel * 0.35;
      pal = {
        back: lerpColor(pal.back, '#57534E', w),
        mid1: lerpColor(pal.mid1, '#A8A29E', w),
        mid2: lerpColor(pal.mid2, '#78716C', w),
        front1: lerpColor(pal.front1, '#D6D3D1', w),
        front2: lerpColor(pal.front2, '#A8A29E', w),
        vein: pal.vein,
      };
    }
    if (env.twilightFactor > 0) {
      pal = {
        back: lerpColor(pal.back, '#432818', env.twilightFactor * 0.25),
        mid1: lerpColor(pal.mid1, '#F59E0B', env.twilightFactor * 0.24),
        mid2: lerpColor(pal.mid2, '#9A3412', env.twilightFactor * 0.22),
        front1: lerpColor(pal.front1, '#FDE68A', env.twilightFactor * 0.34),
        front2: lerpColor(pal.front2, '#EA580C', env.twilightFactor * 0.24),
        vein: lerpColor(pal.vein, '#FEF3C7', env.twilightFactor * 0.4),
      };
    }
    if (env.nightFactor > 0) {
      pal = {
        back: lerpColor(pal.back, '#0B1320', env.nightFactor * 0.74),
        mid1: lerpColor(pal.mid1, '#264363', env.nightFactor * 0.66),
        mid2: lerpColor(pal.mid2, '#16283E', env.nightFactor * 0.7),
        front1: lerpColor(pal.front1, '#5B80A3', env.nightFactor * 0.58),
        front2: lerpColor(pal.front2, '#355678', env.nightFactor * 0.64),
        vein: lerpColor(pal.vein, '#93C5FD', env.nightFactor * 0.65),
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
      droop: witherT * 5.5,
      shrink: witherT * 0.24,
      opacity: 1 - witherT * 0.18,
      fallingProgress: null,
    };
  },
};
