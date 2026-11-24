import type { NodeItem, SectionData } from '@/types/lexis';

export const SECTIONS: SectionData[] = [
  { id: 'sec1', code: 'SEC 01', title: 'いのち・生きること', subtitle: '基礎動詞と生命の語彙群' },
  { id: 'sec2', code: 'SEC 02', title: '特徴・明確さ・点', subtitle: '抽象名詞・他動詞の核心' },
  { id: 'sec3', code: 'SEC 03', title: '動き・変化・進行', subtitle: '因果と変化を表す動詞' },
  { id: 'sec4', code: 'SEC 04', title: '思考・判断・認識', subtitle: '論述・自由英作文の軸' },
];

export const NODE_TEMPLATE: NodeItem[] = [
  { step: 1, label: '語彙セット', sub: '50語インポート', icon: 'book', desc: 'このセクションのコア語彙と語法を一括で確認・登録します。' },
  { step: 2, label: '受容インプット', sub: '英 → 日 反射', icon: 'layers', desc: '意味のコアを0.8秒以内で認識する高速フラッシュカード。' },
  { step: 3, label: '聴解トレーニング', sub: '音声判別', icon: 'headphones', desc: 'スペルを隠した状態で音声のみから意味と品詞を判別します。' },
  { step: 4, label: '瞬間英作文', sub: '日 → 英 口頭', icon: 'mic', desc: '日本語のトリガーを見て、2秒以内に声に出して構文を出力します。' },
  { step: 5, label: '構成英作文 I', sub: 'マルチ語彙使用', icon: 'pen', desc: '複数のターゲット語彙を1つの自然な英文へ統合します。' },
  { step: 6, label: '構成英作文 II', sub: '弱点語法ブレンド', icon: 'pen', desc: '過去のErrorLog（他動詞・冠詞等）を織り交ぜた和文英訳。' },
  { step: 7, label: '流暢性・音読', sub: '4/3/2メソッド', icon: 'zap', desc: '添削済みのモデル英文を時間短縮しながら連続発話します。' },
  { step: 8, label: '総合自由英作文', sub: 'ヒントなし実践', icon: 'crown', desc: '難関大形式のテーマに対し、既習語彙を能動的に組み込んで記述します。' },
];

export const PATH_WIDTH = 320;
export const PATH_CENTER_X = PATH_WIDTH / 2;
export const ROW_HEIGHT = 100;
export const TOP_OFFSET = 48;
export const SNAKE_OFFSETS = [0, 46, 62, 32, -22, -58, -38, 0];