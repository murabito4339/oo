'use client';

import { useState } from 'react';
import { Bookmark, Clock, Eye, Volume2 } from 'lucide-react';

type Props = {
  onReview?: () => void;
};

// デモ用デッキ（Supabase の cards と接続するまでの仮データ）
const DECK = [
  {
    word: 'launch',
    meaning: '〜に着手する、開始する',
    pos: '他動詞',
    note: '他動詞のため launch into 〜 とせず、直接目的語をとる。',
  },
  {
    word: 'obtain',
    meaning: '〜を手に入れる、獲得する',
    pos: '他動詞',
    note: 'get より改まった語。obtain funds / obtain permission。',
  },
  {
    word: 'feature',
    meaning: '特徴；〜を呼び物にする',
    pos: '名・他',
    note: '名詞は「目立つ特徴」。動詞は「〜を特集する」。',
  },
  {
    word: 'distinct',
    meaning: 'はっきりした、別個の',
    pos: '形容詞',
    note: 'be distinct from 〜「〜とは別の」。distinctive は「特有の」。',
  },
  {
    word: 'point',
    meaning: '要点；〜を指す',
    pos: '名・自他',
    note: 'There is no point in -ing「〜しても無駄だ」。',
  },
];

const SESSION_GOAL = 10;

const RATINGS = [
  { label: 'まだ', sub: '1分', btn: 'btn-berry' },
  { label: '迷った', sub: '12時間', btn: 'btn-sun' },
  { label: 'OK', sub: '3日', btn: 'btn-leaf' },
  { label: '瞬殺', sub: '7日', btn: 'btn-sky' },
];

export function CardsTab({ onReview }: Props) {
  const [cardFlipped, setCardFlipped] = useState(false);
  const [cardMode, setCardMode] = useState<'receptive' | 'productive'>('receptive');
  const [index, setIndex] = useState(0);
  const [reviewed, setReviewed] = useState(0);

  const card = DECK[index % DECK.length];
  const front = cardMode === 'receptive' ? card.word : card.meaning;
  const back = cardMode === 'receptive' ? card.meaning : card.word;

  const handleRate = () => {
    setReviewed((n) => n + 1);
    setIndex((i) => i + 1);
    setCardFlipped(false);
    onReview?.();
  };

  return (
    <div className="space-y-5 animate-soft-pop">
      {/* セッション進捗 */}
      <div className="flex items-center gap-3">
        <div className="progress-track flex-1 h-4">
          <div
            className="progress-fill bg-leaf"
            style={{ width: `${(Math.min(reviewed, SESSION_GOAL) / SESSION_GOAL) * 100}%` }}
          />
        </div>
        <span className="text-sm font-black text-ink-soft tabular-nums">
          {Math.min(reviewed, SESSION_GOAL)}/{SESSION_GOAL}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(
          [
            { id: 'receptive', label: '受容カード', sub: '英 → 日' },
            { id: 'productive', label: '産出カード', sub: '日 → 英' },
          ] as const
        ).map((m) => {
          const active = cardMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                setCardMode(m.id);
                setCardFlipped(false);
              }}
              aria-pressed={active}
              className={`btn-3d py-2.5 text-sm flex-col !gap-0 ${
                active ? 'bg-sky-light text-sky-dark border-2 border-sky' : 'btn-white'
              }`}
              style={active ? { ['--chunk' as string]: 'var(--sky)' } : undefined}
            >
              <span>{m.label}</span>
              <span className="text-[11px] font-bold opacity-75">{m.sub}</span>
            </button>
          );
        })}
      </div>

      <div
        onClick={() => setCardFlipped(true)}
        className="card-3d min-h-[320px] p-5 flex flex-col justify-between cursor-pointer select-none"
      >
        <div className="flex items-center justify-between text-xs font-extrabold">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-sky-light text-sky-dark px-2 py-0.5">Sec.02</span>
            <span className="rounded-lg bg-cloud text-ink-soft px-2 py-0.5">{card.pos}</span>
          </div>
          <span className="inline-flex items-center gap-1 text-ink-faint tabular-nums">
            <Clock className="w-4 h-4" />
            1.4s
          </span>
        </div>

        <div key={`${index}-${cardMode}`} className="text-center my-6 space-y-5 animate-pop-in">
          <div
            className={`font-black tracking-tight text-ink ${
              cardMode === 'receptive' ? 'text-4xl' : 'text-2xl leading-snug'
            }`}
          >
            {front}
          </div>

          {cardFlipped ? (
            <div className="pt-5 border-t-2 border-dashed border-line space-y-2 animate-soft-pop">
              <div className="text-xl font-black text-sky-dark">{back}</div>
              <p className="text-xs font-bold text-ink-soft max-w-sm mx-auto leading-relaxed">{card.note}</p>
            </div>
          ) : (
            <p className="text-xs font-extrabold text-ink-faint">頭の中で答えてから、タップして確認</p>
          )}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={(e) => e.stopPropagation()}
            className="btn-3d btn-white px-3 py-2 text-xs"
          >
            <Bookmark className="w-4 h-4 text-berry" />
            今日の英作文に予約
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            aria-label="発音を再生"
            className="btn-3d btn-sky w-12 h-12 !rounded-2xl"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      {cardFlipped ? (
        <div className="grid grid-cols-4 gap-2 animate-soft-pop">
          {RATINGS.map((b) => (
            <button key={b.label} onClick={handleRate} className={`btn-3d ${b.btn} flex-col !gap-0 py-3`}>
              <span className="text-sm">{b.label}</span>
              <span className="text-[10px] font-bold opacity-85 tabular-nums">{b.sub}</span>
            </button>
          ))}
        </div>
      ) : (
        <button onClick={() => setCardFlipped(true)} className="btn-3d btn-leaf w-full py-4 text-base">
          <Eye className="w-5 h-5" />
          答えを見る
        </button>
      )}
    </div>
  );
}
