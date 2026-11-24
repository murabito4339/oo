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
  subtitle: string;
};

export type NodeIconType =
  | 'book'
  | 'layers'
  | 'headphones'
  | 'mic'
  | 'pen'
  | 'zap'
  | 'crown';

export type NodeItem = {
  step: number;
  label: string;
  sub: string;
  icon: NodeIconType;
  desc: string;
};