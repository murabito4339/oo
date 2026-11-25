'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock, Droplets, RotateCcw, Sprout, Trees } from 'lucide-react';
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

  return (
    <section className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
      <RealisticBotanicalCanvas
        days={plantDays}
        isWateredToday={isWateredToday}
        simulatedDate={simulatedDate}
        speciesId={speciesOverride === 'auto' ? null : speciesOverride}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-emerald-600" />
            <h1 className="text-sm font-semibold text-slate-900">Specimen: Lexis Botanica</h1>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                isWateredToday ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {isWateredToday ? '潤い十分' : '水やり待ち'}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">{growthMeta.desc}</p>
        </div>

        <button
          onClick={onWaterPlant}
          className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition shadow-xs"
        >
          <Droplets className="w-3.5 h-3.5 text-sky-300" />
          <span>水やり（+1日）</span>
        </button>
      </div>

      <div className="pt-3 border-t border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-500">
            <Trees className="w-3.5 h-3.5 text-slate-400" />
            <span>植物の種類（開始季節）</span>
          </span>
          <span className="text-[11px] font-medium text-slate-600">
            {speciesOverride === 'auto' ? 'カレンダー季節と自動連動' : '手動固定中'}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSpeciesOverride('auto')}
            className={`text-[10px] font-medium px-2.5 py-1 rounded-lg border transition ${
              speciesOverride === 'auto'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-slate-50/70 border-slate-200/70 text-slate-600 hover:bg-slate-100'
            }`}
          >
            自動（季節連動）
          </button>
          {SPECIES_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setSpeciesOverride(preset.id)}
              className={`text-[10px] font-medium px-2.5 py-1 rounded-lg border transition ${
                speciesOverride === preset.id
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-50/70 border-slate-200/70 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {preset.emoji} {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-slate-500">
            成長サイクル（180日開花 / 360日一巡・再生）
          </span>
          <span className="font-semibold text-slate-900 tabular-nums">累計 {plantDays}日</span>
        </div>

        <input
          type="range"
          min={0}
          max={420}
          value={plantDays}
          onChange={(e) => onChangePlantDays(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />

        <div className="flex flex-wrap gap-1.5">
          {PLANT_DAY_PRESETS.map((preset) => (
            <button
              key={preset.day}
              onClick={() => onChangePlantDays(preset.day)}
              className={`text-[10px] font-medium px-2.5 py-1 rounded-lg border transition tabular-nums ${
                plantDays === preset.day
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-slate-50/70 border-slate-200/70 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>日時実験（四季背景・太陽・月・夜の光）</span>
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
              className="text-[11px] font-medium text-slate-700 bg-slate-50 border border-slate-200/80 rounded-lg px-2 py-0.5 tabular-nums"
            />
            <span className="font-semibold text-slate-900 tabular-nums min-w-[40px] text-right">
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
              className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border transition ${
                isRealtime
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <RotateCcw className="w-2.5 h-2.5" />
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
                className={`text-[10px] font-medium px-2.5 py-1 rounded-lg border transition tabular-nums ${
                  !isRealtime && activeDateStr === targetStr
                    ? 'bg-sky-50 border-sky-200 text-sky-700'
                    : 'bg-slate-50/70 border-slate-200/70 text-slate-600 hover:bg-slate-100'
                }`}
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
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
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
              className={`text-[10px] font-medium px-2.5 py-1 rounded-lg border transition tabular-nums ${
                !isRealtime && activeMinutes === preset.minutes
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-slate-50/70 border-slate-200/70 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
