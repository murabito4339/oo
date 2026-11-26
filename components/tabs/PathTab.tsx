"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Check, Lock, Trophy } from "lucide-react";
import { NodePopover } from "@/components/path/NodePopover";
import { StrandBalance } from "@/components/path/StrandBalance";
import { Sprout } from "@/components/ui/Sprout";
import {
  NODE_TEMPLATE,
  PATH_CENTER_X,
  PATH_WIDTH,
  ROW_HEIGHT,
  SECTIONS,
  SNAKE_OFFSETS,
  STRAND_META,
  TOP_OFFSET,
  TOTAL_STEPS,
  nodeStatus,
} from "@/constants/curriculum";
import { NODE_ICONS, STRAND_THEME, THEME } from "@/lib/theme";
import type { NodeItem, SectionData } from "@/types/lexis";

type Props = {
  selectedSectionId: string;
  /** セクションごとの完了ステップ */
  completed: Record<string, number[]>;
  onSelectSection: (id: string) => void;
  onCompleteNode: (sectionId: string, node: NodeItem) => void;
  onOpenVocab: () => void;
};

type OpenNode = { sectionId: string; step: number } | null;

export function PathTab({
  selectedSectionId,
  completed,
  onSelectSection,
  onCompleteNode,
  onOpenVocab,
}: Props) {
  const [openNode, setOpenNode] = useState<OpenNode>(null);
  const currentNodeRef = useRef<HTMLButtonElement | null>(null);

  // 開いたときに、選択中セクションの「次のステップ」まで自動スクロール
  useEffect(() => {
    currentNodeRef.current?.scrollIntoView({
      block: "center",
      behavior: "instant" as ScrollBehavior,
    });
  }, []);

  return (
    <div className="space-y-6 animate-soft-pop">
      <StrandBalance />

      {openNode && (
        <button
          aria-label="閉じる"
          className="fixed inset-0 z-20 cursor-default"
          onClick={() => setOpenNode(null)}
        />
      )}

      {SECTIONS.map((section, sectionIdx) => (
        <UnitPath
          key={section.id}
          section={section}
          sectionIdx={sectionIdx}
          completed={completed[section.id] ?? []}
          isSelected={section.id === selectedSectionId}
          openStep={openNode?.sectionId === section.id ? openNode.step : null}
          currentNodeRef={
            section.id === selectedSectionId ? currentNodeRef : undefined
          }
          onToggleNode={(step) =>
            setOpenNode((prev) =>
              prev?.sectionId === section.id && prev.step === step
                ? null
                : { sectionId: section.id, step },
            )
          }
          onStart={(node) => {
            onSelectSection(section.id);
            onCompleteNode(section.id, node);
            setOpenNode(null);
          }}
          onOpenVocab={() => {
            onSelectSection(section.id);
            onOpenVocab();
          }}
          nextSection={SECTIONS[sectionIdx + 1]}
        />
      ))}
    </div>
  );
}

/** ノード下側の立体の厚み（globals.css の .node-3d の box-shadow と同じ値） */
const NODE_DEPTH = 7;
/** リングの外側の線からノードまでの距離（線の太さ 5px ＋ すき間 5px） */
const RING_OFFSET = 10;
const BOSS_RADIUS = 26;

/**
 * 「次のステップ」を囲むリング。
 * ノードは下に 7px の厚みがあるので、ボタンの四角ではなく「ボタン＋厚み」の中心に合わせる。
 * 丸いノードは正円のまま、上下のすき間がそろう大きさにする。
 */
function currentRingStyle(size: number, isBoss: boolean): React.CSSProperties {
  if (isBoss) {
    return {
      left: -RING_OFFSET,
      top: -RING_OFFSET,
      width: size + RING_OFFSET * 2,
      height: size + NODE_DEPTH + RING_OFFSET * 2,
      borderRadius: BOSS_RADIUS + RING_OFFSET,
    };
  }
  const diameter = size + NODE_DEPTH + RING_OFFSET * 2;
  return {
    left: -(RING_OFFSET + NODE_DEPTH / 2),
    top: -RING_OFFSET,
    width: diameter,
    height: diameter,
    borderRadius: "9999px",
  };
}

