import type { SpeciesBloomSchedule } from '../types';
import { clamp, lerp } from '../utils';
import { BUD_CMDS, CALYX_CMDS, LEAF_CMDS, SAMARA_WING, circleD, emit, ellipseCmds, flowerD } from './pathKit';
import { type BotanicalProfile, type TreeState, getBloomPhase, getTreeState } from './profiles';
import { type TreeSeg, layoutTree, quadPoint, rng } from './structure';

/**
 * 1 日分の木の「形」を作る。結果は色の決まっていない「スロット → path 文字列」の束で、
 * 色は描画時に時間帯（昼・夕・夜）に合わせて決める。
 * こうすると形の計算は日付が変わったときだけで済み、毎秒の再描画は色の差し替えだけになる。
 */

/** スロット名 → 同じ色で塗る図形をまとめた path */
export type Buckets = Record<string, string>;

export type FlutterGroup = { id: number; ox: number; oy: number; dur: number; delay: number; amp: number; buckets: Buckets };
export type SwayGroup = FlutterGroup & { flutters: FlutterGroup[] };

export type TreeModel = {
  state: TreeState;
  trunk: Buckets;
  groups: SwayGroup[];
  falling: Buckets;
  ground: Buckets;
  minX: number;
  maxX: number;
  bare: boolean;
};

/** 光は左上から */
const LIGHT_X = -0.55;

const add = (b: Buckets, key: string, d: string) => {
  if (!d) return;
  b[key] = (b[key] ?? '') + d;
};

function taperD(s: TreeSeg, wScale = 1, ox = 0, oy = 0) {
  const dx = s.x2 - s.x1;
  const dy = s.y2 - s.y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const w0 = (s.w1 * wScale) / 2;
  const w1 = (s.w2 * wScale) / 2;
  const wm = (w0 + w1) / 2;
  const f = (v: number) => (Math.round(v * 10) / 10).toString();
  return (
    `M${f(s.x1 + nx * w0 + ox)} ${f(s.y1 + ny * w0 + oy)}` +
    `Q${f(s.cx + nx * wm + ox)} ${f(s.cy + ny * wm + oy)} ${f(s.x2 + nx * w1 + ox)} ${f(s.y2 + ny * w1 + oy)}` +
    `L${f(s.x2 - nx * w1 + ox)} ${f(s.y2 - ny * w1 + oy)}` +
    `Q${f(s.cx - nx * wm + ox)} ${f(s.cy - ny * wm + oy)} ${f(s.x1 - nx * w0 + ox)} ${f(s.y1 - ny * w0 + oy)}Z`
  );
}

const tone = (t: number) => Math.round(clamp(t, 0, 4) * 4);

