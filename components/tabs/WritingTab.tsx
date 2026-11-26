'use client';

import { useState } from 'react';
import { CircleAlert, Lightbulb, Volume2 } from 'lucide-react';
import { Sprout } from '@/components/ui/Sprout';

type Props = {
  onCheck?: () => void;
};

export function WritingTab({ onCheck }: Props) {
  const [writingMode, setWritingMode] = useState<'translation' | 'free'>('translation');
  const [showFeedback, setShowFeedback] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);

  const prompt =
    writingMode === 'translation'
      ? 'そのチームはスポンサーから新たな資金を獲得したので、その事業に着手した。'
      : 'What does it mean for a society to support young researchers? Write 60–80 words.';

  return (
    <div className="space-y-5 animate-soft-pop">
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            { id: 'translation', label: '和文英訳', sub: '1文・マルチ語彙' },
            { id: 'free', label: '自由英作文', sub: '論述実践' },
          ] as const
        ).map((m) => {
          const active = writingMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                setWritingMode(m.id);
                setShowFeedback(false);
                setHintLevel(0);
              }}
              aria-pressed={active}
              className={`btn-3d py-2.5 text-sm flex-col !gap-0 ${
                active ? 'bg-berry-light text-berry-dark border-2 border-berry' : 'btn-white'
              }`}
              style={active ? { ['--chunk' as string]: 'var(--berry)' } : undefined}
            >
              <span>{m.label}</span>
              <span className="text-[11px] font-bold opacity-75">{m.sub}</span>
            </button>
          );
        })}
      </div>

      <h1 className="text-2xl font-black text-ink">
        {writingMode === 'translation' ? 'この文を英語にしよう' : 'このテーマで書いてみよう'}
      </h1>

      {/* マスコット＋吹き出しのお題 */}
      <div className="flex items-end gap-3">
        <Sprout size={84} className="shrink-0" />
        <div className="relative flex-1 rounded-2xl border-2 border-line px-4 py-3">
          <span className="absolute -left-[9px] bottom-6 w-4 h-4 rotate-45 bg-white border-l-2 border-b-2 border-line" />
          <p className="relative text-[15px] font-bold leading-relaxed text-ink">{prompt}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold">
        <span className="rounded-lg bg-cloud text-ink-soft px-2 py-1">
          {writingMode === 'translation' ? 'Target: launch / obtain / funds' : '難関大形式 · 60–80 words'}
        </span>
        <span className="rounded-lg bg-berry-light text-berry-dark px-2 py-1">弱点フォーカス：他動詞の語法</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { level: 1, label: 'ヒント1：頭文字' },
          { level: 2, label: 'ヒント2：語法' },
        ].map((h) => (
          <button
            key={h.level}
            onClick={() => setHintLevel((cur) => (cur === h.level ? 0 : h.level))}
            aria-pressed={hintLevel === h.level}
            className={`btn-3d px-3 py-2 text-xs ${
              hintLevel === h.level ? 'bg-sun-light text-sun-dark border-2 border-sun' : 'btn-white'
            }`}
            style={hintLevel === h.level ? { ['--chunk' as string]: 'var(--sun)' } : undefined}
          >
            <Lightbulb className="w-4 h-4 text-sun" />
            {h.label}
          </button>
        ))}
      </div>

      {hintLevel === 1 && (
        <div className="rounded-2xl bg-sun-light px-4 py-3 text-sm font-black text-sun-dark font-mono animate-soft-pop">
          l_____ / o_____ / f____
        </div>
      )}
      {hintLevel === 2 && (
        <div className="rounded-2xl bg-sun-light px-4 py-3 text-xs font-bold text-sun-dark animate-soft-pop">
          「〜に着手する」の launch は他動詞のため、前置詞 into は不要です。
        </div>
      )}

      <textarea
        rows={4}
        defaultValue="The team launched into the project, since they obtained new fund from the sponsors."
        className="w-full rounded-2xl border-2 border-line bg-cloud p-4 text-[15px] font-bold text-ink leading-relaxed focus:outline-none focus:border-sky focus:bg-white transition"
      />

      {!showFeedback && (
        <button
          onClick={() => {
            setShowFeedback(true);
            onCheck?.();
          }}
          className="btn-3d btn-leaf w-full py-4 text-base"
        >
          チェックする
        </button>
      )}

      {showFeedback && (
        <section className="rounded-3xl bg-berry-light p-5 space-y-4 animate-pop-in">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-berry-dark">
              <CircleAlert className="w-7 h-7" strokeWidth={2.6} />
              <span className="text-lg font-black whitespace-nowrap">おしい！ 修正2か所</span>
            </div>
            <button className="btn-3d btn-white px-3 py-1.5 text-xs whitespace-nowrap shrink-0">
              <Volume2 className="w-4 h-4 text-sky" />
              モデル文
            </button>
          </div>

          <div className="rounded-2xl bg-white p-4 text-[15px] font-bold leading-relaxed text-ink">
            The team launched{' '}
            <span className="line-through decoration-2 text-berry bg-berry-light px-1 rounded">into</span> the project,
            since they{' '}
            <span className="bg-sky-light text-sky-dark border-b-2 border-sky px-1 rounded-t">obtained</span> new{' '}
            <span className="line-through decoration-2 text-berry bg-berry-light px-1 rounded">fund</span>{' '}
            <span className="text-leaf-dark bg-leaf-light px-1 rounded">funds</span> from the sponsors.
          </div>

          <ul className="space-y-2 text-xs font-bold text-ink-soft">
            <li className="rounded-2xl bg-white/70 p-3">
              <span className="font-black text-berry-dark">他動詞の語法：</span>
              launch は他動詞のため前置詞 into は不要です（ErrorLog に自動記録）。
            </li>
            <li className="rounded-2xl bg-white/70 p-3">
              <span className="font-black text-berry-dark">可算・不可算：</span>
              「資金」の意味では複数形 funds にするのが自然です。
            </li>
          </ul>

          <button onClick={() => setShowFeedback(false)} className="btn-3d btn-berry w-full py-3.5 text-base">
            書き直す
          </button>
        </section>
      )}
    </div>
  );
}
