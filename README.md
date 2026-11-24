# Lexis Lab (`teppeki-app`)

受容語彙（読める・聞ける）を産出語彙（書ける・話せる）へ引き上げるための、4技能循環型・英語語彙トレーニングアプリ（個人開発）。

## 主な機能（5タブ構成）

1. **ホーム（植物コンサバトリー & 学習ハブ）**
   - 学習完了・水やりに連動して360日サイクルで成長・季節変化（種 → 新芽 → 繁茂 → 蕾 → 180日目開花 → 紅葉・結実 → 落葉 → 再生）するSVG植物ビュー
   - 今日の復習ミッション・進行中セクションへの導線
2. **学習パス**
   - セクションごとの8ステップ構成（語彙セット → 受容インプット → 聴解 → 瞬間英作文 → 構成英作文 I/II → 4/3/2音読 → 総合自由英作文）
3. **カード学習**
   - 受容カード（英 → 日）／産出カード（日 → 英）の切り替え
   - FSRS（4段階評価）ベースの復習UI（※現在UIモック）
4. **英作文ラボ**
   - 1文マルチ語彙和文英訳／自由英作文
   - 段階ヒント（頭文字・語法）および最小修正フィードバックUI（※現在UIモック）
5. **単語帳 & 一括登録（Supabase連携済み）**
   - スラッシュ・カンマ・タブ区切りテキストから語彙を一括登録
   - `ts-fsrs` を用いて、登録と同時に「受容（`receptive`）」「産出（`productive`）」の2種類の初期カードを自動生成

---

## 技術スタック

- **Framework**: Next.js (App Router) / React / TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: `lucide-react`
- **Fonts**: `Plus Jakarta Sans`, `Noto Sans JP`, `JetBrains Mono` (`next/font/google`)
- **Backend / DB**: Supabase (`@supabase/supabase-js`)
- **SRS Algorithm**: `ts-fsrs`

---

## ディレクトリ構成

```text
teppeki-app/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                       # タブ切り替え・全体状態管理
├── features/
│   └── botanical/                     # 植物育成・SVG描画関連を一式集約
│       ├── BotanicalCard.tsx          # 植物カード全体（水やり・スライダー含む）
│       ├── RealisticBotanicalCanvas.tsx  # 植物SVG描画本体
│       ├── constants.ts               # 葉の座標データ・日数プリセット
│       ├── types.ts                   # 植物関連の型定義
│       ├── utils.ts                   # 成長計算・色補間・季節判定ロジック
│       └── index.ts
├── components/
│   ├── layout/                        # Header / BottomNav
│   ├── modals/                        # ノード詳細モーダル
│   └── tabs/                          # Home / Path / Cards / Writing / Vocab
├── constants/
│   └── curriculum.ts                  # カリキュラム・学習パス定義
├── lib/
│   └── supabase.ts                    # Supabaseクライアント設定
└── types/
    └── lexis.ts                       # アプリ本体の型定義
```

---

## ローカル開発セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

プロジェクトルートに `.env.local` を作成し、Supabase の接続情報を設定します（`lib/supabase.ts` が参照する変数名に合わせて記述）。

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **注意**: `.env.local` は `.gitignore` 対象のため、GitHubへプッシュしないこと。

### 3. 開発サーバー起動・確認コマンド

```bash
npm run dev    # 開発サーバー起動 (http://localhost:3000)
npm run lint   # ESLintチェック
npm run build  # 本番ビルド確認
```

---

## Supabase テーブルメモ

単語帳タブ（`VocabTab`）で使用しているテーブル：

- **`lexical_items`**: `id`, `word`, `meaning`, `pos`, `section`, `mastery_stage`, `created_at`
- **`cards`**: `item_id`, `direction` (`receptive` / `productive`), `due`, `stability`, `difficulty`, `scheduled_days`, `learning_steps`, `reps`, `lapses`, `state`

---

## 今後のTODO

- [ ] `CardsTab` を Supabase `cards` テーブル + `ts-fsrs` の実データ復習ロジックと接続
- [ ] 音声再生（Web Speech API または TTS API）の実装
- [ ] `WritingTab` の AI最小修正添削 API 連携 & ErrorLog 自動記録
- [ ] `plantDays` / `streak` / `sectionProgress` の DB 永続化
- [ ] `PathTab` 各ステップノードの専用トレーニング画面連携