function UnitPath({
  section,
  sectionIdx,
  completed,
  isSelected,
  openStep,
  currentNodeRef,
  onToggleNode,
  onStart,
  onOpenVocab,
  nextSection,
}: {
  section: SectionData;
  sectionIdx: number;
  completed: number[];
  isSelected: boolean;
  openStep: number | null;
  currentNodeRef?: React.RefObject<HTMLButtonElement | null>;
  onToggleNode: (step: number) => void;
  onStart: (node: NodeItem) => void;
  onOpenVocab: () => void;
  nextSection?: SectionData;
}) {
  const theme = THEME[section.color];
  const doneCount = completed.length;
  const isComplete = doneCount >= TOTAL_STEPS;
  const coords = NODE_TEMPLATE.map((_, idx) => ({
    x: PATH_CENTER_X + SNAKE_OFFSETS[idx],
    y: TOP_OFFSET + idx * ROW_HEIGHT,
  }));
  const pathHeight = TOP_OFFSET + (NODE_TEMPLATE.length - 1) * ROW_HEIGHT + 96;

  // マスコットは中央に戻るノード（ラベルが右に出る行）の左側に置く
  const mascotRow = sectionIdx % 2 === 0 ? 4 : 8;
  const mascotX = 48;
  const mascotY = coords[mascotRow].y;

  return (
    <section aria-labelledby={`${section.id}-title`}>
      {/* ユニットバナー（スクロール中は上部に固定） */}
      <div className="sticky top-[58px] xl:top-0 z-10 bg-white pt-3 xl:pt-6 pb-2 -mx-1 px-1">
        <div
          className={`rounded-2xl ${theme.bg} text-white px-5 py-4 flex items-center justify-between gap-3`}
          style={{ boxShadow: `0 4px 0 ${theme.chunk}` }}
        >
          <div className="min-w-0">
            <div className="text-[11px] font-extrabold tracking-wider text-white/80">
              ユニット {section.unit} · {section.code}
            </div>
            <h2
              id={`${section.id}-title`}
              className="text-xl font-black leading-tight truncate"
            >
              {section.title}
            </h2>
            <div className="mt-1 flex items-center gap-2 text-xs font-extrabold text-white/90">
              {isComplete ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5">
                  <Trophy className="w-3.5 h-3.5" />
                  修了
                </span>
              ) : (
                <span className="tabular-nums whitespace-nowrap">
                  {doneCount} / {TOTAL_STEPS} ステップ
                </span>
              )}
              <span className="truncate text-white/75">{section.subtitle}</span>
            </div>
          </div>
          <button
            onClick={onOpenVocab}
            className="btn-3d shrink-0 px-3 py-2.5 text-xs text-white border-2 border-white/40 bg-white/10"
            style={{ ["--chunk" as string]: theme.chunk }}
          >
            <BookOpen className="w-4 h-4" />
            語彙一覧
          </button>
        </div>
      </div>

      {/* パス本体 */}
      <div className="flex justify-center pt-4">
        <div
          className="relative"
          style={{ width: PATH_WIDTH, height: pathHeight }}
        >
          <div
            className="absolute pointer-events-none"
            style={{ left: mascotX - 44, top: mascotY - 40 }}
          >
            <Sprout
              size={88}
              mood={isComplete ? "cheer" : doneCount === 0 ? "sleepy" : "happy"}
            />
          </div>

          {NODE_TEMPLATE.map((node, idx) => {
            const status = nodeStatus(node.step, completed);
            const { x, y } = coords[idx];
            const isBoss = node.kind === "boss";
            const size = isBoss ? 84 : 70;
            const Icon = NODE_ICONS[node.icon];
            const isOpen = openStep === node.step;

            const popLeft = Math.min(Math.max(x - 150, -16), PATH_WIDTH - 284);

            return (
              <div key={node.step}>
                <div
                  className={`absolute flex flex-col items-center ${isOpen ? "z-30" : "z-0"}`}
                  style={{
                    left: x,
                    top: y,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {status === "current" && !isOpen && (
                    <div
                      className={`absolute left-1/2 -top-[50px] z-10 animate-bobble whitespace-nowrap rounded-xl border-2 border-line bg-white px-3 py-1.5 text-sm font-black ${theme.textDark}`}
                    >
                      {isSelected ? "はじめる" : "つづき"}
                      <span className="absolute left-1/2 -bottom-[7px] -translate-x-1/2 w-3 h-3 rotate-45 bg-white border-r-2 border-b-2 border-line" />
                    </div>
                  )}

                  <div
                    className="relative"
                    style={{ width: size, height: size }}
                  >
                    {status === "current" && (
                      <span
                        aria-hidden
                        className={`absolute border-[5px] ${theme.border} opacity-40 animate-ring-pulse`}
                        style={currentRingStyle(size, isBoss)}
                      />
                    )}
                    <button
                      ref={status === "current" ? currentNodeRef : undefined}
                      onClick={() => onToggleNode(node.step)}
                      aria-label={`${node.label}（${status === "done" ? "完了" : status === "current" ? "次のステップ" : "ロック中"}）`}
                      aria-expanded={isOpen}
                      className={`node-3d relative flex items-center justify-center w-full h-full ${
                        isBoss ? "rounded-[26px]" : "rounded-full"
                      } ${status === "locked" ? "bg-line text-ink-faint" : `${theme.bg} text-white`}`}
                      style={{
                        ["--chunk" as string]:
                          status === "locked"
                            ? "var(--line-dark)"
                            : theme.chunk,
                      }}
                    >
                      {/* 上面のハイライト */}
                      <span
                        className={`absolute top-[14%] left-1/2 -translate-x-1/2 w-[46%] h-[12%] rounded-full ${
                          status === "locked" ? "bg-white/50" : "bg-white/25"
                        }`}
                      />
                      {status === "done" && !isBoss ? (
                        <Check className="w-8 h-8" strokeWidth={3.5} />
                      ) : status === "locked" && !isBoss ? (
                        <Lock className="w-7 h-7" strokeWidth={2.6} />
                      ) : (
                        <Icon
                          className={isBoss ? "w-10 h-10" : "w-8 h-8"}
                          strokeWidth={2.6}
                        />
                      )}
                      {status === "done" && isBoss && (
                        <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-sun border-2 border-white flex items-center justify-center">
                          <Check className="w-4 h-4" strokeWidth={3.5} />
                        </span>
                      )}
                    </button>
                  </div>

                  {/* ラベルは蛇行の内側（中央寄り）に出す */}
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 flex flex-col whitespace-nowrap ${
                      SNAKE_OFFSETS[idx] > 0
                        ? "right-full mr-3 items-end text-right"
                        : "left-full ml-3 items-start"
                    } ${isOpen ? "opacity-0" : ""}`}
                  >
                    <span
                      className={`text-[13px] font-black leading-tight ${status === "locked" ? "text-ink-faint" : "text-ink"}`}
                    >
                      {node.label}
                    </span>
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-extrabold text-ink-faint">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${STRAND_THEME[node.strand].dot}`}
                      />
                      {STRAND_META[node.strand].label} · {node.minutes}分
                    </span>
                  </div>
                </div>

                {isOpen && (
                  <div
                    className="absolute z-30"
                    style={{ left: popLeft, top: y + size / 2 + 18 }}
                  >
                    <NodePopover
                      node={node}
                      status={status}
                      color={section.color}
                      arrowX={x - popLeft}
                      onStart={() => onStart(node)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {nextSection && (
        <div className="flex items-center gap-3 py-2 text-xs font-extrabold text-ink-faint">
          <span className="h-0.5 flex-1 rounded-full bg-line" />
          次のユニット：{nextSection.title}
          <span className="h-0.5 flex-1 rounded-full bg-line" />
        </div>
      )}
    </section>
  );
}
