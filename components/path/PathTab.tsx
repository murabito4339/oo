'use client';

import { useEffect, useState } from 'react';
import {
  Check,
  Crown,
  Droplets,
  Headphones,
  Layers,
  Lock,
  Mic,
  PenTool,
  Zap,
} from 'lucide-react';
import { PathNode, SectionData } from '@/types';
import { PlantAvatar } from './PlantAvatar';

const SECTIONS: SectionData[] = [
  {
    id: 'sec1',
    code: 'SECTION #1',
    title: 'いのち・生きること',
    colorBg: 'bg-emerald-500',
    colorBorder: 'border-emerald-700',
  },
  {
    id: 'sec2',
    code: 'SECTION #2',
    title: '特徴・明確さ・点',
    colorBg: 'bg-indigo-500',
    colorBorder: 'border-indigo-700',
  },
  {
    id: 'sec3',
    code: 'SECTION #3',
    title: '動き・変化・進行',
    colorBg: 'bg-amber-500',
    colorBorder: 'border-amber-700',
  },
  {
    id: 'sec4',
    code: 'SECTION #4',
    title: '思考・判断・認識',
    colorBg: 'bg-rose-500',
    colorBorder: 'border-rose-700',
  },
];

const NODE_TEMPLATE: PathNode[] = [
  { step: 1, label: '単語セット (50語)', icon: 'book', desc: 'このセクションの単語を一括チェック＆登録' },
  { step: 2, label: '受容カード (R1-R2)', icon: 'layers', desc: '英→日のカードめくりで意味を高速インプット' },
  { step: 3, label: 'リスニング (R3)', icon: 'headphones', desc: '音声だけで意味を判別＆例文ディクテーション' },
  { step: 4, label: '瞬間英作文 (話す)', icon: 'mic', desc: '日本語を見て声に出して2秒以内に即答！' },
  { step: 5, label: '英作文 I (P4)', icon: 'pen', desc: '重要動詞を使った1文マルチ単語英作文' },
  { step: 6, label: '英作文 II (弱点混ぜ)', icon: 'pen', desc: '過去の文法ミスをブレンドした和文英訳' },
  { step: 7, label: '4/3/2・音読 (流暢性)', icon: 'zap', desc: '正解英文のシャドーイング＆時間短縮スピーキング' },
  { step: 8, label: 'ボス戦：自由英作文', icon: 'crown', desc: 'ヒントなしで既習語彙を使うP5チャレンジ！' },
];

// 初回SSR用のデフォルト配置
const DEFAULT_SNAKE_OFFSETS = [0, 44, 68, 36, -24, -64, -40, 0];

// SVG座標計算用の定数（ボタン位置とSVGの線を一致させるため固定値を使用）
const TOP_PADDING = 32; // pt-8 相当
const ROW_HEIGHT = 132;
const NODE_RADIUS = 32; // w-16 h-16 (64px) の半分
const SVG_WIDTH = 320;
const SVG_CENTER_X = SVG_WIDTH / 2;

// 全体としてくねくね蛇行するランダムオフセットを生成
function generateSnakeOffsets(count: number): number[] {
  const startPhase = Math.random() * Math.PI * 2;
  const freq = 0.85 + Math.random() * 0.45; // 左右にうねる周期
  const maxAmplitude = 68; // スマホ幅でもラベルがはみ出にくい最大幅

  return Array.from({ length: count }, (_, idx) => {
    // 最初と最後のノードは中央寄りにすると全体のバランスが良くなる
    const edgeDamping = idx === 0 || idx === count - 1 ? 0.55 : 1;
    const wave = Math.sin(startPhase + idx * freq);
    const jitter = (Math.random() - 0.5) * 26;
    const offset = (wave * (50 + Math.random() * 18) + jitter) * edgeDamping;
    return Math.round(Math.max(-maxAmplitude, Math.min(maxAmplitude, offset)));
  });
}

type PathTabProps = {
  streak: number;
  onChangeStreak: (days: number) => void;
  onOpenVocab: () => void;
  onCelebrate: (message: string) => void;
};

