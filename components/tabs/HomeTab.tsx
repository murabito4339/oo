import { ArrowRight } from 'lucide-react';
import { BotanicalCard } from '@/features/botanical';
import type { SectionData, TabType } from '@/types/lexis';

type Props = {
  plantDays: number;
  isWateredToday: boolean;
  currentSection: SectionData;
  doneCount: number;
  onWaterPlant: () => void;
  onChangePlantDays: (days: number) => void;
  onNavigateTab: (tab: TabType) => void;
};

export function HomeTab({
  plantDays,
  isWateredToday,
  currentSection,
  doneCount,
  onWaterPlant,
  onChangePlantDays,
  onNavigateTab,
}: Props) {
  return (
    <div className="space-y-5 animate-soft-pop">
      <BotanicalCard
        plantDays={plantDays}
        isWateredToday={isWateredToday}
        onWaterPlant={onWaterPlant}
        onChangePlantDays={onChangePlantDays}
      />

      <section className="space-y-2.5">
        <h2 className="text-xs font-medium text-slate-500 px-0.5">本日のトレーニング</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => onNavigateTab('cards')}
            className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 text-left transition shadow-[0_1px_2px_rgba(0,0,0,0.02)] group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                FSRS 復習
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
            </div>
            <div className="mt-2.5 text-sm font-semibold text-slate-900">
              14語のカードが期限です
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">受容・産出の想起スピードを測定</p>
          </button>

          <button
            onClick={() => onNavigateTab('writing')}
            className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 text-left transition shadow-[0_1px_2px_rgba(0,0,0,0.02)] group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                弱点ブレンド
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
            </div>
            <div className="mt-2.5 text-sm font-semibold text-slate-900">1文マルチ和文英訳</div>
            <p className="text-[11px] text-slate-500 mt-0.5">ターゲット：launch / obtain / funds</p>
          </button>
        </div>

        <button
          onClick={() => onNavigateTab('path')}
          className="w-full bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 flex items-center justify-between text-left transition shadow-[0_1px_2px_rgba(0,0,0,0.02)] group"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="font-semibold text-slate-900">{currentSection.code}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500">進捗 {doneCount} / 8 Steps</span>
            </div>
            <div className="text-sm font-semibold text-slate-900">{currentSection.title}</div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600">
            パスを続ける
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </span>
        </button>
      </section>
    </div>
  );
}