export function buildTreeModel(profile: BotanicalProfile, schedule: SpeciesBloomSchedule, cd: number): TreeModel {
  const state = getTreeState(profile, cd);
  const segs = layoutTree(profile.shape, state.g);
  const maxDepth = profile.shape.maxDepth;
  const bare = profile.deciduous && state.fall >= 0.9;

  const trunk: Buckets = {};
  const falling: Buckets = {};
  const ground: Buckets = {};
  const groups = new Map<number, SwayGroup>();

  const bucketFor = (s: TreeSeg): Buckets => {
    if (s.swayGroup === -1) return trunk;
    let g = groups.get(s.swayGroup);
    if (!g) {
      const r = rng(s.swayGroup * 97 + 13);
      const dur = 3.6 + r() * 2;
      const origin = segs.find((q) => q.id === s.swayGroup) ?? s;
      g = { id: s.swayGroup, ox: origin.x1, oy: origin.y1, dur, delay: -r() * dur, amp: 1.1 + r() * 0.8, buckets: {}, flutters: [] };
      groups.set(s.swayGroup, g);
    }
    if (s.flutterGroup === -1) return g.buckets;
    let fl = g.flutters.find((q) => q.id === s.flutterGroup);
    if (!fl) {
      const r = rng(s.flutterGroup * 131 + 7);
      const dur = 1.9 + r() * 1.1;
      const origin = segs.find((q) => q.id === s.flutterGroup) ?? s;
      fl = { id: s.flutterGroup, ox: origin.x1, oy: origin.y1, dur, delay: -r() * dur, amp: 1.8 + r() * 1.6, buckets: {} };
      g.flutters.push(fl);
    }
    return fl.buckets;
  };

  // ---- 幹の根元の張り出し（上端は幹の太さにそろえて段差を作らない） ----
  // 注意：同じ色の図形は 1 本の path にまとめるので、塗りの重なりが打ち消し合わないよう
  // 枝（taperD）と同じ向き（画面上で反時計回り）で描く。
  if (segs.length) {
    const hw = segs[0].w1 * 0.46;
    const f = (v: number) => (Math.round(v * 10) / 10).toString();
    add(trunk, 'bark.mid', `M${f(hw * 1.95)} 3C${f(hw * 1.15)} 2 ${f(hw)} -3 ${f(hw)} -10L${f(-hw)} -10C${f(-hw)} -3 ${f(-hw * 1.15)} 2 ${f(-hw * 1.9)} 3Z`);
    add(trunk, 'bark.dark', `M${f(hw * 1.95)} 3C${f(hw * 1.15)} 2 ${f(hw)} -3 ${f(hw)} -10L${f(hw * 0.12)} -10L${f(hw * 0.3)} 3Z`);
  }

  for (const s of segs) {
    const b = bucketFor(s);

    // ---- 枝：中間色の本体 + 影側の帯 + 光側の細いハイライト ----
    add(b, 'bark.mid', taperD(s));
    if (s.w1 > 1.2) {
      add(b, 'bark.dark', taperD(s, 0.36, -LIGHT_X * s.w1 * 0.36, 0));
      add(b, 'bark.light', taperD(s, 0.16, LIGHT_X * s.w1 * 0.32, 0));
    }
    if (profile.lenticels && s.depth <= 1 && s.w1 > 4) {
      const r = rng(s.id * 7 + 1);
      for (let t = 0.08; t < 0.94; t += 0.07 + r() * 0.08) {
        const p = quadPoint(s, t);
        const a = s.w1 * (0.12 + r() * 0.16);
        const off = (r() - 0.5) * s.w1 * 0.4;
        add(b, 'bark.lent', `M${(p.x + off - a).toFixed(1)} ${p.y.toFixed(1)}v0.5h${(a * 2).toFixed(1)}v-0.5Z`);
      }
    }

    // ---- 冬：細い小枝と冬芽、枝の上の雪 ----
    if (bare && s.terminal) {
      const r = rng(s.id + 99);
      for (let i = 0; i < 3; i++) {
        const a = s.abs + (r() - 0.5) * 1.3;
        const L = 5 + r() * 6;
        const ex = s.x2 + Math.cos(a) * L;
        const ey = s.y2 + Math.sin(a) * L;
        const twig: TreeSeg = { ...s, x1: s.x2, y1: s.y2, cx: (s.x2 + ex) / 2, cy: (s.y2 + ey) / 2, x2: ex, y2: ey, w1: 0.9, w2: 0.4 };
        add(b, 'bark.dark', taperD(twig));
        add(b, 'wbud', emit(ellipseCmds(0.9, 1.3), { x: ex, y: ey, rot: a + Math.PI / 2, sx: 1 }));
      }
    }
    if (bare && Math.abs(Math.sin(s.abs)) < 0.8 && s.w1 > 1) {
      add(b, 'snow', taperD(s, 0.55, 0, -s.w1 * 0.45));
    }
    if (!bare && s.terminal && s.y2 < -40 && Math.sin(s.abs) < -0.35 && s.rnd2 < 0.55) {
      add(b, 'snow', emit(ellipseCmds(4.2, 1.7), { x: s.x2, y: s.y2 - 4, rot: 0, sx: 1 }));
    }

    // ---- 葉 ----
    const leafy = s.terminal || s.depth >= maxDepth - profile.leafLevels;
    if (leafy && !bare) {
      const r = rng(s.id * 31 + 7);
      const count = Math.max(3, Math.floor(s.L / 2.8));
      for (let k = 0; k <= count; k++) {
        const t = 0.3 + (k / count) * 0.7;
        const p = quadPoint(s, t);
        const sides = k === count && s.terminal ? [-1, -0.5, 0, 0.5, 1] : [-1, 1];
        for (const side of sides) {
          // 乱数は状態に関係なく同じ回数だけ引き、日ごとに葉が入れ替わらないようにする
          const rFall = r();
          const rAng = r();
          const rTwist = r();
          const rLen = r();
          const rCol = r();
          const rLayer = r();
          const rShade = r();
          const rDropX = r();
          const rDropY = r();
          const rDropRot = r();
          const ang = s.abs + side * (0.75 + rAng * 0.35) + (side === 0 ? (rTwist - 0.5) * 0.3 : 0);
          const len = profile.leafLen * (0.8 + rLen * 0.45) * lerp(0.55, 1, state.g);
          const q = tone(state.cT + (rCol - 0.5) * state.cSpread);
          const cmds = LEAF_CMDS[profile.leafShape];
          if (state.fall > 0 && rFall < state.fall) {
            if (rFall > state.fall - 0.1) {
              const fx = p.x + (rDropX - 0.5) * 34;
              const fy = p.y + rDropY * (-p.y - 4);
              add(falling, `leafF.${tone(state.cT + 0.3 + (rCol - 0.5))}.m`, emit(cmds, { x: fx, y: fy, rot: rDropRot * Math.PI * 2, sx: len }));
            }
            continue;
          }
          const back = rLayer < 0.38;
          const xf = { x: p.x, y: p.y, rot: ang, sx: len };
          if (back) {
            add(b, `leafB.${q}`, emit(cmds, xf));
          } else {
            add(b, `leafF.${q}.${rShade < 0.55 ? 'm' : 'l'}`, emit(cmds, xf));
            if (profile.leafShape !== 'palmate') {
              add(b, 'vein', emit([['M', 0.1, 0], ['L', 0.8, 0]], xf));
            }
            if (profile.leafShape === 'glossy') {
              add(b, 'gloss', emit([['M', 0.25, -0.18], ['Q', 0.5, -0.26, 0.72, -0.14]], xf));
            }
            if (rDropRot < 0.035) {
              const tip = { x: p.x + Math.cos(ang) * len * 0.85, y: p.y + Math.sin(ang) * len * 0.85 };
              add(b, 'drop', circleD(tip.x, tip.y + 1, 1.1));
            }
          }
        }
      }
    }

    // ---- つぼみ・花・実（枝先） ----
    if (s.terminal) {
      const r = rng(s.id * 17 + 3);
      const rSel = r();
      const rFruit = r();
      const picks = Array.from({ length: profile.flowersPerTip }, () => ({ a: r(), d: r(), rot: r(), off: r() }));
      if (rSel < profile.flowerDensity) {
        picks.forEach((pk, i) => {
          const ang = s.abs + (pk.a - 0.5) * 2.4;
          const dist = profile.flowerStyle === 'sakura' ? 2 + pk.d * 6 : 3;
          const x = s.x2 + Math.cos(ang) * dist;
          const y = s.y2 + Math.sin(ang) * dist;
          const dayOffset = Math.floor(pk.off * 6) - 2;
          const phase = getBloomPhase(schedule, cd, dayOffset, i === 0 && rFruit < profile.fruitDensity / profile.flowerDensity);
          if (phase.bud > 0) {
            const sc = Math.max(2.4, profile.flowerSize * 0.95 * (0.4 + 0.6 * phase.bud));
            const xf = { x, y, rot: ang + Math.PI / 2, sx: sc };
            add(b, phase.bud > 0.55 ? 'bud.1' : 'bud.0', emit(BUD_CMDS, xf));
            add(b, 'calyx', emit(CALYX_CMDS, xf));
          }
          if (phase.open > 0 && phase.wither < 0.95) {
            const sc = profile.flowerSize * (0.55 + 0.45 * phase.open) * (1 - 0.25 * phase.wither);
            const parts = flowerD(profile.flowerStyle, { x, y: y + phase.wither * 3, rot: pk.rot * 1.2 + phase.wither * 0.3, sx: sc });
            const pre = phase.wither > 0.5 ? 'flw' : 'fl';
            add(b, `${pre}.petalA`, parts.petalA);
            add(b, `${pre}.petalB`, parts.petalB);
            add(b, `${pre}.accent`, parts.accent);
            add(b, `${pre}.center`, parts.center);
            add(b, 'fl.stamen', parts.stamen);
          }
          if (phase.fruit >= 0) {
            const m = Math.min(3, Math.floor(phase.fruit * 4));
            const key = `fruit.${m}`;
            if (profile.fruitStyle === 'cherry') {
              add(b, 'fruitStem', `M${s.x2.toFixed(1)} ${s.y2.toFixed(1)}L${(s.x2 + 0.6).toFixed(1)} ${(s.y2 + 5).toFixed(1)}`);
              add(b, key, circleD(s.x2 + 0.6, s.y2 + 6.8, lerp(2, 3, phase.fruit)));
              add(b, 'fruitHi', circleD(s.x2 - 0.2, s.y2 + 6, 0.7));
            } else if (profile.fruitStyle === 'samara') {
              add(b, 'fruitStem', `M${s.x2.toFixed(1)} ${s.y2.toFixed(1)}L${s.x2.toFixed(1)} ${(s.y2 + 3).toFixed(1)}`);
              for (const sgn of [-1, 1]) {
                add(b, key, emit(SAMARA_WING, { x: s.x2, y: s.y2 + 3, rot: Math.PI / 2 + sgn * 0.85, sx: lerp(6, 9, phase.fruit) }));
              }
              add(b, key, circleD(s.x2, s.y2 + 3, 1.3));
            } else if (profile.fruitStyle === 'camelliaNut') {
              add(b, key, circleD(s.x2, s.y2 + 3.5, lerp(2.6, 4, phase.fruit)));
              add(b, 'fruitHi', circleD(s.x2 - 1, s.y2 + 2.4, 0.9));
            } else {
              add(b, key, emit(ellipseCmds(1.9, 3.4), { x: s.x2 + Math.cos(s.abs) * 3, y: s.y2 + Math.sin(s.abs) * 3, rot: s.abs + Math.PI / 2, sx: lerp(0.8, 1, phase.fruit) }));
            }
          }
        });
      }
    }
  }

  // ---- 足元の落ち葉 ----
  const xs = segs.map((s) => s.x2);
  const minX = xs.length ? Math.min(...xs) : -10;
  const maxX = xs.length ? Math.max(...xs) : 10;
  if (profile.deciduous && state.fall > 0.15) {
    const r = rng(9);
    const spreadW = Math.max(30, (maxX - minX) * 0.55);
    const n = Math.round(34 * state.fall);
    for (let i = 0; i < n; i++) {
      const rx = r();
      const ry = r();
      const rr = r();
      const rc = r();
      add(
        ground,
        `leafF.${tone(state.cT + 0.3 + (rc - 0.5) * 1.2)}.m`,
        emit(LEAF_CMDS[profile.leafShape], { x: (rx - 0.5) * spreadW * 1.7, y: 1 + ry * 5, rot: rr * Math.PI * 2, sx: profile.leafLen, sy: profile.leafLen * 0.5 })
      );
    }
  }

  return {
    state,
    trunk,
    groups: [...groups.values()].sort((a, b) => a.id - b.id),
    falling,
    ground,
    minX,
    maxX,
    bare,
  };
}
