import { BookOpen, Home as HomeIcon, Layers, Map, PenTool } from 'lucide-react';
import type { TabType } from '@/types/lexis';

type Props = {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
};

const TABS: { id: TabType; label: string; icon: typeof HomeIcon }[] = [
  { id: 'home', label: 'ホーム', icon: HomeIcon },
  { id: 'path', label: 'パス', icon: Map },
  { id: 'cards', label: 'カード', icon: Layers },
  { id: 'writing', label: '英作文', icon: PenTool },
  { id: 'vocab', label: '単語帳', icon: BookOpen },
];

export function BottomNav({ activeTab, onChangeTab }: Props) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200/80">
      <div className="max-w-2xl mx-auto grid grid-cols-5 h-16">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 transition ${
                active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'stroke-[2.2]' : 'stroke-[1.75]'}`} />
              <span className={`text-[10px] ${active ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}