'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createEmptyCard } from 'ts-fsrs';
import { AlertCircle, CheckCircle2, Plus, RotateCcw, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { THEME } from '@/lib/theme';
import { Sprout } from '@/components/ui/Sprout';
import { SECTIONS } from '@/constants/curriculum';
import type { LexicalItem, ThemeColor } from '@/types/lexis';

type Props = {
  /** 最初に開くセクション（パスの「語彙一覧」から来たときはそのセクション） */
  initialSectionId: string;
};

/** セクションに当てはまらない語をまとめるタブ */
const OTHER_TAB = 'other';
/** 1セクションの語数（出会う A = 1–25、出会う B = 26–50） */
const BLOCK_SIZE = 25;

type TabDef = { id: string; label: string; title: string; color: ThemeColor | null };

const SECTION_TABS: TabDef[] = SECTIONS.map((s) => ({ id: s.id, label: s.code, title: s.title, color: s.color }));

/**
 * 登録時の自由入力のセクション名（「鉄壁 Sec.2」「SEC 02」「section2」など）から、
 * カリキュラムのセクション id を推定する。当てはまらなければ「その他」。
 */
function sectionIdOf(label: string | null): string {
  if (!label) return OTHER_TAB;
  const m = /sec(?:tion)?\.?\s*0*(\d+)/i.exec(label);
  if (!m) return OTHER_TAB;
  const unit = Number(m[1]);
  return SECTIONS.find((s) => s.unit === unit)?.id ?? OTHER_TAB;
}

function defaultSectionLabel(sectionId: string) {
  const section = SECTIONS.find((s) => s.id === sectionId);
  return section ? `鉄壁 Sec.${section.unit}` : '';
}

async function fetchAllItems() {
  // セクションごとに 50 語ずつ並べるため、登録順（古い順）で全件取得する
  return supabase.from('lexical_items').select('*').order('created_at', { ascending: true }).limit(2000);
}

export function VocabTab({ initialSectionId }: Props) {
  const [items, setItems] = useState<LexicalItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState(
    SECTIONS.some((s) => s.id === initialSectionId) ? initialSectionId : SECTIONS[0].id,
  );
  const [bulkText, setBulkText] = useState('');
  const [sectionInput, setSectionInput] = useState(() => defaultSectionLabel(activeTab));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const fetchItems = useCallback(async () => {
    const { data, error } = await fetchAllItems();
    if (!error && data) setItems(data);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const { data, error } = await fetchAllItems();
      if (!isMounted) return;
      if (!error && data) setItems(data);
      setIsLoaded(true);
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, LexicalItem[]> = { [OTHER_TAB]: [] };
    for (const s of SECTIONS) map[s.id] = [];
    for (const item of items) map[sectionIdOf(item.section)].push(item);
    return map;
  }, [items]);

  // 「その他」は該当する語があるときだけ出す
  const tabs: TabDef[] =
    grouped[OTHER_TAB].length > 0 || activeTab === OTHER_TAB
      ? [...SECTION_TABS, { id: OTHER_TAB, label: 'その他', title: 'セクション未設定', color: null }]
      : SECTION_TABS;

  const activeDef = tabs.find((t) => t.id === activeTab) ?? tabs[0];
  const activeItems = grouped[activeDef.id] ?? [];
  const theme = activeDef.color ? THEME[activeDef.color] : null;

  const selectTab = (id: string, focus = false) => {
    setActiveTab(id);
    // 登録先も、開いているセクションに合わせる
    if (id !== OTHER_TAB) setSectionInput(defaultSectionLabel(id));
    setMessage(null);
    const el = tabRefs.current[id];
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (focus) el?.focus();
  };

  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    const idx = tabs.findIndex((t) => t.id === activeDef.id);
    let next = -1;
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    selectTab(tabs[next].id, true);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;
    setLoading(true);
    setMessage(null);

    try {
      const lines = bulkText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const newItems = lines.map((line) => {
        const parts = line.split(/[,/\t]+/).map((s) => s.trim());
        return {
          word: parts[0] || '',
          meaning: parts[1] || '（意味未入力）',
          pos: parts[2] || null,
          section: sectionInput || null,
          mastery_stage: 'R0',
        };
      });

      const { data: insertedItems, error: itemError } = await supabase
        .from('lexical_items')
        .insert(newItems)
        .select();

      if (itemError) throw itemError;

      if (insertedItems && insertedItems.length > 0) {
        const emptyCard = createEmptyCard(new Date());
        const cardsToInsert = insertedItems.flatMap((item) =>
          (['receptive', 'productive'] as const).map((direction) => ({
            item_id: item.id,
            direction,
            due: emptyCard.due.toISOString(),
            stability: emptyCard.stability,
            difficulty: emptyCard.difficulty,
            scheduled_days: emptyCard.scheduled_days,
            learning_steps: emptyCard.learning_steps,
            reps: emptyCard.reps,
            lapses: emptyCard.lapses,
            state: emptyCard.state,
          })),
        );
        const { error: cardError } = await supabase.from('cards').insert(cardsToInsert);
        if (cardError) throw cardError;
      }

      setBulkText('');
      // 登録したセクションのタブに移って、追加された語を見せる
      const target = sectionIdOf(sectionInput || null);
      setActiveTab(target);
      setMessage({
        type: 'success',
        text: `${insertedItems?.length ?? 0}語を登録し、受容・産出のFSRSカードを生成しました。`,
      });
      await fetchItems();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      setMessage({ type: 'error', text: `登録エラー: ${errorMessage}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-soft-pop">
      {/* セクションのタブ（スクロール中も上部に固定） */}
      <div className="sticky top-[58px] xl:top-0 z-10 bg-white pt-1 xl:pt-6 pb-2 -mx-4 px-4">
        <div
          role="tablist"
          aria-label="セクション"
          onKeyDown={handleTabKeyDown}
          className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
        >
          {tabs.map((tab) => {
            const selected = tab.id === activeDef.id;
            const t = tab.color ? THEME[tab.color] : null;
            const count = grouped[tab.id]?.length ?? 0;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                role="tab"
                id={`vocab-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls="vocab-tabpanel"
                tabIndex={selected ? 0 : -1}
                onClick={() => selectTab(tab.id)}
                className={`btn-3d shrink-0 !gap-1.5 px-3.5 py-2 text-xs border-2 ${
                  selected
                    ? `${t ? `${t.bg} border-transparent` : 'bg-ink-soft border-transparent'} text-white`
                    : 'bg-white border-line text-ink-soft'
                }`}
                style={{ ['--chunk' as string]: selected ? (t ? t.chunk : 'var(--ink)') : 'var(--line)' }}
              >
                <span className="font-black">{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 text-[10px] font-black tabular-nums ${
                    selected ? 'bg-white/25' : 'bg-cloud text-ink-faint'
                  }`}
                >
                  {isLoaded ? count : '–'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div id="vocab-tabpanel" role="tabpanel" aria-labelledby={`vocab-tab-${activeDef.id}`} className="space-y-5">
        <section className="card-3d p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className={`text-[11px] font-extrabold tracking-wider ${theme ? theme.textDark : 'text-ink-faint'}`}>
                {activeDef.label}
              </div>
              <h2 className="text-lg font-black text-ink leading-tight truncate">{activeDef.title}</h2>
              <p className="text-[11px] font-extrabold text-ink-faint tabular-nums">
                {activeItems.length}語
                {activeDef.id !== OTHER_TAB && ` / ${BLOCK_SIZE * 2}語`}
              </p>
            </div>
            <button onClick={fetchItems} className="btn-3d btn-white shrink-0 px-3 py-1.5 text-xs">
              <RotateCcw className="w-4 h-4" />
              更新
            </button>
          </div>

          {!isLoaded ? (
            <p className="py-8 text-center text-sm font-extrabold text-ink-faint">読み込んでいます…</p>
          ) : activeItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <Sprout size={80} mood="sleepy" />
              <p className="text-sm font-extrabold text-ink-faint">このセクションの単語はまだありません</p>
              <p className="text-xs font-bold text-ink-faint">下のフォームから登録できます</p>
            </div>
          ) : (
            <WordList items={activeItems} showBlocks={activeDef.id !== OTHER_TAB} />
          )}
        </section>

        <section className="card-3d p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 shrink-0 rounded-2xl bg-sun text-white flex items-center justify-center"
              style={{ boxShadow: '0 3px 0 var(--sun-dark)' }}
            >
              <Plus className="w-6 h-6" strokeWidth={3} />
            </span>
            <div>
              <h2 className="text-lg font-black text-ink leading-tight">語彙を一括登録</h2>
              <p className="text-[11px] font-extrabold text-ink-faint">スラッシュ / カンマ / タブ区切りに対応</p>
            </div>
          </div>

          <form onSubmit={handleImport} className="space-y-3">
            <label className="block space-y-1">
              <span className="text-[11px] font-extrabold text-ink-soft">登録先のセクション</span>
              <input
                type="text"
                value={sectionInput}
                onChange={(e) => setSectionInput(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-line bg-cloud text-sm font-extrabold text-ink focus:outline-none focus:border-sky focus:bg-white transition"
                placeholder="セクション名（例：鉄壁 Sec.2）"
              />
            </label>
            <textarea
              rows={4}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`character / 性格、特徴 / 名詞\nfeature / 特徴、特集する / 名・他`}
              className="w-full px-4 py-3 rounded-2xl border-2 border-line bg-cloud text-sm font-mono text-ink focus:outline-none focus:border-sky focus:bg-white transition"
            />
            <button type="submit" disabled={loading} className="btn-3d btn-sky w-full py-3.5 text-sm">
              <Sparkles className="w-4 h-4" />
              {loading ? '登録しています…' : '登録して FSRS カードを作る'}
            </button>
          </form>

          {message && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 ${
                message.type === 'success' ? 'bg-leaf-light text-leaf-dark' : 'bg-berry-light text-berry-dark'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/** セクションの語を、学習パスの A（語1–25）/ B（語26–50）の区切りで並べる */
function WordList({ items, showBlocks }: { items: LexicalItem[]; showBlocks: boolean }) {
  const blocks = showBlocks
    ? [
        { key: 'A', label: 'A · 語1–25', sub: '出会う A／思い出す A', items: items.slice(0, BLOCK_SIZE), offset: 0 },
        { key: 'B', label: 'B · 語26–50', sub: '出会う B／思い出す B', items: items.slice(BLOCK_SIZE, BLOCK_SIZE * 2), offset: BLOCK_SIZE },
        { key: 'X', label: '語51〜', sub: '50語を超えた分', items: items.slice(BLOCK_SIZE * 2), offset: BLOCK_SIZE * 2 },
      ].filter((b) => b.items.length > 0)
    : [{ key: 'all', label: '', sub: '', items, offset: 0 }];

  return (
    <div className="space-y-4">
      {blocks.map((block) => (
        <div key={block.key} className="space-y-2">
          {block.label && (
            <div className="flex items-baseline justify-between px-0.5">
              <h3 className="text-xs font-black text-ink">{block.label}</h3>
              <span className="text-[10px] font-extrabold text-ink-faint">{block.sub}</span>
            </div>
          )}
          <ul className="space-y-2">
            {block.items.map((item, i) => (
              <li
                key={item.id}
                className="rounded-2xl border-2 border-line px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 shrink-0 text-right text-[11px] font-black text-ink-faint tabular-nums">
                    {block.offset + i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-base text-ink">{item.word}</span>
                      {item.pos && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-cloud text-ink-soft rounded-md">
                          {item.pos}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-ink-soft mt-0.5 truncate">{item.meaning}</p>
                  </div>
                </div>
                <span
                  className={`shrink-0 text-[11px] font-black px-2.5 py-1 rounded-full tabular-nums ${masteryClass(
                    item.mastery_stage,
                  )}`}
                >
                  {item.mastery_stage}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** 習熟段階の色：R0=未着手 / R*=受容段階 / P*=産出段階 */
function masteryClass(stage: string) {
  if (stage.startsWith('P')) return 'bg-leaf-light text-leaf-dark';
  if (stage.startsWith('R') && stage !== 'R0') return 'bg-sky-light text-sky-dark';
  return 'bg-cloud text-ink-soft';
}
