/**
 * 小さな図形（葉・花びら・つぼみ・実）を、絶対座標の path 文字列に変換する道具。
 * 同じ色の図形を 1 本の path にまとめて描くことで、葉が数千枚でも要素数を抑える。
 */

export type Cmd =
  | ['M', number, number]
  | ['L', number, number]
  | ['Q', number, number, number, number]
  | ['C', number, number, number, number, number, number]
  | ['Z'];

export type Xf = { x: number; y: number; rot: number; sx: number; sy?: number };

export function xfCmds(cmds: Cmd[], t: Xf): Cmd[] {
  const c = Math.cos(t.rot);
  const s = Math.sin(t.rot);
  const sx = t.sx;
  const sy = t.sy ?? t.sx;
  const X = (px: number, py: number) => t.x + px * sx * c - py * sy * s;
  const Y = (px: number, py: number) => t.y + px * sx * s + py * sy * c;
  return cmds.map((k): Cmd => {
    switch (k[0]) {
      case 'M':
        return ['M', X(k[1], k[2]), Y(k[1], k[2])];
      case 'L':
        return ['L', X(k[1], k[2]), Y(k[1], k[2])];
      case 'Q':
        return ['Q', X(k[1], k[2]), Y(k[1], k[2]), X(k[3], k[4]), Y(k[3], k[4])];
      case 'C':
        return ['C', X(k[1], k[2]), Y(k[1], k[2]), X(k[3], k[4]), Y(k[3], k[4]), X(k[5], k[6]), Y(k[5], k[6])];
      default:
        return ['Z'];
    }
  });
}

const n1 = (v: number) => (Math.round(v * 10) / 10).toString();

export function toD(cmds: Cmd[]): string {
  let out = '';
  for (const k of cmds) {
    switch (k[0]) {
      case 'M':
      case 'L':
        out += `${k[0]}${n1(k[1])} ${n1(k[2])}`;
        break;
      case 'Q':
        out += `Q${n1(k[1])} ${n1(k[2])} ${n1(k[3])} ${n1(k[4])}`;
        break;
      case 'C':
        out += `C${n1(k[1])} ${n1(k[2])} ${n1(k[3])} ${n1(k[4])} ${n1(k[5])} ${n1(k[6])}`;
        break;
      default:
        out += 'Z';
    }
  }
  return out;
}

export const emit = (cmds: Cmd[], t: Xf) => toD(xfCmds(cmds, t));

/** 単位楕円（4本の3次ベジェ近似） */
export function ellipseCmds(rx: number, ry: number, cx = 0, cy = 0): Cmd[] {
  const k = 0.5523;
  return [
    ['M', cx + rx, cy],
    ['C', cx + rx, cy + ry * k, cx + rx * k, cy + ry, cx, cy + ry],
    ['C', cx - rx * k, cy + ry, cx - rx, cy + ry * k, cx - rx, cy],
    ['C', cx - rx, cy - ry * k, cx - rx * k, cy - ry, cx, cy - ry],
    ['C', cx + rx * k, cy - ry, cx + rx, cy - ry * k, cx + rx, cy],
    ['Z'],
  ];
}

export const circleD = (cx: number, cy: number, r: number) => toD(ellipseCmds(r, r, cx, cy));

// ---------- 葉（長さ 1、+x 方向が葉先） ----------

export type LeafShape = 'almond' | 'glossy' | 'broad' | 'palmate';

const almond = (w: number): Cmd[] => [
  ['M', 0, 0],
  ['C', 0.28, -w, 0.78, -w * 0.75, 1, 0],
  ['C', 0.78, w * 0.75, 0.28, w, 0, 0],
  ['Z'],
];

function palmate(): Cmd[] {
  const cx = 0.36;
  const deg = (d: number) => (d * Math.PI) / 180;
  const tips = [-100, -52, 0, 52, 100];
  const radii = [0.48, 0.6, 0.66, 0.6, 0.48];
  const valley = (d: number): [number, number] => [cx + Math.cos(deg(d)) * 0.2, Math.sin(deg(d)) * 0.2];
  const pts: [number, number][] = [[0, 0], valley(-128)];
  tips.forEach((d, i) => {
    pts.push([cx + Math.cos(deg(d)) * radii[i], Math.sin(deg(d)) * radii[i]]);
    pts.push(valley(i < tips.length - 1 ? (d + tips[i + 1]) / 2 : 128));
  });
  return [['M', pts[0][0], pts[0][1]], ...pts.slice(1).map((q): Cmd => ['L', q[0], q[1]]), ['Z']];
}

