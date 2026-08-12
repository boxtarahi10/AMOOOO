import { useCallback } from 'react';

const STORAGE_KEY = 'abumirza-crossword-v3';

interface LevelProgress {
  filledCells: Record<string, string>;
  completed: boolean;
  timestamp: number;
  stars?: number;
}

export interface CrosswordSave {
  levels: Record<number, LevelProgress>;
  currentLevel: number;
  hints: number;
}

function loadAll(): CrosswordSave {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { levels: {}, currentLevel: 1, hints: 15 };
    return { levels: {}, currentLevel: 1, hints: 15, ...JSON.parse(raw) };
  } catch { return { levels: {}, currentLevel: 1, hints: 15 }; }
}

function saveAll(data: CrosswordSave) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export function useCrosswordProgress() {
  const saveProgress = useCallback((level: number, filledCells: Record<string, string>, completed: boolean, stars?: number) => {
    const data = loadAll();
    data.levels[level] = { filledCells, completed, timestamp: Date.now(), stars };
    if (completed && level >= data.currentLevel) data.currentLevel = level + 1;
    saveAll(data);
  }, []);

  const loadProgress = useCallback((level: number): LevelProgress | null => {
    return loadAll().levels[level] || null;
  }, []);

  const getSave = useCallback((): CrosswordSave => loadAll(), []);

  const useHint = useCallback((): number => {
    const data = loadAll();
    if (data.hints > 0) data.hints--;
    saveAll(data);
    return data.hints;
  }, []);

  return { saveProgress, loadProgress, getSave, useHint };
}
