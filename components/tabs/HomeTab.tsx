import { ChevronRight, Layers, PenLine, Play } from 'lucide-react';
import { DailyQuests, type QuestProgress } from '@/components/layout/DailyQuests';
import { STRAND_META, TOTAL_STEPS, nextNodeOf } from '@/constants/curriculum';
import { BotanicalCard } from '@/features/botanical';
import { NODE_ICONS, THEME } from '@/lib/theme';
import type { SectionData, TabType } from '@/types/lexis';

type Props = {
  plantDays: number;
  isWateredToday: boolean;
  currentSection: SectionData;
  /** 選択中セクションの完了ステップ */
  completed: number[];
  /** 植物を育て始めた日（YYYY-MM-DD） */
  plantStartDate: string | null;
  quests: QuestProgress;
  onWaterPlant: () => void;
  onChangePlantDays: (days: number) => void;
  onNavigateTab: (tab: TabType) => void;
};

export function HomeTab({
  plantDays,
  isWateredToday,
  currentSection,
  completed,
  plantStartDate,
  quests,
  onWaterPlant,
  onChangePlantDays,
  onNavigateTab,
}: Props) {
  const theme = THEME[currentSection.color];
  const nextNode = nextNodeOf(completed);
  const doneCount = completed.length;
  const NextIcon = nextNode ? NODE_ICONS[nextNode.icon] : null;

  return (
    <div className="space-y-5 animate-soft-pop">
      {/* つづきから */}
      <section
        className={`rounded-3xl ${theme.bg} text-white p-5 space-y-4`}
        style={{ boxShadow: `0 5px 0 ${theme.chunk}` }}
      >
        <div className="flex items-start gap-4">
          {NextIcon && (
            <div
              className="w-16 h-16 shrink-0 rounded-full bg-white/20 flex items-center justify-center"
              style={{ boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.12)' }}
            >
              <NextIcon className="w-8 h-8" strokeWidth={2.6} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-extrabold tracking-wider text-white/80">
              ユニット {currentSection.unit} · {currentSection.title}
            </div>
            <h2 className="text-2xl font-black leading-tight mt-0.5">
              {nextNode ? nextNode.label : 'ユニット修了！'}
            </h2>
            <p className="text-xs font-bold text-white/85 mt-1">
              {nextNode
                ? `${STRAND_META[nextNode.strand].label} · 約${nextNode.minutes}分 · ${nextNode.sub}`
                : '次のユニットに進みましょう'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="progress-track flex-1 bg-black/15">
            <div className="progress-fill bg-white" style={{ width: `${(doneCount / TOTAL_STEPS) * 100}%` }} />
          </div>
          <span className="text-xs font-black tabular-nums">
            {doneCount}/{TOTAL_STEPS}
          </span>
        </div>

        <button
          onClick={() => onNavigateTab('path')}
          className={`btn-3d w-full py-3.5 text-base bg-white ${theme.textDark}`}
          style={{ ['--chunk' as string]: 'rgba(0,0,0,0.18)' }}
        >
          <Play className="w-5 h-5 fill-current" />
          つづきから
        </button>
      </section>

      <BotanicalCard
        plantDays={plantDays}
        isWateredToday={isWateredToday}
        startDate={plantStartDate}
        onWaterPlant={onWaterPlant}
        onChangePlantDays={onChangePlantDays}
      />

      <div className="xl:hidden">
        <DailyQuests progress={quests} />
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-black text-ink px-0.5">今日のトレーニング</h2>
        <div className="grid grid-cols-2 gap-3">
          <TrainingTile
            onClick={() => onNavigateTab('cards')}
            icon={<Layers className="w-7 h-7 text-white" strokeWidth={2.6} />}
            iconBg="bg-grape"
            chunk="var(--grape-dark)"
            badge="FSRS 復習"
            title="14枚が期限"
            sub="受容・産出の想起スピード"
          />
          <TrainingTile
            onClick={() => onNavigateTab('writing')}
            icon={<PenLine className="w-7 h-7 text-white" strokeWidth={2.6} />}
            iconBg="bg-berry"
            chunk="var(--berry-dark)"
            badge="弱点ブレンド"
            title="1文マルチ和文英訳"
            sub="launch / obtain / funds"
          />
        </div>
      </section>
    </div>
  );
}

function TrainingTile({
  onClick,
  icon,
  iconBg,
  chunk,
  badge,
  title,
  sub,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  iconBg: string;
  chunk: string;
  badge: string;
  title: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className="btn-3d btn-white !items-start !justify-start flex-col text-left p-4 !gap-3 group"
    >
      <div className="w-full flex items-center justify-between">
        <span
          className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center`}
          style={{ boxShadow: `0 3px 0 ${chunk}` }}
        >
          {icon}
        </span>
        <ChevronRight className="w-5 h-5 text-ink-faint group-hover:translate-x-0.5 transition" />
      </div>
      <div className="space-y-0.5">
        <div className="text-[11px] font-extrabold text-ink-faint">{badge}</div>
        <div className="text-[15px] font-black text-ink leading-snug">{title}</div>
        <div className="text-[11px] font-bold text-ink-soft">{sub}</div>
      </div>
    </button>
  );
}
