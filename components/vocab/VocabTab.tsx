'use client';

import { useState } from 'react';
import { PlusCircle, RotateCcw, Sparkles } from 'lucide-react';
import { createEmptyCard } from 'ts-fsrs';
import { supabase } from '@/lib/supabase';
import { LexicalItem } from '@/types';

type VocabTabProps = {
  items: LexicalItem[];
  onRefresh: () => Promise<void>;
};

export function VocabTab({ items, onRefresh }: VocabTabProps) {
  const [bulkText, setBulkText] = useState('');
  const [sectionInput, setSectionInput] = useState('鉄壁 Sec.2');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;
    setLoading(true);
    setMessage('');

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
      setMessage(`✅ ${insertedItems?.length ?? 0}語を登録し、受容・産出のFSRSカードを作成しました！`);
      await onRefresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      setMessage(`❌ エラー: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-pop-in">
      <section className="bg-white p-5 rounded-3xl shadow-sm border-2 border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-extrabold text-base">
            <PlusCircle className="w-5 h-5 text-indigo-600" />
            <h2>今日の単語を一括登録（DB連動）</h2>
          </div>
          <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-600">
            📷 写真OCRも追加予定
          </span>
        </div>

        <form onSubmit={handleImport} className="space-y-3">
          <input
            type="text"
            value={sectionInput}
            onChange={(e) => setSectionInput(e.target.value)}
            className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-bold"
            placeholder="セクション名（例：鉄壁 Sec.2）"
          />
          <textarea
            rows={4}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={`character / 性格、特徴 / 名詞\nfeature / 特徴、特集する / 名・他`}
            className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-mono"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 text-white font-extrabold rounded-2xl transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? '登録中...' : 'データベースに登録＆FSRSカード生成'}
          </button>
        </form>
        {message && (
          <div className="p-3 rounded-xl bg-slate-100 text-sm font-bold">{message}</div>
        )}
      </section>

      <section className="bg-white p-5 rounded-3xl shadow-sm border-2 border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-base">登録済みの単語 ({items.length})</h2>
          <button
            onClick={onRefresh}
            className="text-xs font-bold text-indigo-600 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 更新
          </button>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">まだ単語がありません</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base">{item.word}</span>
                    {item.pos && (
                      <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                        {item.pos}
                      </span>
                    )}
                    {item.section && (
                      <span className="text-xs font-bold text-indigo-600">{item.section}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{item.meaning}</p>
                </div>
                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
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