import { Clock, Lock, Play, RotateCcw } from 'lucide-react';
import { STRAND_META, TOTAL_STEPS } from '@/constants/curriculum';
import { THEME } from '@/lib/theme';
import type { NodeItem, ThemeColor } from '@/types/lexis';

type Props = {
  node: NodeItem;
  status: 'done' | 'current' | 'locked';
  color: ThemeColor;
  /** 吹き出しの三角の位置（ポップオーバー左端からの px） */
  arrowX: number;
  onStart: () => void;
};

const KIND_LABEL: Record<NodeItem['kind'], string> = {
  lesson: 'レッスン',
  story: 'ストーリー',
  practice: 'パーソナル練習',
  boss: 'ユニット修了テスト',
};

/** ノードをタップしたときに真下に出る吹き出し（Duolingo 風） */
export function NodePopover({ node, status, color, arrowX, onStart }: Props) {
  const theme = THEME[color];
  const locked = status === 'locked';
  const strand = STRAND_META[node.strand];

  return (
    <div
      className={`relative w-[300px] rounded-2xl p-4 animate-pop-in ${
        locked ? 'bg-cloud border-2 border-line text-ink-soft' : `${theme.bg} text-white`
      }`}
      role="dialog"
      aria-label={node.label}
    >
      <span
        className={`absolute -top-2 w-4 h-4 rotate-45 ${
          locked ? 'bg-cloud border-l-2 border-t-2 border-line' : theme.bg
        }`}
        style={{ left: arrowX - 8 }}
      />

      <div className="flex items-center justify-between gap-2 text-[11px] font-extrabold">
        <span className={locked ? 'text-ink-faint' : 'text-white/80'}>
          {KIND_LABEL[node.kind]} {node.step} / {TOTAL_STEPS}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
            locked ? 'bg-line text-ink-soft' : 'bg-white/20 text-white'
          }`}
        >
          {strand.label}
        </span>
      </div>

      <h3 className={`mt-1 text-lg font-black leading-snug ${locked ? 'text-ink' : ''}`}>{node.label}</h3>
      <p className={`mt-1 text-[13px] font-bold leading-relaxed ${locked ? 'text-ink-soft' : 'text-white/90'}`}>
        {node.desc}
      </p>

      <ol className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-extrabold">
        {node.activities.map((a, i) => (
          <li
            key={a}
            className={`rounded-lg px-2 py-1 ${locked ? 'bg-white border border-line' : 'bg-black/10'}`}
          >
            {i + 1}. {a}
          </li>
        ))}
      </ol>

      <div className={`mt-3 flex items-center gap-1 text-[11px] font-extrabold ${locked ? 'text-ink-faint' : 'text-white/80'}`}>
        <Clock className="w-3.5 h-3.5" />
        約{node.minutes}分
      </div>

      <div className="mt-3">
        {locked ? (
          <div className="btn-3d btn-white w-full py-3 text-sm text-ink-faint cursor-not-allowed">
            <Lock className="w-4 h-4" />
            前のステップを終えると解放
          </div>
        ) : (
          <button
            onClick={onStart}
            className={`btn-3d w-full py-3 text-sm bg-white ${theme.textDark}`}
            style={{ ['--chunk' as string]: 'rgba(0,0,0,0.18)' }}
          >
            {status === 'done' ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            {status === 'done' ? 'もう一度練習（+1日）' : 'はじめる（+1日）'}
          </button>
        )}
      </div>
    </div>
  );
}
