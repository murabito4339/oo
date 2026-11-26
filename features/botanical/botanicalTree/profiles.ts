import type { SpeciesBloomSchedule, SpeciesId } from '../types';
import { clamp, lerp } from '../utils';
import type { LeafShape } from './pathKit';
import type { TreeShapeParams } from './structure';

/**
 * 樹種ごとの「ボタニカル版」の設定。
 * 樹形（枝の分かれ方）・葉の形・色の変化・花と実の描き方を樹種ごとに変える。
 * 季節感（空・地面・雪など）はカレンダーで動き、木の状態はこのサイクル日数（cd）だけで決まる。
 */

/** 葉の色の段階：0 若葉 → 1 夏の緑 → 2 黄葉 → 3 紅葉 → 4 枯れ葉 */
type ColorRamp = [string, string, string, string, string];

export type BotanicalProfile = {
  shape: TreeShapeParams;
  leafShape: LeafShape;
  leafLen: number;
  /** 葉を付ける世代の数（枝先から数えて） */
  leafLevels: number;
  leaf: { dark: ColorRamp; mid: ColorRamp; light: ColorRamp };
  /** 芽吹き直後の若葉の色（山桜の赤茶色の若葉、楓の赤い新芽など） */
  young?: [string, string, string];
  bark: { dark: string; mid: string; light: string };
  /** 幹の横縞（桜の皮目） */
  lenticels: boolean;
  flowerStyle: 'sakura' | 'camellia' | 'hibiscus' | 'mapleBlossom';
  flower: { petalA: string; petalB: string; center: string; accent: string; stamen: string };
  flowerSize: number;
  flowersPerTip: number;
  /** 枝先のうち花を付ける割合 */
  flowerDensity: number;
  budColor: string;
  fruitStyle: 'cherry' | 'samara' | 'camelliaNut' | 'hibiscusPod';
  fruit: { young: string; ripe: string };
  /** 実を付ける枝先の割合 */
  fruitDensity: number;
  deciduous: boolean;
  /** 落葉樹：色づき開始日・落葉の開始日と終了日 */
  autumn?: { colorStart: number; fallStart: number; fallEnd: number };
};

export const PROFILES: Record<SpeciesId, BotanicalProfile> = {
  spring: {
    shape: {
      seed: 11, trunkLen: 60, trunkW: 18, maxDepth: 6, trunkSplit: 3, spread: 0.62, lenRatio: 0.74,
      widthRatio: 0.7, upBias: 0.12, droop: 0.05, bend: 0.25, triChance: 0.4,
    },
    leafShape: 'almond',
    leafLen: 9,
    leafLevels: 3,
    leaf: {
      dark: ['#4E8F3A', '#1F5A33', '#8C6A1E', '#8E2F1E', '#5E4433'],
      mid: ['#7DBB55', '#2F7A43', '#D4A53A', '#C9512E', '#8A644A'],
      light: ['#B9E08A', '#5FA65A', '#F0D27A', '#EE8A4A', '#B08A68'],
    },
    bark: { dark: '#3B2A23', mid: '#5C4236', light: '#8A6A57' },
    lenticels: true,
    flowerStyle: 'sakura',
    flower: { petalA: '#FFF1F5', petalB: '#FFF1F5', center: '#C2416B', accent: '#F7CAD7', stamen: '#C2416B' },
    flowerSize: 3.6,
    flowersPerTip: 3,
    flowerDensity: 0.9,
    budColor: '#F4A7BD',
    fruitStyle: 'cherry',
    fruit: { young: '#65A30D', ripe: '#7F1D3A' },
    fruitDensity: 0.45,
    deciduous: true,
    autumn: { colorStart: 228, fallStart: 270, fallEnd: 322 },
  },
  autumn: {
    shape: {
      seed: 23, trunkLen: 54, trunkW: 19, maxDepth: 6, trunkSplit: 3, spread: 0.72, lenRatio: 0.75,
      widthRatio: 0.66, upBias: 0.05, droop: 0.05, bend: 0.3, triChance: 0.4,
    },
    leafShape: 'palmate',
    leafLen: 9,
    leafLevels: 3,
    leaf: {
      dark: ['#5C8A2E', '#2C6630', '#9A6A12', '#7F1414', '#5A3A2E'],
      mid: ['#8DBB45', '#3F8A3C', '#E0A52A', '#C0221E', '#7E5442'],
      light: ['#C5E07A', '#77B158', '#F7D35C', '#F0603A', '#A57A62'],
    },
    young: ['#7F1D1D', '#B4442E', '#E0835A'],
    bark: { dark: '#45403C', mid: '#6A625B', light: '#958B82' },
    lenticels: false,
    flowerStyle: 'mapleBlossom',
    flower: { petalA: '#B91C1C', petalB: '#B91C1C', center: '#FDE68A', accent: '#B91C1C', stamen: '#FDE68A' },
    flowerSize: 2.2,
    flowersPerTip: 2,
    flowerDensity: 0.7,
    budColor: '#B4442E',
    fruitStyle: 'samara',
    fruit: { young: '#C0D26A', ripe: '#9A3412' },
    fruitDensity: 0.55,
    deciduous: true,
    autumn: { colorStart: 222, fallStart: 280, fallEnd: 330 },
  },
  winter: {
    shape: {
      seed: 5, trunkLen: 16, trunkW: 15, maxDepth: 6, trunkSplit: 3, spread: 0.6, lenRatio: 0.8, firstRatio: 3,
      widthRatio: 0.7, upBias: 0.26, droop: 0.03, bend: 0.2, triChance: 0.45,
    },
    leafShape: 'glossy',
    leafLen: 9.5,
    leafLevels: 3,
    leaf: {
      // 2〜4 は世代交代で古い木の葉が枯れるときだけ使う
      dark: ['#2C6A45', '#123826', '#4A5A22', '#6B4A22', '#5A4030'],
      mid: ['#4C9A63', '#1F5A3C', '#7A8A33', '#9A6A2E', '#7E5A40'],
      light: ['#8CCB98', '#4E8F68', '#A8B04A', '#C08A44', '#A07A5A'],
    },
    bark: { dark: '#4E4640', mid: '#776B62', light: '#A3978C' },
    lenticels: false,
    flowerStyle: 'camellia',
    flower: { petalA: '#9F1239', petalB: '#D61F3C', center: '#FACC15', accent: '#F43F5E', stamen: '#FACC15' },
    flowerSize: 4.8,
    flowersPerTip: 1,
    flowerDensity: 0.3,
    budColor: '#D61F3C',
    fruitStyle: 'camelliaNut',
    fruit: { young: '#65A30D', ripe: '#7C2D12' },
    fruitDensity: 0.35,
    deciduous: false,
  },
  summer: {
    shape: {
      seed: 31, trunkLen: 14, trunkW: 7, maxDepth: 5, trunkSplit: 4, spread: 0.36, lenRatio: 0.8, firstRatio: 4.6,
      widthRatio: 0.8, upBias: 0.3, droop: 0.06, bend: 0.3, triChance: 0.3,
    },
    leafShape: 'broad',
    leafLen: 10,
    leafLevels: 3,
    leaf: {
      // 2〜4 は世代交代で古い木の葉が枯れるときだけ使う
      dark: ['#2E7D3E', '#17532F', '#5A6A22', '#7A5A22', '#5A4030'],
      mid: ['#4CA457', '#237A42', '#8A9A33', '#B07A2E', '#7E5A40'],
      light: ['#8ED184', '#57AE62', '#BAC24A', '#D49A44', '#A07A5A'],
    },
    bark: { dark: '#4B3A2C', mid: '#6B5340', light: '#8F7559' },
    lenticels: false,
    flowerStyle: 'hibiscus',
    flower: { petalA: '#BE123C', petalB: '#F43F5E', center: '#7F1D1D', accent: '#F97316', stamen: '#FDE047' },
    flowerSize: 8,
    flowersPerTip: 1,
    flowerDensity: 0.34,
    budColor: '#F43F5E',
    fruitStyle: 'hibiscusPod',
    fruit: { young: '#4D7C0F', ripe: '#A16207' },
    fruitDensity: 0.25,
    deciduous: false,
  },
};

