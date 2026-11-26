import { Gift, Layers, PenLine, Route } from 'lucide-react';

export type QuestProgress = {
  stepsToday: number;
  reviewedToday: number;
  writingChecks: number;
};

const QUESTS = [
  {
    key: 'stepsToday' as const,
    label: 'パスを1ステップ進める',
    target: 1,
    icon: Route,
    iconClass: 'text-sky',
    fill: 'bg-sky',
  },
  {
    key: 'reviewedToday' as const,
    label: 'カードを10枚復習する',
    target: 10,
    icon: Layers,
    iconClass: 'text-grape',
    fill: 'bg-grape',
  },
  {
    key: 'writingChecks' as const,
    label: '英作文を1回チェックする',
    target: 1,
    icon: PenLine,
    iconClass: 'text-berry',
    fill: 'bg-berry',
  },
];

type Props = {
  progress: QuestProgress;
  compact?: boolean;
};

export function DailyQuests({ progress, compact = false }: Props) {
  const doneCount = QUESTS.filter((q) => progress[q.key] >= q.target).length;
  return (
    <section className="card-3d p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-ink">デイリークエスト</h2>
        <span className="text-xs font-extrabold text-ink-faint tabular-nums">
          {doneCount} / {QUESTS.length}
        </span>
      </div>
      <ul className={compact ? 'space-y-3' : 'space-y-3.5'}>
        {QUESTS.map((q) => {
          const Icon = q.icon;
          const value = Math.min(progress[q.key], q.target);
          const done = value >= q.target;
          return (
            <li key={q.key} className="flex items-center gap-3">
              <Icon className={`w-7 h-7 shrink-0 ${q.iconClass}`} strokeWidth={2.4} />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="text-[13px] font-extrabold text-ink truncate">{q.label}</div>
                <div className="flex items-center gap-2">
                  <div className="progress-track flex-1 relative">
                    <div
                      className={`progress-fill ${done ? 'bg-sun' : q.fill}`}
                      style={{ width: `${(value / q.target) * 100}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-ink-soft tabular-nums mix-blend-multiply">
                      {value} / {q.target}
                    </span>
                  </div>
                  <Gift
                    className={`w-6 h-6 shrink-0 ${done ? 'text-sun fill-sun-light' : 'text-line-dark'}`}
                    strokeWidth={2.2}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
