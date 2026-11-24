import type { SeasonMeta } from './types';

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * clamp(t, 0, 1);
}

export function lerpColor(hex1: string, hex2: string, t: number) {
  const ct = clamp(t, 0, 1);
  const c1 = parseInt(hex1.slice(1), 16);
  const c2 = parseInt(hex2.slice(1), 16);
  const r = Math.round(lerp((c1 >> 16) & 255, (c2 >> 16) & 255, ct));
  const g = Math.round(lerp((c1 >> 8) & 255, (c2 >> 8) & 255, ct));
  const b = Math.round(lerp(c1 & 255, c2 & 255, ct));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function getSeasonMeta(days: number): SeasonMeta {
  if (days === 0) {
    return {
      seasonEn: 'DORMANT',
      seasonJa: '播種・山の目覚め前',
      desc: '朝霧に包まれた山の土の中で、小さな種が静かに春の発芽を待っています。',
      bgFrom: '#E8EEF5',
      bgTo: '#DCE5EE',
      sunColor: '#CBD5E1',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    };
  }
  const cycle = Math.floor((days - 1) / 360) + 1;
  const cd = ((days - 1) % 360) + 1;

  if (cd <= 55) {
    return {
      seasonEn: cycle > 1 ? 'REBIRTH · SPRING' : 'SPRING',
      seasonJa: cycle > 1 ? '第2世代・山の芽吹き' : '春 · 芽吹き',
      desc:
        cycle > 1
          ? '前年の苔むした古株の傍らから、新しい命の若木が春の木漏れ日を浴びて伸び始めています。'
          : '澄んだ山の春光を受け、瑞々しい若葉と枝が力強く広がり始めています。',
      bgFrom: '#E4F2FE',
      bgTo: '#F1F9EE',
      sunColor: '#FDE68A',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    };
  }
  if (cd <= 125) {
    return {
      seasonEn: 'EARLY SUMMER',
      seasonJa: '初夏 · 新緑と枝葉',
      desc: '幹と枝が大きく張り出し、幾重にも重なる新緑の葉が山の風と光を浴びて呼吸しています。',
      bgFrom: '#D6ECFD',
      bgTo: '#EBF6EF',
      sunColor: '#FCD34D',
      badgeClass: 'bg-teal-50 text-teal-700 border-teal-200/80',
    };
  }
  if (cd <= 179) {
    return {
      seasonEn: 'HIGH SUMMER',
      seasonJa: '盛夏 · 花芽の成熟',
      desc: '青々とした枝先に無数の花芽が膨らみました。180日目の開花まであと少しです。',
      bgFrom: '#CFE6FC',
      bgTo: '#E8F3FA',
      sunColor: '#FBBF24',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/80',
    };
  }
  if (cd <= 228) {
    return {
      seasonEn: 'ANTHESIS · BLOOM',
      seasonJa: '満開 · 山花の輝き',
      desc: '180日の積み重ねが結実し、山あいの空のもとで気品ある花々が一斉に咲き誇っています。',
      bgFrom: '#E6EDFC',
      bgTo: '#FCF1F7',
      sunColor: '#FDE047',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    };
  }
  if (cd <= 295) {
    return {
      seasonEn: 'AUTUMN',
      seasonJa: '秋 · 紅葉と結実',
      desc: '花後に小さな木の実が実り、木々の葉は深緑から黄金・茜色へと鮮やかに染まっています。',
      bgFrom: '#FCEAD5',
      bgTo: '#F5E4D8',
      sunColor: '#F59E0B',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
    };
  }
  return {
    seasonEn: 'WINTER',
    seasonJa: '冬 · 雪化粧と越冬',
    desc: 'すべての葉が山の土へ還り、種と冬芽を抱いて雪景色の中で静かに春を待ちます。',
    bgFrom: '#D9E3EF',
    bgTo: '#ECF1F7',
    sunColor: '#E2E8F0',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300/70',
  };
}