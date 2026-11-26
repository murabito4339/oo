'use client';

import { useCallback, useEffect, useState } from 'react';
import { createEmptyCard } from 'ts-fsrs';
import { AlertCircle, CheckCircle2, Plus, RotateCcw, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Sprout } from '@/components/ui/Sprout';
import type { LexicalItem } from '@/types/lexis';

export function VocabTab() {
  const [items, setItems] = useState<LexicalItem[]>([]);
  const [bulkText, setBulkText] = useState('');
  const [sectionInput, setSectionInput] = useState('鉄壁 Sec.2');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchItems = useCallback(async () => {
    const { data, error } = await supabase
      .from('lexical_items')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setItems(data);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const { data, error } = await supabase
        .from('lexical_items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (isMounted && !error && data) {
        setItems(data);
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

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
        const cardsToInsert = insertedItems.flatMap((item) => [
          {
            item_id: item.id,
            direction: 'receptive',
            due: emptyCard.due.toISOString(),
            stability: emptyCard.stability,
            difficulty: emptyCard.difficulty,
            scheduled_days: emptyCard.scheduled_days,
            learning_steps: emptyCard.learning_steps,
            reps: emptyCard.reps,
            lapses: emptyCard.lapses,
            state: emptyCard.state,
          },
          {
            item_id: item.id,
            direction: 'productive',
            due: emptyCard.due.toISOString(),
            stability: emptyCard.stability,
            difficulty: emptyCard.difficulty,
            scheduled_days: emptyCard.scheduled_days,
            learning_steps: emptyCard.learning_steps,
            reps: emptyCard.reps,
            lapses: emptyCard.lapses,
            state: emptyCard.state,
          },
        ]);
        const { error: cardError } = await supabase.from('cards').insert(cardsToInsert);
        if (cardError) throw cardError;
      }

      setBulkText('');
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
          <input
            type="text"
            value={sectionInput}
            onChange={(e) => setSectionInput(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border-2 border-line bg-cloud text-sm font-extrabold text-ink focus:outline-none focus:border-sky focus:bg-white transition"
            placeholder="セクション名（例：鉄壁 Sec.2）"
          />
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

      <section className="card-3d p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-ink tabular-nums">登録済みの語彙（{items.length}）</h2>
          <button onClick={fetchItems} className="btn-3d btn-white px-3 py-1.5 text-xs">
            <RotateCcw className="w-4 h-4" />
            更新
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <Sprout size={80} mood="sleepy" />
            <p className="text-sm font-extrabold text-ink-faint">登録されている単語がまだありません</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border-2 border-line px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-base text-ink">{item.word}</span>
                    {item.pos && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-cloud text-ink-soft rounded-md">
                        {item.pos}
                      </span>
                    )}
                    {item.section && (
                      <span className="text-[11px] font-extrabold text-sky-dark">{item.section}</span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-ink-soft mt-0.5 truncate">{item.meaning}</p>
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
        )}
      </section>
    </div>
  );
}

/** 習熟段階の色：R0=未着手 / R*=受容段階 / P*=産出段階 */
function masteryClass(stage: string) {
  if (stage.startsWith('P')) return 'bg-leaf-light text-leaf-dark';
  if (stage.startsWith('R') && stage !== 'R0') return 'bg-sky-light text-sky-dark';
  return 'bg-cloud text-ink-soft';
}