export type TreeState = {
  /** 成長度 0〜1 */
  g: number;
  /** 葉の色の段階（0〜4） */
  cT: number;
  /** 葉ごとの色のばらつき */
  cSpread: number;
  /** 落ちた葉の割合 0〜1 */
  fall: number;
  /** 若葉の色の強さ 0〜1 */
  young: number;
  /** 幹がまだ緑色の若い茎である度合い 0〜1 */
  greenStem: number;
};

export function getTreeState(profile: BotanicalProfile, cd: number): TreeState {
  // 発芽の日から内部的に育て、芽の段階が終わる cd24 には芽と同じくらいの若木になっている。
  // 序盤は速く、成木（cd150）に近づくほどゆっくり育つ。
  const g = Math.pow(clamp((cd - 1) / 149, 0, 1), 0.75);
  const greenUp = clamp((cd - 24) / 66, 0, 1);
  const young = profile.young ? clamp(1 - (cd - 24) / 40, 0, 1) : 0;
  const greenStem = clamp(1 - (cd - 24) / 30, 0, 1);
  if (!profile.deciduous || !profile.autumn) {
    return { g, cT: greenUp, cSpread: 0.25, fall: 0, young, greenStem };
  }
  const { colorStart, fallStart, fallEnd } = profile.autumn;
  let cT = greenUp;
  let cSpread = 0.25;
  if (cd >= colorStart) {
    const t = cd - colorStart;
    cT = t < 25 ? lerp(1, 2, t / 25) : t < 55 ? lerp(2, 3, (t - 25) / 30) : lerp(3, 4, (t - 55) / 45);
    cSpread = 1.4;
  }
  // 見た目の葉の減り方が一定になるよう、序盤を少し早める
  const fall = Math.pow(clamp((cd - fallStart) / (fallEnd - fallStart), 0, 1), 0.7);
  return { g, cT, cSpread, fall, young, greenStem };
}

export type BloomPhase = {
  /** このノードのつぼみの大きさ（0 で非表示） */
  bud: number;
  /** 開き具合（0 で非表示） */
  open: number;
  /** 花の終わりの進み具合 0〜1（桜は花びらが散り、椿・ハイビスカスは 1 で花ごと落ちる） */
  wither: number;
  /** 咲き始めの日（ノードごとにずれる） */
  start: number;
};

/**
 * 花ノード 1 つの状態。ノードごとに開花日を -2〜+3 日ずらし、
 * 自分の開花日までは必ずつぼみを出しておく（つぼみも花もない日を作らない）。
 */
export function getBloomPhase(schedule: SpeciesBloomSchedule, cd: number, dayOffset: number): BloomPhase {
  const { budStart, flowerStart, flowerWitherStart, flowerEnd } = schedule;
  const start = flowerStart + dayOffset;
  const phase: BloomPhase = { bud: 0, open: 0, wither: 0, start };
  if (cd >= budStart && cd < start) {
    phase.bud = clamp((cd - budStart) / Math.max(1, start - budStart), 0.15, 1);
  }
  if (cd >= start) {
    phase.open = clamp((cd - start + 1) / 5, 0.35, 1);
    phase.wither = clamp((cd - (flowerWitherStart + dayOffset)) / Math.max(1, flowerEnd - flowerWitherStart), 0, 1);
  }
  return phase;
}
