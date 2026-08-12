import { SaveData } from '../data/types';

const SAVE_KEY = 'abumirza_save';

const defaultSave: SaveData = {
  currentLevel: 1,
  completedLevels: {},
  totalScore: 0,
  hintsRemaining: 5,
  lastDailyBonus: null,
  soundEnabled: true,
  foundWordsInProgress: {},
  chestWords: 0,
  chestScore: 0,
  speedBestLevel: 0,
  speedTotalScore: 0,
  chestUsedWords: [],
};

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...defaultSave };
    const data = JSON.parse(raw);
    return { ...defaultSave, ...data };
  } catch {
    return { ...defaultSave };
  }
}

export function saveSave(data: Partial<SaveData>) {
  try {
    const current = loadSave();
    const updated = { ...current, ...data };
    localStorage.setItem(SAVE_KEY, JSON.stringify(updated));
  } catch {}
}

export function isLevelUnlocked(level: number): boolean {
  if (level === 1) return true;
  const save = loadSave();
  return !!save.completedLevels[level - 1] || !!save.completedLevels[level];
}

export function completeLevel(levelId: number, stars: number, hintsUsed: number, score: number) {
  const save = loadSave();
  const existing = save.completedLevels[levelId];
  if (!existing || stars > existing.stars) {
    save.completedLevels[levelId] = { stars, hintsUsed };
  }
  save.totalScore = (save.totalScore || 0) + score;
  if (levelId >= save.currentLevel) {
    save.currentLevel = levelId + 1;
  }
  delete save.foundWordsInProgress[levelId];
  saveSave(save);
}

export function saveFoundWords(levelId: number, words: string[]) {
  const save = loadSave();
  save.foundWordsInProgress[levelId] = words;
  saveSave(save);
}

export function getFoundWords(levelId: number): string[] {
  const save = loadSave();
  return save.foundWordsInProgress[levelId] || [];
}

export function checkDailyBonus(): boolean {
  const save = loadSave();
  const today = new Date().toDateString();
  return save.lastDailyBonus !== today;
}

export function claimDailyBonus(): number {
  const save = loadSave();
  const today = new Date().toDateString();
  save.lastDailyBonus = today;
  save.totalScore = (save.totalScore || 0) + 500;
  saveSave(save);
  return save.totalScore;
}

// Check if word was already sent to chest (globally persisted)
export function isWordInChestHistory(word: string): boolean {
  const save = loadSave();
  return (save.chestUsedWords || []).includes(word);
}

export function addChestWord(word: string, scorePerWord: number): { chestWords: number; chestScore: number } {
  const save = loadSave();
  // Add to global used list
  if (!save.chestUsedWords) save.chestUsedWords = [];
  if (!save.chestUsedWords.includes(word)) {
    save.chestUsedWords.push(word);
  }
  save.chestWords = (save.chestWords || 0) + 1;
  save.chestScore = (save.chestScore || 0) + scorePerWord;
  saveSave(save);
  return { chestWords: save.chestWords, chestScore: save.chestScore };
}

export function claimChest(): number {
  const save = loadSave();
  const amount = save.chestScore || 0;
  save.totalScore = (save.totalScore || 0) + amount;
  save.chestWords = 0;
  save.chestScore = 0;
  saveSave(save);
  return amount;
}
