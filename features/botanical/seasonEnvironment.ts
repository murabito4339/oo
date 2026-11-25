import type { EnvironmentState, SeasonKey } from './types';
import { clamp, getDayOfYear, getSeasonFromDate, lerpColor } from './utils';

function seasonalWeight(doy: number, start: number, peakStart: number, peakEnd: number, end: number) {
  if (start > end) {
    const shifted = doy >= start ? doy : doy + 365;
    const pStart = peakStart >= start ? peakStart : peakStart + 365;
    const pEnd = peakEnd >= start ? peakEnd : peakEnd + 365;
    const sEnd = end + 365;
    if (shifted < start || shifted > sEnd) return 0;
    if (shifted < pStart) return clamp((shifted - start) / (pStart - start), 0, 1);
    if (shifted <= pEnd) return 1;
    return clamp((sEnd - shifted) / (sEnd - pEnd), 0, 1);
  }
  if (doy < start || doy > end) return 0;
  if (doy < peakStart) return clamp((doy - start) / (peakStart - start), 0, 1);
  if (doy <= peakEnd) return 1;
  return clamp((end - doy) / (end - peakEnd), 0, 1);
}

function blend4Colors(
  springC: string,
  summerC: string,
  autumnC: string,
  winterC: string,
  wSpring: number,
  wSummer: number,
  wAutumn: number,
  wWinter: number
) {
  let c = springC;
  const s1 = wSpring + wSummer;
  if (s1 > 0) c = lerpColor(springC, summerC, wSummer / s1);
  const s2 = s1 + wAutumn;
  if (s2 > 0) c = lerpColor(c, autumnC, wAutumn / s2);
  const s3 = s2 + wWinter;
  if (s3 > 0) c = lerpColor(c, winterC, wWinter / s3);
  return c;
}

const SEASON_META: Record<
  SeasonKey,
  { seasonEn: string; seasonJa: string; badgeClass: string }
> = {
  spring: {
    seasonEn: 'SPRING',
    seasonJa: '春 · 山桜の季節',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  },
  summer: {
    seasonEn: 'SUMMER',
    seasonJa: '夏 · 青葉と太陽の季節',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/80',
  },
  autumn: {
    seasonEn: 'AUTUMN',
    seasonJa: '秋 · 紅葉の季節',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
  },
  winter: {
    seasonEn: 'WINTER',
    seasonJa: '冬 · 雪化粧の季節',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300/70',
  },
};

