import { BookOpen, Droplets, Flame } from 'lucide-react';
import { THEME } from '@/lib/theme';
import type { SectionData } from '@/types/lexis';

type Props = {
  streak: number;
  isWateredToday: boolean;
  plantDays: number;
  masteredCount: number;
  currentSection: SectionData;
};

/**
 * 画面上部のステータスバー（xl 未満で表示。xl 以上では右レールに同じ情報を出す）。
 */
export function Header({ streak, isWateredToday, plantDays, masteredCount, currentSection }: Props) {
  const theme = THEME[currentSection.color];
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b-2 border-line xl:hidden">
      <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-8 h-8 shrink-0 rounded-xl ${theme.bg} text-white flex items-center justify-center text-sm font-black`}
            style={{ boxShadow: `0 3px 0 ${theme.chunk}` }}
            title={currentSection.title}
          >
            {currentSection.unit}
          </span>
          <span className="lg:hidden text-lg font-black tracking-tight text-leaf">Lexis Lab</span>
          <span className="hidden lg:inline truncate text-sm font-extrabold text-ink">
            {currentSection.title}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm font-extrabold tabular-nums">
          <StatPill
            icon={<Flame className={`w-5 h-5 ${isWateredToday ? 'text-flame fill-flame animate-flicker' : 'text-ink-faint'}`} />}
            value={streak}
            className={isWateredToday ? 'text-flame' : 'text-ink-faint'}
            label={`${streak}日連続`}
          />
          <StatPill
            icon={<Droplets className="w-5 h-5 text-sky fill-sky-light" />}
            value={plantDays}
            className="text-sky"
            label={`水やり累計 ${plantDays}日`}
          />
          <StatPill
            icon={<BookOpen className="w-5 h-5 text-grape" />}
            value={masteredCount}
            className="text-grape"
            label={`習得 ${masteredCount}語`}
          />
        </div>
      </div>
    </header>
  );
}

function StatPill({
  icon,
  value,
  className,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  className: string;
  label: string;
}) {
  return (
    <div className={`flex items-center gap-1 ${className}`} title={label} aria-label={label}>
      {icon}
      <span>{value}</span>
    </div>
  );
}
