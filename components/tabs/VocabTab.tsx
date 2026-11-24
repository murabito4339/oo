'use client';

import { useCallback, useEffect, useState } from 'react';
import { createEmptyCard } from 'ts-fsrs';
import { AlertCircle, CheckCircle2, Plus, RotateCcw, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
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
      <section className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">語彙を一括登録</h2>
          </div>
          <span className="text-[11px] font-medium text-slate-400">
            スラッシュ / カンマ / タブ区切り対応
          </span>
        </div>

        <form onSubmit={handleImport} className="space-y-3">
          <input
            type="text"
            value={sectionInput}
            onChange={(e) => setSectionInput(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 transition"
            placeholder="セクション名（例：鉄壁 Sec.2）"
          />
          <textarea
            rows={4}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={`character / 性格、特徴 / 名詞\nfeature / 特徴、特集する / 名・他`}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500 transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {loading ? '登録処理中...' : 'データベースへ登録＆FSRSカード生成'}
          </button>
        </form>

        {message && (
          <div
            className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 border ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/70'
                : 'bg-rose-50 text-rose-800 border-rose-200/70'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}
      </section>

      <section className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 tabular-nums">
            登録済みの語彙 ({items.length})
          </h2>
          <button
            onClick={fetchItems}
            className="text-xs font-medium text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            更新
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">
            登録されている単語がまだありません
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-900">{item.word}</span>
                    {item.pos && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {item.pos}
                      </span>
                    )}
                    {item.section && (
                      <span className="text-[11px] font-medium text-indigo-600">
                        {item.section}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{item.meaning}</p>
                </div>
                <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60 tabular-nums">
                  {item.mastery_stage}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}