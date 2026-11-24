'use client';

import { BookOpen, ChevronRight, Crown, Layers, Map, PenTool, Sprout } from 'lucide-react';
import { TabType } from '@/types';
import { PlantAvatar } from './PlantAvatar';

const ACTIVE_VOCAB_COUNT = 142;
const ACTIVE_VOCAB_GOAL = 2100;
const STREAK_TEST_DAYS = [0, 1, 5, 10, 14];

const SHORTCUTS: { id: TabType; label: string; desc: string; icon: typeof Map; color: string }[] = [
  { id: 'cards', label: 'カード', desc: '復習カードをめくる', icon: Layers, color: 'bg-sky-50 text-sky-600' },
  { id: 'writing', label: '英作文', desc: '1文英作文に挑戦', icon: PenTool, color: 'bg-amber-50 text-amber-600' },
  { id: 'vocab', label: '単語帳', desc: '単語の登録・確認', icon: BookOpen, color: 'bg-rose-50 text-rose-600' },
];

type HomeTabProps = {
  streak: number;
  onChangeStreak: (days: number) => void;
  dbItemCount: number;
  onNavigate: (tab: TabType) => void;
};

export function HomeTab({ streak, onChangeStreak, dbItemCount, onNavigate }: HomeTabProps) {
  const progressPercent = Math.round((ACTIVE_VOCAB_COUNT / ACTIVE_VOCAB_GOAL) * 100);

  return (
    <div className="space-y-4 animate-pop-in">
      <section
        aria-labelledby="streak-heading"
        className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm space-y-3"
      >
        <h2 id="streak-heading" className="sr-only">
          ストリーク
        </h2>
        <PlantAvatar streak={streak} />
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <span className="text-[10px] font-bold text-slate-500 px-1.5">成長テスト:</span>
          {STREAK_TEST_DAYS.map((d) => (
            <button
              key={d}
              onClick={() => onChangeStreak(d)}
              aria-pressed={streak === d}
              className={`text-xs font-bold px-2 py-1 rounded-lg transition ${
                streak === d ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
              }`}
            >
              {d}日
            </button>
          ))}
        </div>
      </section>

      <section aria-label="学習の進み具合" className="grid grid-cols-2 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            能動語彙化
          </div>
          <div className="mt-1 text-lg font-black text-slate-800 leading-tight">
            {ACTIVE_VOCAB_COUNT}
            <span className="text-xs font-bold text-slate-400"> / {ACTIVE_VOCAB_GOAL.toLocaleString()}語</span>
          </div>
          <div
            className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="能動語彙化の進捗"
          >
            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <Sprout className="w-3.5 h-3.5 text-indigo-500" />
            登録単語
          </div>
          <div className="mt-1 text-lg font-black text-slate-800 leading-tight">
            {dbItemCount}
            <span className="text-xs font-bold text-slate-400">語</span>
          </div>
          <div className="mt-2 text-[10px] font-bold text-slate-400">データベース</div>
        </div>
      </section>

      <button
        onClick={() => onNavigate('path')}
        className="w-full flex items-center gap-3 p-4 rounded-2xl bg-indigo-600 border-b-4 border-indigo-800 text-white text-left shadow-sm transition active:border-b-0 active:translate-y-1"
      >
        <div className="w-11 h-11 shrink-0 rounded-xl bg-white/20 flex items-center justify-center">
          <Map className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold opacity-85">今日の学習</div>
          <div className="text-base font-black">パスの続きから始める</div>
        </div>
        <ChevronRight className="w-5 h-5 shrink-0" />
      </button>

      <section aria-labelledby="shortcut-heading" className="space-y-2">
        <h2 id="shortcut-heading" className="text-xs font-bold text-slate-500">
          ほかの学習
        </h2>
        <ul className="space-y-2">
          {SHORTCUTS.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.id}>
                <button
                  onClick={() => onNavigate(s.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white border-2 border-slate-200 text-left transition hover:border-slate-300 active:translate-y-0.5"
                >
                  <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${s.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-extrabold text-slate-800">{s.label}</div>
                    <div className="text-xs text-slate-500">{s.desc}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 text-slate-300" />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
