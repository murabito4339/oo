'use client';

import { useState } from 'react';
import { ChevronDown, FlaskConical } from 'lucide-react';
import { NODE_TEMPLATE, STRAND_META, STRAND_ORDER, strandMinutes } from '@/constants/curriculum';
import { STRAND_THEME } from '@/lib/theme';

/** 1セクションの時間配分（4つのストランド）を見せるカード */
export function StrandBalance() {
  const [open, setOpen] = useState(false);
  const minutes = strandMinutes(NODE_TEMPLATE);
  const total = STRAND_ORDER.reduce((s, k) => s + minutes[k], 0);

  return (
    <section className="card-3d p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-grape" strokeWidth={2.4} />
          <h2 className="text-sm font-black text-ink">1セクションの配分</h2>
        </div>
        <span className="text-xs font-extrabold text-ink-faint tabular-nums">
          10ステップ · 約{total}分
        </span>
      </div>

      <div className="flex h-4 w-full overflow-hidden rounded-full gap-0.5" aria-hidden="true">
        {STRAND_ORDER.map((k) => (
          <div
            key={k}
            className={`${STRAND_THEME[k].bar} first:rounded-l-full last:rounded-r-full`}
            style={{ width: `${(minutes[k] / total) * 100}%` }}
          />
        ))}
      </div>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {STRAND_ORDER.map((k) => (
          <li key={k} className="flex items-center gap-2 text-xs font-extrabold text-ink">
            <span className={`w-2.5 h-2.5 rounded-full ${STRAND_THEME[k].dot}`} />
            <span className="flex-1">{STRAND_META[k].label}</span>
            <span className="tabular-nums text-ink-soft">
              {minutes[k]}分 · {Math.round((minutes[k] / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between rounded-xl bg-cloud px-3 py-2 text-xs font-extrabold text-ink-soft hover:text-ink transition"
        aria-expanded={open}
      >
        なぜこの順番？
        <ChevronDown className={`w-4 h-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul className="space-y-2 text-xs font-bold leading-relaxed text-ink-soft animate-soft-pop">
          <li>
            <b className="text-ink">50語を A/B に分けて交互に。</b>
            A を学んだ直後に B を挟むので、A を思い出すまでに自然な間隔が空きます。
          </li>
          <li>
            <b className="text-ink">音は最初から。</b>
            独立した「聴解」ステップはやめ、出会う段階から音声と綴りをセットにしました。
          </li>
          <li>
            <b className="text-ink">認識 → 想起の順。</b>
            まず英→日で手がかりを作り、次に日→英で自力で取り出します。
          </li>
          <li>
            <b className="text-ink">文脈で聴く・読む時間を新設。</b>
            旧パスに無かった「ストーリー」で、50語に文脈の中で再会します。
          </li>
          <li>
            <b className="text-ink">流暢性は終盤に。</b>
            4/3/2 は既に知っている語と内容で行うときに効くため、作文と添削の後に置いています。
          </li>
        </ul>
      )}
    </section>
  );
}
