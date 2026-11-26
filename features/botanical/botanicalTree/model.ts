import type { SpeciesBloomSchedule } from '../types';
import { clamp, lerp } from '../utils';
import { BUD_CMDS, CALYX_CMDS, LEAF_CMDS, SAKURA_PETAL, SAMARA_WING, circleD, emit, ellipseCmds, flowerD } from './pathKit';
import { type BotanicalProfile, type TreeState, getBloomPhase, getTreeState } from './profiles';
import { type TreeSeg, layoutTree, quadPoint, rng } from './structure';

/**
 * 1 日分の木の「形」を作る。結果は色の決まっていない「スロット → path 文字列」の束で、
 * 色は描画時に時間帯（昼・夕・夜）に合わせて決める。
 * 形の計算は日付が変わったときだけで済み、毎秒の再描画は色の差し替えだけになる。
 *
 * 消え方はすべて「植物として起きること」で表す（透明度で薄くすることはしない）。
 * - 葉：色づく → 垂れる → 舞いながら落ちる → 地面に積もる → 分解されて減る
 * - 桜：花びらが 1 枚ずつ散る / 椿・ハイビスカス：花ごと落ちて地面でしおれる
 * - 実：熟して落ちる（楓の翼果は回りながら落ちる）
 * - 前の世代の木：葉を落とし、枝先から順に枝を落とし、幹が崩れて苔むした切り株になり、ゆっくり土に還る
 */

/** スロット名 → 同じ色で塗る図形をまとめた path */
export type Buckets = Record<string, string>;

export type FlutterGroup = { id: number; ox: number; oy: number; dur: number; delay: number; amp: number; buckets: Buckets };
export type SwayGroup = FlutterGroup & { flutters: FlutterGroup[] };

/** 落ちていくもの。flutter = 舞う（葉・花びら）、drop = まっすぐ落ちる（花・実・枝）、spin = 回りながら落ちる（翼果） */
export type FallStyle = 'flutter' | 'drop' | 'spin';

export type Faller = {
  key: string;
  /** 落ち始める位置（ツリーローカル座標） */
  x: number;
  y: number;
  /** 原点を中心にした形 */
  d: string;
  slot: string;
  style: FallStyle;
  /** 地面までの落下距離（px） */
  drop: number;
  /** 左右の揺れ幅（px） */
  drift: number;
  /** 回転量（deg） */
  spin: number;
  /** 1 回の落下にかかる秒数（地面で少し休む時間を含む） */
  dur: number;
  delay: number;
  /** 舞う・回る動きの周期（秒） */
  flipDur: number;
};

export type TreeModel = {
  state: TreeState;
  trunk: Buckets;
  groups: SwayGroup[];
  /** 地面に落ちたもの（落ち葉・花びら・花・実） */
  ground: Buckets;
  fallers: Faller[];
  minX: number;
  maxX: number;
};

export type ModelOptions = {
  /**
   * 0 より大きいとき、前の世代の木として「朽ちていく途中」を描く。
   * 値は新しいサイクルの日数（cd）。木そのものは cd360 の姿から始まる。
   */
  decayDay?: number;
};

/** 光は左上から */
const LIGHT_X = -0.55;

/** 同時に落ちているものの上限（多すぎると騒がしく、重くなる） */
const CAP = { leaf: 32, petal: 22, flower: 6, fruit: 8, twig: 10, chip: 4 };
const LITTER_MAX = 46;
const PETAL_GROUND_MAX = 40;

const add = (b: Buckets, key: string, d: string) => {
  if (!d) return;
  b[key] = (b[key] ?? '') + d;
};

const f1 = (v: number) => (Math.round(v * 10) / 10).toString();

/** 枝 1 本分の、先に向かって細くなる形（画面上で反時計回り） */
function taperD(s: TreeSeg, wScale = 1, ox = 0, oy = 0) {
  const dx = s.x2 - s.x1;
  const dy = s.y2 - s.y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const w0 = (s.w1 * wScale) / 2;
  const w1 = (s.w2 * wScale) / 2;
  const wm = (w0 + w1) / 2;
  return (
    `M${f1(s.x1 + nx * w0 + ox)} ${f1(s.y1 + ny * w0 + oy)}` +
    `Q${f1(s.cx + nx * wm + ox)} ${f1(s.cy + ny * wm + oy)} ${f1(s.x2 + nx * w1 + ox)} ${f1(s.y2 + ny * w1 + oy)}` +
    `L${f1(s.x2 - nx * w1 + ox)} ${f1(s.y2 - ny * w1 + oy)}` +
    `Q${f1(s.cx - nx * wm + ox)} ${f1(s.cy - ny * wm + oy)} ${f1(s.x1 - nx * w0 + ox)} ${f1(s.y1 - ny * w0 + oy)}Z`
  );
}

