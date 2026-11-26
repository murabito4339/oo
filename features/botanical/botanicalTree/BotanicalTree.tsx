'use client';

import { type CSSProperties, type ReactNode, useMemo } from 'react';
import type { EnvironmentState, SpeciesConfig } from '../types';
import { lerpColor, tintForTime } from '../utils';
import { type Buckets, type Faller, type FlutterGroup, buildTreeModel } from './model';
import { type BotanicalProfile, PROFILES, type TreeState } from './profiles';

type Props = {
  species: SpeciesConfig;
  /** サイクル内の日数（1〜360） */
  cd: number;
  env: EnvironmentState;
  isWateredToday: boolean;
  /** 0 より大きいと、前の世代の木が朽ちていく途中として描く（値は新しいサイクルの cd） */
  decayDay?: number;
};

type Paint = { fill?: string; stroke?: string; strokeWidth?: number; opacity?: number } | null;

function ramp(stops: readonly string[], t: number) {
  const i = Math.min(stops.length - 2, Math.max(0, Math.floor(t)));
  return lerpColor(stops[i], stops[i + 1], t - i);
}

const LEAF_TINT = {
  d: { idx: 0, twilight: '#432818', tw: 0.22, night: '#0B1320', nt: 0.74 },
  m: { idx: 1, twilight: '#F59E0B', tw: 0.2, night: '#264363', nt: 0.66 },
  l: { idx: 2, twilight: '#FDE68A', tw: 0.3, night: '#5B80A3', nt: 0.58 },
} as const;

function leafColor(profile: BotanicalProfile, state: TreeState, env: EnvironmentState, q: number, shade: 'd' | 'm' | 'l') {
  const stops = shade === 'd' ? profile.leaf.dark : shade === 'm' ? profile.leaf.mid : profile.leaf.light;
  const tint = LEAF_TINT[shade];
  let c = ramp(stops, q / 4);
  if (profile.young && state.young > 0) c = lerpColor(c, profile.young[tint.idx], state.young * 0.8);
  if (env.twilightFactor > 0) c = lerpColor(c, tint.twilight, env.twilightFactor * tint.tw);
  if (env.nightFactor > 0) c = lerpColor(c, tint.night, env.nightFactor * tint.nt);
  return c;
}

