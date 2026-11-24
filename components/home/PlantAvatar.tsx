'use client';

export function PlantAvatar({ streak }: { streak: number }) {
  const stage =
    streak === 0
      ? '種 (0日)'
      : streak < 3
      ? '双葉 (発芽!)'
      : streak < 7
      ? '若葉 (成長中)'
      : streak < 14
      ? 'つぼみ (あと少し!)'
      : '満開の花 (習慣化達成!)';

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-14 h-14 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner">
        <div className="animate-sway">
          <svg viewBox="0 0 64 64" className="w-11 h-11">
            <ellipse cx="32" cy="56" rx="20" ry="5" fill="#92400e" opacity="0.25" />
            {streak === 0 && <ellipse cx="32" cy="48" rx="6" ry="8" fill="#b45309" />}
            {streak >= 1 && (
              <path
                d={streak >= 7 ? 'M32 54 Q30 36 32 20' : 'M32 54 Q31 44 32 34'}
                stroke="#16a34a"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
            )}
            {streak >= 1 && (
              <>
                <path d="M32 42 Q20 34 16 40 Q22 48 32 42" fill="#22c55e" />
                <path d="M32 40 Q44 32 48 38 Q42 46 32 40" fill="#4ade80" />
              </>
            )}
            {streak >= 3 && (
              <>
                <path d="M31 30 Q18 22 15 29 Q22 36 31 30" fill="#16a34a" />
                <path d="M32 28 Q45 20 49 27 Q42 34 32 28" fill="#22c55e" />
              </>
            )}
            {streak >= 7 && streak < 14 && <circle cx="32" cy="17" r="6" fill="#f43f5e" />}
            {streak >= 14 && (
              <g>
                <circle cx="32" cy="11" r="5" fill="#fb7185" />
                <circle cx="24" cy="17" r="5" fill="#fb7185" />
                <circle cx="40" cy="17" r="5" fill="#fb7185" />
                <circle cx="27" cy="24" r="5" fill="#fb7185" />
                <circle cx="37" cy="24" r="5" fill="#fb7185" />
                <circle cx="32" cy="17" r="4.5" fill="#facc15" />
              </g>
            )}
          </svg>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-extrabold text-emerald-700">{streak}日連続</span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            {stage}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">学習すると💧水やりで育ちます</p>
      </div>
    </div>
  );
}