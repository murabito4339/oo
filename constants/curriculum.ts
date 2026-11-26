import type { NodeItem, SectionData, Strand } from '@/types/lexis';

export const SECTIONS: SectionData[] = [
  { id: 'sec1', code: 'SEC 01', unit: 1, title: 'いのち・生きること', subtitle: '基礎動詞と生命の語彙群', color: 'leaf' },
  { id: 'sec2', code: 'SEC 02', unit: 2, title: '特徴・明確さ・点', subtitle: '抽象名詞・他動詞の核心', color: 'sky' },
  { id: 'sec3', code: 'SEC 03', unit: 3, title: '動き・変化・進行', subtitle: '因果と変化を表す動詞', color: 'grape' },
  { id: 'sec4', code: 'SEC 04', unit: 4, title: '思考・判断・認識', subtitle: '論述・自由英作文の軸', color: 'sun' },
];

/**
 * 1セクション（50語）の学習パス。
 *
 * 旧パスは「語彙 → 受容 → 聴解 → 瞬間英作文 → 構成I → 構成II → 音読 → 自由英作文」と
 * 技能ごとに一直線に並んでいた（ブロック型）。新パスの方針：
 *  1. 50語を A/B の2ブロックに分け、導入 → 想起 をブロックごとに回す。
 *     A を学んでから B を挟むことで、A の再想起までに自然な間隔が空く。
 *  2. 音声は最初の出会いから綴りと一緒に提示する（独立した「聴解」ステップは廃止）。
 *  3. 各ブロックは 認識（英→日）→ 想起（日→英）の順。
 *  4. 旧パスで 0 だった「意味重視インプット」として、50語を含む短いストーリーを入れる。
 *  5. 途中にミックス復習（A+B 混合・弱点優先）を置き、間隔反復をパスに組み込む。
 *  6. 流暢性（4/3/2）は、内容と語が十分に馴染んだ終盤に置く。
 *  7. 最後にヒントなしの自由英作文をユニット修了ノード（ボス）として置く。
 * 根拠の詳細はプロジェクト資料「学習パス配分の研究」を参照。
 */
export const NODE_TEMPLATE: NodeItem[] = [
  {
    step: 1,
    kind: 'lesson',
    strand: 'focus',
    icon: 'sparkles',
    label: '出会う A',
    sub: '語1–25・音声つき',
    minutes: 5,
    desc: '新出語25語に、音声・綴り・例文のセットで出会います。4択で意味を確かめながら、最初から音と形を結びつけます。',
    activities: ['音声＋綴り＋例文で提示', '4択で意味を認識'],
  },
  {
    step: 2,
    kind: 'lesson',
    strand: 'focus',
    icon: 'layers',
    label: '思い出す A',
    sub: '英→日 → 日→英',
    minutes: 5,
    desc: 'まず英→日の認識で手がかりを作り、次に日→英で自力で取り出します。一度正解した語も、すぐには外さずもう一度想起します。',
    activities: ['英→日 認識（0.8秒目標）', '日→英 タイピング想起'],
  },
  {
    step: 3,
    kind: 'lesson',
    strand: 'focus',
    icon: 'sparkles',
    label: '出会う B',
    sub: '語26–50・音声つき',
    minutes: 5,
    desc: '残りの25語に出会います。A の直後ではなく間に B を挟むことで、A を思い出すまでに間隔が空きます。',
    activities: ['音声＋綴り＋例文で提示', '4択で意味を認識'],
  },
  {
    step: 4,
    kind: 'lesson',
    strand: 'focus',
    icon: 'layers',
    label: '思い出す B',
    sub: '英→日 → 日→英',
    minutes: 5,
    desc: 'B の25語を、認識 → 想起の順で取り出します。',
    activities: ['英→日 認識（0.8秒目標）', '日→英 タイピング想起'],
  },
  {
    step: 5,
    kind: 'story',
    strand: 'input',
    icon: 'book',
    label: 'ストーリー',
    sub: '聴く → 読む',
    minutes: 10,
    desc: '50語を織り込んだ短い会話文を、まず音声だけで聴き、次にスクリプトで読みます。内容理解の質問に答えながら、語を文脈の中で再び目にします。',
    activities: ['音声だけで聴く', 'スクリプトを読む', '内容理解クイズ'],
  },
  {
    step: 6,
    kind: 'practice',
    strand: 'focus',
    icon: 'dumbbell',
    label: 'ミックス復習',
    sub: 'A+B 混合・弱点優先',
    minutes: 6,
    desc: 'A と B を混ぜ、聴き取り（ディクテーション）と日→英想起を交互に出題します。間違えた語や答えるのが遅かった語ほど多く出ます。',
    activities: ['音声 → 綴り（ディクテーション）', '日→英 想起', '間違えた語の再出題'],
  },
  {
    step: 7,
    kind: 'lesson',
    strand: 'output',
    icon: 'mic',
    label: '瞬間英作文',
    sub: '日→英 口頭',
    minutes: 6,
    desc: '日本語のトリガーを見て、2秒以内に声に出して英文を作ります。',
    activities: ['日本語トリガー → 口頭で英文', 'モデル音声と比較'],
  },
  {
    step: 8,
    kind: 'lesson',
    strand: 'output',
    icon: 'pen',
    label: '構成英作文',
    sub: 'マルチ語彙＋弱点語法',
    minutes: 10,
    desc: '複数のターゲット語を1文に統合し、過去の ErrorLog（他動詞・冠詞など）も混ぜた和文英訳に挑みます。最小修正フィードバックつき。',
    activities: ['マルチ語彙の和文英訳', '弱点語法ブレンド', '最小修正フィードバック'],
  },
  {
    step: 9,
    kind: 'lesson',
    strand: 'fluency',
    icon: 'zap',
    label: '4/3/2 流暢性',
    sub: 'ストーリーを語り直す',
    minutes: 10,
    desc: 'ストーリーを1.25倍速で聴き直し、その内容を4分 → 3分 → 2分と時間を縮めて語り直します。新しい語は足さず、既に知っている語を速く使うことだけに集中します。',
    activities: ['1.25倍速で聴き直す', '4分 → 3分 → 2分で語り直す'],
  },
  {
    step: 10,
    kind: 'boss',
    strand: 'output',
    icon: 'trophy',
    label: '総合自由英作文',
    sub: 'ヒントなし・修了テスト',
    minutes: 12,
    desc: '難関大形式のテーマに対し、ヒントなしで既習語を組み込んで書きます。これを終えるとセクション修了です。',
    activities: ['テーマ自由英作文（60–80語）', '語彙使用チェック', '添削'],
  },
];

