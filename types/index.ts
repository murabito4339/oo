export type TabType = 'home' | 'path' | 'cards' | 'writing' | 'vocab';

export type LexicalItem = {
  id: string;
  word: string;
  meaning: string;
  pos: string | null;
  section: string | null;
  mastery_stage: string;
  created_at: string;
};

export type SectionData = {
  id: string;
  code: string;
  title: string;
  colorBg: string;
  colorBorder: string;
};

export type PathNode = {
  step: number;
  label: string;
  icon: string;
  desc: string;
};
