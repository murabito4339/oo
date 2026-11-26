'use client';

import { useState } from 'react';
import { Droplets, Sparkles } from 'lucide-react';
import { BottomNav, SideNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { StatsRail } from '@/components/layout/StatsRail';
import { CardsTab } from '@/components/tabs/CardsTab';
import { HomeTab } from '@/components/tabs/HomeTab';
import { PathTab } from '@/components/tabs/PathTab';
import { VocabTab } from '@/components/tabs/VocabTab';
import { WritingTab } from '@/components/tabs/WritingTab';
import { SECTIONS } from '@/constants/curriculum';
import type { NodeItem, TabType } from '@/types/lexis';

type Toast = { title: string; sub?: string };

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [plantDays, setPlantDays] = useState(180);
  const [streak, setStreak] = useState(5);
  const [isWateredToday, setIsWateredToday] = useState(false);
  const masteredCount = 142;

  const [selectedSectionId, setSelectedSectionId] = useState('sec2');
  const [sectionProgress, setSectionProgress] = useState<Record<string, number>>({
    sec1: 10,
    sec2: 3,
    sec3: 1,
    sec4: 0,
  });

  // デイリークエスト（デモ：その日の操作回数）
  const [stepsToday, setStepsToday] = useState(0);
  const [reviewedToday, setReviewedToday] = useState(0);
  const [writingChecks, setWritingChecks] = useState(0);

  const [toast, setToast] = useState<Toast | null>(null);

  const currentSection = SECTIONS.find((s) => s.id === selectedSectionId) || SECTIONS[0];
  const doneCount = sectionProgress[selectedSectionId] ?? 0;
  const quests = { stepsToday, reviewedToday, writingChecks };

  const triggerToast = (next: Toast) => {
    setToast(next);
    setTimeout(() => setToast(null), 2800);
  };

  const water = () => {
    setPlantDays((d) => d + 1);
    if (!isWateredToday) {
      setStreak((s) => s + 1);
      setIsWateredToday(true);
    }
  };

  const handleWaterPlant = () => {
    water();
    triggerToast({ title: '水やり完了！', sub: '植物が1日ぶん成長しました' });
  };

  const handleCompleteNode = (sectionId: string, node: NodeItem) => {
    const currentDone = sectionProgress[sectionId] ?? 0;
    if (node.step > currentDone) {
      setSectionProgress((prev) => ({ ...prev, [sectionId]: node.step }));
    }
    setSelectedSectionId(sectionId);
    setStepsToday((n) => n + 1);
    water();
    triggerToast({ title: `「${node.label}」クリア！`, sub: '水やり +1日' });
  };

  return (
    <div className="min-h-screen bg-white pb-28 lg:pb-12 lg:pl-60 xl:pr-[340px]">
      {toast && (
        <div
          role="status"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 btn-3d btn-leaf px-5 py-3 text-sm animate-pop-in pointer-events-none"
        >
          <Sparkles className="w-5 h-5 shrink-0" />
          <span>{toast.title}</span>
          {toast.sub && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/20 px-2 py-0.5 text-xs font-extrabold">
              <Droplets className="w-3.5 h-3.5" />
              {toast.sub}
            </span>
          )}
        </div>
      )}

      <SideNav activeTab={activeTab} onChangeTab={setActiveTab} />

      <Header
        streak={streak}
        isWateredToday={isWateredToday}
        plantDays={plantDays}
        masteredCount={masteredCount}
        currentSection={currentSection}
      />

      <main className="max-w-xl mx-auto px-4 pt-5 xl:pt-8">
        {activeTab === 'home' && (
          <HomeTab
            plantDays={plantDays}
            isWateredToday={isWateredToday}
            currentSection={currentSection}
            doneCount={doneCount}
            quests={quests}
            onWaterPlant={handleWaterPlant}
            onChangePlantDays={setPlantDays}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'path' && (
          <PathTab
            selectedSectionId={selectedSectionId}
            sectionProgress={sectionProgress}
            onSelectSection={setSelectedSectionId}
            onCompleteNode={handleCompleteNode}
            onOpenVocab={() => setActiveTab('vocab')}
          />
        )}

        {activeTab === 'cards' && <CardsTab onReview={() => setReviewedToday((n) => n + 1)} />}
        {activeTab === 'writing' && <WritingTab onCheck={() => setWritingChecks((n) => n + 1)} />}
        {activeTab === 'vocab' && <VocabTab />}
      </main>

      <StatsRail
        streak={streak}
        isWateredToday={isWateredToday}
        plantDays={plantDays}
        masteredCount={masteredCount}
        quests={quests}
      />

      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
}
