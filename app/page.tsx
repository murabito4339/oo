'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Droplets, Home as HomeIcon, Layers, Map, PenTool } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LexicalItem, TabType } from '@/types';
import { HomeTab } from '@/components/home/HomeTab';
import { PathTab } from '@/components/path/PathTab';
import { CardsTab } from '@/components/cards/CardsTab';
import { WritingTab } from '@/components/writing/WritingTab';
import { VocabTab } from '@/components/vocab/VocabTab';

const TABS: { id: TabType; label: string; title: string; icon: typeof Map }[] = [
  { id: 'home', label: 'ホーム', title: 'ホーム', icon: HomeIcon },
  { id: 'path', label: 'パス', title: '学習パス', icon: Map },
  { id: 'cards', label: 'カード', title: 'カード', icon: Layers },
  { id: 'writing', label: '英作文', title: '英作文', icon: PenTool },
  { id: 'vocab', label: '単語帳', title: '単語帳', icon: BookOpen },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
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
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-sm">
              鉄
            </div>
            <h1 className="text-base font-black text-slate-800 truncate">
              {TABS.find((t) => t.id === activeTab)?.title}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4">
        {activeTab === 'home' && (
          <HomeTab
            streak={streak}
            onChangeStreak={setStreak}
            dbItemCount={items.length}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'path' && (
          <PathTab
            onOpenVocab={() => setActiveTab('vocab')}
            onCelebrate={triggerCelebration}
          />
        )}
        {activeTab === 'cards' && <CardsTab />}
        {activeTab === 'writing' && <WritingTab />}
        {activeTab === 'vocab' && <VocabTab items={items} onRefresh={fetchItems} />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t-2 border-slate-200">
        <div className="max-w-2xl mx-auto grid grid-cols-5 h-16">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-current={active ? 'page' : undefined}
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