/** 枝を根元から t の位置で切った残り */
function truncateSeg(s: TreeSeg, t: number): TreeSeg {
  const p = quadPoint(s, t);
  return { ...s, cx: lerp(s.x1, s.cx, t), cy: lerp(s.y1, s.cy, t), x2: p.x, y2: p.y, w2: lerp(s.w1, s.w2, t), L: s.L * t };
}

const tone = (t: number) => Math.round(clamp(t, 0, 4) * 4);

/** 角度 a を真下（+π/2）へ k の割合だけ近づける */
function towardDown(a: number, k: number) {
  const diff = Math.atan2(Math.sin(Math.PI / 2 - a), Math.cos(Math.PI / 2 - a));
  return a + diff * k;
}

type Cand = { pri: number; make: () => Faller };

export function buildTreeModel(profile: BotanicalProfile, schedule: SpeciesBloomSchedule, cd: number, opts: ModelOptions = {}): TreeModel {
  const decay = opts.decayDay ?? 0;
  const dying = decay > 0;
  let state = getTreeState(profile, dying ? 360 : cd);
  if (dying && !profile.deciduous) {
    // 常緑樹も、世代交代では葉が茶色くなってから落ちる
    state = { ...state, cT: lerp(1, 3.6, clamp(decay / 10, 0, 1)), cSpread: 1.2, fall: Math.pow(clamp((decay - 5) / 11, 0, 1), 0.7), young: 0 };
  }
  const segs = layoutTree(profile.shape, state.g);
  const maxDepth = profile.shape.maxDepth;
  const bare = state.fall >= 0.9;

  // 朽ちていく木：枝先の世代から順に落ちる（子の枝は必ず親より先に落ちる）
  const dropDay = (s: TreeSeg) => (s.depth === 0 ? Infinity : 10 + (maxDepth - s.depth) * 2.2 + s.rnd3 * 2.2);
  const alive = (s: TreeSeg) => !dying || decay < dropDay(s);

  const trunk: Buckets = {};
  const ground: Buckets = {};
  const groups = new Map<number, SwayGroup>();
  const cands: Record<keyof typeof CAP, Cand[]> = { leaf: [], petal: [], flower: [], fruit: [], twig: [], chip: [] };

  const faller = (key: string, x: number, y: number, d: string, slot: string, style: FallStyle, seed: number): Faller => {
    const r = rng(seed);
    const groundY = 2 + r() * 4;
    const drop = Math.max(6, groundY - y);
    const dur = style === 'flutter' ? 7 + r() * 4 : style === 'spin' ? 7 + r() * 3 : 9 + r() * 5;
    const drift = style === 'drop' ? (r() - 0.5) * 10 : (r() - 0.5) * 2 * (14 + drop * 0.12);
    const spin = style === 'spin' ? 360 : style === 'flutter' ? 40 + r() * 60 : (r() - 0.5) * 160;
    const flipDur = style === 'spin' ? 0.45 + r() * 0.25 : style === 'flutter' ? 1.4 + r() * 1.1 : dur;
    return { key, x, y, d, slot, style, drop, drift, spin, dur, delay: -r() * dur, flipDur };
  };

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

  // ---- 幹（朽ちていく木では、上から崩れて切り株になり、ゆっくり沈む） ----
  let trunkSeg: TreeSeg | null = segs[0] ?? null;
  let sink = 0;
  if (dying && trunkSeg && decay >= 24) {
    const stumpLen = Math.min(22, trunkSeg.L);
    const crumble = clamp((decay - 24) / 12, 0, 1);
    sink = clamp((decay - 36) / 300, 0, 1);
    const visLen = lerp(trunkSeg.L, stumpLen, crumble) * (1 - sink);
    if (visLen < 1.5) {
      trunkSeg = null;
    } else {
      const cut = truncateSeg(trunkSeg, visLen / trunkSeg.L);
      trunkSeg = cut;
      // 折れ口：ギザギザの断面
      const ul = Math.hypot(cut.x2 - cut.cx, cut.y2 - cut.cy) || 1;
      const ux = (cut.x2 - cut.cx) / ul;
      const uy = (cut.y2 - cut.cy) / ul;
      const nx = -uy;
      const ny = ux;
      const w = cut.w2 / 2;
      const hs = [0, 3.2, 1, 3.8, 0.6, 2.6, 0];
      const pts = hs.map((h, i) => {
        const k = w - (2 * w * i) / (hs.length - 1);
        return `${f1(cut.x2 + nx * k + ux * h * (1 - sink))} ${f1(cut.y2 + ny * k + uy * h * (1 - sink))}`;
      });
      add(trunk, 'bark.cap', `M${pts.join('L')}L${f1(cut.x2 - nx * w - ux)} ${f1(cut.y2 - ny * w - uy)}L${f1(cut.x2 + nx * w - ux)} ${f1(cut.y2 + ny * w - uy)}Z`);
      if (decay < 36) {
        const r = rng(decay * 7 + 3);
        for (let i = 0; i < CAP.chip; i++) {
          const k = (r() - 0.5) * w * 2;
          const chip = emit(ellipseCmds(1.6 + r(), 1 + r() * 0.6), { x: 0, y: 0, rot: r() * 3, sx: 1 });
          cands.chip.push({ pri: r(), make: () => faller(`chip-${i}`, cut.x2 + nx * k, cut.y2 + ny * k, chip, 'bark.dark', 'drop', decay * 31 + i) });
        }
      }
      // 苔：折れてから少しずつ広がる
      const moss = clamp((decay - 28) / 60, 0, 1);
      if (moss > 0) {
        add(trunk, 'moss', emit(ellipseCmds(w * 1.15 * moss + 0.5, 2.2 * moss + 0.4), { x: cut.x2, y: cut.y2 - 0.5, rot: 0, sx: 1 }));
        add(trunk, 'moss', emit(ellipseCmds(4 * moss + 0.5, 2.4 * moss + 0.3), { x: -cut.w1 * 0.55, y: -1.5, rot: 0, sx: 1 }));
        add(trunk, 'moss', emit(ellipseCmds(3 * moss + 0.4, 2 * moss + 0.3), { x: cut.w1 * 0.6, y: -0.8, rot: 0, sx: 1 }));
      }
    }
  }

  // ---- 幹の根元の張り出し（上端は幹の太さにそろえて段差を作らない） ----
  // 注意：同じ色の図形は 1 本の path にまとめるので、塗りの重なりが打ち消し合わないよう
  // 枝（taperD）と同じ向き（画面上で反時計回り）で描く。
  if (segs.length && trunkSeg) {
    const hw = segs[0].w1 * 0.46;
    const top = -10 * (1 - sink);
    const mid = -3 * (1 - sink);
    add(trunk, 'bark.mid', `M${f1(hw * 1.95)} 3C${f1(hw * 1.15)} 2 ${f1(hw)} ${f1(mid)} ${f1(hw)} ${f1(top)}L${f1(-hw)} ${f1(top)}C${f1(-hw)} ${f1(mid)} ${f1(-hw * 1.15)} 2 ${f1(-hw * 1.9)} 3Z`);
    add(trunk, 'bark.dark', `M${f1(hw * 1.95)} 3C${f1(hw * 1.15)} 2 ${f1(hw)} ${f1(mid)} ${f1(hw)} ${f1(top)}L${f1(hw * 0.12)} ${f1(top)}L${f1(hw * 0.3)} 3Z`);
  }

  for (const s0 of segs) {
    let s = s0;
    if (s.depth === 0) {
      if (!trunkSeg) continue;
      s = trunkSeg;
    } else if (!alive(s)) {
      // 今日〜昨日落ちた枝は、落ちていく姿を描く
      if (decay - dropDay(s) < 1.5) {
        const local: TreeSeg = { ...s, x1: 0, y1: 0, cx: s.cx - s.x1, cy: s.cy - s.y1, x2: s.x2 - s.x1, y2: s.y2 - s.y1 };
        cands.twig.push({ pri: -(s.L * s.w1), make: () => faller(`twig-${s.id}`, s.x1, s.y1, taperD(local), 'bark.mid', 'drop', s.id * 11 + 5) });
      }
      continue;
    }
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
        add(b, 'bark.lent', `M${f1(p.x + off - a)} ${f1(p.y)}v0.5h${f1(a * 2)}v-0.5Z`);
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
    const leafy = s.depth > 0 && (s.terminal || s.depth >= maxDepth - profile.leafLevels);
    if (leafy && state.fall < 1) {
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
          const rPri = r();
          const rSeed = r();
          const rDrop = r();
          let ang = s.abs + side * (0.75 + rAng * 0.35) + (side === 0 ? (rTwist - 0.5) * 0.3 : 0);
          let len = profile.leafLen * (0.8 + rLen * 0.45) * lerp(0.55, 1, state.g);
          const q = tone(state.cT + (rCol - 0.5) * state.cSpread);
          const cmds = LEAF_CMDS[profile.leafShape];
          if (state.fall > 0 && rFall < state.fall) {
            // ここ数日で落ちた葉は、舞いながら落ちていく
            if (rFall > state.fall - 0.05) {
              const fq = tone(state.cT + 0.3 + (rCol - 0.5));
              const centered = emit(cmds, { x: -len / 2, y: 0, rot: 0, sx: len });
              cands.leaf.push({ pri: rPri, make: () => faller(`leaf-${s.id}-${k}-${side}`, p.x, p.y, centered, `leafF.${fq}.m`, 'flutter', Math.floor(rSeed * 1e6)) });
            }
            continue;
          }
          if (state.fall > 0 && rFall < state.fall + 0.06) {
            // もうすぐ落ちる葉は、柄が弱って垂れ下がり、少し縮れる
            ang = towardDown(ang, 0.45);
            len *= 0.92;
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
            if (rDrop < 0.035) {
              const tip = { x: p.x + Math.cos(ang) * len * 0.85, y: p.y + Math.sin(ang) * len * 0.85 };
              add(b, 'drop', circleD(tip.x, tip.y + 1, 1.1));
            }
          }
        }
      }
    }

    // ---- つぼみ・花・実（枝先） ----
    if (s.terminal && !dying) {
      const r = rng(s.id * 17 + 3);
      const rSel = r();
      const rFruit = r();
      const picks = Array.from({ length: profile.flowersPerTip }, () => ({ a: r(), d: r(), rot: r(), off: r(), g1: r(), g2: r() }));
      if (rSel < profile.flowerDensity) {
        picks.forEach((pk, i) => {
          const ang = s.abs + (pk.a - 0.5) * 2.4;
          const dist = profile.flowerStyle === 'sakura' ? 2 + pk.d * 6 : 3;
          const x = s.x2 + Math.cos(ang) * dist;
          const y = s.y2 + Math.sin(ang) * dist;
          const dayOffset = Math.floor(pk.off * 6) - 2;
          const phase = getBloomPhase(schedule, cd, dayOffset);
          const key = `${s.id}-${i}`;

          if (phase.bud > 0) {
            const sc = Math.max(2.4, profile.flowerSize * 0.95 * (0.4 + 0.6 * phase.bud));
            const xf = { x, y, rot: ang + Math.PI / 2, sx: sc };
            add(b, phase.bud > 0.55 ? 'bud.1' : 'bud.0', emit(BUD_CMDS, xf));
            add(b, 'calyx', emit(CALYX_CMDS, xf));
          }

          if (phase.open > 0) {
            const sc = profile.flowerSize * (0.55 + 0.45 * phase.open);
            const wholeDrop = profile.flowerStyle === 'camellia' || profile.flowerStyle === 'hibiscus';
            if (wholeDrop) {
              // 椿・ハイビスカスは、花の形のまま丸ごと落ちる
              const dropAt = schedule.flowerWitherStart + dayOffset + pk.d * (schedule.flowerEnd - schedule.flowerWitherStart);
              if (cd < dropAt) {
                const close = profile.flowerStyle === 'hibiscus' ? clamp((cd - (dropAt - 4)) / 4, 0, 1) * 0.25 : 0;
                const parts = flowerD(profile.flowerStyle, { x, y, rot: pk.rot * 1.2, sx: sc * (1 - close) });
                add(b, 'fl.petalA', parts.petalA.join(''));
                add(b, 'fl.petalB', parts.petalB.join(''));
                add(b, 'fl.accent', parts.accent);
                add(b, 'fl.center', parts.center);
                add(b, 'fl.stamen', parts.stamen);
              } else {
                const age = cd - dropAt;
                if (age < 1.5) {
                  const parts = flowerD(profile.flowerStyle, { x: 0, y: 0, rot: pk.rot * 1.2, sx: sc });
                  cands.flower.push({ pri: pk.g1, make: () => faller(`fl-${key}`, x, y, parts.petalA.join('') + parts.petalB.join(''), 'fl.petalB', 'drop', s.id * 13 + i) });
                }
                if (age < 16) {
                  // 地面に落ちた花：寝た形でつぶれて見え、日に日に茶色くしおれて小さくなる
                  const gx = x + (pk.g1 - 0.5) * 12;
                  const gy = 2 + pk.g2 * 4;
                  const shrink = 1 - age / 40;
                  const parts = flowerD(profile.flowerStyle, { x: gx, y: gy, rot: pk.rot * 3, sx: sc * shrink, sy: sc * 0.5 * shrink });
                  add(ground, `flg.${Math.min(3, Math.floor(age / 4))}`, parts.petalA.join('') + parts.petalB.join(''));
                  add(ground, 'flgc', parts.center);
                }
              }
            } else if (phase.wither < 1) {
              // 桜・楓は花びらが 1 枚ずつ散る
              const parts = flowerD(profile.flowerStyle, { x, y, rot: pk.rot * 1.2, sx: sc });
              const keep = Math.ceil(parts.petalA.length * (1 - phase.wither));
              add(b, 'fl.petalA', parts.petalA.slice(0, keep).join(''));
              add(b, 'fl.accent', parts.accent);
              add(b, 'fl.center', parts.center);
              if (phase.wither > 0 && profile.flowerStyle === 'sakura') {
                const petal = emit(SAKURA_PETAL, { x: 0, y: 0, rot: 0, sx: profile.flowerSize * 0.9 });
                cands.petal.push({ pri: pk.g1, make: () => faller(`pt-${key}`, x, y, petal, 'fl.petalA', 'flutter', s.id * 19 + i) });
              }
            }
          }

          // 実：熟して、その実ごとの日に落ちる
          const hasFruit = i === 0 && rFruit < profile.fruitDensity / profile.flowerDensity;
          if (hasFruit && cd >= schedule.fruitStart) {
            const dropAt = schedule.fruitEnd - 10 + pk.off * 10;
            const m = clamp((cd - schedule.fruitStart) / 45, 0, 1);
            const slot = `fruit.${Math.min(3, Math.floor(m * 4))}`;
            const fruitShape = (fx: number, fy: number): string => {
              if (profile.fruitStyle === 'samara') {
                return (
                  [-1, 1].map((sgn) => emit(SAMARA_WING, { x: fx, y: fy, rot: Math.PI / 2 + sgn * 0.85, sx: lerp(6, 9, m) })).join('') +
                  circleD(fx, fy, 1.3)
                );
              }
              if (profile.fruitStyle === 'hibiscusPod') return emit(ellipseCmds(1.9, 3.4), { x: fx, y: fy, rot: 0, sx: lerp(0.8, 1, m) });
              return circleD(fx, fy, profile.fruitStyle === 'camelliaNut' ? lerp(2.6, 4, m) : lerp(2, 3, m));
            };
            if (cd < dropAt) {
              if (profile.fruitStyle === 'cherry') {
                add(b, 'fruitStem', `M${f1(s.x2)} ${f1(s.y2)}L${f1(s.x2 + 0.6)} ${f1(s.y2 + 5)}`);
                add(b, slot, fruitShape(s.x2 + 0.6, s.y2 + 6.8));
                add(b, 'fruitHi', circleD(s.x2 - 0.2, s.y2 + 6, 0.7));
              } else if (profile.fruitStyle === 'samara') {
                add(b, 'fruitStem', `M${f1(s.x2)} ${f1(s.y2)}L${f1(s.x2)} ${f1(s.y2 + 3)}`);
                add(b, slot, fruitShape(s.x2, s.y2 + 3));
              } else if (profile.fruitStyle === 'camelliaNut') {
                add(b, slot, fruitShape(s.x2, s.y2 + 3.5));
                add(b, 'fruitHi', circleD(s.x2 - 1, s.y2 + 2.4, 0.9));
              } else {
                add(b, slot, emit(ellipseCmds(1.9, 3.4), { x: s.x2 + Math.cos(s.abs) * 3, y: s.y2 + Math.sin(s.abs) * 3, rot: s.abs + Math.PI / 2, sx: lerp(0.8, 1, m) }));
              }
            } else {
              const age = cd - dropAt;
              if (age < 1.5) {
                const style: FallStyle = profile.fruitStyle === 'samara' ? 'spin' : 'drop';
                cands.fruit.push({ pri: pk.g2, make: () => faller(`fr-${key}`, s.x2, s.y2 + 3, fruitShape(0, 0), 'fruit.3', style, s.id * 23 + i) });
              }
              // 落ちた実の一部だけが地面に残り、鳥に食べられたり傷んだりして 1 週間ほどでなくなる
              if (age < 8 && pk.g1 < 0.4) add(ground, 'fruitG', fruitShape(s.x2 + (pk.g2 - 0.5) * 16, 3 + pk.g1 * 6));
            }
          }
        });
      }
    }
  }

  // ---- 足元の落ち葉：落ちた分だけ積もり、時間とともに分解されて減っていく ----
  // 影は残っている枝の広がりから、落ち葉は元の樹冠の広がりから決める
  const xsAll = segs.map((s) => s.x2);
  const xsAlive = segs.filter((s) => s.depth > 0 && alive(s)).map((s) => s.x2);
  const minX = Math.min(-10, ...xsAlive);
  const maxX = Math.max(10, ...xsAlive);
  const spreadW = Math.max(30, ((xsAll.length ? Math.max(...xsAll) : 10) - (xsAll.length ? Math.min(...xsAll) : -10)) * 0.55);
  const fallEnd = profile.autumn?.fallEnd ?? 360;
  const effCd = dying ? 360 + decay : cd;
  const rot = clamp((effCd - fallEnd - 15) / 70, 0, 1);
  const litterCount = Math.round(LITTER_MAX * state.fall * (1 - rot));
  if (litterCount > 0) {
    const r = rng(9);
    for (let i = 0; i < LITTER_MAX; i++) {
      const rx = r();
      const ry = r();
      const rr = r();
      const rc = r();
      if (i >= litterCount) continue;
      add(
        ground,
        `leafF.${tone(state.cT + (rc - 0.5) * 1.4 + rot * 1.5)}.${rc < 0.5 ? 'l' : 'm'}`,
        emit(LEAF_CMDS[profile.leafShape], { x: (rx - 0.5) * spreadW * 2, y: 0.5 + ry * 7, rot: rr * Math.PI * 2, sx: profile.leafLen * 0.9, sy: profile.leafLen * 0.45 })
      );
    }
  }

  // ---- 散った桜の花びら：散った分だけ地面に積もり、2 週間ほどで消えていく ----
  if (profile.flowerStyle === 'sakura' && !dying) {
    const scattered = clamp((cd - schedule.flowerWitherStart) / Math.max(1, schedule.flowerEnd - schedule.flowerWitherStart), 0, 1);
    const petalRot = clamp((cd - schedule.flowerEnd - 3) / 14, 0, 1);
    const n = Math.round(PETAL_GROUND_MAX * scattered * (1 - petalRot));
    const r = rng(17);
    for (let i = 0; i < PETAL_GROUND_MAX; i++) {
      const rx = r();
      const ry = r();
      const rr = r();
      if (i >= n) continue;
      add(ground, 'petalG', emit(SAKURA_PETAL, { x: (rx - 0.5) * spreadW * 1.8, y: 1.5 + ry * 5, rot: rr * Math.PI * 2, sx: 3.2, sy: 1.8 }));
    }
  }

  const fallers: Faller[] = [];
  (Object.keys(CAP) as (keyof typeof CAP)[]).forEach((kind) => {
    cands[kind]
      .sort((a, b) => a.pri - b.pri)
      .slice(0, CAP[kind])
      .forEach((c) => fallers.push(c.make()));
  });

  return {
    state,
    trunk,
    groups: [...groups.values()].sort((a, b) => a.id - b.id),
    ground,
    fallers,
    minX,
    maxX,
  };
}