export const TOTAL_STEPS = NODE_TEMPLATE.length;

// ---- 進捗 ----
// 進捗は「完了したステップ番号の一覧」で持つ。旧パスから移ってきた人は、
// 新設ノード（ストーリー・ミックス復習）だけが未完了の「穴」になることがあるため、
// 「何ステップ目まで進んだか」の数だけでは表せない。

/** 完了ステップを正規化（範囲外を除き、重複なし・昇順） */
export function normalizeCompleted(steps: readonly number[]): number[] {
  return [...new Set(steps)].filter((s) => Number.isInteger(s) && s >= 1 && s <= TOTAL_STEPS).sort((a, b) => a - b);
}

/** 次に取り組むノード（未完了のうち最初のもの）。全部終わっていれば null */
export function nextNodeOf(completed: readonly number[]): NodeItem | null {
  const done = new Set(completed);
  return NODE_TEMPLATE.find((n) => !done.has(n.step)) ?? null;
}

export type NodeStatus = 'done' | 'current' | 'locked';

export function nodeStatus(step: number, completed: readonly number[]): NodeStatus {
  if (completed.includes(step)) return 'done';
  return nextNodeOf(completed)?.step === step ? 'current' : 'locked';
}

/**
 * 旧パス（8ステップ）の各ステップを終えていたら、新パスのどのステップを完了扱いにするか。
 *
 * 旧: 1 語彙セット / 2 受容インプット / 3 聴解 / 4 瞬間英作文 / 5 構成英作文 I /
 *     6 構成英作文 II / 7 4/3/2音読 / 8 総合自由英作文
 *
 * 方針：中身が実質的に済んでいるノードだけを完了にし、新設したノードは完了にしない。
 *  - 語彙セットで50語すべてに出会っている → 出会う A・B
 *  - 受容インプット（英→日の想起ドリル）→ 思い出す A・B
 *  - 聴解は単語の音声練習で、ストーリー（文脈の中で聴く・読む）とは別物 → 対応なし
 *  - 構成英作文は I と II の両方を終えたときだけ、統合後の構成英作文を完了
 *  - ストーリーとミックス復習は新設なので、旧パスを修了した人にも残る
 */
const LEGACY_STEP_MAP: Record<number, number[]> = {
  1: [1, 3],
  2: [2, 4],
  3: [],
  4: [7],
  5: [],
  6: [8],
  7: [9],
  8: [10],
};

export const LEGACY_TOTAL_STEPS = 8;

/** 旧パスで「何ステップ目まで終えたか」から、新パスの完了ステップを求める */
export function migrateLegacyDoneCount(legacyDone: number): number[] {
  const upTo = Math.max(0, Math.min(LEGACY_TOTAL_STEPS, Math.floor(legacyDone)));
  const steps: number[] = [];
  for (let s = 1; s <= upTo; s++) steps.push(...LEGACY_STEP_MAP[s]);
  return normalizeCompleted(steps);
}

export const STRAND_META: Record<
  Strand,
  { label: string; short: string; desc: string }
> = {
  focus: { label: '語に集中', short: '集中', desc: '導入・想起・復習（言語焦点学習）' },
  input: { label: '聴く・読む', short: 'インプット', desc: '内容理解のための多聴・多読' },
  output: { label: '話す・書く', short: 'アウトプット', desc: '伝えるための発話・作文' },
  fluency: { label: '速く使う', short: '流暢性', desc: '既知の語を時間制限つきで使う' },
};

export const STRAND_ORDER: Strand[] = ['focus', 'input', 'output', 'fluency'];

/** ストランドごとの合計時間（分） */
export function strandMinutes(nodes: NodeItem[] = NODE_TEMPLATE): Record<Strand, number> {
  return nodes.reduce(
    (acc, n) => {
      acc[n.strand] += n.minutes;
      return acc;
    },
    { focus: 0, input: 0, output: 0, fluency: 0 } as Record<Strand, number>,
  );
}

// ---- パス描画レイアウト ----
export const PATH_WIDTH = 320;
export const PATH_CENTER_X = PATH_WIDTH / 2;
export const ROW_HEIGHT = 118;
export const TOP_OFFSET = 70;
/** 蛇行の横オフセット（正弦波）。ボスは中央に戻す。 */
export const SNAKE_OFFSETS = NODE_TEMPLATE.map((n, i) =>
  n.kind === 'boss' ? 0 : Math.round(Math.sin((i * Math.PI) / 4) * 64),
);
