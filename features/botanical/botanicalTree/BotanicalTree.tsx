'use client';

import { type CSSProperties, type ReactNode, useMemo } from 'react';
import type { EnvironmentState, SpeciesConfig } from '../types';
import { lerpColor, tintForTime } from '../utils';
import { type Buckets, type FlutterGroup, buildTreeModel } from './model';
import { type BotanicalProfile, PROFILES, type TreeState } from './profiles';

type Props = {
  species: SpeciesConfig;
  /** サイクル内の日数（1〜360） */
  cd: number;
  env: EnvironmentState;
  isWateredToday: boolean;
  /** 葉の揺れアニメーション */
  animate?: boolean;
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

function makePainter(profile: BotanicalProfile, state: TreeState, env: EnvironmentState, isWateredToday: boolean) {
  const night = env.nightFactor;
  const flower = (hex: string) => tintForTime(hex, night, '#475569', 0.55);
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
              ? tintForTime(lerpColor(profile.bark.mid, profile.bark.dark, 0.65), night, '#141B29', 0.72)
              : a === 'lent'
                ? tintForTime(lerpColor(profile.bark.mid, profile.bark.light, 0.55), night, '#334155', 0.66)
              : a === 'mid'
                ? tintForTime(profile.bark.mid, night, '#334155', 0.66)
                : tintForTime(profile.bark.light, night, '#475569', 0.62),
        };
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
      case 'flw': {
        if (a === 'stamen') {
          p = { stroke: flower(profile.flower.stamen), strokeWidth: profile.flowerSize * 0.09 };
          break;
        }
        const base = profile.flower[a as 'petalA' | 'petalB' | 'center' | 'accent'];
        p = kind === 'fl' ? { fill: flower(base) } : { fill: flower(lerpColor(base, '#F5F5F4', 0.35)), opacity: 0.5 };
        if (kind === 'fl' && a === 'accent' && profile.flowerStyle === 'camellia') p.opacity = 0.55;
        break;
      }
      case 'fruit':
        p = { fill: tintForTime(lerpColor(profile.fruit.young, profile.fruit.ripe, Number(a) / 3), night, '#3B425E', 0.65) };
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

/** 重ね順（前方ほど手前） */
const ORDER = ['leafB', 'bark.mid', 'bark.dark', 'bark.lent', 'bark.light', 'wbud', 'leafF', 'vein', 'gloss', 'bud', 'calyx', 'flw', 'fl', 'fruitStem', 'fruit', 'fruitHi', 'snow', 'drop'];

function orderOf(slot: string) {
  const exact = ORDER.indexOf(slot);
  return exact >= 0 ? exact : ORDER.indexOf(slot.split('.')[0]);
}

function sortedSlots(b: Buckets, only?: 'back' | 'front') {
  return Object.keys(b)
    .filter((k) => (only === 'back' ? k.startsWith('leafB.') : only === 'front' ? !k.startsWith('leafB.') : true))
    .sort((x, y) => {
      const ox = orderOf(x);
      const oy = orderOf(y);
      return ox - oy || x.localeCompare(y, 'en', { numeric: true });
    });
}

function renderBuckets(b: Buckets, paint: (slot: string) => Paint, only?: 'back' | 'front'): ReactNode[] {
  return sortedSlots(b, only).map((slot) => {
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

function swayStyle(g: FlutterGroup): CSSProperties {
  return {
    transformOrigin: `${g.ox.toFixed(1)}px ${g.oy.toFixed(1)}px`,
    animationDuration: `${g.dur.toFixed(2)}s`,
    animationDelay: `${g.delay.toFixed(2)}s`,
    ['--sway-amp' as string]: `${g.amp.toFixed(2)}deg`,
  };
}

export function BotanicalTree({ species, cd, env, isWateredToday, animate = true }: Props) {
  const profile = PROFILES[species.id];
  // 形の計算は樹種と日数が変わったときだけ。毎秒の再描画では色だけを差し替える。
  const model = useMemo(() => buildTreeModel(profile, species.bloomSchedule, cd), [profile, species.bloomSchedule, cd]);
  const paint = makePainter(profile, model.state, env, isWateredToday);
  const swayCls = animate ? 'leaf-sway' : undefined;
  const flutterCls = animate ? 'leaf-flutter' : undefined;
  const shadowW = Math.max(30, (model.maxX - model.minX) * 0.55);

  const groupPass = (only: 'back' | 'front') =>
    model.groups.map((g) => (
      <g key={`${only}-${g.id}`} className={swayCls} style={animate ? swayStyle(g) : undefined}>
        {renderBuckets(g.buckets, paint, only)}
        {g.flutters.map((f) => (
          <g key={f.id} className={flutterCls} style={animate ? swayStyle(f) : undefined}>
            {renderBuckets(f.buckets, paint, only)}
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
      {renderBuckets(model.falling, paint)}
    </g>
  );
}
