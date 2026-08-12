const EMPTY: null = null;
const BLOCKED = "#";

export interface WordEntry {
  word: string;
  clue: string;
  category: string;
}

export interface PlacedWord {
  word: string;
  clue: string;
  category: string;
  row: number;
  col: number;
  direction: "across" | "down";
  number?: number;
}

export interface CrosswordResult {
  grid: (string | null)[][];
  width: number;
  height: number;
  wordCount: number;
  cluesAcross: PlacedWord[];
  cluesDown: PlacedWord[];
  numberMap: Record<string, number>;
  level: number;
  targetSize: number;
}

export class CrosswordGenerator {
  private gridSize: number;
  private center: number;
  private grid: (string | null)[][] = [];
  private placedWords: PlacedWord[] = [];
  private maxRows: number;
  private maxCols: number;

  constructor(maxRows: number, maxCols: number) {
    this.maxRows = maxRows;
    this.maxCols = maxCols;
    this.gridSize = Math.max(maxRows, maxCols) * 2 + 5;
    this.center = Math.floor(this.gridSize / 2);
    this.grid = this._createEmptyGrid();
  }

  private _createEmptyGrid(): (string | null)[][] {
    return Array.from({ length: this.gridSize }, () =>
      Array.from({ length: this.gridSize }, () => EMPTY)
    );
  }

  generate(
    dominantWords: WordEntry[],
    connectorWords: WordEntry[],
    otherWords: WordEntry[],
    targetWordCount: number
  ): CrosswordResult | null {
    const maxAttempts = 40;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      this.grid = this._createEmptyGrid();
      this.placedWords = [];

      const dominantCount = Math.ceil(targetWordCount * 0.6);
      const fillerCount = targetWordCount - dominantCount;
      const fillerPool = this._shuffle([...connectorWords, ...otherWords]);

      const wordPool = [
        ...this._shuffle(dominantWords).slice(0, dominantCount),
        ...fillerPool.slice(0, fillerCount),
      ];
      wordPool.sort((a, b) => b.word.length - a.word.length);

      const success = this._placeAllWords(wordPool);
      if (success && this._validateConnectivity() && this._fitsInBounds()) {
        return this._finalizeGrid();
      }
    }
    return null;
  }

  private _placeFirstWord(entry: WordEntry) {
    const row = this.center;
    const col = this.center - Math.floor(entry.word.length / 2);
    this._writeWord(entry, row, col, "across");
  }

  private _placeAllWords(wordPool: WordEntry[]): boolean {
    if (wordPool.length === 0) return false;
    this._placeFirstWord(wordPool[0]);
    for (let i = 1; i < wordPool.length; i++) {
      this._tryPlaceWithIntersection(wordPool[i]);
    }
    return this.placedWords.length >= Math.floor(wordPool.length * 0.7);
  }

  private _tryPlaceWithIntersection(entry: WordEntry): boolean {
    const word = entry.word;
    const candidates: { row: number; col: number; direction: "across" | "down" }[] = [];

    for (let i = 0; i < word.length; i++) {
      const letter = word[i];
      for (const placed of this.placedWords) {
        for (let j = 0; j < placed.word.length; j++) {
          if (placed.word[j] !== letter) continue;
          const crossRow = placed.direction === "across" ? placed.row : placed.row + j;
          const crossCol = placed.direction === "across" ? placed.col + j : placed.col;
          const newDirection: "across" | "down" = placed.direction === "across" ? "down" : "across";
          const newRow = newDirection === "down" ? crossRow - i : crossRow;
          const newCol = newDirection === "across" ? crossCol - i : crossCol;
          if (this._canPlace(word, newRow, newCol, newDirection)) {
            candidates.push({ row: newRow, col: newCol, direction: newDirection });
          }
        }
      }
    }
    if (candidates.length === 0) return false;
    const choice = candidates[Math.floor(Math.random() * candidates.length)];
    this._writeWord(entry, choice.row, choice.col, choice.direction);
    return true;
  }

  private _canPlace(word: string, row: number, col: number, direction: "across" | "down"): boolean {
    if (row < 0 || col < 0) return false;
    const len = word.length;
    let hasIntersection = false;
    for (let k = 0; k < len; k++) {
      const r = direction === "across" ? row : row + k;
      const c = direction === "across" ? col + k : col;
      if (r < 0 || c < 0 || r >= this.gridSize || c >= this.gridSize) return false;
      const existing = this.grid[r][c];
      if (existing === BLOCKED) return false;
      if (existing !== EMPTY) {
        if (existing !== word[k]) return false;
        hasIntersection = true;
      } else {
        if (!this._checkPerpendicularEmpty(r, c, direction)) return false;
      }
    }
    const beforeR = direction === "across" ? row : row - 1;
    const beforeC = direction === "across" ? col - 1 : col;
    const afterR = direction === "across" ? row : row + len;
    const afterC = direction === "across" ? col + len : col;
    if (this._isOccupied(beforeR, beforeC)) return false;
    if (this._isOccupied(afterR, afterC)) return false;
    return hasIntersection;
  }

  private _checkPerpendicularEmpty(r: number, c: number, direction: "across" | "down"): boolean {
    if (direction === "across") {
      const up = this.grid[r - 1]?.[c];
      const down = this.grid[r + 1]?.[c];
      return (up === EMPTY || up === undefined) && (down === EMPTY || down === undefined);
    } else {
      const left = this.grid[r]?.[c - 1];
      const right = this.grid[r]?.[c + 1];
      return (left === EMPTY || left === undefined) && (right === EMPTY || right === undefined);
    }
  }

  private _isOccupied(r: number, c: number): boolean {
    if (r < 0 || c < 0 || r >= this.gridSize || c >= this.gridSize) return false;
    return this.grid[r][c] !== EMPTY && this.grid[r][c] !== undefined;
  }

  private _writeWord(entry: WordEntry, row: number, col: number, direction: "across" | "down") {
    for (let k = 0; k < entry.word.length; k++) {
      const r = direction === "across" ? row : row + k;
      const c = direction === "across" ? col + k : col;
      this.grid[r][c] = entry.word[k];
    }
    this.placedWords.push({ word: entry.word, clue: entry.clue, category: entry.category, row, col, direction });
  }

  private _validateConnectivity(): boolean {
    if (this.placedWords.length === 0) return false;
    if (this.placedWords.length === 1) return true;
    const visited = new Set([0]);
    const queue = [0];
    while (queue.length > 0) {
      const idx = queue.pop()!;
      const current = this.placedWords[idx];
      for (let i = 0; i < this.placedWords.length; i++) {
        if (visited.has(i)) continue;
        if (this._wordsIntersect(current, this.placedWords[i])) { visited.add(i); queue.push(i); }
      }
    }
    return visited.size === this.placedWords.length;
  }

  private _wordsIntersect(a: PlacedWord, b: PlacedWord): boolean {
    for (let i = 0; i < a.word.length; i++) {
      const ar = a.direction === "across" ? a.row : a.row + i;
      const ac = a.direction === "across" ? a.col + i : a.col;
      for (let j = 0; j < b.word.length; j++) {
        const br = b.direction === "across" ? b.row : b.row + j;
        const bc = b.direction === "across" ? b.col + j : b.col;
        if (ar === br && ac === bc) return true;
      }
    }
    return false;
  }

  private _fitsInBounds(): boolean {
    const bounds = this._getBounds();
    return (bounds.maxRow - bounds.minRow + 1) <= this.maxRows && (bounds.maxCol - bounds.minCol + 1) <= this.maxCols;
  }

  private _getBounds() {
    let minRow = Infinity, maxRow = -Infinity, minCol = Infinity, maxCol = -Infinity;
    for (const w of this.placedWords) {
      for (let k = 0; k < w.word.length; k++) {
        const r = w.direction === "across" ? w.row : w.row + k;
        const c = w.direction === "across" ? w.col + k : w.col;
        minRow = Math.min(minRow, r); maxRow = Math.max(maxRow, r);
        minCol = Math.min(minCol, c); maxCol = Math.max(maxCol, c);
      }
    }
    return { minRow, maxRow, minCol, maxCol };
  }

  private _finalizeGrid(): CrosswordResult {
    const bounds = this._getBounds();
    const height = bounds.maxRow - bounds.minRow + 1;
    const width = bounds.maxCol - bounds.minCol + 1;
    const finalGrid: (string | null)[][] = Array.from({ length: height }, () => Array.from({ length: width }, () => BLOCKED as string | null));
    const normalizedWords = this.placedWords.map(w => ({ ...w, row: w.row - bounds.minRow, col: w.col - bounds.minCol }));
    for (const w of normalizedWords) {
      for (let k = 0; k < w.word.length; k++) {
        const r = w.direction === "across" ? w.row : w.row + k;
        const c = w.direction === "across" ? w.col + k : w.col;
        finalGrid[r][c] = w.word[k];
      }
    }
    const numberMap: Record<string, number> = {};
    let counter = 1;
    const sortedStarts = [...normalizedWords].sort((a, b) => a.row === b.row ? a.col - b.col : a.row - b.row);
    for (const w of sortedStarts) {
      const key = `${w.row},${w.col}`;
      if (!numberMap[key]) numberMap[key] = counter++;
    }
    const cluesAcross: PlacedWord[] = [];
    const cluesDown: PlacedWord[] = [];
    for (const w of normalizedWords) {
      const num = numberMap[`${w.row},${w.col}`];
      const item = { ...w, number: num };
      if (w.direction === "across") cluesAcross.push(item); else cluesDown.push(item);
    }
    cluesAcross.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
    cluesDown.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
    return { grid: finalGrid, width, height, wordCount: normalizedWords.length, cluesAcross, cluesDown, numberMap, level: 0, targetSize: this.maxRows };
  }

  private _shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
}

