import type {
  BranchSpec,
  ComputedBranch,
  LeafShape,
  Point,
  TreeSkeleton,
} from './types';
import { clamp, lerp } from './utils';

export function cubicPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
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

export function quadPoint(p0: Point, p1: Point, p2: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

export function buildTaperedBranchPath(
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

export function buildScallopedClusterPath(cx: number, cy: number, r: number, fold = 0) {
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

export function buildTropicalClusterPath(cx: number, cy: number, r: number, fold = 0) {
  const fronds = 8;
  let d = '';
  for (let i = 0; i < fronds; i++) {
    const a = (i / fronds) * Math.PI * 2 - Math.PI / 2;
    const nextA = ((i + 1) / fronds) * Math.PI * 2 - Math.PI / 2;
    const midA = (a + nextA) * 0.5;
    const tipR = r * (1.18 - (i % 2) * 0.14) * (1 - fold * 0.22);
    const valleyR = r * 0.56;
    const tx = cx + Math.cos(a) * tipR;
    const ty = cy + Math.sin(a) * tipR * 0.82;
    const vx = cx + Math.cos(midA) * valleyR;
    const vy = cy + Math.sin(midA) * valleyR * 0.82;
    if (i === 0) {
      d = `M ${tx.toFixed(1)} ${ty.toFixed(1)}`;
    }
    const c1x = cx + Math.cos(a + 0.18) * r * 0.92;
    const c1y = cy + Math.sin(a + 0.18) * r * 0.78;
    const nextTx = cx + Math.cos(nextA) * r * (1.18 - ((i + 1) % 2) * 0.14) * (1 - fold * 0.22);
    const nextTy = cy + Math.sin(nextA) * r * (1.18 - ((i + 1) % 2) * 0.14) * (1 - fold * 0.22) * 0.82;
    d += ` Q ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${vx.toFixed(1)} ${vy.toFixed(1)} L ${nextTx.toFixed(1)} ${nextTy.toFixed(1)}`;
  }
  return `${d} Z`;
}

export function buildMapleClusterPath(cx: number, cy: number, r: number, fold = 0) {
  const points = 10;
  let d = '';
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2 - Math.PI / 2;
    const isPeak = i % 2 === 0;
    const rad = r * (isPeak ? 1.15 - ((i / 2) % 2) * 0.12 : 0.62) * (1 - fold * 0.22);
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad * 0.86;
    d += i === 0 ? `M ${px.toFixed(1)} ${py.toFixed(1)}` : ` L ${px.toFixed(1)} ${py.toFixed(1)}`;
  }
  return `${d} Z`;
}

export function buildEvergreenClusterPath(cx: number, cy: number, r: number, fold = 0) {
  const w = r * 1.18 * (1 - fold * 0.22);
  const h = r * 0.94;
  const topY = cy - h * 0.96;
  const midY = cy - h * 0.12;
  const botY = cy + h * 0.56;

  return `M ${cx.toFixed(1)} ${topY.toFixed(1)}
    L ${(cx + w * 0.52).toFixed(1)} ${midY.toFixed(1)}
    L ${(cx + w * 0.36).toFixed(1)} ${midY.toFixed(1)}
    L ${(cx + w).toFixed(1)} ${botY.toFixed(1)}
    Q ${(cx + w * 0.45).toFixed(1)} ${(botY + 5).toFixed(1)}, ${cx.toFixed(1)} ${(botY + 2).toFixed(1)}
    Q ${(cx - w * 0.45).toFixed(1)} ${(botY + 5).toFixed(1)}, ${(cx - w).toFixed(1)} ${botY.toFixed(1)}
    L ${(cx - w * 0.36).toFixed(1)} ${midY.toFixed(1)}
    L ${(cx - w * 0.52).toFixed(1)} ${midY.toFixed(1)} Z`;
}

export function buildClusterPathByShape(
  shape: LeafShape,
  cx: number,
  cy: number,
  r: number,
  fold = 0
) {
  switch (shape) {
    case 'tropical':
      return buildTropicalClusterPath(cx, cy, r, fold);
    case 'maple':
      return buildMapleClusterPath(cx, cy, r, fold);
    case 'needle':
      return buildEvergreenClusterPath(cx, cy, r, fold);
    case 'rounded':
    default:
      return buildScallopedClusterPath(cx, cy, r, fold);
  }
}

export function computeTreeSkeleton(
  cd: number,
  branchSpecs: BranchSpec[],
  opts?: {
    heightScale?: number;
    thicknessScale?: number;
    isSecondGenChild?: boolean;
    isEvergreen?: boolean;
  }
): TreeSkeleton {
  const heightScale = opts?.heightScale ?? 1;
  const thicknessScale = opts?.thicknessScale ?? 1;
  const isSecondGenChild = opts?.isSecondGenChild ?? false;
  const isEvergreen = opts?.isEvergreen ?? false;

  const trunkG = clamp((cd - 22) / 118, 0, 1);
  const trunkScaleH = lerp(0.28, 1.0, Math.pow(trunkG, 0.78)) * heightScale;
  const trunkScaleW = lerp(0.32, 1.0, Math.pow(trunkG, 1.05)) * thicknessScale;

  const youthWave = Math.sin(trunkG * Math.PI);
  const growSway1 = Math.sin(trunkG * Math.PI * 2.5) * 7.5 * youthWave;
  const growSway2 = -Math.sin(trunkG * Math.PI * 2.1) * 6.5 * youthWave;

  const ageLean = !isEvergreen && cd >= 312 ? clamp((cd - 312) / 48, 0, 1) * -6.5 : 0;
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

  const winterBow =
    cd >= 288 ? clamp((cd - 288) / 58, 0, 1) * (isEvergreen ? 2.2 : 5.2) : 0;
  const twigWeather = !isEvergreen && cd >= 340 ? clamp((cd - 340) / 20, 0, 1) : 0;

  const branches: Record<string, ComputedBranch> = {};

  for (const br of branchSpecs) {
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

export function getAnchorPoint(
  skeleton: TreeSkeleton,
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

export function buildSeagullPath(wingPos: number, bankSkew: number) {
  const leftSpan = 10.5 * (1 - bankSkew * 0.16);
  const rightSpan = 10.5 * (1 + bankSkew * 0.16);
  const elbowLift = -2.8 + wingPos * 2.4;
  const tipY = -0.6 + wingPos * 5.2;

  return `M ${(-leftSpan).toFixed(2)} ${tipY.toFixed(2)} Q ${(-leftSpan * 0.52).toFixed(2)} ${elbowLift.toFixed(2)}, 0 0 Q ${(rightSpan * 0.52).toFixed(2)} ${elbowLift.toFixed(2)}, ${rightSpan.toFixed(2)} ${tipY.toFixed(2)}`;
}