export function computeEnvironmentState(activeDate: Date | null): EnvironmentState {
  const refDate = activeDate ?? new Date(2026, 3, 15, 12, 0, 0);
  const doy = getDayOfYear(refDate);
  const seasonKey = getSeasonFromDate(refDate);
  const meta = SEASON_META[seasonKey];

  const hours =
    refDate.getHours() +
    refDate.getMinutes() / 60 +
    refDate.getSeconds() / 3600 +
    refDate.getMilliseconds() / 3600000;

  const latRad = (35.6 * Math.PI) / 180;
  const decRad = (23.44 * Math.sin(((doy - 81) / 365) * Math.PI * 2) * Math.PI) / 180;
  const hourAngle = ((hours - 12) / 24) * Math.PI * 2;

  const sunElevation =
    Math.sin(latRad) * Math.sin(decRad) +
    Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourAngle);
  const sunX = 260 + Math.sin(hourAngle) * 215;
  const sunY = 164 - sunElevation * 128;
  const sunOpacity = clamp((sunElevation + 0.14) / 0.24, 0, 1);

  const moonAngle = hourAngle + Math.PI;
  const moonElevation = -sunElevation;
  const moonX = 260 + Math.sin(moonAngle) * 200;
  const moonY = 164 - moonElevation * 116;
  const moonOpacity = clamp((moonElevation - 0.02) / 0.2, 0, 0.92);

  const twilightFactor = clamp(1 - Math.abs(sunElevation) / 0.24, 0, 1);
  const nightFactor = clamp((-sunElevation - 0.04) / 0.24, 0, 1);

  const rawSpring = seasonalWeight(doy, 52, 76, 130, 158);
  const rawSummer = seasonalWeight(doy, 134, 160, 226, 252);
  const rawAutumn = seasonalWeight(doy, 232, 266, 318, 342);
  const rawWinter = seasonalWeight(doy, 322, 344, 46, 72);
  const total = rawSpring + rawSummer + rawAutumn + rawWinter || 1;

  const springFactor = rawSpring / total;
  const summerFactor = rawSummer / total;
  const autumnFactor = rawAutumn / total;
  const winterFactor = rawWinter / total;

  const autumnWarmth = clamp(autumnFactor * 1.15, 0, 1);
  const snowLevel = clamp((winterFactor - 0.18) / 0.65, 0, 1);
  const streamFrozen = snowLevel > 0.68;

  let skyFrom = blend4Colors(
    '#E4F2FE',
    '#BCE3FA',
    '#FCEAD5',
    '#D9E3EF',
    springFactor,
    summerFactor,
    autumnFactor,
    winterFactor
  );
  let skyTo = blend4Colors(
    '#F1F9EE',
    '#E2F7EE',
    '#F5E4D8',
    '#ECF1F7',
    springFactor,
    summerFactor,
    autumnFactor,
    winterFactor
  );
  let sunColor = blend4Colors(
    '#FDE68A',
    '#FBBF24',
    '#F59E0B',
    '#E2E8F0',
    springFactor,
    summerFactor,
    autumnFactor,
    winterFactor
  );

  if (twilightFactor > 0) {
    skyFrom = lerpColor(skyFrom, '#94A3B8', twilightFactor * 0.35);
    skyTo = lerpColor(skyTo, '#FDBA74', twilightFactor * 0.45);
    sunColor = lerpColor(sunColor, '#FB923C', twilightFactor * 0.75);
  }
  if (nightFactor > 0) {
    skyFrom = lerpColor(skyFrom, '#0F172A', nightFactor * 0.88);
    skyTo = lerpColor(skyTo, '#1E3A5F', nightFactor * 0.82);
  }

  let farMountain = blend4Colors(
    '#9BB8CD',
    '#7FA8C9',
    '#B9A3A8',
    '#CBD5E1',
    springFactor,
    summerFactor,
    autumnFactor,
    winterFactor
  );
  let midMountain = blend4Colors(
    '#6C9488',
    '#42826E',
    '#8C6D5A',
    '#94A3B8',
    springFactor,
    summerFactor,
    autumnFactor,
    winterFactor
  );
  let hillTop = blend4Colors(
    '#65A30D',
    '#4D9A1B',
    '#A16207',
    '#F8FAFC',
    springFactor,
    summerFactor,
    autumnFactor,
    winterFactor
  );
  let hillMid = blend4Colors(
    '#3F7D20',
    '#2D6A2E',
    '#78350F',
    '#E2E8F0',
    springFactor,
    summerFactor,
    autumnFactor,
    winterFactor
  );
  let hillDeep = blend4Colors(
    '#1B4332',
    '#143B28',
    '#451A03',
    '#CBD5E1',
    springFactor,
    summerFactor,
    autumnFactor,
    winterFactor
  );

  if (nightFactor > 0) {
    farMountain = lerpColor(farMountain, '#1E293B', nightFactor * 0.56);
    midMountain = lerpColor(midMountain, '#162436', nightFactor * 0.54);
    hillTop = lerpColor(hillTop, '#1E293B', nightFactor * 0.48);
    hillMid = lerpColor(hillMid, '#132030', nightFactor * 0.5);
    hillDeep = lerpColor(hillDeep, '#0B1320', nightFactor * 0.52);
  }

  return {
    dayOfYear: doy,
    seasonKey,
    ...meta,
    springFactor,
    summerFactor,
    autumnFactor,
    winterFactor,
    autumnWarmth,
    snowLevel,
    streamFrozen,
    skyFrom,
    skyTo,
    sunColor,
    farMountain,
    midMountain,
    hillTop,
    hillMid,
    hillDeep,
    sunX,
    sunY,
    sunOpacity,
    moonX,
    moonY,
    moonOpacity,
    twilightFactor,
    nightFactor,
    showPetals: springFactor > 0.45,
    showSummerShimmer: summerFactor > 0.35 && nightFactor < 0.5,
    showFireflies: (summerFactor > 0.35 || springFactor > 0.55) && nightFactor > 0.35,
    showAutumnLeaves: autumnWarmth > 0.28,
    showSnowfall: snowLevel > 0.32,
    showButterfly: (springFactor > 0.35 || summerFactor > 0.35) && nightFactor < 0.4,
  };
}
