import { BookOpen, Droplets, Flame } from 'lucide-react';
import { Sprout } from '@/components/ui/Sprout';
import { DailyQuests, type QuestProgress } from './DailyQuests';

type Props = {
  streak: number;
  isWateredToday: boolean;
  plantDays: number;
  masteredCount: number;
  quests: QuestProgress;
};

/** PC（xl 以上）の右レール：ステータスとデイリークエスト */
export function StatsRail({ streak, isWateredToday, plantDays, masteredCount, quests }: Props) {
  return (
    <aside className="hidden xl:block fixed right-0 inset-y-0 w-[340px] overflow-y-auto px-6 py-6 space-y-5">
      <div className="flex items-center justify-around text-base font-black tabular-nums">
        <span className={`flex items-center gap-1.5 ${isWateredToday ? 'text-flame' : 'text-ink-faint'}`}>
          <Flame className={`w-6 h-6 ${isWateredToday ? 'fill-flame animate-flicker' : ''}`} />
          {streak}
        </span>
        <span className="flex items-center gap-1.5 text-sky">
          <Droplets className="w-6 h-6 fill-sky-light" />
          {plantDays}
        </span>
        <span className="flex items-center gap-1.5 text-grape">
          <BookOpen className="w-6 h-6" />
          {masteredCount}
        </span>
      </div>

      <section className="card-3d p-4 flex items-center gap-3">
        <Sprout size={64} mood={isWateredToday ? 'cheer' : 'sleepy'} />
        <div className="min-w-0">
          <div className="text-base font-black text-ink">
            {isWateredToday ? `${streak}日連続達成！` : `${streak}日連続中`}
          </div>
          <p className="text-xs font-bold text-ink-soft leading-relaxed mt-0.5">
            {isWateredToday
              ? '今日の水やりは完了。この調子でパスを進めよう。'
              : 'パスを1ステップ進めると、水やりになって連続記録がのびます。'}
          </p>
        </div>
      </section>

      <DailyQuests progress={quests} compact />
    </aside>
  );
}
