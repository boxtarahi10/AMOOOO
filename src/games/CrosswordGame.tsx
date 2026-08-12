import { useState, useEffect, useCallback, useMemo } from 'react';
import { generateLevel, type CrosswordResult, type PlacedWord } from '../utils/crossword-engine';
import { getChapterWords, getChapterName } from '../data/word-bank';
import { useCrosswordProgress } from '../hooks/useCrosswordProgress';
import { toPersianNum } from '../data/levelUtils';
import { IconBack, IconPlay, IconStar, IconHint, IconHome } from '../components/Icons';

const TOTAL_LEVELS = 100;

// Sounds
let sCtx: AudioContext | null = null;
function sAc() { if (!sCtx) sCtx = new (window.AudioContext || (window as any).webkitAudioContext)(); if (sCtx.state === 'suspended') sCtx.resume(); return sCtx; }
function sPluck(f: number, t: number, v = 0.04, d = 0.25) { try { const c = sAc(), o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f; const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + d); const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f * 1.5; b.Q.value = 2; o.connect(b); b.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + .05); } catch {} }
function sndTap() { sPluck(600, sAc().currentTime, .03, .1); }
function sndWord() { const t = sAc().currentTime; [523, 659, 784].forEach((f, i) => sPluck(f, t + i * .08, .04, .35)); }
function sndComplete() { const t = sAc().currentTime; [523, 587, 659, 698, 784, 880, 988, 1047].forEach((f, i) => sPluck(f, t + i * .07, .04, .5)); }

// Keyboard rows
const KB_ROWS = [['ض','ص','ث','ق','ف','غ','ع','ه','خ','ح','ج'],['ش','س','ی','ب','ل','ا','ت','ن','م','ک','گ'],['ظ','ط','ز','ر','ذ','د','پ','و','چ']];

interface Props { onBack: () => void; }

