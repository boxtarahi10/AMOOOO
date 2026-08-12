import { levels } from './levels';
import { COMMON_WORDS } from './commonWords';

const norm = (w: string) =>
  w.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/‌/g, '')
    .replace(/ة/g, 'ه').replace(/أ|إ/g, 'ا');

const set = new Set<string>();

// Add all level words
levels.forEach((l) => {
  (l.words || []).forEach((w) => set.add(String(w).replace(/‌/g, '')));
});

// Add common words
COMMON_WORDS.forEach((w) => {
  const cleaned = w.replace(/‌/g, '').trim();
  if (cleaned.length >= 2 && cleaned.length <= 8) {
    set.add(cleaned);
  }
});

export const dictionary = Array.from(set)
  .filter((w) => w.length >= 2 && w.length <= 8 && /^[؀-ۿ]+$/.test(w))
  .sort((a, b) => a.length - b.length || a.localeCompare(b, 'fa'));

export const dictionaryNorm = dictionary.map((w) => ({ w, n: norm(w) }));

export const DICT_SIZE = dictionary.length;

// Dictionary size available via DICT_SIZE export