function makePainter(profile: BotanicalProfile, species: SpeciesConfig, state: TreeState, env: EnvironmentState, isWateredToday: boolean) {
  const night = env.nightFactor;
  const flower = (hex: string) => tintForTime(hex, night, '#475569', 0.55);
  // 若い幹は芽の茎と同じ緑色から、ひと月ほどで樹皮の色になる
  const bark = (hex: string) => lerpColor(hex, species.sproutColors.stem, state.greenStem * 0.85);
  const cache = new Map<string, Paint>();
  return (slot: string): Paint => {
    const hit = cache.get(slot);
    if (hit !== undefined) return hit;
    let p: Paint;
    const [kind, a, b] = slot.split('.');
    switch (kind) {
      case 'bark':
        p = {
          fill:
            a === 'dark'
              ? tintForTime(bark(lerpColor(profile.bark.mid, profile.bark.dark, 0.65)), night, '#141B29', 0.72)
              : a === 'lent'
                ? tintForTime(bark(lerpColor(profile.bark.mid, profile.bark.light, 0.55)), night, '#334155', 0.66)
                : a === 'cap'
                  ? tintForTime(lerpColor(profile.bark.light, '#C8B69A', 0.5), night, '#475569', 0.62)
                  : a === 'mid'
                    ? tintForTime(bark(profile.bark.mid), night, '#334155', 0.66)
                    : tintForTime(bark(profile.bark.light), night, '#475569', 0.62),
        };
        break;
      case 'moss':
        p = { fill: tintForTime('#6B8E23', night, '#1E3A5F', 0.62) };
        break;
      case 'leafB':
        p = { fill: leafColor(profile, state, env, Number(a), 'd') };
        break;
      case 'leafF':
        p = { fill: leafColor(profile, state, env, Number(a), b === 'l' ? 'l' : 'm') };
        break;
      case 'vein':
        p = { stroke: leafColor(profile, state, env, Math.round(state.cT * 4), 'd'), strokeWidth: 0.35, opacity: 0.55 };
        break;
      case 'gloss':
        p = { stroke: '#FFFFFF', strokeWidth: 0.45, opacity: 0.3 * (1 - night * 0.7) };
        break;
      case 'wbud':
        p = { fill: tintForTime('#7A4A35', night, '#1E293B', 0.65) };
        break;
      case 'bud':
        p = { fill: tintForTime(a === '1' ? profile.budColor : '#86B95B', night, '#475569', 0.55) };
        break;
      case 'calyx':
        p = { fill: tintForTime('#3F7D20', night, '#1E3A5F', 0.62) };
        break;
      case 'fl':
        if (a === 'stamen') p = { stroke: flower(profile.flower.stamen), strokeWidth: profile.flowerSize * 0.09 };
        else {
          p = { fill: flower(profile.flower[a as 'petalA' | 'petalB' | 'center' | 'accent']) };
          if (a === 'accent' && profile.flowerStyle === 'camellia') p.opacity = 0.55;
        }
        break;
      case 'flg':
        // 地面に落ちた花：日がたつほど茶色くしおれる
        p = { fill: flower(lerpColor(profile.flower.petalB, '#6B3A2A', Number(a) / 3.5)) };
        break;
      case 'flgc':
        p = { fill: flower(lerpColor(profile.flower.center, '#5B4636', 0.4)) };
        break;
      case 'petalG':
        p = { fill: flower(lerpColor(profile.flower.petalA, profile.flower.accent, 0.4)) };
        break;
      case 'fruit':
        p = { fill: tintForTime(lerpColor(profile.fruit.young, profile.fruit.ripe, Number(a) / 3), night, '#3B425E', 0.65) };
        break;
      case 'fruitG':
        p = { fill: tintForTime(lerpColor(profile.fruit.ripe, '#6B4A33', 0.5), night, '#1E293B', 0.65) };
        break;
      case 'fruitStem':
        p = { stroke: tintForTime('#5B4636', night, '#1E293B', 0.7), strokeWidth: 0.8 };
        break;
      case 'fruitHi':
        p = { fill: '#FFFFFF', opacity: night > 0.5 ? 0.3 : 0.5 };
        break;
      case 'snow':
        p = env.snowLevel > 0.05 ? { fill: tintForTime('#FFFFFF', night, '#94A3B8', 0.5), opacity: Math.min(0.95, env.snowLevel * 1.1) } : null;
        break;
      case 'drop':
        p = isWateredToday && env.snowLevel < 0.5 ? { fill: '#E0F2FE', opacity: 0.9 } : null;
        break;
      default:
        p = null;
    }
    cache.set(slot, p);
    return p;
  };
}

/** 重ね順（後ろほど手前） */
const ORDER = [
  'petalG', 'flg', 'flgc', 'fruitG',
  'leafB', 'bark.mid', 'bark.dark', 'bark.lent', 'bark.light', 'bark.cap', 'moss', 'wbud',
  'leafF', 'vein', 'gloss', 'bud', 'calyx', 'fl', 'fruitStem', 'fruit', 'fruitHi', 'snow', 'drop',
];

function orderOf(slot: string) {
  const exact = ORDER.indexOf(slot);
  return exact >= 0 ? exact : ORDER.indexOf(slot.split('.')[0]);
}

function renderBuckets(b: Buckets, paint: (slot: string) => Paint, only?: 'back' | 'front'): ReactNode[] {
  return Object.keys(b)
    .filter((k) => (only === 'back' ? k.startsWith('leafB.') : only === 'front' ? !k.startsWith('leafB.') : true))
    .sort((x, y) => orderOf(x) - orderOf(y) || x.localeCompare(y, 'en', { numeric: true }))
    .map((slot) => {
      const p = paint(slot);
      if (!p) return null;
      return (
        <path
          key={slot}
          d={b[slot]}
          fill={p.fill ?? 'none'}
          stroke={p.stroke}
          strokeWidth={p.strokeWidth}
          strokeLinecap={p.stroke ? 'round' : undefined}
          opacity={p.opacity}
        />
      );
    });
}

