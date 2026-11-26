import { clamp, lerp } from '../utils';

/**
 * 樹形の生成（ボタニカル版）
 *
 * 幹から世代ごとに枝分かれする木を、種（seed）付きの乱数で毎回同じ形に作る。
 * 成長度 g（0〜1）に応じて、内側の世代から順に枝が伸びる。
 * 座標は「根元 = (0, 0)、上がマイナス y」のツリーローカル座標。
 */

export type TreeShapeParams = {
  seed: number;
  /** 幹（第0世代）の長さ */
  trunkLen: number;
  /** 幹の根元の太さ（全幅） */
  trunkW: number;
  /** 枝分かれの世代数 */
  maxDepth: number;
  /** 幹の先で分かれる本数 */
  trunkSplit: number;
  /** 枝の開き角（ラジアン） */
  spread: number;
  /** 子の枝の長さ / 親の枝の長さ */
  lenRatio: number;
  /** 第1世代だけ長さ比を変える（株立ちの低木など） */
  firstRatio?: number;
  /** 子の枝の太さ / 親の枝の太さ（パイプモデル） */
  widthRatio: number;
  /** 上へ向かう傾向 */
  upBias: number;
  /** 世代が進むほど枝先が垂れる量 */
  droop: number;
  /** 枝の曲がり */
  bend: number;
  /** 3本に分かれる確率 */
  triChance: number;
};

export type TreeSeg = {
  id: number;
  depth: number;
  x1: number;
  y1: number;
  cx: number;
  cy: number;
  x2: number;
  y2: number;
  /** 枝の向き（ラジアン、-π/2 が真上） */
  abs: number;
  w1: number;
  w2: number;
  L: number;
  terminal: boolean;
  /** 揺れのまとまり（第2世代の祖先）。-1 は幹まわりで揺らさない */
  swayGroup: number;
  /** 細かい揺れのまとまり（第4世代の祖先）。-1 はなし */
  flutterGroup: number;
  rnd: number;
  rnd2: number;
  rnd3: number;
};

export type Point = { x: number; y: number };

type Node = {
  id: number;
  depth: number;
  relAngle: number;
  len: number;
  w: number;
  bend: number;
  children: Node[];
  rnd: number;
  rnd2: number;
  rnd3: number;
};

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildNodes(p: TreeShapeParams): Node {
  const r = rng(p.seed);
  let id = 0;
  const node = (depth: number, relAngle: number, len: number, w: number): Node => {
    const n: Node = {
      id: id++,
      depth,
      relAngle,
      len,
      w,
      bend: (r() - 0.5) * p.bend,
      children: [],
      rnd: r(),
      rnd2: r(),
      rnd3: r(),
    };
    if (depth < p.maxDepth) {
      const count = depth === 0 ? p.trunkSplit : r() < p.triChance ? 3 : 2;
      for (let i = 0; i < count; i++) {
        let a = count === 1 ? (r() - 0.5) * 0.2 : (i / (count - 1) - 0.5) * 2 * p.spread * (0.75 + r() * 0.45);
        if (count >= 3 && depth > 0) a *= 0.9;
        const lr = p.lenRatio * (0.8 + r() * 0.32) * (depth === 0 && p.firstRatio ? p.firstRatio : 1);
        const cw = w * p.widthRatio * (count >= 3 ? 0.86 : 1);
        n.children.push(node(depth + 1, a, len * lr, cw));
      }
    }
    return n;
  };
  return node(0, 0, p.trunkLen, p.trunkW);
}

const nodeCache = new Map<string, Node>();
function getNodes(p: TreeShapeParams) {
  const key = JSON.stringify(p);
  let n = nodeCache.get(key);
  if (!n) {
    n = buildNodes(p);
    nodeCache.set(key, n);
  }
  return n;
}

export function quadPoint(s: TreeSeg, t: number): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * s.x1 + 2 * mt * t * s.cx + t * t * s.x2,
    y: mt * mt * s.y1 + 2 * mt * t * s.cy + t * t * s.y2,
  };
}

/** 成長度 g（0〜1）での枝の配置を返す */
export function layoutTree(p: TreeShapeParams, g: number): TreeSeg[] {
  const root = getNodes(p);
  const segs: TreeSeg[] = [];
  const S = lerp(0.42, 1, Math.pow(g, 0.8));
  const WS = lerp(0.28, 1, Math.pow(g, 0.9));

  const walk = (n: Node, x: number, y: number, parentAbs: number, swayGroup: number, flutterGroup: number) => {
    let abs = parentAbs + n.relAngle;
    if (n.depth > 0) abs += (-Math.PI / 2 - abs) * p.upBias;
    abs += Math.sign(Math.cos(abs)) * p.droop * n.depth;
    const birth = (n.depth / (p.maxDepth + 1)) * 0.82;
    const lg = clamp((g - birth) / 0.2, 0, 1);
    if (lg <= 0) return false;
    const L = n.len * S * (0.3 + 0.7 * lg);
    const x2 = x + Math.cos(abs) * L;
    const y2 = y + Math.sin(abs) * L;
    const childW = n.children.length ? n.w * p.widthRatio : n.w * 0.5;
    const sg = n.depth === 2 ? n.id : swayGroup;
    const fg = n.depth === 4 ? n.id : flutterGroup;
    const seg: TreeSeg = {
      id: n.id,
      depth: n.depth,
      x1: x,
      y1: y,
      cx: (x + x2) / 2 - Math.sin(abs) * n.bend * L,
      cy: (y + y2) / 2 + Math.cos(abs) * n.bend * L,
      x2,
      y2,
      abs,
      w1: n.w * WS,
      w2: Math.max(0.5, childW * WS * lerp(0.6, 1, lg)),
      L,
      terminal: true,
      swayGroup: sg,
      flutterGroup: fg,
      rnd: n.rnd,
      rnd2: n.rnd2,
      rnd3: n.rnd3,
    };
    segs.push(seg);
    for (const c of n.children) {
      if (walk(c, x2, y2, abs, sg, fg)) seg.terminal = false;
    }
    return true;
  };
  walk(root, 0, 0, -Math.PI / 2, -1, -1);
  return segs;
}
