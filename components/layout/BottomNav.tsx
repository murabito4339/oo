import { House, Layers, Library, PenLine, Route } from 'lucide-react';
import type { TabType } from '@/types/lexis';

type Props = {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
};

export const NAV_TABS: {
  id: TabType;
  label: string;
  icon: typeof House;
  color: string;
}[] = [
  { id: 'home', label: 'ホーム', icon: House, color: 'text-leaf' },
  { id: 'path', label: 'パス', icon: Route, color: 'text-sky' },
  { id: 'cards', label: 'カード', icon: Layers, color: 'text-grape' },
  { id: 'writing', label: '英作文', icon: PenLine, color: 'text-berry' },
  { id: 'vocab', label: '単語帳', icon: Library, color: 'text-sun' },
];

/** モバイル用の下部ナビ（lg 以上ではサイドナビに切り替え） */
export function BottomNav({ activeTab, onChangeTab }: Props) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t-2 border-line lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-xl mx-auto grid grid-cols-5 h-[68px] px-2 gap-1">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              aria-current={active ? 'page' : undefined}
              className={`my-2 flex flex-col items-center justify-center gap-0.5 rounded-xl border-2 transition ${
                active ? 'border-sky/60 bg-sky-light' : 'border-transparent hover:bg-cloud'
              }`}
            >
              <Icon
                className={`w-6 h-6 ${active ? tab.color : 'text-ink-faint'}`}
                strokeWidth={active ? 2.6 : 2.2}
              />
              <span
                className={`text-[10px] font-extrabold ${active ? 'text-sky-dark' : 'text-ink-faint'}`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** PC 用の左サイドナビ */
export function SideNav({ activeTab, onChangeTab }: Props) {
  return (
    <aside className="hidden lg:flex fixed left-0 inset-y-0 z-40 w-60 flex-col border-r-2 border-line bg-white px-4 py-6">
      <div className="px-3 pb-6">
        <span className="text-[28px] font-black tracking-tight text-leaf">Lexis Lab</span>
        <p className="text-[11px] font-bold text-ink-faint mt-0.5">能動語彙化トレーニング</p>
      </div>
      <nav className="flex flex-col gap-1.5">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-4 px-3 py-2.5 rounded-xl border-2 text-left transition ${
                active
                  ? 'border-sky/60 bg-sky-light text-sky-dark'
                  : 'border-transparent text-ink-soft hover:bg-cloud'
              }`}
            >
              <Icon className={`w-7 h-7 ${tab.color}`} strokeWidth={2.4} />
              <span className="text-sm font-extrabold tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
