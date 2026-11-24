import { Droplets, X } from 'lucide-react';
import type { NodeItem } from '@/types/lexis';

type Props = {
  node: NodeItem;
  sectionCode: string;
  onClose: () => void;
  onComplete: () => void;
};

export function NodeDetailModal({ node, sectionCode, onClose, onComplete }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 p-6 space-y-4 animate-soft-pop shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-indigo-600">
            {sectionCode} · STEP {node.step}
          </span>
          <button
            onClick={onClose}
            aria-label="閉じる"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight">{node.label}</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{node.desc}</p>
        </div>
        <div className="pt-2">
          <button
            onClick={onComplete}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl transition flex items-center justify-center gap-2"
          >
            <Droplets className="w-4 h-4" />
            <span>完了として記録する（デモ）</span>
          </button>
        </div>
      </div>
    </div>
  );
}