type CSSVars = CSSProperties & Record<`--${string}`, string>;

function swayStyle(g: FlutterGroup): CSSVars {
  return {
    transformOrigin: `${g.ox.toFixed(1)}px ${g.oy.toFixed(1)}px`,
    animationDuration: `${g.dur.toFixed(2)}s`,
    animationDelay: `${g.delay.toFixed(2)}s`,
    '--sway-amp': `${g.amp.toFixed(2)}deg`,
  };
}

/**
 * 落ちていくもの。外側の g が落下の道すじ（左右に揺れながら下へ）、
 * 内側の g が舞い方（ひらひら裏返る・くるくる回る・転がる）を受け持つ。
 */
function FallingThing({ f, paint }: { f: Faller; paint: (slot: string) => Paint }) {
  const p = paint(f.slot);
  if (!p) return null;
  const path: CSSVars = {
    animationDuration: `${f.dur.toFixed(2)}s`,
    animationDelay: `${f.delay.toFixed(2)}s`,
    '--drop': `${f.drop.toFixed(1)}px`,
    '--drift': `${f.drift.toFixed(1)}px`,
  };
  const motion: CSSVars = {
    animationDuration: `${f.flipDur.toFixed(2)}s`,
    animationDelay: f.style === 'drop' ? `${f.delay.toFixed(2)}s` : `${(f.delay % f.flipDur).toFixed(2)}s`,
    '--spin': `${f.spin.toFixed(0)}deg`,
  };
  const pathCls = f.style === 'flutter' ? 'fall-flutter' : f.style === 'spin' ? 'fall-spin-path' : 'fall-drop';
  const motionCls = f.style === 'flutter' ? 'fall-flip' : f.style === 'spin' ? 'fall-whirl' : 'fall-tumble';
  return (
    <g transform={`translate(${f.x.toFixed(1)} ${f.y.toFixed(1)})`}>
      <g className={pathCls} style={path}>
        <g className={motionCls} style={motion}>
          <path d={f.d} fill={p.fill ?? 'none'} opacity={p.opacity} />
        </g>
      </g>
    </g>
  );
}

export function BotanicalTree({ species, cd, env, isWateredToday, decayDay = 0 }: Props) {
  const profile = PROFILES[species.id];
  // 形の計算は樹種と日数が変わったときだけ。毎秒の再描画では色だけを差し替える。
  const model = useMemo(
    () => buildTreeModel(profile, species.bloomSchedule, cd, { decayDay }),
    [profile, species.bloomSchedule, cd, decayDay]
  );
  const paint = makePainter(profile, species, model.state, env, isWateredToday);
  // 朽ちていく木は風に揺れない
  const sway = decayDay === 0;
  const shadowW = Math.max(30, (model.maxX - model.minX) * 0.55);

  const groupPass = (only: 'back' | 'front') =>
    model.groups.map((g) => (
      <g key={`${only}-${g.id}`} className={sway ? 'leaf-sway' : undefined} style={sway ? swayStyle(g) : undefined}>
        {renderBuckets(g.buckets, paint, only)}
        {g.flutters.map((fl) => (
          <g key={fl.id} className={sway ? 'leaf-flutter' : undefined} style={sway ? swayStyle(fl) : undefined}>
            {renderBuckets(fl.buckets, paint, only)}
          </g>
        ))}
      </g>
    ));

  return (
    <g>
      <ellipse
        cx={((model.minX + model.maxX) / 2 + 8).toFixed(1)}
        cy="3"
        rx={shadowW.toFixed(1)}
        ry={(5 + shadowW * 0.04).toFixed(1)}
        fill="#0B2A16"
        opacity={0.2 * (1 - env.nightFactor * 0.5)}
      />
      {renderBuckets(model.ground, paint)}
      {groupPass('back')}
      {renderBuckets(model.trunk, paint)}
      {groupPass('front')}
      <g className="fallers">
        {model.fallers.map((f) => (
          <FallingThing key={f.key} f={f} paint={paint} />
        ))}
      </g>
    </g>
  );
}
