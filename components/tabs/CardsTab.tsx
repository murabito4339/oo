'use client';

import { useState } from 'react';
import { Bookmark, Clock, Volume2 } from 'lucide-react';

export function CardsTab() {
  const [cardFlipped, setCardFlipped] = useState(false);
  const [cardMode, setCardMode] = useState<'receptive' | 'productive'>('receptive');

  return (
    <div className="space-y-5 animate-soft-pop">
      <div className="inline-flex w-full bg-slate-200/70 p-1 rounded-xl">
        <button
          onClick={() => {
            setCardMode('receptive');
            setCardFlipped(false);
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
            cardMode === 'receptive'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          受容カード（英 → 日）
        </button>
        <button
          onClick={() => {
            setCardMode('productive');
            setCardFlipped(false);
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
            cardMode === 'productive'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          産出カード（日 → 英）
        </button>
      </div>

      <div
        onClick={() => setCardFlipped(!cardFlipped)}
        className="bg-white min-h-[300px] rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-6 flex flex-col justify-between cursor-pointer hover:border-slate-300 transition"
      >
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              Sec.02
            </span>
            <span>他動詞</span>
          </div>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Clock className="w-3.5 h-3.5" />
            1.4s
          </span>
        </div>

        <div className="text-center my-8 space-y-4">
          <div className="text-3xl font-semibold tracking-tight text-slate-900">
            {cardMode === 'receptive' ? 'launch' : '〜に着手する、開始する'}
          </div>

          {cardFlipped ? (
            <div className="pt-5 border-t border-slate-100 space-y-2 animate-soft-pop">
              <div className="text-lg font-semibold text-indigo-600">
                {cardMode === 'receptive' ? '〜に着手する、開始する' : 'launch'}
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                語法注意：他動詞のため「launch into 〜」と前置詞を挟まず直接目的語をとる。
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400">カードをタップして解答を表示</p>
          )}
        </div>

        <div className="flex justify-between items-center pt-2">
          <button
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200/80 hover:border-indigo-200 transition"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>今日の英作文に予約</span>
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            aria-label="発音を再生"
            className="p-2 rounded-lg border border-slate-200/80 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'まだ', sub: '1分', accent: 'hover:border-rose-300 hover:bg-rose-50/40 text-rose-700' },
          { label: '迷った', sub: '12時間', accent: 'hover:border-amber-300 hover:bg-amber-50/40 text-amber-700' },
          { label: 'OK', sub: '3日', accent: 'hover:border-emerald-300 hover:bg-emerald-50/40 text-emerald-700' },
          { label: '瞬殺', sub: '7日', accent: 'hover:border-indigo-300 hover:bg-indigo-50/40 text-indigo-700' },
        ].map((b) => (
          <button
            key={b.label}
            onClick={() => setCardFlipped(false)}
            className={`bg-white border border-slate-200/80 py-3 rounded-xl transition text-center shadow-2xs ${b.accent}`}
          >
            <div className="font-semibold text-xs">{b.label}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 tabular-nums">{b.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}