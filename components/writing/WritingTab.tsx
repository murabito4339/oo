'use client';

import { useState } from 'react';
import { Lightbulb, Volume2 } from 'lucide-react';

export function WritingTab() {
  const [writingMode, setWritingMode] = useState<'translation' | 'free'>('translation');
  const [showDiffMock, setShowDiffMock] = useState(true);
  const [hintLevel, setHintLevel] = useState(0);

  return (
    <div className="space-y-4 animate-pop-in">
      <div className="flex bg-slate-200 p-1 rounded-2xl">
        <button
          onClick={() => setWritingMode('translation')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${
            writingMode === 'translation' ? 'bg-white shadow text-indigo-600' : 'text-slate-600'
          }`}
        >
          1文マルチ和文英訳 (P4)
        </button>
        <button
          onClick={() => setWritingMode('free')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${
            writingMode === 'free' ? 'bg-white shadow text-indigo-600' : 'text-slate-600'
          }`}
        >
          自由英作文 (P5狙い)
        </button>
      </div>

      <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700">
            {writingMode === 'translation'
              ? 'ターゲット: launch / obtain / fund'
              : '東大型テーマ (60〜80語)'}
          </span>
          <span className="text-xs font-bold text-rose-600">🔥 弱点ブレンド: 他動詞</span>
        </div>

        <p className="font-bold text-base text-slate-800 leading-relaxed">
          {writingMode === 'translation'
            ? 'そのチームはスポンサーから新たな資金を獲得したので、その事業に着手した。'
            : 'What does it mean for a society to support young researchers? Write 60–80 words.'}
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setHintLevel((h) => (h === 1 ? 0 : 1))}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            ヒント1：頭文字
          </button>
          <button
            onClick={() => setHintLevel((h) => (h === 2 ? 0 : 2))}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            ヒント2：語法
          </button>
        </div>
        {hintLevel === 1 && (
          <div className="text-xs bg-amber-50 p-2.5 rounded-xl text-amber-900 font-mono">
            l_____ / o_____ / f____
          </div>
        )}
        {hintLevel === 2 && (
          <div className="text-xs bg-amber-50 p-2.5 rounded-xl text-amber-900">
            「〜に着手する」の launch は他動詞なので、後ろに前置詞 into は不要です！
          </div>
        )}

        <textarea
          rows={3}
          defaultValue="The team launched into the project, since they obtained new fund from the sponsors."
          className="w-full p-3 rounded-2xl border-2 border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={() => setShowDiffMock(true)}
          className="w-full py-3 bg-indigo-600 border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 text-white font-extrabold rounded-2xl transition"
        >
          最小修正 AI添削を実行（サンプル表示）
        </button>
      </div>

      {showDiffMock && (
        <div className="bg-white p-5 rounded-3xl border-2 border-emerald-200 space-y-3 shadow-sm animate-pop-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
              最小修正添削結果
            </span>
            <button className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl">
              <Volume2 className="w-4 h-4" />
              正しい英文を音読再生
            </button>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl text-sm leading-relaxed font-medium">
            The team launched{' '}
            <span className="line-through text-rose-500 bg-rose-50 px-1 rounded">into</span>{' '}
            the project, since they{' '}
            <span className="bg-amber-100 text-amber-900 px-1 rounded font-bold">
              obtained ✨P5
            </span>{' '}
            new{' '}
            <span className="line-through text-rose-500 bg-rose-50 px-1 rounded">fund</span>{' '}
            <span className="text-emerald-700 font-bold bg-emerald-100 px-1 rounded">
              funds
            </span>{' '}
            from the sponsors.
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="p-2.5 bg-rose-50 text-rose-800 rounded-xl font-medium">
              🏷️ <b>[他動詞ミス]</b> launch は他動詞なので into は不要です（ErrorLogに記録済）
            </div>
            <div className="p-2.5 bg-rose-50 text-rose-800 rounded-xl font-medium">
              🏷️ <b>[可算/不可算]</b> 「資金」の意味の fund は複数形 funds で使います
            </div>
          </div>
        </div>
      )}
    </div>
  );
}