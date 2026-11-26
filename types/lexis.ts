export type TabType = 'home' | 'path' | 'cards' | 'writing' | 'vocab';

export type LexicalItem = {
  id: string;
  word: string;
  meaning: string;
  pos: string | null;
  section: string | null;
  mastery_stage: string;
  created_at: string;
};

/** セクション（＝ユニット）のテーマ色 */
export type ThemeColor = 'leaf' | 'sky' | 'grape' | 'sun';

export type SectionData = {
  id: string;
  code: string;
  unit: number;
  title: string;
  subtitle: string;
  color: ThemeColor;
};

/**
 * Nation の「4つのストランド」による分類。
 * focus  = 言語焦点学習（語そのものに注意を向ける：導入・想起・復習）
 * input  = 意味重視インプット（内容を理解するために聴く・読む）
 * output = 意味重視アウトプット（伝えるために話す・書く）
 * fluency = 流暢性（既知の語を速く使う）
 */
export type Strand = 'focus' | 'input' | 'output' | 'fluency';

/** パス上のノードの種類（見た目と扱いが変わる） */
export type NodeKind = 'lesson' | 'story' | 'practice' | 'boss';

export type NodeIconType =
  | 'sparkles'
  | 'layers'
  | 'book'
  | 'dumbbell'
  | 'headphones'
  | 'mic'
  | 'pen'
  | 'zap'
  | 'trophy';

export type NodeItem = {
  step: number;
  kind: NodeKind;
  strand: Strand;
  label: string;
  sub: string;
  icon: NodeIconType;
  /** 目安の所要時間（分） */
  minutes: number;
  desc: string;
  /** ノード内で行う活動（順番どおり） */
  activities: string[];
};
