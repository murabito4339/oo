import {
  BookOpen,
  Dumbbell,
  Headphones,
  Layers,
  type LucideIcon,
  Mic,
  PenLine,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import type { NodeIconType, Strand, ThemeColor } from '@/types/lexis';

/**
 * Tailwind はクラス名を静的に拾うため、色ごとのクラスはここに文字列で列挙しておく。
 */
export const THEME: Record<
  ThemeColor,
  {
    bg: string;
    bgLight: string;
    text: string;
    textDark: string;
    border: string;
    btn: string;
    /** 立体ノード／バナーの影色（CSS変数） */
    chunk: string;
    hex: string;
  }
> = {
  leaf: {
    bg: 'bg-leaf',
    bgLight: 'bg-leaf-light',
    text: 'text-leaf',
    textDark: 'text-leaf-dark',
    border: 'border-leaf',
    btn: 'btn-leaf',
    chunk: 'var(--leaf-dark)',
    hex: 'var(--leaf)',
  },
  sky: {
    bg: 'bg-sky',
    bgLight: 'bg-sky-light',
    text: 'text-sky',
    textDark: 'text-sky-dark',
    border: 'border-sky',
    btn: 'btn-sky',
    chunk: 'var(--sky-dark)',
    hex: 'var(--sky)',
  },
  grape: {
    bg: 'bg-grape',
    bgLight: 'bg-grape-light',
    text: 'text-grape',
    textDark: 'text-grape-dark',
    border: 'border-grape',
    btn: 'btn-grape',
    chunk: 'var(--grape-dark)',
    hex: 'var(--grape)',
  },
  sun: {
    bg: 'bg-sun',
    bgLight: 'bg-sun-light',
    text: 'text-sun',
    textDark: 'text-sun-dark',
    border: 'border-sun',
    btn: 'btn-sun',
    chunk: 'var(--sun-dark)',
    hex: 'var(--sun)',
  },
};

/** ストランド（4技能の役割）ごとの色 */
export const STRAND_THEME: Record<Strand, { chip: string; bar: string; dot: string }> = {
  focus: { chip: 'bg-sky-light text-sky-dark', bar: 'bg-sky', dot: 'bg-sky' },
  input: { chip: 'bg-grape-light text-grape-dark', bar: 'bg-grape', dot: 'bg-grape' },
  output: { chip: 'bg-leaf-light text-leaf-dark', bar: 'bg-leaf', dot: 'bg-leaf' },
  fluency: { chip: 'bg-sun-light text-sun-dark', bar: 'bg-sun', dot: 'bg-sun' },
};

export const NODE_ICONS: Record<NodeIconType, LucideIcon> = {
  sparkles: Sparkles,
  layers: Layers,
  book: BookOpen,
  dumbbell: Dumbbell,
  headphones: Headphones,
  mic: Mic,
  pen: PenLine,
  zap: Zap,
  trophy: Trophy,
};
