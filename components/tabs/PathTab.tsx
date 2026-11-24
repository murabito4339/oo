'use client';

import { useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Crown,
  Headphones,
  Layers,
  Lock,
  Mic,
  PenTool,
  Zap,
} from 'lucide-react';
import { NodeDetailModal } from '@/components/modals/NodeDetailModal';
import {
  NODE_TEMPLATE,
  PATH_CENTER_X,
  PATH_WIDTH,
  ROW_HEIGHT,
  SECTIONS,
  SNAKE_OFFSETS,
  TOP_OFFSET,
} from '@/constants/curriculum';
import type { NodeItem, SectionData } from '@/types/lexis';

type Props = {
  selectedSectionId: string;
  sectionProgress: Record<string, number>;
  currentSection: SectionData;
  doneCount: number;
  onSelectSection: (id: string) => void;
  onCompleteNode: (node: NodeItem) => void;
  onOpenVocab: () => void;
};

export function PathTab({
  selectedSectionId,
  sectionProgress,
  currentSection,
  doneCount,
  onSelectSection,
  onCompleteNode,
  onOpenVocab,
}: Props) {
  const [activeNodeModal, setActiveNodeModal] = useState<NodeItem | null>(null);

  const nodeCoords = NODE_TEMPLATE.map((_, idx) => ({
    x: PATH_CENTER_X + SNAKE_OFFSETS[idx % SNAKE_OFFSETS.length],
    y: TOP_OFFSET + idx * ROW_HEIGHT,
  }));
  const totalPathHeight = TOP_OFFSET + (NODE_TEMPLATE.length - 1) * ROW_HEIGHT + 72;

  return (
    <div className="space-y-5 animate-soft-pop">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
          <span className="font-medium">カリキュラム・セクション</span>
          <span className="tabular-nums text-[11px] text-slate-400">全50セクション構成</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SECTIONS.map((sec) => {
            const isSelected = sec.id === selectedSectionId;
            const prog = sectionProgress[sec.id] ?? 0;
            return (
              <button
                key={sec.id}
                onClick={() => onSelectSection(sec.id)}
                className={`shrink-0 px-3.5 py-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`text-[10px] font-medium tracking-wider ${
                      isSelected ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {sec.code}
                  </span>
                  <span
                    className={`text-[10px] tabular-nums font-medium ${
                      isSelected ? 'text-indigo-300' : 'text-slate-400'
                    }`}
                  >
                    {prog}/8
                  </span>
                </div>
                <div className="text-xs font-semibold mt-0.5">{sec.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div
        key={selectedSectionId}
        className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden animate-soft-pop"
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wider text-indigo-600">
                {currentSection.code}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-[11px] text-slate-400">{currentSection.subtitle}</span>
            </div>
            <h2 className="text-base font-semibold text-slate-900 mt-0.5 tracking-tight">
              {currentSection.title}
            </h2>
          </div>
          <button
            onClick={onOpenVocab}
            className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
          >
            <span>語彙一覧</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="py-6 flex justify-center bg-gradient-to-b from-white to-slate-50/40">
          <div className="relative" style={{ width: `${PATH_WIDTH}px`, height: `${totalPathHeight}px` }}>
            <svg
              viewBox={`0 0 ${PATH_WIDTH} ${totalPathHeight}`}
              className="absolute inset-0 w-full h-full pointer-events-none"
              fill="none"
            >
              {nodeCoords.map((pt, i) => {
                if (i === nodeCoords.length - 1) return null;
                const next = nodeCoords[i + 1];
                const midY = (pt.y + next.y) / 2;
                const d = `M ${pt.x} ${pt.y} C ${pt.x} ${midY}, ${next.x} ${midY}, ${next.x} ${next.y}`;
                const stepCompleted = i + 1 <= doneCount;

                return (
                  <path
                    key={i}
                    d={d}
                    stroke={stepCompleted ? '#4F46E5' : '#E2E8F0'}
                    strokeWidth={stepCompleted ? '2' : '1.75'}
                    strokeDasharray={stepCompleted ? undefined : '4 5'}
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>

            {NODE_TEMPLATE.map((node, idx) => {
              const isDone = node.step <= doneCount;
              const isCurrent = node.step === doneCount + 1;
              const isLocked = node.step > doneCount + 1;
              const { x, y } = nodeCoords[idx];

              let nodeCircleStyle =
                'bg-slate-50 border border-slate-200 text-slate-300 cursor-not-allowed';
              if (isDone) {
                nodeCircleStyle =
                  'bg-white border border-indigo-200 text-indigo-600 hover:border-indigo-400 shadow-xs';
              } else if (isCurrent) {
                nodeCircleStyle =
                  'bg-indigo-600 border border-indigo-600 text-white shadow-md animate-subtle-pulse hover:bg-indigo-700';
              }

              return (
                <div
                  key={node.step}
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute flex flex-col items-center"
                >
                  {isCurrent && (
                    <div className="absolute -top-8 bg-slate-900 text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full shadow-sm whitespace-nowrap tracking-wide">
                      NEXT
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (!isLocked) setActiveNodeModal(node);
                    }}
                    aria-label={node.label}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${nodeCircleStyle}`}
                  >
                    {isDone ? (
                      <Check className="w-5 h-5 stroke-[2.2]" />
                    ) : isLocked ? (
                      <Lock className="w-4 h-4" />
                    ) : node.icon === 'crown' ? (
                      <Crown className="w-5 h-5" />
                    ) : node.icon === 'headphones' ? (
                      <Headphones className="w-5 h-5" />
                    ) : node.icon === 'mic' ? (
                      <Mic className="w-5 h-5" />
                    ) : node.icon === 'pen' ? (
                      <PenTool className="w-4 h-4" />
                    ) : node.icon === 'zap' ? (
                      <Zap className="w-5 h-5" />
                    ) : node.icon === 'book' ? (
                      <BookOpen className="w-4 h-4" />
                    ) : (
                      <Layers className="w-4 h-4" />
                    )}
                  </button>

                  <div className="absolute top-14 flex flex-col items-center whitespace-nowrap">
                    <span
                      className={`text-xs font-medium tracking-tight ${
                        isCurrent ? 'text-slate-900 font-semibold' : isDone ? 'text-slate-700' : 'text-slate-400'
                      }`}
                    >
                      {node.label}
                    </span>
                    <span className="text-[10px] text-slate-400">{node.sub}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {activeNodeModal && (
        <NodeDetailModal
          node={activeNodeModal}
          sectionCode={currentSection.code}
          onClose={() => setActiveNodeModal(null)}
          onComplete={() => {
            onCompleteNode(activeNodeModal);
            setActiveNodeModal(null);
          }}
        />
      )}
    </div>
  );
}