export default function CrosswordGame({ onBack }: Props) {
  const [phase, setPhase] = useState<'menu' | 'select' | 'play' | 'help' | 'win'>('menu');
  const [levelNum, setLevelNum] = useState(1);
  const [cw, setCw] = useState<CrosswordResult | null>(null);
  const [filled, setFilled] = useState<Record<string, string>>({});
  const [selCell, setSelCell] = useState<{ row: number; col: number } | null>(null);
  const [dir, setDir] = useState<'across' | 'down'>('across');
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');
  const [winStars, setWinStars] = useState(0);

  const { saveProgress, loadProgress, getSave, useHint: consumeHint } = useCrosswordProgress();
  const save = getSave();

  const startLevel = useCallback((lvl: number) => {
    setLevelNum(lvl);
    const chapter = Math.min(5, Math.ceil(lvl / 20));
    const { dominant, connector, other } = getChapterWords(chapter);
    try {
      const result = generateLevel(lvl, dominant, connector, other);
      setCw(result);
      const saved = loadProgress(lvl);
      setFilled(saved?.filledCells || {});
      setFoundWords(new Set());
      setSelCell(null);
      setPhase('play');
    } catch { showToast('خطا در ساخت جدول'); }
  }, [loadProgress]);

  // Check complete words
  const checkWords = useCallback((f: Record<string, string>) => {
    if (!cw) return;
    const nf = new Set(foundWords);
    let any = false;
    const allClues = [...cw.cluesAcross, ...cw.cluesDown];
    allClues.forEach(cl => {
      const k = `${cl.direction}-${cl.number}`;
      if (nf.has(k)) return;
      let ok = true;
      for (let i = 0; i < cl.word.length; i++) {
        const r = cl.direction === 'across' ? cl.row : cl.row + i;
        const c = cl.direction === 'across' ? cl.col + i : cl.col;
        if (f[`${r}-${c}`] !== cl.word[i]) { ok = false; break; }
      }
      if (ok) { nf.add(k); any = true; }
    });
    if (any) { sndWord(); setFoundWords(nf); showToast('آفرین!');
      if (nf.size === cw.wordCount) {
        setTimeout(() => {
          sndComplete();
          const hintsLeft = getSave().hints;
          const st = hintsLeft >= 12 ? 3 : hintsLeft >= 8 ? 2 : 1;
          setWinStars(st);
          saveProgress(levelNum, f, true, st);
          setPhase('win');
        }, 500);
      }
    }
  }, [cw, foundWords, levelNum, saveProgress, getSave]);

  const handleKey = useCallback((letter: string) => {
    if (!cw || !selCell) return;
    const { row, col } = selCell;
    if (cw.grid[row]?.[col] === '#' || cw.grid[row]?.[col] === null) return;
    const ch = letter.replace(/[^؀-ۿ]/g, '');
    if (!ch) return;
    sndTap();
    const nf = { ...filled, [`${row}-${col}`]: ch[0] };
    setFilled(nf);
    saveProgress(levelNum, nf, false);
    checkWords(nf);
    // Auto-advance
    let nr = row, nc = col;
    if (dir === 'across') nc++; else nr++;
    if (nr < cw.height && nc < cw.width && cw.grid[nr]?.[nc] !== '#' && cw.grid[nr]?.[nc] !== null) {
      setSelCell({ row: nr, col: nc });
    }
  }, [cw, selCell, dir, filled, levelNum, saveProgress, checkWords]);

  const handleDelete = useCallback(() => {
    if (!selCell) return;
    const { row, col } = selCell;
    const nf = { ...filled };
    if (nf[`${row}-${col}`]) { delete nf[`${row}-${col}`]; }
    else {
      let pr = row, pc = col;
      if (dir === 'across') pc--; else pr--;
      if (pr >= 0 && pc >= 0 && cw && cw.grid[pr]?.[pc] !== '#') { setSelCell({ row: pr, col: pc }); delete nf[`${pr}-${pc}`]; }
    }
    setFilled(nf);
    if (cw) saveProgress(levelNum, nf, false);
  }, [selCell, filled, dir, cw, levelNum, saveProgress]);

  const handleHint = useCallback(() => {
    if (!cw) return;
    const hintsLeft = consumeHint();
    if (hintsLeft < 0) { showToast('راهنما تمام شد!'); return; }
    for (let r = 0; r < cw.height; r++) {
      for (let c = 0; c < cw.width; c++) {
        const val = cw.grid[r]?.[c];
        if (val && val !== '#' && !filled[`${r}-${c}`]) {
          const nf = { ...filled, [`${r}-${c}`]: val };
          setFilled(nf); sndTap(); showToast('یک حرف آشکار شد');
          saveProgress(levelNum, nf, false);
          checkWords(nf);
          return;
        }
      }
    }
  }, [cw, filled, consumeHint, levelNum, saveProgress, checkWords]);

  const handleCellTap = useCallback((r: number, c: number) => {
    if (!cw || cw.grid[r]?.[c] === '#' || cw.grid[r]?.[c] === null) return;
    if (selCell?.row === r && selCell?.col === c) setDir(d => d === 'across' ? 'down' : 'across');
    else setSelCell({ row: r, col: c });
  }, [cw, selCell]);

  // Active word/clue
  const activeWord = useMemo((): PlacedWord | null => {
    if (!cw || !selCell) return null;
    const { row, col } = selCell;
    const clues = dir === 'across' ? cw.cluesAcross : cw.cluesDown;
    const match = clues.find(w => {
      if (dir === 'across') return w.row === row && col >= w.col && col < w.col + w.word.length;
      return w.col === col && row >= w.row && row < w.row + w.word.length;
    });
    if (match) return match;
    const all = [...cw.cluesAcross, ...cw.cluesDown];
    return all.find(w => {
      if (w.direction === 'across') return w.row === row && col >= w.col && col < w.col + w.word.length;
      return w.col === col && row >= w.row && row < w.row + w.word.length;
    }) || null;
  }, [cw, selCell, dir]);

  const hlCells = useMemo(() => {
    if (!activeWord) return new Set<string>();
    const s = new Set<string>();
    for (let i = 0; i < activeWord.word.length; i++) {
      const r = activeWord.direction === 'across' ? activeWord.row : activeWord.row + i;
      const c = activeWord.direction === 'across' ? activeWord.col + i : activeWord.col;
      s.add(`${r}-${c}`);
    }
    return s;
  }, [activeWord]);

  // Physical keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (phase !== 'play') return;
      if (e.key === 'Backspace') { handleDelete(); e.preventDefault(); }
      else if (e.key.length === 1 && /[؀-ۿ]/.test(e.key)) { handleKey(e.key); e.preventDefault(); }
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [phase, handleKey, handleDelete]);

  const showToast = (t: string) => { setToast(t); setTimeout(() => setToast(''), 1500); };
  const chapter = Math.min(5, Math.ceil(levelNum / 20));
  const chapterName = getChapterName(chapter);

  return (
    <div className="fixed inset-0 flex flex-col" style={{ zIndex: 20 }} dir="rtl">
      <div className="eslimi-bg" />
      {toast && <div className="fixed top-16 left-0 right-0 flex justify-center" style={{ zIndex: 50 }}><div className="px-4 py-2 rounded-xl text-white font-bold animate-toast-in" style={{ fontSize: 'clamp(11px,3vw,14px)', background: 'linear-gradient(135deg,rgba(0,102,162,.9),rgba(26,58,82,.9))' }}>{toast}</div></div>}

      {/* MENU */}
      {phase === 'menu' && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 relative" style={{ zIndex: 2 }}>
          <div className="flex flex-col items-center w-full" style={{ maxWidth: 'min(400px,92vw)', gap: 'clamp(10px,3vh,18px)' }}>
            <div className="text-center"><h1 className="display text-white" style={{ fontSize: 'clamp(26px,7vw,38px)' }}>جدول ابومیرزا</h1><p className="text-cyan-400/60" style={{ fontSize: 'clamp(10px,2.8vw,13px)' }}>جدول متقاطع فارسی • {toPersianNum(TOTAL_LEVELS)} مرحله</p></div>
            <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(6px,1.5vh,10px)' }}>
              <button onClick={() => startLevel(save.currentLevel)} className="w-full rounded-2xl text-white font-bold btn-3d flex items-center justify-center gap-2" style={{ padding: 'clamp(10px,3vh,16px)', fontSize: 'clamp(13px,3.5vw,17px)', background: 'linear-gradient(135deg,#0066A2,#1A3A52)', boxShadow: '0 6px 20px rgba(0,102,162,.4)' }}><IconPlay size={18} /> ادامه — مرحله {toPersianNum(save.currentLevel)}</button>
              <button onClick={() => setPhase('select')} className="w-full rounded-2xl glass text-white font-bold btn-3d" style={{ padding: 'clamp(8px,2.5vh,14px)', fontSize: 'clamp(12px,3vw,15px)' }}>انتخاب مرحله</button>
              <button onClick={() => setPhase('help')} className="w-full rounded-2xl glass text-white/50 btn-3d" style={{ padding: 'clamp(6px,2vh,12px)', fontSize: 'clamp(10px,2.8vw,13px)' }}>راهنما</button>
              <button onClick={onBack} className="w-full rounded-2xl text-white/30 btn-3d flex items-center justify-center gap-1" style={{ padding: 'clamp(6px,2vh,12px)', fontSize: 'clamp(10px,2.8vw,13px)' }}><IconBack size={12} /> بازگشت</button>
            </div>
          </div>
        </div>
      )}

      {/* SELECT */}
      {phase === 'select' && (<>
        <div className="flex items-center justify-between px-4 py-3 safe-top relative" style={{ zIndex: 2 }}><button onClick={() => setPhase('menu')} className="w-9 h-9 rounded-xl glass flex items-center justify-center btn-3d"><IconBack size={14} /></button><h2 className="text-white font-bold display" style={{ fontSize: 'clamp(14px,4vw,17px)' }}>انتخاب مرحله</h2><div className="w-9" /></div>
        <div className="flex-1 overflow-y-auto scrollbar-hide px-3 pb-6 relative" style={{ zIndex: 2 }}><div className="grid grid-cols-5 gap-2 max-w-md mx-auto">{Array.from({ length: TOTAL_LEVELS }, (_, i) => { const id = i + 1; const done = !!save.levels[id]?.completed; const ul = id <= save.currentLevel; const cur = id === save.currentLevel; return <button key={id} onClick={() => ul && startLevel(id)} disabled={!ul} className="aspect-square rounded-xl flex flex-col items-center justify-center font-bold btn-3d" style={{ fontSize: 'clamp(10px,3vw,13px)', background: done ? 'rgba(0,102,162,.15)' : cur ? 'rgba(212,175,55,.15)' : ul ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.01)', border: `1.5px solid ${done ? 'rgba(0,102,162,.3)' : cur ? 'rgba(212,175,55,.4)' : 'rgba(255,255,255,.05)'}`, color: done ? '#7dd3fc' : cur ? '#fbbf24' : ul ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.1)', opacity: ul ? 1 : .3 }}>{toPersianNum(id)}{done && save.levels[id]?.stars && <div className="flex gap-px mt-0.5">{[1,2,3].map(s=><IconStar key={s} size={5} filled={s<=save.levels[id].stars!} color={s<=save.levels[id].stars!?'#fbbf24':'rgba(255,255,255,.06)'}/>)}</div>}</button>; })}</div></div>
      </>)}

      {/* PLAY */}
      {phase === 'play' && cw && (<>
        <div className="flex items-center justify-between px-3 py-2 safe-top relative" style={{ zIndex: 2 }}>
          <button onClick={() => setPhase('menu')} className="rounded-xl glass flex items-center justify-center btn-3d" style={{ width: 'clamp(30px,8vw,38px)', height: 'clamp(30px,8vw,38px)' }}><IconBack size={14} /></button>
          <div className="text-center"><span className="text-white font-bold" style={{ fontSize: 'clamp(11px,3vw,14px)' }}>مرحله {toPersianNum(levelNum)}</span><span className="text-white/30 block" style={{ fontSize: 'clamp(7px,2vw,9px)' }}>{chapterName} • {toPersianNum(foundWords.size)}/{toPersianNum(cw.wordCount)}</span></div>
          <button onClick={handleHint} className="rounded-xl flex items-center gap-1 px-2 btn-3d" style={{ height: 'clamp(30px,8vw,38px)', background: 'rgba(212,175,55,.08)', border: '1px solid rgba(212,175,55,.15)', fontSize: 'clamp(9px,2.5vw,11px)', color: '#fbbf24' }}><IconHint size={12} />{toPersianNum(getSave().hints)}</button>
        </div>

        {/* Clue */}
        <div className="px-3 py-1 relative" style={{ zIndex: 2 }}><div className="rounded-xl px-3 py-1.5 text-center" style={{ background: 'rgba(0,102,162,.1)', border: '1px solid rgba(0,102,162,.2)', minHeight: '30px' }}>{activeWord ? <span className="text-cyan-300 font-bold" style={{ fontSize: 'clamp(10px,2.8vw,13px)' }}>{activeWord.direction === 'across' ? 'افقی' : 'عمودی'} {toPersianNum(activeWord.number || 0)}: {activeWord.clue}</span> : <span className="text-white/25" style={{ fontSize: 'clamp(9px,2.5vw,11px)' }}>روی خانه بزن</span>}</div></div>

        {/* GRID */}
        <div className="flex-1 flex items-start justify-center px-2 py-1 overflow-auto relative" style={{ zIndex: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cw.width}, 1fr)`, gap: '1.5px', width: `min(${cw.width * 36}px, 95vw)` }}>
            {Array.from({ length: cw.height }, (_, r) =>
              Array.from({ length: cw.width }, (_, c) => {
                const key = `${r}-${c}`;
                const val = cw.grid[r]?.[c];
                const isBlk = val === '#' || val === null;
                const isAct = selCell?.row === r && selCell?.col === c;
                const isHL = hlCells.has(key);
                const num = cw.numberMap[`${r},${c}`];
                const letter = filled[key] || '';
                const isDone = [...cw.cluesAcross, ...cw.cluesDown].some(cl => {
                  if (!foundWords.has(`${cl.direction}-${cl.number}`)) return false;
                  for (let i = 0; i < cl.word.length; i++) {
                    if ((cl.direction === 'across' ? cl.row : cl.row + i) === r && (cl.direction === 'across' ? cl.col + i : cl.col) === c) return true;
                  }
                  return false;
                });

                return <div key={key} onClick={() => !isBlk && handleCellTap(r, c)} className={`relative flex items-center justify-center ${isBlk ? '' : 'cursor-pointer'} transition-all duration-100`} style={{
                  aspectRatio: '1', borderRadius: 'clamp(2px,.6vw,4px)',
                  background: isBlk ? 'rgba(0,0,0,.5)' : isAct ? 'linear-gradient(145deg,#0066A2,#1A3A52)' : isHL ? 'rgba(0,102,162,.15)' : isDone ? 'rgba(0,102,162,.06)' : 'rgba(255,255,255,.05)',
                  border: isBlk ? 'none' : `1px solid ${isAct ? '#7dd3fc' : isHL ? 'rgba(0,102,162,.25)' : isDone ? 'rgba(0,102,162,.12)' : 'rgba(255,255,255,.07)'}`,
                  boxShadow: isAct ? '0 0 6px rgba(0,102,162,.3)' : 'none',
                }}>
                  {!isBlk && num && <span className="absolute font-bold text-white/20" style={{ top: 0, right: '1.5px', fontSize: 'clamp(5px,1.4vw,7px)' }}>{toPersianNum(num)}</span>}
                  {!isBlk && <span className={`font-bold select-none ${isAct ? 'text-white' : isDone ? 'text-cyan-300' : 'text-white/85'}`} style={{ fontSize: 'clamp(11px,3.5vw,18px)' }}>{letter}</span>}
                </div>;
              })
            )}
          </div>
        </div>

        {/* Keyboard */}
        <div className="px-2 pb-1 safe-bottom relative" style={{ zIndex: 2 }}>
          <div className="w-full max-w-md mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {KB_ROWS.map((row, ri) => <div key={ri} className="flex justify-center" style={{ gap: '2px' }}>
              {ri === 2 && <button onClick={handleDelete} className="rounded-lg flex items-center justify-center btn-3d" style={{ width: 'clamp(28px,8vw,38px)', height: 'clamp(28px,7vw,34px)', background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.18)' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg></button>}
              {row.map(k => <button key={k} onClick={() => handleKey(k)} className="rounded-lg flex items-center justify-center font-bold btn-3d" style={{ flex: 1, maxWidth: 'clamp(24px,7vw,32px)', height: 'clamp(28px,7vw,34px)', fontSize: 'clamp(12px,3.2vw,16px)', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', color: '#fff' }}>{k}</button>)}
            </div>)}
          </div>
        </div>
      </>)}

      {/* WIN */}
      {phase === 'win' && (
        <div className="flex-1 flex items-center justify-center px-4 relative" style={{ zIndex: 2 }}>
          <div className="rounded-3xl w-full text-center animate-slide-up" style={{ maxWidth: 'min(340px,90vw)', padding: 'clamp(18px,4vw,28px)', background: 'linear-gradient(180deg,rgba(0,102,162,.12),rgba(26,58,82,.06))', border: '2px solid rgba(0,102,162,.25)' }}>
            <div className="flex justify-center mb-3">{[0,1,2].map(i=><div key={i} className={`win-star ${i<winStars?'on':''}`} style={{animationDelay:`${.3+i*.4}s`}}><IconStar size={28} filled={i<winStars} color={i<winStars?'#fbbf24':'rgba(255,255,255,.08)'}/></div>)}</div>
            <h2 className="display text-white mb-1" style={{ fontSize: 'clamp(20px,5.5vw,28px)' }}>آفرین!</h2>
            <p className="text-cyan-300/60 mb-4" style={{ fontSize: 'clamp(10px,2.8vw,13px)' }}>مرحله {toPersianNum(levelNum)} حل شد</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'clamp(6px,1.5vh,10px)' }}>
              <button onClick={() => { const nl = levelNum + 1; if (nl <= TOTAL_LEVELS) startLevel(nl); else setPhase('menu'); }} className="w-full rounded-2xl text-white font-bold btn-3d flex items-center justify-center gap-2" style={{ padding: 'clamp(10px,3vh,14px)', fontSize: 'clamp(12px,3.5vw,15px)', background: 'linear-gradient(135deg,#0066A2,#1A3A52)' }}><IconPlay size={16} /> مرحله بعد</button>
              <button onClick={() => setPhase('menu')} className="w-full rounded-2xl glass text-white/50 btn-3d flex items-center justify-center gap-1" style={{ padding: 'clamp(8px,2vh,12px)', fontSize: 'clamp(10px,2.8vw,12px)' }}><IconHome size={12} /> منو</button>
            </div>
          </div>
        </div>
      )}

      {/* HELP */}
      {phase === 'help' && (<>
        <div className="flex items-center justify-between px-4 py-3 safe-top relative" style={{zIndex:2}}><button onClick={()=>setPhase('menu')} className="w-9 h-9 rounded-xl glass flex items-center justify-center btn-3d"><IconBack size={14}/></button><h2 className="text-white font-bold display" style={{fontSize:'clamp(14px,4vw,17px)'}}>راهنمای جدول</h2><div className="w-9"/></div>
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-8 relative" style={{zIndex:2}}><div className="max-w-md mx-auto space-y-2.5">
          {[{t:'جدول متقاطع واقعی',d:'کلمات افقی و عمودی واقعاً روی هم تقاطع دارند — حرف مشترک باید برای هر دو کلمه درست باشه.'},{t:'انتخاب خانه',d:'روی خانه بزن تا سرنخ ببینی. دوبار بزن تا جهت افقی/عمودی عوض بشه.'},{t:'تایپ حروف',d:'از صفحه‌کلید فارسی پایین صفحه استفاده کن. حرف بعدی خودکار انتخاب میشه.'},{t:'راهنما',d:'دکمه لامپ یک حرف خالی رو آشکار می‌کنه. تعداد راهنما محدوده.'},{t:'ستاره‌ها',d:'۳ ستاره: کم‌ترین راهنما. ۲ ستاره: متوسط. ۱ ستاره: زیاد.'},{t:'ذخیره',d:'پیشرفت هر مرحله خودکار ذخیره میشه.'}].map((x,i)=><div key={i} className="glass rounded-2xl p-3" style={{animation:`slide-up .35s ease-out ${i*.05}s both`}}><h3 className="text-cyan-300 font-bold mb-0.5" style={{fontSize:'clamp(11px,2.8vw,13px)'}}>{x.t}</h3><p className="text-white/40" style={{fontSize:'clamp(9px,2.4vw,11px)',lineHeight:1.5}}>{x.d}</p></div>)}
        </div></div>
      </>)}
    </div>
  );
}
