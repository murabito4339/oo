import { useSyncExternalStore } from 'react';
import {
  NODE_TEMPLATE,
  SECTIONS,
  migrateLegacyDoneCount,
  normalizeCompleted,
} from '@/constants/curriculum';

/**
 * 学習の進捗と植物の状態を、この端末（localStorage）にバージョンつきで保存する。
 *
 * v1（旧パス時代の形）: { sectionProgress: { sec1: 0〜8, ... } } … 旧8ステップで「何ステップ目まで終えたか」
 * v2（現在）         : { version: 2, completed: { sec1: [1, 2, ...] }, plant: { startDate, days } }
 *
 * 形を変えるときは PROGRESS_VERSION を上げ、migrate() に前の版からの変換を足すこと。
 * 将来 Supabase に移すときも、この形をそのままテーブルに写せるようにしてある。
 */
const STORAGE_KEY = 'lexis-lab:progress';
export const PROGRESS_VERSION = 2;

export type PlantState = {
  /** 育て始めた日（YYYY-MM-DD）。樹種はこの日の季節で決まり、その後は変わらない */
  startDate: string | null;
  /** 累計の成長日数（水やり・学習で増える） */
  days: number;
};

export type ProgressState = {
  version: typeof PROGRESS_VERSION;
  /** セクションごとの完了ステップ番号 */
  completed: Record<string, number[]>;
  plant: PlantState;
};

// まだ保存がない人に見せるデモ用の初期値
const ALL_STEPS = NODE_TEMPLATE.map((n) => n.step);
const DEMO_COMPLETED: Record<string, number[]> = {
  sec1: ALL_STEPS,
  sec2: [1, 2, 3],
  sec3: [1],
  sec4: [],
};
const DEMO_PLANT_DAYS = 180;

export function toDateKey(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function freshState(): ProgressState {
  return {
    version: PROGRESS_VERSION,
    completed: { ...DEMO_COMPLETED },
    plant: { startDate: toDateKey(new Date()), days: DEMO_PLANT_DAYS },
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function parsePlant(raw: unknown): PlantState {
  const fallback = freshState().plant;
  if (!isRecord(raw)) return fallback;
  const startDate =
    typeof raw.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.startDate) ? raw.startDate : fallback.startDate;
  const days = typeof raw.days === 'number' && Number.isFinite(raw.days) && raw.days >= 0 ? Math.floor(raw.days) : fallback.days;
  return { startDate, days };
}

function emptyCompleted(): Record<string, number[]> {
  return Object.fromEntries(SECTIONS.map((s) => [s.id, [] as number[]]));
}

/** 保存されていた値を現在の形にそろえる。読めない形なら null */
export function migrate(raw: unknown): ProgressState | null {
  if (!isRecord(raw)) return null;
  const completed = emptyCompleted();

  if (raw.version === 2 && isRecord(raw.completed)) {
    for (const [id, steps] of Object.entries(raw.completed)) {
      if (Array.isArray(steps)) completed[id] = normalizeCompleted(steps.filter((s): s is number => typeof s === 'number'));
    }
  } else if (isRecord(raw.sectionProgress)) {
    // v1: 旧8ステップのパス
    for (const [id, count] of Object.entries(raw.sectionProgress)) {
      if (typeof count === 'number') completed[id] = migrateLegacyDoneCount(count);
    }
  } else {
    return null;
  }

  return { version: PROGRESS_VERSION, completed, plant: parsePlant(raw.plant) };
}

// ---- ストア（useSyncExternalStore 用） ----

let cache: ProgressState | null = null;
const listeners = new Set<() => void>();

function save(state: ProgressState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // プライベートモードなどで保存できなくても、画面上の状態はそのまま使える
  }
}

function load(): ProgressState {
  if (cache) return cache;
  let state: ProgressState | null = null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) state = migrate(JSON.parse(stored));
  } catch {
    state = null;
  }
  cache = state ?? freshState();
  // 初回は開始日を、移行した場合は新しい形を、すぐに書き戻しておく
  save(cache);
  return cache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // 別のタブでの変更も反映する
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function update(fn: (prev: ProgressState) => ProgressState) {
  cache = fn(load());
  save(cache);
  listeners.forEach((l) => l());
}

// サーバー側の描画では保存が読めないので、開始日なしのデモ値を使う（読み込み後すぐ差し替わる）
const SERVER_SNAPSHOT: ProgressState = {
  version: PROGRESS_VERSION,
  completed: DEMO_COMPLETED,
  plant: { startDate: null, days: DEMO_PLANT_DAYS },
};

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, load, () => SERVER_SNAPSHOT);
}

export const progressActions = {
  completeStep(sectionId: string, step: number) {
    update((prev) => {
      const current = prev.completed[sectionId] ?? [];
      if (current.includes(step)) return prev;
      return { ...prev, completed: { ...prev.completed, [sectionId]: normalizeCompleted([...current, step]) } };
    });
  },
  setPlantDays(days: number) {
    update((prev) => ({ ...prev, plant: { ...prev.plant, days: Math.max(0, Math.floor(days)) } }));
  },
  addPlantDays(delta: number) {
    update((prev) => ({ ...prev, plant: { ...prev.plant, days: Math.max(0, prev.plant.days + delta) } }));
  },
};