export const LEAF_CMDS: Record<LeafShape, Cmd[]> = {
  almond: almond(0.36),
  glossy: almond(0.42),
  broad: almond(0.5),
  palmate: palmate(),
};

// ---------- 花（半径 1） ----------

const sakuraPetal: Cmd[] = [
  ['M', 0, 0.5],
  ['C', -0.55, 0.2, -0.5, -0.45, -0.12, -0.5],
  ['L', 0, -0.36],
  ['L', 0.12, -0.5],
  ['C', 0.5, -0.45, 0.55, 0.2, 0, 0.5],
  ['Z'],
];

const hibiscusPetal: Cmd[] = [
  ['M', 0, 0],
  ['C', -0.62, -0.25, -0.6, -1.0, 0, -1.0],
  ['C', 0.6, -1.0, 0.62, -0.25, 0, 0],
  ['Z'],
];

export type FlowerParts = { petalA: string; petalB: string; center: string; accent: string; stamen: string };

export function flowerD(style: 'sakura' | 'camellia' | 'hibiscus' | 'mapleBlossom', t: Xf): FlowerParts {
  const parts: FlowerParts = { petalA: '', petalB: '', center: '', accent: '', stamen: '' };
  const compose = (cmds: Cmd[], local: Xf) => emit(xfCmds(cmds, local), t);
  if (style === 'sakura') {
    for (let i = 0; i < 5; i++) {
      const a = ((i * 72 - 90) * Math.PI) / 180;
      parts.petalA += compose(sakuraPetal, { x: Math.cos(a) * 0.55, y: Math.sin(a) * 0.55, rot: (i * 72 * Math.PI) / 180, sx: 1 });
    }
    parts.center += emit(ellipseCmds(0.22, 0.22), t);
  } else if (style === 'camellia') {
    for (let i = 0; i < 6; i++) {
      const petal = xfCmds(ellipseCmds(0.42, 0.5), { x: 0, y: -0.42, rot: 0, sx: 1 });
      const d = compose(petal, { x: 0, y: 0, rot: ((i * 60 + 15) * Math.PI) / 180, sx: 1 });
      if (i % 2) parts.petalB += d;
      else parts.petalA += d;
    }
    parts.accent += emit(ellipseCmds(0.36, 0.36), t);
    parts.center += emit(ellipseCmds(0.22, 0.22), t);
  } else if (style === 'hibiscus') {
    for (let i = 0; i < 5; i++) {
      const d = compose(hibiscusPetal, { x: 0, y: 0, rot: (i * 72 * Math.PI) / 180, sx: 1 });
      if (i % 2) parts.petalB += d;
      else parts.petalA += d;
    }
    parts.center += emit(ellipseCmds(0.28, 0.28), t);
    parts.stamen += emit(
      [
        ['M', 0, 0],
        ['L', 0.55, -0.75],
      ],
      t
    );
    parts.accent += emit(ellipseCmds(0.11, 0.11, 0.58, -0.8), t);
  } else {
    // 楓の花：小さな赤い花が数個かたまって咲く
    for (const [dx, dy] of [
      [0, 0],
      [0.9, 0.5],
      [-0.7, 0.7],
    ]) {
      parts.petalA += emit(ellipseCmds(0.45, 0.45, dx, dy), t);
      parts.center += emit(ellipseCmds(0.18, 0.18, dx, dy), t);
    }
  }
  return parts;
}

// ---------- つぼみ（高さ 1、上向き） ----------

export const BUD_CMDS: Cmd[] = [
  ['M', 0, 0],
  ['C', -0.35, -0.32, -0.32, -0.82, 0, -1.05],
  ['C', 0.32, -0.82, 0.35, -0.32, 0, 0],
  ['Z'],
];
export const CALYX_CMDS: Cmd[] = [['M', -0.26, 0], ['Q', 0, 0.22, 0.26, 0], ['L', 0, -0.18], ['Z']];

// ---------- 実 ----------

/** 翼果（楓の実）：2枚の羽が V 字に付く。原点が付け根 */
export const SAMARA_WING: Cmd[] = [
  ['M', 0, 0],
  ['C', 0.25, -0.12, 0.8, -0.22, 1, 0],
  ['C', 0.8, 0.12, 0.35, 0.16, 0, 0],
  ['Z'],
];
