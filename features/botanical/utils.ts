import type { GrowthStageMeta, SeasonKey, SpeciesId } from './types';

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

export function tintForTime(
  hex: string,
  nightFactor: number,
  nightTarget: string,
  strength: number
) {
  return nightFactor > 0 ? lerpColor(hex, nightTarget, nightFactor * strength) : hex;
}

export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff =
    date.getTime() -
    start.getTime() +
    (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60000;
  return clamp(Math.floor(diff / 86400000), 1, 366);
}

export function getSeasonFromDate(date: Date | null): SeasonKey {
  if (!date) return 'spring';
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

const SPECIES_LABEL: Record<SpeciesId, string> = {
  spring: '山桜',
  summer: 'ハイビスカス',
  autumn: '山楓',
  winter: '常緑松・寒椿',
};

export function getGrowthStageMeta(days: number, speciesId: SpeciesId): GrowthStageMeta {
  const name = SPECIES_LABEL[speciesId];
  if (days === 0) {
    return {
      stageEn: 'DORMANT',
      stageJa: `${name} · 播種`,
      desc: `山の土の中で、${name}の小さな種が静かに最初の一滴を待っています。`,
    };
  }

  const cycle = Math.floor((days - 1) / 360) + 1;
  const cd = ((days - 1) % 360) + 1;

  if (cd <= 23) {
    return {
      stageEn: cycle > 1 ? 'REBIRTH · SPROUT' : 'SPROUT',
      stageJa: cycle > 1 ? `${name} · 第${cycle}世代の芽吹き` : `${name} · 発芽`,
      desc:
        cycle > 1
          ? `苔むした古株の傍らから、新しい世代の${name}が力強く双葉を広げています。`
          : `柔らかな土から${name}の若芽が顔を出し、季節の光を受け止めています。`,
    };
  }

  if (cd <= 125) {
    return {
      stageEn: 'GROWING',
      stageJa: `${name} · 枝葉の成長`,
      desc:
        speciesId === 'summer'
          ? '太い枝を放射状に伸ばし、艶やかなトロピカルの広葉がみずみずしく茂っています。'
          : speciesId === 'autumn'
            ? '風情ある枝先に切れ込みのある楓の葉が広がり、木立の輪郭が整ってきました。'
            : speciesId === 'winter'
              ? '深緑の針葉を層のように重ね、どんな季節の風にも揺るがない凛とした樹形が育っています。'
              : 'しなやかな幹と枝が大きく張り出し、幾重にも重なる葉が山の風を受けて呼吸しています。',
    };
  }

  if (cd <= 179) {
    return {
      stageEn: 'BUDDING',
      stageJa: `${name} · 花芽の成熟`,
      desc: `${name}の枝先に無数の蕾が膨らみました。180日目の開花まであと少しです。`,
    };
  }

  if (cd <= 228) {
    return {
      stageEn: 'ANTHESIS · BLOOM',
      stageJa: `${name} · 満開`,
      desc:
        speciesId === 'summer'
          ? '180日の積み重ねが結実し、太陽のように鮮やかな大輪のハイビスカスが咲き誇っています。'
          : speciesId === 'autumn'
            ? '繊細な花々とともに、楓の樹冠が鮮やかな彩りを帯び始めています。'
            : speciesId === 'winter'
              ? '深い緑の枝葉の合間から、凛と気高い真紅の寒椿が鮮やかに花開いています。'
              : '180日の積み重ねが実を結び、山あいの空のもとで山桜の花々が一斉に咲き誇っています。',
    };
  }

  if (cd <= 295) {
    return {
      stageEn: 'FRUITING',
      stageJa: `${name} · 結実と成熟`,
      desc:
        speciesId === 'autumn'
          ? '枝先に小さな木の実が実り、楓の葉は黄金や朱色へと深く色づいています。'
          : `${name}の枝先に小さな実りが宿り、次の命へと向かう豊かな季節を迎えています。`,
    };
  }

  return {
    stageEn: speciesId === 'winter' || speciesId === 'summer' ? 'EVERGREEN · REST' : 'DORMANT · REST',
    stageJa: speciesId === 'winter' ? `${name} · 越冬` : `${name} · 静養と再生前`,
    desc:
      speciesId === 'winter'
        ? '常緑の葉を保ったまま種を抱き、次のサイクルへ向けた静かな再生を待っています。'
        : '葉を休め、次の世代の種と芽を土に託して、静かに新しいサイクルを待っています。',
  };
}