export function getLevelConfig(levelNumber: number) {
  if (levelNumber <= 20) return { size: 7, wordCount: 7 };
  if (levelNumber <= 40) return { size: 9, wordCount: 9 };
  if (levelNumber <= 60) return { size: 11, wordCount: 12 };
  if (levelNumber <= 80) return { size: 13, wordCount: 16 };
  return { size: 15, wordCount: 20 };
}

export function generateLevel(
  levelNumber: number,
  dominantWords: WordEntry[],
  connectorWords: WordEntry[],
  otherWords: WordEntry[]
): CrosswordResult {
  const config = getLevelConfig(levelNumber);
  let wordCount = config.wordCount;
  while (wordCount >= 4) {
    const gen = new CrosswordGenerator(config.size, config.size);
    const result = gen.generate(dominantWords, connectorWords, otherWords, wordCount);
    if (result) return { ...result, level: levelNumber, targetSize: config.size };
    wordCount -= 1;
  }
  // Emergency fallback
  const w = dominantWords[0] || connectorWords[0];
  return { grid: [[w.word[0]]], width: 1, height: 1, wordCount: 1, cluesAcross: [{ ...w, row: 0, col: 0, direction: 'across', number: 1 }], cluesDown: [], numberMap: { '0,0': 1 }, level: levelNumber, targetSize: config.size };
}