export function PathTab({
  streak,
  onChangeStreak,
  onOpenVocab,
  onCelebrate,
}: PathTabProps) {
  const [selectedSectionId, setSelectedSectionId] = useState('sec2');
  const [sectionProgress, setSectionProgress] = useState<Record<string, number>>({
    sec1: 8,
    sec2: 2,
    sec3: 1,
    sec4: 0,
  });
  const [activeNodeModal, setActiveNodeModal] = useState<PathNode | null>(null);

  // セクションごとのランダム配置をクライアントマウント時に生成
  const [sectionOffsets, setSectionOffsets] = useState<Record<string, number[]>>({});

  useEffect(() => {
    const generated: Record<string, number[]> = {};
    SECTIONS.forEach((sec) => {
      generated[sec.id] = generateSnakeOffsets(NODE_TEMPLATE.length);
    });
    setSectionOffsets(generated);
  }, []);

  const currentSection = SECTIONS.find((s) => s.id === selectedSectionId) || SECTIONS[0];
  const doneCount = sectionProgress[selectedSectionId] ?? 0;
  const currentOffsets = sectionOffsets[selectedSectionId] || DEFAULT_SNAKE_OFFSETS;

  const svgHeight = TOP_PADDING + (NODE_TEMPLATE.length - 1) * ROW_HEIGHT + NODE_RADIUS * 2 + 16;

  const handleCompleteNodeDemo = () => {
    if (!activeNodeModal) return;
    const currentDone = sectionProgress[selectedSectionId] ?? 0;
    if (activeNodeModal.step > currentDone) {
      setSectionProgress((prev) => ({
        ...prev,
        [selectedSectionId]: activeNodeModal.step,
      }));
    }
    const label = activeNodeModal.label;
    setActiveNodeModal(null);
    onCelebrate(`💧「${label}」クリア！植物に水をあげました！`);
  };

  return (
    <>
      <div className="space-y-5 animate-pop-in">
        <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <PlantAvatar streak={streak} />
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 px-1.5">成長テスト:</span>
            {[0, 1, 5, 10, 14].map((d) => (
              <button
                key={d}
                onClick={() => onChangeStreak(d)}
                className={`text-xs font-bold px-2 py-1 rounded-lg transition ${
                  streak === d
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                {d}日
              </button>
            ))}
          </div>
        </div>

        {/* Section 切り替えトグル */}
        <div>
          <div className="text-xs font-bold text-slate-500 mb-2 flex items-center justify-between">
            <span>セクションを切り替えてパスを表示</span>
            <span className="text-indigo-600">全50セクション対応</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {SECTIONS.map((sec) => {
              const isSelected = sec.id === selectedSectionId;
              const prog = sectionProgress[sec.id] ?? 0;
              return (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSectionId(sec.id)}
                  className={`shrink-0 px-3.5 py-2 rounded-2xl border-2 text-left transition-all active:translate-y-0.5 ${
                    isSelected
                      ? `${sec.colorBg} text-white border-transparent shadow-md`
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-[10px] font-bold opacity-85">{sec.code}</div>
                  <div className="text-xs font-extrabold flex items-center gap-1.5">
                    {sec.title}
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {prog}/8
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 選択中Sectionの帯 ＋ 8ノードパス */}
        <div key={selectedSectionId} className="animate-pop-in space-y-6">
          <div
            className={`${currentSection.colorBg} text-white p-4 rounded-2xl border-b-4 ${currentSection.colorBorder} flex items-center justify-between shadow-sm`}
          >
            <div>
              <div className="text-xs font-bold uppercase tracking-wider opacity-90">
                {currentSection.code}
              </div>
              <h2 className="text-lg font-black">{currentSection.title}</h2>
            </div>
            <button
              onClick={onOpenVocab}
              className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-xs font-bold border border-white/30 transition"
            >
              単語一覧を見る
            </button>
          </div>

          <div
            style={{ paddingTop: TOP_PADDING }}
            className="relative pb-4 flex flex-col items-center overflow-x-clip"
          >
            {/* ノード間をつなぐくねくねの棒（背景SVG） */}
            <svg
              width={SVG_WIDTH}
              height={svgHeight}
              viewBox={`0 0 ${SVG_WIDTH} ${svgHeight}`}
              className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 overflow-visible"
            >
              {NODE_TEMPLATE.slice(0, -1).map((node, idx) => {
                const offset1 = currentOffsets[idx] ?? 0;
                const offset2 = currentOffsets[idx + 1] ?? 0;

                const x1 = SVG_CENTER_X + offset1;
                const y1 = TOP_PADDING + idx * ROW_HEIGHT + NODE_RADIUS;
                const x2 = SVG_CENTER_X + offset2;
                const y2 = TOP_PADDING + (idx + 1) * ROW_HEIGHT + NODE_RADIUS;

                // 滑らかなS字ベジェ曲線
                const midY = (y1 + y2) / 2;
                const pathD = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

                // このノードがクリア済みなら、下のノードへ色の棒を伸ばす
                const isPathLit = node.step <= doneCount;

                return (
                  <g key={`connector-${node.step}`}>
                    {/* ベースの道（未クリア・グレー） */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth={12}
                      strokeLinecap="round"
                    />
                    {/* クリア後に下へ伸びる色の棒 */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth={12}
                      strokeLinecap="round"
                      pathLength={1}
                      strokeDasharray="1 2"
                      strokeDashoffset={isPathLit ? 0 : 1.05}
                      style={{
                        transition: 'stroke-dashoffset 600ms cubic-bezier(0.22, 1, 0.36, 1)',
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* 各ステップのノード */}
            {NODE_TEMPLATE.map((node, idx) => {
              const isDone = node.step <= doneCount;
              const isCurrent = node.step === doneCount + 1;
              const isLocked = node.step > doneCount + 1;
              const offset = currentOffsets[idx] ?? 0;

              let btnStyle =
                'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed';
              if (isDone) {
                btnStyle =
                  'bg-emerald-500 border-emerald-700 text-white hover:bg-emerald-400';
              } else if (isCurrent) {
                btnStyle = `${currentSection.colorBg} ${currentSection.colorBorder} text-white ring-4 ring-indigo-200`;
              }

              return (
                <div
                  key={node.step}
                  style={{
                    height: ROW_HEIGHT,
                    transform: `translateX(${offset}px)`,
                  }}
                  className="relative z-10 flex flex-col items-center transition-transform duration-500"
                >
                  {isCurrent && (
                    <div className="absolute -top-9 z-20 bg-white text-indigo-600 font-black text-xs px-3 py-1 rounded-xl border-2 border-indigo-200 shadow-md animate-float whitespace-nowrap">
                      START!
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-r-2 border-b-2 border-indigo-200 rotate-45" />
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (!isLocked) setActiveNodeModal(node);
                    }}
                    className={`w-16 h-16 shrink-0 rounded-full border-b-[6px] flex items-center justify-center transition-all active:border-b-0 active:translate-y-[6px] shadow-md ${btnStyle}`}
                  >
                    {isDone ? (
                      <Check className="w-7 h-7 stroke-[3]" />
                    ) : isLocked ? (
                      <Lock className="w-6 h-6" />
                    ) : node.icon === 'crown' ? (
                      <Crown className="w-7 h-7" />
                    ) : node.icon === 'headphones' ? (
                      <Headphones className="w-7 h-7" />
                    ) : node.icon === 'mic' ? (
                      <Mic className="w-7 h-7" />
                    ) : node.icon === 'pen' ? (
                      <PenTool className="w-6 h-6" />
                    ) : node.icon === 'zap' ? (
                      <Zap className="w-7 h-7" />
                    ) : (
                      <Layers className="w-6 h-6" />
                    )}
                  </button>

                  <span
                    className={`mt-1.5 max-w-[160px] text-center leading-tight text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/85 backdrop-blur-[1px] ${
                      isCurrent
                        ? 'bg-indigo-100 text-indigo-800'
                        : isDone
                        ? 'text-emerald-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {node.step}. {node.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {activeNodeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 animate-pop-in shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
                {currentSection.code} / STEP {activeNodeModal.step}
              </span>
              <button
                onClick={() => setActiveNodeModal(null)}
                className="text-sm font-bold text-slate-400 hover:text-slate-600"
              >
                閉じる
              </button>
            </div>
            <h3 className="text-xl font-black text-slate-900">{activeNodeModal.label}</h3>
            <p className="text-sm text-slate-600">{activeNodeModal.desc}</p>
            <div className="pt-2 flex gap-2">
              <button
                onClick={handleCompleteNodeDemo}
                className="flex-1 py-3 bg-emerald-500 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 text-white font-extrabold rounded-2xl transition flex items-center justify-center gap-2"
              >
                <Droplets className="w-5 h-5" />
                クリアして水やり！(デモ)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}