'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { CardsTab } from '@/components/tabs/CardsTab';
import { HomeTab } from '@/components/tabs/HomeTab';
import { PathTab } from '@/components/tabs/PathTab';
import { VocabTab } from '@/components/tabs/VocabTab';
import { WritingTab } from '@/components/tabs/WritingTab';
import { SECTIONS } from '@/constants/curriculum';
import type { NodeItem, TabType } from '@/types/lexis';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [plantDays, setPlantDays] = useState(180);
  const [streak, setStreak] = useState(5);
  const [isWateredToday, setIsWateredToday] = useState(false);

  const [selectedSectionId, setSelectedSectionId] = useState('sec2');
  const [sectionProgress, setSectionProgress] = useState<Record<string, number>>({
    sec1: 8,
    sec2: 2,
    sec3: 1,
    sec4: 0,
  });
  const [waterCelebration, setWaterCelebration] = useState<string | null>(null);

  const currentSection = SECTIONS.find((s) => s.id === selectedSectionId) || SECTIONS[0];
  const doneCount = sectionProgress[selectedSectionId] ?? 0;

  const triggerToast = (text: string) => {
    setWaterCelebration(text);
    setTimeout(() => setWaterCelebration(null), 2800);
  };

  const handleWaterPlant = () => {
    setPlantDays((d) => d + 1);
    if (!isWateredToday) {
      setStreak((s) => s + 1);
      setIsWateredToday(true);
    }
    triggerToast('学習を完了し、植物へ水やりを行いました (+1 Day)');
  };

  const handleCompleteNodeDemo = (node: NodeItem) => {
    const currentDone = sectionProgress[selectedSectionId] ?? 0;
    if (node.step > currentDone) {
      setSectionProgress((prev) => ({
        ...prev,
        [selectedSectionId]: node.step,
      }));
    }
    setPlantDays((d) => d + 1);
    setIsWateredToday(true);
    triggerToast(`「${node.label}」を完了しました (+1 Day)`);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-slate-900 pb-24">
      {waterCelebration && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 animate-soft-pop border border-slate-700/60">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{waterCelebration}</span>
        </div>
      )}

      <Header streak={streak} />

      <main className="max-w-2xl mx-auto px-4 pt-5">
        {activeTab === 'home' && (
          <HomeTab
            plantDays={plantDays}
            isWateredToday={isWateredToday}
            currentSection={currentSection}
            doneCount={doneCount}
            onWaterPlant={handleWaterPlant}
            onChangePlantDays={setPlantDays}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'path' && (
          <PathTab
            selectedSectionId={selectedSectionId}
            sectionProgress={sectionProgress}
            currentSection={currentSection}
            doneCount={doneCount}
            onSelectSection={setSelectedSectionId}
            onCompleteNode={handleCompleteNodeDemo}
            onOpenVocab={() => setActiveTab('vocab')}
          />
        )}

        {activeTab === 'cards' && <CardsTab />}
        {activeTab === 'writing' && <WritingTab />}
        {activeTab === 'vocab' && <VocabTab />}
      </main>

      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
}