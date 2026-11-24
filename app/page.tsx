'use client';

import { useEffect, useState } from 'react';
import {
  BookOpen,
  Crown,
  Droplets,
  Flame,
  Layers,
  Map,
  PenTool,
  Sprout,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LexicalItem, TabType } from '@/types';
import { PathTab } from '@/components/path/PathTab';
import { CardsTab } from '@/components/cards/CardsTab';
import { WritingTab } from '@/components/writing/WritingTab';
import { VocabTab } from '@/components/vocab/VocabTab';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('path');
  const [streak, setStreak] = useState(5);
  const [waterCelebration, setWaterCelebration] = useState<string | null>(null);
  const [items, setItems] = useState<LexicalItem[]>([]);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('lexical_items')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setItems(data);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const triggerCelebration = (msg: string) => {
    setWaterCelebration(msg);
    setTimeout(() => setWaterCelebration(null), 2800);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {waterCelebration && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-2 animate-pop-in">
          <Droplets className="w-5 h-5 text-sky-200 animate-bounce" />
          {waterCelebration}
        </div>
      )}

      {/* 上部ステータスバー */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-sm">
              鉄
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400">能動語彙化</div>
              <div className="text-sm font-extrabold text-slate-800 flex items-center gap-1">
                <Crown className="w-4 h-4 text-amber-500" />
                142 / 2,100語
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 font-extrabold text-sm">
              <Flame className="w-4 h-4 fill-orange-500" />
              <span>{streak}日</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-sm">
              <Sprout className="w-4 h-4" />
              <span>DB:{items.length}語</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4">
        {activeTab === 'path' && (
          <PathTab
            streak={streak}
            onChangeStreak={setStreak}
            onOpenVocab={() => setActiveTab('vocab')}
            onCelebrate={triggerCelebration}
          />
        )}
        {activeTab === 'cards' && <CardsTab />}
        {activeTab === 'writing' && <WritingTab />}
        {activeTab === 'vocab' && <VocabTab items={items} onRefresh={fetchItems} />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t-2 border-slate-200">
        <div className="max-w-2xl mx-auto grid grid-cols-4 h-16">
          {[
            { id: 'path', label: 'パス', icon: Map },
            { id: 'cards', label: 'カード', icon: Layers },
            { id: 'writing', label: '英作文', icon: PenTool },
            { id: 'vocab', label: '単語帳', icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex flex-col items-center justify-center gap-1 transition ${
                  active ? 'text-indigo-600 font-extrabold' : 'text-slate-400 font-bold'
                }`}
              >
                <div className={`p-1 rounded-xl ${active ? 'bg-indigo-50' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px]">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}