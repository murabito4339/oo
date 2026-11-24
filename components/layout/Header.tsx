import { Flame } from 'lucide-react';

type Props = {
  streak: number;
};

export function Header({ streak }: Props) {
  return (
    <header className="sticky top-0 z-30 bg-[#F8F9FB]/85 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-semibold tracking-tight">
            L
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-tight text-slate-900">Lexis Lab</span>
            <span className="hidden sm:inline text-[11px] text-slate-400 font-medium">
              能動語彙化トレーニング
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3.5 text-xs font-medium tabular-nums">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Flame className="w-3.5 h-3.5 text-indigo-600" />
            <span>{streak}日連続</span>
          </div>
          <div className="h-3 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">習得</span>
            <span className="font-semibold text-slate-900">142 / 2,100</span>
          </div>
        </div>
      </div>
    </header>
  );
}