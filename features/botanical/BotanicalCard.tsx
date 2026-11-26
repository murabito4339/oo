'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Clock, Droplets, RotateCcw, SlidersHorizontal, Sprout, Trees } from 'lucide-react';
import { PLANT_DAY_PRESETS, SPECIES_PRESETS, TIME_PRESETS } from './constants';
import { RealisticBotanicalCanvas } from './RealisticBotanicalCanvas';
import type { SpeciesId } from './types';
import { getGrowthStageMeta, getSeasonFromDate } from './utils';

type Props = {
  plantDays: number;
  isWateredToday: boolean;
  onWaterPlant: () => void;
  onChangePlantDays: (days: number) => void;
  startedSeason?: SpeciesId;
  startDate?: Date | string;
};

const DATE_SEASON_PRESETS = [
  { label: '春 (04/15)', month: 4, day: 15 },
  { label: '夏 (07/20)', month: 7, day: 20 },
  { label: '秋 (10/25)', month: 10, day: 25 },
  { label: '冬 (01/15)', month: 1, day: 15 },
];

function formatDateInput(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTimeLabel(minutes: number) {
  const hh = String(Math.floor(minutes / 60) % 24).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function BotanicalCard({
  plantDays,
  isWateredToday,
  onWaterPlant,
  onChangePlantDays,
  startedSeason,
  startDate,
}: Props) {
  const initialFromStartDate = useMemo<SpeciesId | 'auto'>(() => {
    if (startedSeason) return startedSeason;
    if (startDate) {
      const parsed = startDate instanceof Date ? startDate : new Date(startDate);
      if (!Number.isNaN(parsed.getTime())) {
        return getSeasonFromDate(parsed);
      }
    }
    return 'auto';
  }, [startedSeason, startDate]);

  const [liveNow, setLiveNow] = useState<Date | null>(null);
  const [isRealtime, setIsRealtime] = useState(true);
  const [manualDateStr, setManualDateStr] = useState('2026-11-26');
  const [manualMinutes, setManualMinutes] = useState(720);
  const [speciesOverride, setSpeciesOverride] = useState<SpeciesId | 'auto'>(initialFromStartDate);

  useEffect(() => {
    setSpeciesOverride(initialFromStartDate);
  }, [initialFromStartDate]);

  useEffect(() => {
    const initial = new Date();
    setLiveNow(initial);
    setManualDateStr(formatDateInput(initial));
    setManualMinutes(initial.getHours() * 60 + initial.getMinutes());

    const timer = window.setInterval(() => {
      setLiveNow(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const simulatedDate = useMemo(() => {
    if (isRealtime) return null;
    const [y, m, d] = manualDateStr.split('-').map(Number);
    if (!y || !m || !d) return null;
    const hh = Math.floor(manualMinutes / 60);
    const mm = manualMinutes % 60;
    return new Date(y, m - 1, d, hh, mm, 0);
  }, [isRealtime, manualDateStr, manualMinutes]);

  const activeDate = simulatedDate ?? liveNow;
  const resolvedSpeciesId: SpeciesId =
    speciesOverride === 'auto' ? getSeasonFromDate(activeDate) : speciesOverride;
  const growthMeta = getGrowthStageMeta(plantDays, resolvedSpeciesId);

  const activeMinutes = isRealtime
    ? liveNow
      ? liveNow.getHours() * 60 + liveNow.getMinutes()
      : manualMinutes
    : manualMinutes;

  const activeDateStr = isRealtime
    ? liveNow
      ? formatDateInput(liveNow)
      : manualDateStr
    : manualDateStr;

  const chip = (active: boolean, activeClass: string) =>
    `text-[11px] font-extrabold px-3 py-1.5 rounded-xl border-2 transition tabular-nums ${
      active ? activeClass : 'bg-white border-line text-ink-soft hover:bg-cloud'
    }`;

  return (
    <section className="card-3d p-3 sm:p-4 space-y-4">
      <RealisticBotanicalCanvas
        days={plantDays}
        isWateredToday={isWateredToday}
        simulatedDate={simulatedDate}
        speciesId={speciesOverride === 'auto' ? null : speciesOverride}
      />

      <div className="flex items-center justify-between gap-3 px-1">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Sprout className="w-5 h-5 text-leaf" strokeWidth={2.6} />
            <h2 className="text-base font-black text-ink">わたしの温室</h2>
            <span
              className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                isWateredToday ? 'bg-leaf-light text-leaf-dark' : 'bg-sun-light text-sun-dark'
              }`}
            >
              {isWateredToday ? '潤い十分' : '水やり待ち'}
            </span>
          </div>
          <p className="text-xs font-bold text-ink-soft leading-relaxed">{growthMeta.desc}</p>
        </div>

        <button onClick={onWaterPlant} className="btn-3d btn-sky shrink-0 px-4 py-3 text-sm">
          <Droplets className="w-5 h-5" />
          <span>水やり</span>
        </button>
      </div>

      <details className="group rounded-2xl bg-cloud px-3 py-2">
        <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-xs font-extrabold text-ink-soft">
          <span className="inline-flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4" />
            表示テスト（樹種・成長日・日時）
          </span>
          <ChevronDown className="w-4 h-4 transition group-open:rotate-180" />
        </summary>

        <div className="space-y-4 pt-3 pb-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-extrabold">
              <span className="inline-flex items-center gap-1.5 text-ink-soft">
                <Trees className="w-3.5 h-3.5" />
                植物の種類（開始季節）
              </span>
              <span className="text-ink-faint">
                {speciesOverride === 'auto' ? 'カレンダー季節と自動連動' : '手動固定中'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSpeciesOverride('auto')}
                className={chip(speciesOverride === 'auto', 'bg-leaf-light border-leaf text-leaf-dark')}
              >
                自動（季節連動）
              </button>
              {SPECIES_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSpeciesOverride(preset.id)}
                  className={chip(speciesOverride === preset.id, 'bg-leaf-light border-leaf text-leaf-dark')}
                >
                  {preset.emoji} {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-extrabold">
              <span className="text-ink-soft">成長サイクル（180日開花 / 360日一巡・再生）</span>
              <span className="text-ink tabular-nums">累計 {plantDays}日</span>
            </div>
            <input
              type="range"
              min={0}
              max={420}
              value={plantDays}
              onChange={(e) => onChangePlantDays(Number(e.target.value))}
              className="w-full h-2 bg-line rounded-full appearance-none cursor-pointer accent-leaf"
            />
            <div className="flex flex-wrap gap-1.5">
              {PLANT_DAY_PRESETS.map((preset) => (
                <button
                  key={preset.day}
                  onClick={() => onChangePlantDays(preset.day)}
                  className={chip(plantDays === preset.day, 'bg-sky-light border-sky text-sky-dark')}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-extrabold">
              <span className="inline-flex items-center gap-1.5 text-ink-soft">
                <Clock className="w-3.5 h-3.5" />
                日時（四季背景・太陽・月・夜の光）
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={activeDateStr}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    setIsRealtime(false);
                    setManualDateStr(e.target.value);
                  }}
                  className="text-[11px] font-extrabold text-ink bg-white border-2 border-line rounded-lg px-2 py-0.5 tabular-nums"
                />
                <span className="text-ink tabular-nums min-w-[40px] text-right">
                  {formatTimeLabel(activeMinutes)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const current = new Date();
                    setLiveNow(current);
                    setManualDateStr(formatDateInput(current));
                    setManualMinutes(current.getHours() * 60 + current.getMinutes());
                    setIsRealtime(true);
                  }}
                  className={chip(isRealtime, 'bg-leaf-light border-leaf text-leaf-dark') + ' inline-flex items-center gap-1 !py-0.5'}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isRealtime ? 'リアルタイム中' : '現在時刻に戻す'}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {DATE_SEASON_PRESETS.map((preset) => {
                const year = Number(activeDateStr.slice(0, 4)) || 2026;
                const targetStr = `${year}-${String(preset.month).padStart(2, '0')}-${String(preset.day).padStart(2, '0')}`;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setIsRealtime(false);
                      setManualDateStr(targetStr);
                    }}
                    className={chip(!isRealtime && activeDateStr === targetStr, 'bg-sky-light border-sky text-sky-dark')}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <input
              type="range"
              min={0}
              max={1439}
              step={5}
              value={activeMinutes}
              onChange={(e) => {
                if (isRealtime && liveNow) {
                  setManualDateStr(formatDateInput(liveNow));
                }
                setIsRealtime(false);
                setManualMinutes(Number(e.target.value));
              }}
              className="w-full h-2 bg-line rounded-full appearance-none cursor-pointer accent-sun"
            />

            <div className="flex flex-wrap gap-1.5">
              {TIME_PRESETS.map((preset) => (
                <button
                  key={preset.minutes}
                  type="button"
                  onClick={() => {
                    if (isRealtime && liveNow) {
                      setManualDateStr(formatDateInput(liveNow));
                    }
                    setIsRealtime(false);
                    setManualMinutes(preset.minutes);
                  }}
                  className={chip(!isRealtime && activeMinutes === preset.minutes, 'bg-sun-light border-sun text-sun-dark')}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </details>
    </section>
  );
}
