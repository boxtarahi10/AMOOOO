import { Level } from './types';

// Extract unique letters needed for a set of words
export function extractLetters(words: string[]): string[] {
  // Find the longest word - it contains all needed letters as a base
  // Then check if other words need additional letters
  const letterCounts: Record<string, number> = {};
  
  for (const word of words) {
    const wordCounts: Record<string, number> = {};
    for (const ch of word) {
      wordCounts[ch] = (wordCounts[ch] || 0) + 1;
    }
    for (const [ch, count] of Object.entries(wordCounts)) {
      letterCounts[ch] = Math.max(letterCounts[ch] || 0, count);
    }
  }
  
  const letters: string[] = [];
  for (const [ch, count] of Object.entries(letterCounts)) {
    for (let i = 0; i < count; i++) {
      letters.push(ch);
    }
  }
  
  return letters;
}

// Validate that a word can be formed from given letters
export function canFormWord(word: string, letters: string[]): boolean {
  const available = [...letters];
  for (const ch of word) {
    const idx = available.indexOf(ch);
    if (idx === -1) return false;
    available.splice(idx, 1);
  }
  return true;
}

// Create a level from words
export function createLevel(id: number, words: string[]): Level {
  return {
    id,
    letters: extractLetters(words),
    words: [...words].sort((a, b) => a.length - b.length),
  };
}

// Convert Persian number
export function toPersianNum(n: number): string {
  const persianDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  return String(n).replace(/\d/g, d => persianDigits[parseInt(d)]);
}

// Format score
export function formatScore(n: number): string {
  return toPersianNum(n);
}
