'use client';

import { Droplets, Sprout } from 'lucide-react';
import { PLANT_DAY_PRESETS } from './constants';
import { RealisticBotanicalCanvas } from './RealisticBotanicalCanvas';
import { getSeasonMeta } from './utils';

type Props = {
  plantDays: number;
  isWateredToday: boolean;
  onWaterPlant: () => void;
  onChangePlantDays: (days: number) => void;
};

export function BotanicalCard({
  plantDays,
  isWateredToday,
  onWaterPlant,
  onChangePlantDays,
}: Props) {
  const seasonMeta = getSeasonMeta(plantDays);

  return (
    <section className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
      <RealisticBotanicalCanvas days={plantDays} isWateredToday={isWateredToday} />

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
          <p className="text-xs text-slate-500 leading-relaxed">{seasonMeta.desc}</p>
        </div>

        <button
          onClick={onWaterPlant}
          className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition shadow-xs"
        >
          <Droplets className="w-3.5 h-3.5 text-sky-300" />
          <span>水やり（+1日）</span>
        </button>
      </div>

      <div className="pt-3 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-slate-500">
            成長・季節サイクル（180日開花 / 360日枯れ・再生）
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
    </section>
  );
}