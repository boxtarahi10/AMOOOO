export interface Level {
  id: number;
  letters: string[];
  words: string[];
}

export interface SaveData {
  currentLevel: number;
  completedLevels: Record<number, { stars: number; hintsUsed: number }>;
  totalScore: number;
  hintsRemaining: number;
  lastDailyBonus: string | null;
  soundEnabled: boolean;
  foundWordsInProgress: Record<number, string[]>;
  chestWords: number;
  chestScore: number;
  speedBestLevel: number;
  speedTotalScore: number;
  chestUsedWords: string[];  // ALL chest words ever collected - persisted globally
}

export type GameScreen = 'start' | 'select' | 'playing' | 'paused' | 'complete' | 'settings' | 'about' | 'howto' | 'wordfinder' | 'chest' | 'speed' | 'chapter' | 'jadval';

export interface Toast {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info' | 'combo';
}
