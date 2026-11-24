'use client';

import { useState } from 'react';
import { AlertCircle, Lightbulb, Volume2 } from 'lucide-react';

export function WritingTab() {
  const [writingMode, setWritingMode] = useState<'translation' | 'free'>('translation');
  const [showDiffMock, setShowDiffMock] = useState(true);
  const [hintLevel, setHintLevel] = useState(0);

  return (
    <div className="space-y-5 animate-soft-pop">
      <div className="inline-flex w-full bg-slate-200/70 p-1 rounded-xl">
        <button
          onClick={() => setWritingMode('translation')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
            writingMode === 'translation'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          1文和文英訳（マルチ語彙）
        </button>
        <button
          onClick={() => setWritingMode('free')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
            writingMode === 'free'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          自由英作文（論述実践）
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
            {writingMode === 'translation'
              ? 'Target: launch / obtain / funds'
              : '難関大形式 · 60–80 words'}
          </span>
          <span className="text-[11px] font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
            弱点フォーカス: 他動詞の語法
          </span>
        </div>

        <p className="font-medium text-[15px] text-slate-900 leading-relaxed">
          {writingMode === 'translation'
            ? 'そのチームはスポンサーから新たな資金を獲得したので、その事業に着手した。'
            : 'What does it mean for a society to support young researchers? Write 60–80 words.'}
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setHintLevel((h) => (h === 1 ? 0 : 1))}
            className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border inline-flex items-center gap-1.5 transition ${
              hintLevel === 1
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            ヒント 1：頭文字
          </button>
          <button
            onClick={() => setHintLevel((h) => (h === 2 ? 0 : 2))}
            className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border inline-flex items-center gap-1.5 transition ${
              hintLevel === 2
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            ヒント 2：語法
          </button>
        </div>

        {hintLevel === 1 && (
          <div className="text-xs bg-slate-50 border border-slate-200/70 px-3 py-2 rounded-lg text-slate-700 font-mono">
            l_____ / o_____ / f____
          </div>
        )}
        {hintLevel === 2 && (
          <div className="text-xs bg-slate-50 border border-slate-200/70 px-3 py-2 rounded-lg text-slate-600">
            「〜に着手する」の launch は他動詞のため、前置詞 into は不要です。
          </div>
        )}

        <textarea
          rows={3}
          defaultValue="The team launched into the project, since they obtained new fund from the sponsors."
          className="w-full p-3.5 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition"
        />

        <button
          onClick={() => setShowDiffMock(true)}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl transition"
        >
          最小修正 AI添削を実行
        </button>
      </div>

      {showDiffMock && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4 animate-soft-pop">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900">添削フィードバック</span>
            <button className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 px-2.5 py-1 rounded-lg bg-indigo-50/70 transition">
              <Volume2 className="w-3.5 h-3.5" />
              モデル英文を再生
            </button>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 text-sm leading-relaxed text-slate-800">
            The team launched{' '}
            <span className="line-through text-rose-600 bg-rose-50 px-1 rounded">into</span>{' '}
            the project, since they{' '}
            <span className="bg-indigo-50 text-indigo-700 border-b border-indigo-300 px-1 rounded-t font-medium">
              obtained
            </span>{' '}
            new{' '}
            <span className="line-through text-rose-600 bg-rose-50 px-1 rounded">fund</span>{' '}
            <span className="text-emerald-700 font-medium bg-emerald-50 px-1 rounded">funds</span>{' '}
            from the sponsors.
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl flex items-start gap-2.5 text-slate-600">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800">他動詞の語法：</span>
                launch は他動詞のため前置詞 into は不要です（ErrorLogに自動記録）。
              </div>
            </div>
            <div className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl flex items-start gap-2.5 text-slate-600">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800">可算・不可算：</span>
                「資金」の意味で用いる場合、複数形 funds にするのが自然です。
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}