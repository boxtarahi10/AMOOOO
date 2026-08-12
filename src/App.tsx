import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Level, GameScreen, Toast } from './data/types';
import { getLevel, totalLevels } from './data/levels';
import { toPersianNum } from './data/levelUtils';
import { useSound } from './hooks/useSound';
import { dictionary } from './data/dictionary';
import { speedRounds, TOTAL_SPEED_ROUNDS } from './data/speedLevels';
import { loadSave, completeLevel as completeLevelSave, saveFoundWords, getFoundWords, checkDailyBonus, claimDailyBonus, saveSave, addChestWord, claimChest, isWordInChestHistory } from './utils/storage';
import WordFinder from './components/WordFinder';
import IranMap from './components/IranMap';
import CrosswordGame from './games/CrosswordGame';
// PremiumBackground replaced with eslimi-bg CSS class
import WinConfetti from './components/WinConfetti';
import { useMusic } from './hooks/useMusic';
import { getCityForLevel } from './data/iranRoute';
import { IconPlay, IconPause, IconBack, IconShuffle, IconHint, IconCoin, IconChest, IconFire, IconStar, IconGrid, IconSpeed, IconSearch, IconHelp, IconInfo, IconHome, IconRefresh, IconGift, IconTrophy, IconCheck, IconCelebrate } from './components/Icons';

const HINT_COST = 150;
const CHEST_WORD_SCORE = 15;
const CHEST_CLAIM_THRESHOLD = 15;

// ===== CONFETTI =====
function Confetti({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null), anim = useRef(0);
  useEffect(() => {
    if (!active || !ref.current) return;
    const c = ref.current, ctx = c.getContext('2d'); if (!ctx) return;
    c.width = innerWidth; c.height = innerHeight;
    const cols = ['#d4af37','#ffd700','#ef4444','#10b981','#8b5cf6','#f59e0b','#ec4899','#06b6d4'];
    const ps = Array.from({ length: 120 }, () => ({ x: c.width / 2 + (Math.random() - .5) * 100, y: c.height * .3, vx: (Math.random() - .5) * 16, vy: -Math.random() * 14 - 4, w: Math.random() * 10 + 4, h: Math.random() * 6 + 3, col: cols[~~(Math.random() * cols.length)], rot: Math.random() * 6.28, rv: (Math.random() - .5) * .3, a: 1 }));
    let f = 0;
    const go = () => { ctx.clearRect(0, 0, c.width, c.height); f++; ps.forEach(p => { p.x += p.vx; p.vy += .25; p.y += p.vy; p.rot += p.rv; if (f > 80) p.a -= .02; if (p.a <= 0) return; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = Math.max(0, p.a); ctx.fillStyle = p.col; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); }); if (f < 150) anim.current = requestAnimationFrame(go); };
    anim.current = requestAnimationFrame(go); return () => cancelAnimationFrame(anim.current);
  }, [active]);
  return active ? <canvas ref={ref} className="fixed inset-0 pointer-events-none" style={{ zIndex: 50 }} /> : null;
}

function Toasts({ ts }: { ts: Toast[] }) {
  return <div className="fixed top-16 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none" style={{ zIndex: 40 }}>{ts.map(t => <div key={t.id} className={`px-5 py-2.5 rounded-2xl text-white font-bold text-sm shadow-2xl animate-toast-in ${t.type === 'success' ? 'bg-gradient-to-r from-emerald-600 to-emerald-500' : t.type === 'error' ? 'bg-gradient-to-r from-red-600 to-red-500' : t.type === 'combo' ? 'bg-gradient-to-r from-amber-600 to-orange-500' : 'bg-gradient-to-r from-blue-600 to-blue-500'}`}>{t.text}</div>)}</div>;
}

function Particles({ ps }: { ps: { id: number; x: number; y: number; emoji: string }[] }) {
  return <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 30 }}>{ps.map(p => <div key={p.id} className="absolute text-2xl" style={{ left: p.x, top: p.y, animation: 'float-up 1s ease-out forwards' }}>{p.emoji}</div>)}</div>;
}

// ===== CHEST SCREEN =====
function ChestScreen({ onBack, save, onClaim }: { onBack: () => void; save: ReturnType<typeof loadSave>; onClaim: () => void }) {
  const cw = save.chestWords || 0, cs = save.chestScore || 0, canClaim = cw >= CHEST_CLAIM_THRESHOLD, prog = Math.min(cw / CHEST_CLAIM_THRESHOLD, 1);
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm" style={{ zIndex: 45 }} onClick={onBack}>
      <div className="max-w-xs w-full mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="rounded-3xl p-6 text-center" style={{ background: 'linear-gradient(180deg, #2d1f0e 0%, #1a1209 100%)', border: '2px solid #d4af37', boxShadow: '0 0 40px rgba(212,175,55,0.2)' }}>
          <div className="flex justify-center mb-3"><IconChest size={56} /></div>
          <h2 className="text-xl font-black mb-1" style={{ color: '#ffd700' }}>صندوقچه واژه‌ها</h2>
          <p className="text-white/40 text-[11px] mb-4">کلمات معنی‌دار خارج مرحله اینجا جمع میشن!</p>
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-amber-400 font-bold">{toPersianNum(cw)} واژه</span>
              <span className="text-amber-300 font-bold flex items-center gap-1"><IconCoin size={12} /> {toPersianNum(cs)}</span>
            </div>
            <div className="h-5 rounded-full overflow-hidden relative" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${prog * 100}%`, background: 'linear-gradient(90deg, #d4af37, #ffd700, #f59e0b)', boxShadow: `0 0 ${prog > 0.5 ? 15 : 8}px rgba(212,175,55,0.5)` }} />
              <div className="absolute inset-0 flex items-center justify-center"><span className="text-[10px] font-bold text-white/90 drop-shadow-lg">{toPersianNum(cw)} / {toPersianNum(CHEST_CLAIM_THRESHOLD)}</span></div>
            </div>
          </div>
          {canClaim ? <button onClick={onClaim} className="w-full py-3 rounded-2xl font-bold text-lg text-[#1a1209] btn-3d mt-4" style={{ background: 'linear-gradient(135deg, #ffd700, #d4af37)', boxShadow: '0 6px 20px rgba(212,175,55,0.5)' }}>
            <span className="flex items-center justify-center gap-2"><IconGift size={20} color="#1a1209" /> برداشت {toPersianNum(cs)} سکه!</span>
          </button> : <p className="text-white/40 text-xs mt-3">{toPersianNum(CHEST_CLAIM_THRESHOLD - cw)} واژه دیگه تا برداشت!</p>}
          <button onClick={onBack} className="mt-3 text-white/40 text-sm">بستن</button>
        </div>
      </div>
    </div>
  );
}

function ChestWordAnim({ word, active }: { word: string | null; active: boolean }) {
  if (!active || !word) return null;
  return <div className="fixed inset-0 pointer-events-none flex items-center justify-center" style={{ zIndex: 35 }}><div className="text-amber-300 font-bold text-base px-4 py-2 rounded-xl flex items-center gap-2" style={{ animation: 'chestFly 1.2s ease-in forwards', background: 'linear-gradient(135deg, rgba(139,69,19,0.9), rgba(160,82,45,0.9))', border: '1px solid #d4af37', boxShadow: '0 0 15px rgba(212,175,55,0.4)' }}><IconChest size={20} /> «{word}» رفت تو صندوقچه!</div></div>;
}

// ===== CHAPTER UNLOCK =====
function ChapterUnlock({ chapter, bonus, onClose }: { chapter: number; bonus: number; onClose: () => void }) {
  const names = ['آغاز سفر','کاشف کلمات','دانشمند حروف','استاد واژگان','نابغه فارسی','پادشاه کلمات','فرزند ادب','گنجینه دانش','افسانه واژه','پیر خردمند','اسطوره ادبیات','فرهنگ زنده','ققنوس حروف','سلطان سخن','جاودانه','ستاره درخشان','شاهکار ادبی','نگین فرهنگ','تاج دانایی','اوج رفعت','خداوند واژه','بینهایت','ابرقدرت','اعجوبه','جهان پهلوان','نور دانش','کیمیاگر','پیشوا','فرمانروا','خاتم','سرآمد','یگانه','بیمانند','افلاک','جاویدان','نقطه اوج','ابدیت','ستوده','گرامی','سربلند','فرخنده','میمون','سعادت','فلاح','رستگاری','نجات','ظفر','فیروزی','کامیابی','سرافرازی','شکوه'];
  const name = names[Math.min(chapter - 1, names.length - 1)];
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md" style={{ zIndex: 55 }}>
      <div className="max-w-xs w-full mx-4 text-center animate-slide-up">
        <div className="rounded-3xl p-8" style={{ background: 'linear-gradient(180deg, #1a0a30, #0d0520)', border: '2px solid #8b5cf6', boxShadow: '0 0 60px rgba(139,92,246,0.3)' }}>
          <div className="flex justify-center mb-3"><IconTrophy size={48} color="#a855f7" /></div>
          <div className="text-purple-300 font-bold text-sm mb-1">فصل جدید باز شد!</div>
          <h2 className="text-2xl font-black text-white mb-2">«{name}»</h2>
          <p className="text-purple-400/70 text-xs mb-1">فصل {toPersianNum(chapter)}</p>
          <div className="my-4 py-3 rounded-xl flex items-center justify-center gap-2" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <IconGift size={18} color="#c084fc" /><span className="text-purple-300 font-bold">جایزه: {toPersianNum(bonus)} سکه</span>
          </div>
          <button onClick={onClose} className="w-full py-3 rounded-2xl font-bold text-lg text-white btn-3d flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' }}><IconPlay size={18} /> ادامه بازی</button>
        </div>
      </div>
    </div>
  );
}

// ===== SPEED MODE =====
// Animated Clock SVG
function AnimatedClock({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-2xl">
      {/* Outer ring */}
      <circle cx="50" cy="50" r="46" fill="none" stroke="url(#clockRing)" strokeWidth="4"/>
      {/* Face */}
      <circle cx="50" cy="50" r="42" fill="#0f0025" stroke="rgba(139,92,246,0.3)" strokeWidth="1"/>
      {/* Hour marks */}
      {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => {
        const a = (i/12)*Math.PI*2 - Math.PI/2;
        const x1 = 50+Math.cos(a)*35, y1 = 50+Math.sin(a)*35;
        const x2 = 50+Math.cos(a)*39, y2 = 50+Math.sin(a)*39;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i%3===0?"#a855f7":"rgba(139,92,246,0.4)"} strokeWidth={i%3===0?"3":"1.5"} strokeLinecap="round"/>;
      })}
      {/* Numbers at 12, 3, 6, 9 */}
      <text x="50" y="22" textAnchor="middle" fill="#c084fc" fontSize="10" fontWeight="bold">۱۲</text>
      <text x="78" y="54" textAnchor="middle" fill="#c084fc" fontSize="10" fontWeight="bold">۳</text>
      <text x="50" y="84" textAnchor="middle" fill="#c084fc" fontSize="10" fontWeight="bold">۶</text>
      <text x="22" y="54" textAnchor="middle" fill="#c084fc" fontSize="10" fontWeight="bold">۹</text>
      {/* Minute hand - spinning */}
      <line x1="50" y1="50" x2="50" y2="18" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" style={{ transformOrigin:'50px 50px', animation:'clockMinute 8s linear infinite' }}/>
      {/* Second hand - spinning fast */}
      <line x1="50" y1="50" x2="50" y2="14" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" style={{ transformOrigin:'50px 50px', animation:'clockSecond 2s linear infinite' }}/>
      {/* Center dot */}
      <circle cx="50" cy="50" r="3" fill="#c084fc"/>
      <circle cx="50" cy="50" r="1.5" fill="#1a0030"/>
      <defs>
        <linearGradient id="clockRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed"/><stop offset="50%" stopColor="#a855f7"/><stop offset="100%" stopColor="#c084fc"/>
        </linearGradient>
      </defs>
      <style>{`@keyframes clockMinute{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes clockSecond{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </svg>
  );
}

function SpeedMode({ onBack, onAddScore }: { onBack: () => void; onAddScore: (s: number) => void }) {
  const [round, setRound] = useState(0), [found, setFound] = useState<string[]>([]), [timeLeft, setTimeLeft] = useState(15);
  const [totalScore, setTotalScore] = useState(0), [phase, setPhase] = useState<'ready' | 'playing' | 'result' | 'gameover'>('ready');
  const [input, setInput] = useState('');
  const [selectedTapIndices, setSelectedTapIndices] = useState<number[]>([]);
  const [scrambledLetters, setScrambledLetters] = useState<string[]>([]);
  const sound = useSound(); const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const rd = round < speedRounds.length ? speedRounds[round] : null;

  // Scramble letters when round changes
  useEffect(() => {
    if (!rd) return;
    const arr = [...rd.letters];
    for (let i = arr.length - 1; i > 0; i--) { const j = ~~(Math.random() * (i + 1));[arr[i], arr[j]] = [arr[j], arr[i]]; }
    // Extra scramble: reverse if same as original
    if (arr.join('') === rd.letters.join('')) arr.reverse();
    setScrambledLetters(arr);
  }, [round, rd]);

  useEffect(() => { if (phase !== 'playing') return; timerRef.current = setInterval(() => { setTimeLeft(p => { if (p <= 1) { clearInterval(timerRef.current); setPhase('result'); return 0; } return p - 1; }); }, 1000); return () => clearInterval(timerRef.current); }, [phase]);

  const startRound = () => { setFound([]); setTimeLeft(15); setInput(''); setSelectedTapIndices([]); setPhase('playing'); };
  const nextRound = () => { if (round + 1 >= TOTAL_SPEED_ROUNDS) { setPhase('gameover'); return; } setRound(r => r + 1); setFound([]); setTimeLeft(15); setInput(''); setSelectedTapIndices([]); setPhase('playing'); };

  const checkWord = useCallback((w: string) => {
    if (!rd) return;
    if (rd.words.includes(w) && !found.includes(w)) {
      setFound(p => [...p, w]); setTotalScore(p => p + 1); sound.playCorrect();
      if (found.length + 1 >= rd.words.length) { clearInterval(timerRef.current); setPhase('result'); }
    } else { sound.playWrong(); }
  }, [rd, found, sound]);

  // Typing submit
  const submitTyped = () => { if (!input.trim()) return; checkWord(input.trim()); setInput(''); };

  // Tap to select letters (build word by tapping)
  const tapLetter = (idx: number) => {
    if (selectedTapIndices.includes(idx)) {
      // Deselect: remove from end if it's the last one
      if (selectedTapIndices[selectedTapIndices.length - 1] === idx) {
        setSelectedTapIndices(p => p.slice(0, -1));
        sound.playDeselect();
      }
      return;
    }
    setSelectedTapIndices(p => [...p, idx]);
    sound.playSelect();
  };

  const submitTapped = () => {
    if (selectedTapIndices.length < 2) { setSelectedTapIndices([]); return; }
    const w = selectedTapIndices.map(i => scrambledLetters[i]).join('');
    checkWord(w);
    setSelectedTapIndices([]);
  };

  const clearTapped = () => { setSelectedTapIndices([]); };

  const finish = () => { onAddScore(totalScore); onBack(); };
  const timeProg = timeLeft / 15, tc = timeLeft > 10 ? '#10b981' : timeLeft > 5 ? '#f59e0b' : '#ef4444';
  const tappedWord = selectedTapIndices.map(i => scrambledLetters[i]).join('');

  return (
    <div className="fixed inset-0 flex flex-col items-center" style={{ zIndex: 20 }}>
      <div className="eslimi-bg" />
      {/* Speed streaks */}
      {phase === 'playing' && [0,1,2,3,4,5].map(i => <div key={i} className="speed-streak" style={{ left: `${15+i*14}%`, animationDelay: `${i*.35}s` }} />)}
      {/* Red urgency vignette when <=5s */}
      {phase === 'playing' && timeLeft <= 5 && <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1, background: 'radial-gradient(circle, transparent 40%, rgba(220,38,38,.2) 100%)', animation: 'pulse-gold 1s infinite' }} />}
      <div className="w-full flex items-center justify-between px-4 py-3 safe-top" style={{ position: 'relative', zIndex: 2 }}>
        <button onClick={finish} className="w-10 h-10 rounded-xl glass flex items-center justify-center btn-3d"><IconBack /></button>
        <div className="text-center"><div className="text-purple-300 font-bold text-sm flex items-center gap-1"><IconSpeed size={16} /> بازی سرعتی</div><div className="text-white/40 text-[10px]">مرحله {toPersianNum(round + 1)}/{toPersianNum(TOTAL_SPEED_ROUNDS)}</div></div>
        <div className="px-3 py-1 rounded-xl flex items-center gap-1" style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}><IconCoin size={14} /><span className="text-purple-300 font-bold text-sm">{toPersianNum(totalScore)}</span></div>
      </div>

      {/* READY */}
      {phase === 'ready' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 relative" style={{ zIndex: 2 }}>
          {/* Neon ring behind clock */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full" style={{ transform: 'scale(1.4)', background: 'radial-gradient(circle, rgba(168,85,247,.2), transparent 70%)', animation: 'pulse-gold 2s infinite' }} />
            <AnimatedClock size={Math.min(100, innerWidth * 0.25)} />
          </div>
          <h2 className="display text-3xl text-white" style={{ background: 'linear-gradient(135deg,#ff2d75,#c77dff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 12px rgba(199,125,255,.4))' }}>بازی سرعتی</h2>
          <p className="text-purple-300/60 text-center text-sm leading-relaxed">حروف رو ببین، روشون بزن یا تایپ کن!<br/>۱۵ ثانیه وقت داری</p>
          <button onClick={startRound} className="py-4 px-12 rounded-2xl font-bold text-xl text-white btn3d shine flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 6px 24px rgba(139,92,246,0.5), 0 0 40px rgba(139,92,246,.15)' }}><IconPlay size={22} /> شروع!</button>
        </div>
      )}

      {/* PLAYING */}
      {phase === 'playing' && rd && (
        <div className="flex-1 flex flex-col items-center justify-between py-3 px-4 w-full max-w-sm relative" style={{ zIndex: 2 }}>
          {/* Timer */}
          <div className="w-full">
            <div className="w-full h-3 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${timeProg * 100}%`, background: tc, boxShadow: `0 0 12px ${tc}` }} />
            </div>
            <div className="text-center text-2xl font-black" style={{ color: tc }}>{toPersianNum(timeLeft)}</div>
          </div>

          {/* Target words */}
          <div className="flex gap-2 flex-wrap justify-center my-2">
            {rd.words.map((w, i) => (
              <div key={i} className={`px-3 py-1.5 rounded-xl font-bold text-sm transition-all ${found.includes(w) ? 'text-emerald-300' : 'text-white/25'}`}
                style={{ background: found.includes(w) ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${found.includes(w) ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                {found.includes(w) ? <span className="flex items-center gap-1">{w} <IconCheck /></span> : '‌ '.repeat(w.length).split(' ').map((_, ci) => <span key={ci} className="inline-block w-4 border-b border-white/20 mx-px">&nbsp;</span>)}
              </div>
            ))}
          </div>

          {/* Tapped word display */}
          <div className="h-10 flex items-center justify-center">
            {tappedWord && (
              <div className="px-4 py-1.5 rounded-xl text-white font-bold text-xl tracking-wider" style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>{tappedWord}</div>
            )}
          </div>

          {/* Letter tiles - tappable */}
          <div className="flex gap-2.5 justify-center flex-wrap my-2">
            {scrambledLetters.map((l, i) => {
              const isSel = selectedTapIndices.includes(i);
              return (
                <button key={i} onClick={() => tapLetter(i)}
                  className="rounded-xl flex items-center justify-center text-xl font-black btn-3d transition-all"
                  style={{
                    width: 'clamp(48px,14vw,60px)', height: 'clamp(48px,14vw,60px)',
                    background: isSel ? 'linear-gradient(145deg, #7c3aed, #6d28d9)' : 'linear-gradient(145deg, #f5e6d3, #d4c4a8)',
                    color: isSel ? '#fff' : '#3e2723',
                    boxShadow: isSel ? '0 0 20px rgba(139,92,246,0.5), 0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.5)',
                    transform: isSel ? 'scale(1.08)' : 'scale(1)',
                    border: isSel ? '2px solid rgba(168,85,247,0.6)' : '1px solid rgba(0,0,0,0.08)',
                  }}>
                  {l}
                </button>
              );
            })}
          </div>

          {/* Tap action buttons */}
          <div className="flex gap-2 w-full mb-2">
            <button onClick={clearTapped} className="w-12 h-10 rounded-xl flex items-center justify-center btn-3d" style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <button onClick={submitTapped} className="flex-1 h-10 rounded-xl font-bold text-white btn-3d text-sm flex items-center justify-center gap-1" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', opacity: selectedTapIndices.length < 2 ? 0.4 : 1 }} disabled={selectedTapIndices.length < 2}>
              <IconCheck size={16} color="#fff" /> ثبت ضربه‌ای
            </button>
          </div>

          {/* Typing input (alternative) */}
          <div className="w-full flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value.replace(/[^؀-ۿ]/g, ''))} onKeyDown={e => e.key === 'Enter' && submitTyped()} className="flex-1 py-2.5 px-3 rounded-xl text-white text-base font-bold text-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.2)', outline: 'none' }} placeholder="یا تایپ کن..." dir="rtl" />
            <button onClick={submitTyped} className="px-4 rounded-xl font-bold text-white btn-3d text-sm" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>ارسال</button>
          </div>
        </div>
      )}

      {/* RESULT */}
      {phase === 'result' && rd && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
          <IconCelebrate size={48} />
          <h3 className="text-xl font-bold text-white">{found.length === rd.words.length ? 'عالی!' : 'وقت تموم شد!'}</h3>
          <p className="text-purple-300 text-sm">{toPersianNum(found.length)}/{toPersianNum(rd.words.length)} کلمه</p>
          <button onClick={nextRound} className="py-3 px-10 rounded-2xl font-bold text-white btn-3d mt-2 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}><IconPlay size={18} /> مرحله بعد</button>
        </div>
      )}

      {/* GAMEOVER */}
      {phase === 'gameover' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
          <IconTrophy size={48} />
          <h2 className="text-2xl font-black text-white">تموم شد!</h2>
          <div className="py-3 px-8 rounded-xl flex items-center gap-2" style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}><IconCoin size={18} /><span className="text-purple-300 font-bold text-xl">{toPersianNum(totalScore)} امتیاز</span></div>
          <button onClick={finish} className="py-3 px-10 rounded-2xl font-bold text-white btn-3d mt-2" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>برداشت و بازگشت</button>
        </div>
      )}
    </div>
  );
}

// ===== LETTER CIRCLE =====
function LetterCircle({ letters, selectedIndices, onSelect, onRelease, onShuffle, shaking }: {
  letters: string[]; selectedIndices: number[]; onSelect: (i: number) => void; onRelease: () => void; onShuffle: () => void; shaking: boolean;
}) {
  const cRef = useRef<HTMLDivElement>(null), [drag, setDrag] = useState(false), [order, setOrder] = useState<number[]>([]);
  useEffect(() => { setOrder(letters.map((_, i) => i)); }, [letters]);
  const shuffle = useCallback(() => { const a = letters.map((_, i) => i); for (let i = a.length - 1; i > 0; i--) { const j = ~~(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } setOrder(a); onShuffle(); }, [letters, onShuffle]);
  const R = letters.length <= 4 ? 78 : letters.length <= 5 ? 88 : letters.length <= 6 ? 93 : 98;
  // Use percentage-based sizing relative to circle container
  const containerSize = Math.min(310, innerWidth * 0.8, innerHeight * 0.42);
  const S = Math.round(containerSize * 0.17), C = 155;
  const pos = useMemo(() => order.map((_, vi) => { const oi = order[vi], a = (vi / letters.length) * 6.283 - 1.5708; return { oi, x: C + Math.cos(a) * R, y: C + Math.sin(a) * R, l: letters[oi] }; }), [order, letters, R]);
  const findAt = useCallback((cx: number, cy: number) => { if (!cRef.current) return -1; const r = cRef.current.getBoundingClientRect(), sx = 310 / r.width, sy = 310 / r.height, x = (cx - r.left) * sx, y = (cy - r.top) * sy; for (const p of pos) if (Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2) < 36) return p.oi; return -1; }, [pos]);
  const onD = useCallback((e: React.PointerEvent) => { e.preventDefault(); setDrag(true); const i = findAt(e.clientX, e.clientY); if (i >= 0) onSelect(i); }, [findAt, onSelect]);
  const onM = useCallback((e: React.PointerEvent) => { if (!drag) return; e.preventDefault(); const i = findAt(e.clientX, e.clientY); if (i >= 0) { if (selectedIndices.length >= 2 && selectedIndices[selectedIndices.length - 2] === i) onSelect(-i - 100); else if (!selectedIndices.includes(i)) onSelect(i); } }, [drag, findAt, onSelect, selectedIndices]);
  const onU = useCallback(() => { setDrag(false); onRelease(); }, [onRelease]);
  const cw = selectedIndices.map(i => letters[i]).join('');
  const gvp = (oi: number) => pos.find(p => p.oi === oi) || { x: C, y: C };
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-10 flex items-center justify-center">{cw && <div className="px-5 py-1.5 rounded-2xl text-white font-bold text-xl tracking-wider animate-bounce-subtle" style={{ background: 'linear-gradient(135deg,rgba(212,175,55,0.15),rgba(255,215,0,0.08))', border: '1px solid rgba(212,175,55,0.3)', backdropFilter: 'blur(16px)', textShadow: '0 0 15px rgba(212,175,55,0.4)' }}>{cw}</div>}</div>
      <div ref={cRef} className={`relative touch-none select-none ${shaking ? 'animate-shake' : ''}`} style={{ width: 'min(310px, 80vw, 42vh)', height: 'min(310px, 80vw, 42vh)', touchAction: 'none' }} onPointerDown={onD} onPointerMove={onM} onPointerUp={onU} onPointerCancel={onU} onPointerLeave={onU}>
        <div className="absolute inset-0 rounded-full" style={{ border: '3px solid rgba(212,175,55,0.4)', boxShadow: '0 0 50px rgba(212,175,55,0.12), inset 0 0 80px rgba(16,185,129,0.08)' }} />
        <div className="absolute inset-3 rounded-full" style={{ border: '1px solid rgba(212,175,55,0.12)' }} />
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 310 310">
          <defs><filter id="gl"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
          {selectedIndices.length > 1 && selectedIndices.map((idx, i) => { if (i === 0) return null; const f = gvp(selectedIndices[i - 1]), t = gvp(idx); return <line key={`${i}-${idx}`} x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke="#d4af37" strokeWidth="5" strokeLinecap="round" filter="url(#gl)" strokeOpacity="0.85" />; })}
        </svg>
        {pos.map(p => {
          const sel = selectedIndices.includes(p.oi), last = selectedIndices[selectedIndices.length - 1] === p.oi && selectedIndices.length > 0;
          return <div key={p.oi} className="absolute flex items-center justify-center rounded-full transition-all duration-150" style={{ width: S, height: S, left: `calc(${p.x / 310 * 100}% - ${S / 2}px)`, top: `calc(${p.y / 310 * 100}% - ${S / 2}px)`, background: sel ? 'linear-gradient(145deg, #d4af37, #b8941e)' : 'linear-gradient(145deg, #f5e6d3, #e8d5c0, #d4c4a8)', boxShadow: sel ? '0 0 30px rgba(212,175,55,0.6), 0 6px 12px rgba(0,0,0,0.3), inset 0 2px 3px rgba(255,255,255,0.3)' : '0 6px 16px rgba(0,0,0,0.35), inset 0 2px 4px rgba(255,255,255,0.6), inset 0 -2px 3px rgba(0,0,0,0.1)', transform: sel ? 'scale(1.12)' : 'scale(1)', zIndex: sel ? 10 : 1, border: last ? '2px solid rgba(255,215,0,0.7)' : sel ? '2px solid rgba(255,215,0,0.4)' : '1px solid rgba(0,0,0,0.08)' }}>
            <span className={`font-extrabold text-[clamp(18px,5vw,22px)] select-none ${sel ? 'text-white' : 'text-[#3e2723]'}`} style={{ textShadow: sel ? '0 1px 3px rgba(0,0,0,0.3)' : 'none' }}>{p.l}</span>
          </div>;
        })}
        <button onClick={e => { e.stopPropagation(); shuffle(); }} onPointerDown={e => e.stopPropagation()} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[clamp(40px,12vw,56px)] h-[clamp(40px,12vw,56px)] rounded-full flex items-center justify-center z-20 transition-all duration-150 active:scale-90" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))', backdropFilter: 'blur(16px)', border: '1.5px solid rgba(212,175,55,0.25)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}><IconShuffle size={22} /></button>
      </div>
    </div>
  );
}

// ===== WORD GRID =====
function WordGrid({ words, foundWords, justFound, revealedLetters, onHintLetter }: { words: string[]; foundWords: string[]; justFound: string | null; revealedLetters: Record<string, number[]>; onHintLetter: (w: string, i: number) => void }) {
  const grouped = useMemo(() => { const g: Record<number, string[]> = {}; words.forEach(w => { const l = w.length; if (!g[l]) g[l] = []; g[l].push(w); }); return Object.entries(g).sort(([a], [b]) => +a - +b).map(([l, ws]) => ({ len: +l, words: ws })); }, [words]);
  const fc = foundWords.length, tc = words.length, pr = tc > 0 ? fc / tc : 0;
  return (
    <div className="w-full max-w-sm mx-auto space-y-2" dir="rtl">
      <div className="flex items-center gap-3 px-2"><div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }}><div className="h-full rounded-full transition-all duration-500" style={{ width: `${pr * 100}%`, background: 'linear-gradient(90deg, #d4af37, #10b981)', boxShadow: '0 0 10px rgba(16,185,129,0.4)' }} /></div><span className="text-amber-400/80 font-bold text-sm min-w-[45px] text-center">{toPersianNum(fc)}/{toPersianNum(tc)}</span></div>
      <div className="space-y-2 overflow-y-auto scrollbar-hide px-1" style={{ maxHeight: 'clamp(80px, 28vh, 240px)' }}>
        {grouped.map(({ len, words: gw }) => <div key={len} className="flex flex-wrap gap-1.5 justify-center">{gw.map(word => {
          const isF = foundWords.includes(word), isJ = justFound === word, rv = revealedLetters[word] || [];
          return <div key={word} className={`flex gap-0.5 rounded-xl px-1.5 py-1 transition-all ${isF ? 'border border-emerald-500/30' : 'border border-white/5'} ${isJ ? 'animate-word-found ring-2 ring-amber-400/50' : ''}`} style={{ background: isF ? 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(16,185,129,0.08))' : 'rgba(255,255,255,0.03)' }}>
            {word.split('').map((ch, i) => { const isR = rv.includes(i); return <div key={i} onClick={() => { if (!isF && !isR) onHintLetter(word, i); }} className={`rounded-lg flex items-center justify-center font-bold transition-all ${isF ? 'text-emerald-300' : isR ? 'text-amber-400' : 'bg-white/5 text-transparent cursor-pointer hover:bg-white/10 active:scale-90'}`} style={{ width:'clamp(22px,6.5vw,28px)', height:'clamp(26px,7.5vw,32px)', fontSize:'clamp(11px,3vw,14px)', ...(isJ ? { animation: `letter-pop 0.4s ${i * 0.06}s both` } : isR ? { background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)' } : {}) }}>{isF ? ch : isR ? ch : '—'}</div>; })}
            {isF && <span className="ml-0.5"><IconCheck size={12} /></span>}
          </div>;
        })}</div>)}
      </div>
    </div>
  );
}

// ===== MAIN APP =====
export default function App() {
  const [screen, setScreen] = useState<GameScreen>('start');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [levelData, setLevelData] = useState<Level | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [score, setScore] = useState(0);
  const [levelScore, setLevelScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);
  const [justFound, setJustFound] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [save, setSave] = useState(loadSave);
  const [revealedLetters, setRevealedLetters] = useState<Record<string, number[]>>({});
  const [showChest, setShowChest] = useState(false);
  const [chestAnim, setChestAnim] = useState<string | null>(null);
  const [chestCount, setChestCount] = useState(0);
  const [chapterUnlock, setChapterUnlock] = useState<{ chapter: number; bonus: number } | null>(null);
  const [showGreeting, setShowGreeting] = useState(true);
  const [isNight, setIsNight] = useState(false);

  const sound = useSound();
  const music = useMusic();
  const tid = useRef(0), pid = useRef(0);

  // Day/Night detection + greeting
  useEffect(() => {
    const h = new Date().getHours();
    const night = h >= 20 || h < 5;
    setIsNight(night);
    document.documentElement.dataset.theme = night ? 'night' : 'day';
    const s = loadSave(); setSave(s); setCurrentLevel(s.currentLevel); setScore(s.totalScore || 0); setChestCount(s.chestWords || 0); sound.setEnabled(s.soundEnabled);
    // Auto-dismiss greeting
    setTimeout(() => setShowGreeting(false), 3000);
  }, []);

  const toast = useCallback((t: string, tp: Toast['type']) => { const id = ++tid.current; setToasts(p => [...p, { id, text: t, type: tp }]); setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 1800); }, []);
  const spawn = useCallback((x: number, y: number, c = 5) => { const em = ['⭐', '✨', '💫', '🌟']; const np = Array.from({ length: c }, () => ({ id: ++pid.current, x: x + (Math.random() - .5) * 80, y: y + (Math.random() - .5) * 40, emoji: em[~~(Math.random() * em.length)] })); setParticles(p => [...p, ...np]); setTimeout(() => setParticles(p => p.filter(q => !np.find(r => r.id === q.id))), 1200); }, []);

  const startLevel = useCallback((lv: number) => {
    const d = getLevel(lv); if (!d) { toast('مرحله یافت نشد!', 'error'); return; }
    setLevelData(d); setCurrentLevel(lv); setSelectedIndices([]); setLevelScore(0); setHintsUsed(0); setStreak(0); setJustFound(null); setShaking(false); setShowConfetti(false); setRevealedLetters({});
    const s = loadSave(); setScore(s.totalScore || 0); setChestCount(s.chestWords || 0);
    setFoundWords((getFoundWords(lv)).filter(w => d.words.includes(w)));
    setScreen('playing');
  }, [toast]);

  const handleSelect = useCallback((i: number) => { if (i < -99) { setSelectedIndices(p => p.slice(0, -1)); sound.playDeselect(); return; } setSelectedIndices(p => { if (p.includes(i)) return p; sound.playSelect(); return [...p, i]; }); }, [sound]);

  const isValidBonusWord = useCallback((word: string) => {
    if (!levelData) return false;
    if (levelData.words.includes(word)) return false;
    return dictionary.includes(word);
  }, [levelData]);

  const handleRelease = useCallback(() => {
    if (!levelData || selectedIndices.length < 2) { setSelectedIndices([]); return; }
    const word = selectedIndices.map(i => levelData.letters[i]).join('');
    setSelectedIndices([]);

    if (levelData.words.includes(word)) {
      if (foundWords.includes(word)) { toast('قبلاً پیدا شده!', 'info'); return; }
      const nf = [...foundWords, word]; setFoundWords(nf); setJustFound(word); setTimeout(() => setJustFound(null), 1000);
      const ns = streak + 1; setStreak(ns);
      const ws = word.length * 100 + (ns > 1 ? ns * 50 : 0);
      setLevelScore(p => p + ws); setScore(p => p + ws);
      const sv = loadSave(); sv.totalScore = (sv.totalScore || 0) + ws; saveSave(sv);
      saveFoundWords(levelData.id, nf);
      if (ns > 1) { sound.playCombo(ns); toast(`کمبو ×${toPersianNum(ns)}! +${toPersianNum(ws)}`, 'combo'); }
      else { sound.playCorrect(); toast(`آفرین! +${toPersianNum(ws)}`, 'success'); }
      spawn(innerWidth / 2, innerHeight / 2);
      if (nf.length === levelData.words.length) {
        setTimeout(() => {
          sound.playLevelComplete(); setShowConfetti(true);
          completeLevelSave(levelData.id, hintsUsed === 0 ? 3 : hintsUsed <= 2 ? 2 : 1, hintsUsed, levelScore + ws);
          const ns2 = loadSave(); setSave(ns2);
          const cc = Object.keys(ns2.completedLevels).length;
          if (cc > 0 && cc % 50 === 0) { const ch = cc / 50, bonus = 300 + (ch - 1) * 10; const sv2 = loadSave(); sv2.totalScore = (sv2.totalScore || 0) + bonus; saveSave(sv2); setScore(p => p + bonus); setChapterUnlock({ chapter: ch, bonus }); }
          else setScreen('complete');
        }, 600);
      }
    } else if (isValidBonusWord(word)) {
      // Chest word - check globally persisted history
      if (isWordInChestHistory(word)) { toast('قبلاً رفته تو صندوقچه!', 'info'); return; }
      setStreak(0);
      const { chestWords } = addChestWord(word, CHEST_WORD_SCORE);
      setChestCount(chestWords);
      setChestAnim(word); sound.playHint();
      toast(`«${word}» رفت تو صندوقچه!`, 'info');
      setTimeout(() => setChestAnim(null), 1200);
    } else {
      setStreak(0); setShaking(true); sound.playWrong(); toast('کلمه نادرست', 'error');
      setTimeout(() => setShaking(false), 500);
    }
  }, [levelData, selectedIndices, foundWords, streak, sound, toast, spawn, hintsUsed, levelScore, isValidBonusWord]);

  const handleHintLetter = useCallback((word: string, ci: number) => {
    if (!levelData) return;
    if (score < HINT_COST) { toast(`سکه کافی نیست! (${toPersianNum(HINT_COST)} لازم)`, 'error'); sound.playWrong(); return; }
    setScore(p => p - HINT_COST);
    const sv = loadSave(); sv.totalScore = Math.max(0, (sv.totalScore || 0) - HINT_COST); saveSave(sv);
    setHintsUsed(p => p + 1);
    setRevealedLetters(p => { const c = p[word] || []; if (c.includes(ci)) return p; return { ...p, [word]: [...c, ci] }; });
    sound.playHint(); toast(`−${toPersianNum(HINT_COST)} سکه`, 'info');
    spawn(innerWidth / 2, innerHeight * .3, 3);
    const revealed = [...(revealedLetters[word] || []), ci];
    if (revealed.length === word.length && !foundWords.includes(word)) {
      setTimeout(() => {
        const nf = [...foundWords, word]; setFoundWords(nf); setJustFound(word); setTimeout(() => setJustFound(null), 1000);
        saveFoundWords(levelData.id, nf); sound.playCorrect(); toast('کلمه آشکار شد!', 'success');
        if (nf.length === levelData.words.length) setTimeout(() => { sound.playLevelComplete(); setShowConfetti(true); completeLevelSave(levelData.id, 1, hintsUsed + 1, levelScore); setSave(loadSave()); setScreen('complete'); }, 600);
      }, 300);
    }
  }, [levelData, score, foundWords, revealedLetters, sound, toast, spawn, hintsUsed, levelScore]);

  const handleClaimChest = useCallback(() => {
    const amount = claimChest(); setScore(p => p + amount); setChestCount(0); setShowChest(false);
    toast(`${toPersianNum(amount)} سکه برداشت شد!`, 'success'); sound.playLevelComplete(); spawn(innerWidth / 2, innerHeight / 2, 8); setSave(loadSave());
  }, [toast, sound, spawn]);

  const goHome = useCallback(() => { setScreen('start'); const s = loadSave(); setSave(s); setScore(s.totalScore || 0); setChestCount(s.chestWords || 0); }, []);
  const goSelect = useCallback(() => { setScreen('select'); setSave(loadSave()); }, []);

  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (screen === 'playing') setScreen('paused'); else if (screen === 'paused') setScreen('playing'); } }; addEventListener('keydown', h); return () => removeEventListener('keydown', h); }, [screen]);

  return (
    <div className="fixed inset-0 overflow-hidden select-none" dir="rtl" style={{ touchAction: 'none', width: '100%', height: '100%' }}>
      {/* Eslimi background for screens that don't have their own */}
      {(screen === 'paused' || screen === 'complete' || screen === 'chest' || screen === 'chapter') && <div className="eslimi-bg" />}

      <Toasts ts={toasts} />
      <Particles ps={particles} />
      <Confetti active={showConfetti} />
      <ChestWordAnim word={chestAnim} active={!!chestAnim} />

      {/* Greeting Splash */}
      {showGreeting && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md" style={{ zIndex: 60, animation: 'greetFade 3s ease-in-out forwards' }}>
          <div className="text-center px-8 animate-bounce-in">
            <img src="/images/logo.png" alt="" className="w-20 h-20 rounded-2xl mx-auto mb-4 object-cover animate-bounce-subtle" style={{ boxShadow: '0 8px 30px rgba(0,0,0,.5)' }} onError={e=>{(e.target as HTMLImageElement).style.display='none';}} />
            <p className="text-2xl font-black text-white mb-2" style={{ textShadow: '0 0 20px rgba(212,175,55,.4)' }}>
              {isNight ? 'شب بخیر دوست من 🌙' : 'سلام آفتاب ☀️'}
            </p>
            <p className="text-white/60 text-sm">
              {isNight ? 'خوش اومدی! امشب هم یه کم واژه بسازیم؟' : 'صبحت بخیر! آماده‌ای برای سفر؟'}
            </p>
          </div>
        </div>
      )}

      {chapterUnlock && <ChapterUnlock chapter={chapterUnlock.chapter} bonus={chapterUnlock.bonus} onClose={() => { setChapterUnlock(null); setScreen('complete'); }} />}
      {showChest && <ChestScreen onBack={() => setShowChest(false)} save={loadSave()} onClaim={handleClaimChest} />}

      {/* ===== START SCREEN ===== */}
      {screen === 'start' && (
        <div className="fixed inset-0" style={{ zIndex: 20 }}>
          <div className="eslimi-bg" />
          <img src="/images/start-bg.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none" style={{ zIndex: 1 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div className="relative h-full flex flex-col items-center justify-center px-4 safe-top safe-bottom" style={{ zIndex: 2 }}>
            <div className="animate-slide-down flex flex-col items-center w-full" style={{ gap: 'clamp(8px,2.5vh,18px)', maxWidth: 'min(400px,92vw)' }}>
              <div className="animate-float">
                <img src="/images/logo.png" alt="ابومیرزا" className="object-cover" style={{ width: 'clamp(100px,28vw,150px)', height: 'clamp(100px,28vw,150px)', borderRadius: '32px', boxShadow: '0 12px 40px rgba(0,0,0,.5), 0 0 0 4px rgba(255,255,255,.15)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <div className="text-center">
                <h1 className="display text-[clamp(32px,9vw,48px)] text-white mb-1" style={{ textShadow: '0 0 30px rgba(212,175,55,0.4), 0 4px 8px rgba(0,0,0,0.6)' }}>ابومیرزا</h1>
                <p className="text-amber-400/80 text-sm font-medium">بازی کلمات فارسی</p>
                <p className="text-white/30 text-xs mt-1">{toPersianNum(totalLevels)} مرحله</p>
              </div>
              {checkDailyBonus() && <button onClick={() => { claimDailyBonus(); setScore(loadSave().totalScore || 0); setSave(loadSave()); toast('۵۰۰ سکه دریافت شد!', 'success'); }} className="w-full py-3 rounded-2xl text-white font-bold text-base btn-3d animate-pulse-gold flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }}><IconGift size={20} /> هدیه روزانه — ۵۰۰ سکه!</button>}
              <div className="w-full" style={{ display:'flex', flexDirection:'column', gap:'clamp(6px,1.5vh,12px)' }}>
                <button onClick={() => startLevel(save.currentLevel)} className="w-full rounded-2xl text-white font-bold btn-3d flex items-center justify-center gap-2" style={{ padding:'clamp(10px,3vh,16px)', fontSize:'clamp(14px,4vw,18px)', background:'linear-gradient(135deg, #d4af37, #f59e0b)', boxShadow:'0 6px 20px rgba(212,175,55,0.4)' }}><IconPlay size={18} /> ادامه — مرحله {toPersianNum(save.currentLevel)}</button>
                <button onClick={goSelect} className="w-full rounded-2xl glass text-white font-bold btn-3d flex items-center justify-center gap-2" style={{ padding:'clamp(8px,2.5vh,14px)', fontSize:'clamp(13px,3.5vw,16px)' }}><IconGrid size={16} /> انتخاب مرحله</button>
                <div className="flex gap-2">
                  <button onClick={() => setScreen('speed')} className="flex-1 rounded-2xl font-bold btn-3d text-white flex items-center justify-center gap-1" style={{ padding:'clamp(8px,2.5vh,14px)', fontSize:'clamp(11px,3vw,14px)', background:'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(168,85,247,0.15))', border:'1px solid rgba(139,92,246,0.3)' }}><IconSpeed size={14} /> سرعتی</button>
                  <button onClick={() => setScreen('wordfinder')} className="flex-1 rounded-2xl font-bold btn-3d text-white flex items-center justify-center gap-1" style={{ padding:'clamp(8px,2.5vh,14px)', fontSize:'clamp(11px,3vw,14px)', background:'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(255,215,0,0.1))', border:'1px solid rgba(212,175,55,0.3)' }}><IconSearch size={14} /> واژه‌یاب</button>
                </div>
                <button onClick={() => setScreen('jadval')} className="w-full rounded-2xl font-bold btn-3d text-white flex items-center justify-center gap-1.5" style={{ padding:'clamp(8px,2.5vh,14px)', fontSize:'clamp(11px,3vw,14px)', background:'linear-gradient(135deg, rgba(20,184,166,0.25), rgba(13,148,136,0.12))', border:'1px solid rgba(20,184,166,0.3)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                  جدول کلمات
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setScreen('howto')} className="flex-1 rounded-2xl glass text-white/60 font-medium btn-3d flex items-center justify-center gap-1" style={{ padding:'clamp(6px,2vh,12px)', fontSize:'clamp(10px,2.8vw,13px)' }}><IconHelp size={13} color="rgba(255,255,255,0.6)" /> راهنما</button>
                  <button onClick={() => setScreen('about')} className="flex-1 rounded-2xl glass text-white/60 font-medium btn-3d flex items-center justify-center gap-1" style={{ padding:'clamp(6px,2vh,12px)', fontSize:'clamp(10px,2.8vw,13px)' }}><IconInfo size={13} color="rgba(255,255,255,0.6)" /> درباره</button>
                </div>
              </div>
              {/* Audio controls */}
              <div className="flex items-center justify-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-white/25" style={{ fontSize: 'clamp(9px,2.5vw,11px)' }}><IconCoin size={11} color="rgba(255,255,255,0.25)" /><span>{toPersianNum(score)} سکه</span></div>
                <button onClick={music.toggle} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all" style={{ fontSize: 'clamp(9px,2.5vw,11px)', background: music.playing ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${music.playing ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.06)'}`, color: music.playing ? '#d4af37' : 'rgba(255,255,255,0.3)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                  <span>{music.playing ? 'موسیقی' : 'خاموش'}</span>
                  {music.playing && <span style={{ fontSize: '8px' }}>♪</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== LEVEL SELECT = IRAN MAP ===== */}
      {screen === 'select' && <IranMap currentLevel={save.currentLevel} completedLevels={save.completedLevels} onSelectLevel={startLevel} onBack={goHome} isNight={isNight} />}

      {/* ===== INFO SCREENS ===== */}
      {screen === 'howto' && <HowToScreen onBack={goHome} />}
      {screen === 'about' && <AboutScreen onBack={goHome} />}
      {screen === 'wordfinder' && <div className="fixed inset-0" style={{ zIndex: 10 }}><div className="eslimi-bg" /><div className="relative h-full overflow-y-auto" style={{ zIndex: 2 }}><WordFinder onBack={goHome} /></div></div>}
      {screen === 'jadval' && <CrosswordGame onBack={goHome} />}
      {screen === 'speed' && <SpeedMode onBack={goHome} onAddScore={s => { const sv = loadSave(); sv.totalScore = (sv.totalScore || 0) + s; saveSave(sv); setScore(sv.totalScore); setSave(loadSave()); if (s > 0) toast(`${toPersianNum(s)} سکه اضافه شد!`, 'success'); }} />}

      {/* ===== GAME SCREEN (with premium fixed background) ===== */}
      {screen === 'playing' && levelData && (
        <div className="game-screen flex flex-col" style={{ zIndex: 10 }}>
          {/* eslimi bg is applied via CSS .game-screen::after */}
          {/* HUD */}
          <div className="w-full flex items-center justify-between safe-top relative" style={{ zIndex: 2, padding: 'clamp(4px,1.5vw,8px) clamp(8px,2vw,14px)' }}>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setScreen('paused')} className="rounded-xl glass flex items-center justify-center btn-3d" style={{ width: 'clamp(32px,9vw,40px)', height: 'clamp(32px,9vw,40px)' }}><IconBack size={16} /></button>
              <div className="glass rounded-xl px-2 py-1"><span className="text-amber-400 font-bold" style={{ fontSize: 'clamp(10px,3vw,13px)' }}>مرحله {toPersianNum(currentLevel)}</span><span className="text-white/30 block" style={{ fontSize: 'clamp(7px,2vw,9px)' }}>{getCityForLevel(currentLevel).cityName}</span></div>
            </div>
            <div className="flex items-center gap-1">
              {streak > 1 && <div className="glass rounded-lg px-1.5 py-0.5 animate-bounce-subtle flex items-center gap-0.5"><IconFire size={12} /><span className="text-orange-400 font-bold" style={{ fontSize: 'clamp(9px,2.5vw,12px)' }}>×{toPersianNum(streak)}</span></div>}
              <div className="rounded-xl flex items-center gap-1" style={{ padding: 'clamp(4px,1vw,8px) clamp(8px,2vw,12px)', background: 'linear-gradient(135deg,rgba(212,175,55,0.2),rgba(255,215,0,0.1))', border: '1px solid rgba(212,175,55,0.3)' }}>
                <IconCoin size={14} /><span className="text-amber-300 font-extrabold" style={{ fontSize: 'clamp(12px,3.5vw,16px)' }}>{toPersianNum(score)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ChestButton count={chestCount} onClick={() => setShowChest(true)} />
              <button onClick={() => setScreen('paused')} className="rounded-xl glass flex items-center justify-center btn-3d" style={{ width: 'clamp(32px,9vw,40px)', height: 'clamp(32px,9vw,40px)' }}><IconPause size={14} /></button>
            </div>
          </div>
          {/* Compact info bar: hint cost + city */}
          <div className="flex items-center justify-center gap-2 px-3 relative" style={{ zIndex: 2, paddingTop: 'clamp(2px,0.5vh,4px)', paddingBottom: 'clamp(2px,0.5vh,4px)' }}>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold" style={{ fontSize: 'clamp(8px,2.2vw,10px)', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.12)' }}>
              <IconHint size={10} /><span className="text-amber-400/60">هر حرف:</span><span className="text-amber-300">{toPersianNum(HINT_COST)}</span><IconCoin size={8} />
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg font-medium text-white/70" style={{ fontSize: 'clamp(8px,2.2vw,10px)', background: 'rgba(0,212,255,.08)', border: '1px solid rgba(0,212,255,.15)' }}>
              <span style={{ fontSize: 'clamp(8px,2.5vw,11px)' }}>📍</span><span>{getCityForLevel(currentLevel).cityName}</span>
            </div>
          </div>
          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-between py-1 px-3 overflow-hidden relative" style={{ zIndex: 2 }}>
            <div className="w-full flex-shrink-0"><WordGrid words={levelData.words} foundWords={foundWords} justFound={justFound} revealedLetters={revealedLetters} onHintLetter={handleHintLetter} /></div>
            <div className="circle-stage flex-shrink-0 safe-bottom"><LetterCircle letters={levelData.letters} selectedIndices={selectedIndices} onSelect={handleSelect} onRelease={handleRelease} onShuffle={() => sound.playShuffle()} shaking={shaking} /></div>
          </div>
        </div>
      )}

      {/* ===== PAUSE ===== */}
      {screen === 'paused' && (() => {
        const pauseMsgs = [
          { title: 'خسته شدی؟ 😴', sub: 'یه چای بخور برگرد!' },
          { title: 'چرا وایسادی؟ 🤔', sub: 'کلمات منتظرتن!' },
          { title: 'چی شد فرزندم؟ 👴', sub: 'ابومیرزا نگرانته!' },
          { title: 'کجا رفتی؟! 😄', sub: 'حروف دلشون تنگ شده!' },
          { title: 'استراحت؟ ☕', sub: 'باشه ولی زود برگرد!' },
          { title: 'فرار نکن! 😂', sub: 'هنوز کلمه مونده!' },
          { title: 'یه نفس بکش! 💨', sub: 'بعدش بیا ادامه بدیم' },
          { title: 'تایم اوت! ⏰', sub: 'مغزت داغ کرده؟' },
          { title: 'رفتی آب بخوری؟ 🥤', sub: 'خوبه، هیدراته باش!' },
          { title: 'هوم... 🧐', sub: 'داری فکر می‌کنی یا تنبلی؟' },
          { title: 'سلااام! 👋', sub: 'هنوز اینجایی دیگه؟' },
          { title: 'پاز؟ واقعاً؟ 😏', sub: 'نکنه جواب رو داری سرچ می‌کنی!' },
        ];
        const msg = pauseMsgs[Math.floor(Math.random() * pauseMsgs.length)];
        return (
          <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 30, background: 'rgba(0,0,0,.65)', WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)' }}>
            <div className="glass-strong rounded-3xl w-[min(320px,90vw)] mx-4 animate-slide-up text-center" style={{ padding: 'clamp(20px,5vw,32px)' }}>
              <IconPause size={32} color="#d4af37" />
              <h2 className="display text-[clamp(18px,5vw,24px)] text-white mt-2 mb-1">{msg.title}</h2>
              <p className="text-white/50 text-[clamp(11px,3vw,14px)] mb-5">{msg.sub}</p>
              <div className="space-y-2.5">
                <button onClick={() => setScreen('playing')} className="w-full rounded-2xl text-white font-bold btn-3d flex items-center justify-center gap-2" style={{ padding: 'clamp(10px,3vw,14px)', fontSize: 'clamp(14px,4vw,18px)', background: 'linear-gradient(135deg, #d4af37, #f59e0b)' }}><IconPlay size={18} /> بزن بریم!</button>
                <button onClick={() => startLevel(currentLevel)} className="w-full rounded-2xl glass text-white font-medium btn-3d border border-white/10 flex items-center justify-center gap-2" style={{ padding: 'clamp(10px,3vw,14px)', fontSize: 'clamp(12px,3.5vw,15px)' }}><IconRefresh size={16} /> از اول</button>
                <button onClick={goHome} className="w-full rounded-2xl text-white/50 font-medium btn-3d flex items-center justify-center gap-2" style={{ padding: 'clamp(10px,3vw,14px)', fontSize: 'clamp(12px,3.5vw,15px)' }}><IconHome size={16} color="rgba(255,255,255,0.5)" /> خونه</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===== COMPLETE ===== */}
      {screen === 'complete' && (() => {
        const earnedStars = hintsUsed === 0 ? 3 : hintsUsed <= 2 ? 2 : 1;
        return <>
          <WinConfetti />
          <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 30, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(12px)' }}>
            {/* Rotating golden rays */}
            <div className="win-rays" />
            {/* Card */}
            <div className="win-card relative rounded-3xl w-[min(320px,90vw)] mx-4 text-center" style={{ padding: 'clamp(16px,4vw,28px)', background: 'linear-gradient(180deg, rgba(20,20,50,.95), rgba(10,10,30,.98))', border: '2px solid rgba(212,175,55,.3)', boxShadow: '0 20px 60px rgba(0,0,0,.5), 0 0 40px rgba(212,175,55,.1)' }}>
              {/* Floating sparkles inside card */}
              {[0,1,2,3,4].map(i => <div key={i} className="absolute text-amber-400/40 text-xs" style={{ left: `${15+i*16}%`, top: `${20+i*12}%`, animation: `float-up ${2+i*.5}s ease-out infinite`, animationDelay: `${i*.4}s` }}>✦</div>)}

              <h2 className="display text-4xl mb-1" style={{ background: 'linear-gradient(135deg, #ffd700, #ff8c42)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 16px rgba(255,215,0,.4))', animation: 'bounce-subtle 2s infinite' }}>آفرین!</h2>
              <p className="text-white/60 mb-4 text-sm">مرحله {toPersianNum(currentLevel)} تکمیل شد</p>

              {/* Stars with pop animation */}
              <div className="flex justify-center gap-4 mb-5">
                {[0, 1, 2].map(i => (
                  <div key={i} className={`win-star ${i < earnedStars ? 'on' : ''}`}
                    style={{ animationDelay: `${0.3 + i * 0.5}s` }}>
                    <IconStar size={38} filled={i < earnedStars} color={i < earnedStars ? '#fbbf24' : 'rgba(255,255,255,.12)'} />
                  </div>
                ))}
              </div>

              {/* Score */}
              <div className="rounded-2xl p-3 mb-5 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg,rgba(212,175,55,.15),rgba(255,215,0,.08))', border: '1px solid rgba(212,175,55,.25)', boxShadow: '0 0 20px rgba(212,175,55,.1)' }}>
                <IconCoin size={22} />
                <span className="text-amber-300 font-extrabold text-2xl display">{toPersianNum(levelScore)}</span>
              </div>

              {/* Buttons */}
              <div className="space-y-2.5">
                <button onClick={() => { setShowConfetti(false); const nl = currentLevel + 1; if (nl <= totalLevels) startLevel(nl); else { toast('همه مراحل تموم شد!', 'success'); goHome(); } }}
                  className="w-full py-3.5 rounded-2xl text-white font-bold text-lg btn3d shine flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #059669, #10b981)', boxShadow: '0 6px 24px rgba(16,185,129,.4)' }}>
                  <IconPlay size={18} /> مرحله بعد
                </button>
                <div className="flex gap-2">
                  <button onClick={() => { setShowConfetti(false); goSelect(); }} className="flex-1 py-2.5 rounded-xl glass text-white/60 font-medium btn3d flex items-center justify-center gap-1"><IconGrid size={15} /></button>
                  <button onClick={() => { setShowConfetti(false); goHome(); }} className="flex-1 py-2.5 rounded-xl glass text-white/60 font-medium btn3d flex items-center justify-center gap-1"><IconHome size={15} /></button>
                </div>
              </div>
            </div>
          </div>
        </>;
      })()}
    </div>
  );
}

// ===== CHEST BUTTON (in HUD) =====
function ChestButton({ count, onClick }: { count: number; onClick: () => void }) {
  const isFull = count >= CHEST_CLAIM_THRESHOLD;
  const [bump, setBump] = useState(false);
  useEffect(() => { if (count > 0) { setBump(true); const t = setTimeout(() => setBump(false), 600); return () => clearTimeout(t); } }, [count]);
  return (
    <button onClick={onClick} className={`relative ${bump ? 'animate-chest-shake' : ''}`} style={ isFull ? { animation: 'chestFull 1.1s ease-in-out infinite', filter: 'drop-shadow(0 0 14px rgba(255,214,10,.7))' } : { animation: 'chestIdle 12s ease-in-out infinite' }}>
      <svg viewBox="0 0 64 64" className="w-10 h-10" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.4))' }}>
        <ellipse cx="32" cy="58" rx="24" ry="6" fill="rgba(255,214,10,.2)"/>
        <rect x="8" y="26" width="48" height="28" rx="6" fill="#8a5a2b" stroke="#3e2a12" strokeWidth="3"/>
        <path d="M8 30 C8 14 24 8 32 8 C40 8 56 14 56 30 L56 32 L8 32 Z" fill="#a06a35" stroke="#3e2a12" strokeWidth="3"/>
        <rect x="8" y="28" width="48" height="6" fill="#ffd60a" stroke="#3e2a12" strokeWidth="2"/>
        <rect x="28" y="26" width="8" height="14" rx="2" fill="#ffd60a" stroke="#3e2a12" strokeWidth="2"/>
        <circle cx="32" cy="33" r="2" fill="#3e2a12"/>
      </svg>
      {count > 0 && <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1" style={{ background: isFull ? 'linear-gradient(135deg,#ffd700,#f59e0b)' : 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: isFull ? '0 0 10px rgba(255,214,10,.7)' : '0 0 6px rgba(239,68,68,.5)', animation: isFull ? 'badgePulse 1s infinite' : 'none', color: isFull ? '#1a1209' : '#fff' }}>{count > 99 ? '99+' : count}</div>}
    </button>
  );
}

// (Level select moved to IranMap component)

// ===== HOW TO / ABOUT =====
function HowToScreen({ onBack }: { onBack: () => void }) {
  const items = [
    { I: <IconPlay size={24} color="#10b981" />, t: 'کشیدن حروف', d: 'انگشتت رو روی حروف بکش تا کلمه بسازی.' },
    { I: <IconHint size={24} />, t: 'راهنمای حرفی', d: `روی هر خونه خالی بزن (${toPersianNum(HINT_COST)} سکه).` },
    { I: <IconChest size={24} />, t: 'صندوقچه', d: 'کلمات فارسی خارج مرحله تو صندوقچه جمع میشن!' },
    { I: <IconSpeed size={24} />, t: 'بازی سرعتی', d: 'تو ۱۵ ثانیه کلمات رو پیدا کن!' },
    { I: <IconTrophy size={24} />, t: 'فصل‌ها', d: 'هر ۵۰ مرحله فصل جدید + جایزه سکه!' },
    { I: <IconSearch size={24} />, t: 'واژه‌یاب', d: 'ابزار پیدا کردن کلمات از حروف دلخواه.' },
  ];
  return (
    <div className="fixed inset-0 flex flex-col overflow-y-auto" style={{ zIndex: 20 }}>
      <div className="eslimi-bg" />
      <div className="flex items-center justify-between px-4 py-3 safe-top relative" style={{ zIndex: 2 }}>
        <button onClick={onBack} className="w-10 h-10 rounded-xl glass flex items-center justify-center btn3d"><IconBack /></button>
        <h2 className="text-white display text-lg">راهنمای بازی</h2>
        <div className="w-10" />
      </div>
      <div className="flex-1 px-4 pb-8 max-w-md mx-auto relative" style={{ zIndex: 2 }} dir="rtl">
        <div className="space-y-3">
          {items.map((x, i) => (
            <div key={i} className="glass rounded-2xl p-4 flex gap-3 items-start btn3d"
              style={{ animation: `slide-up .5s ease-out ${i * 0.08}s both` }}>
              <div className="flex-shrink-0 mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(212,175,55,.15), rgba(212,175,55,.05))', border: '1px solid rgba(212,175,55,.2)' }}>
                {x.I}
              </div>
              <div>
                <h3 className="text-amber-400 font-bold text-sm mb-0.5">{x.t}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{x.d}</p>
              </div>
            </div>
          ))}
          <div className="glass rounded-2xl p-3 text-center" style={{ animation: 'slide-up .5s ease-out .5s both' }}>
            <p className="text-white/20 text-[10px]" style={{ background: 'linear-gradient(90deg, #d4af37, #c77dff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pixelprofix & Mansour Nademi</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="fixed inset-0 flex flex-col overflow-y-auto" style={{ zIndex: 20 }} dir="rtl">
      <div className="eslimi-bg" />
      <div className="flex items-center justify-between px-4 py-3 safe-top relative" style={{ zIndex: 2 }} dir="ltr">
        <button onClick={onBack} className="w-10 h-10 rounded-xl glass flex items-center justify-center btn3d"><IconBack /></button>
        <h2 className="text-white font-bold display text-lg">درباره ابومیرزا</h2>
        <div className="w-10" />
      </div>
      <div className="flex-1 px-4 pb-10 max-w-md mx-auto relative" style={{ zIndex: 2 }}>
        {/* Logo with 3D sway + halo */}
        <div className="flex flex-col items-center mb-5 mt-2" style={{ perspective: '800px' }}>
          <div style={{ animation: 'logoSway 4s ease-in-out infinite, glowPulse 3s infinite' }}>
            <img src="/images/logo.png" alt="ابومیرزا" className="w-24 h-24 rounded-3xl mb-3 object-cover shine" style={{ boxShadow: '0 8px 30px rgba(0,0,0,.5), 0 0 30px rgba(212,175,55,.2), 0 0 0 3px rgba(255,255,255,.1)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <h2 className="display text-2xl text-white">ابومیرزا</h2>
          <p className="text-amber-400/70 text-sm">نسخه ۲.۰</p>
        </div>

        {/* AI Made */}
        <div className="glass rounded-2xl p-4 mb-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,.3), rgba(168,85,247,.15))' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#a855f7"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 110 2h-1.07A7 7 0 0113 22v-1a1 1 0 112 0v.93A5 5 0 0019 17a5 5 0 00-5-5h-4a5 5 0 00-5 5 5 5 0 004 4.93V22a1 1 0 112 0v1a7 7 0 01-6.93-6H3a1 1 0 110-2h1a7 7 0 017-7h1V5.73A2 2 0 0112 2z"/></svg>
            </div>
            <div>
              <h3 className="text-purple-300 font-bold text-sm mb-1">ساخته‌شده با هوش مصنوعی</h3>
              <p className="text-white/50 text-xs leading-relaxed">این بازی در کمتر از یک روز، تماماً توسط هوش مصنوعی طراحی، کدنویسی و خلق شده است.</p>
              <p className="text-white/30 text-[10px] mt-1">تاریخ خلق: ۲۰ مرداد ۱۴۰۵ — 11 August 2026</p>
            </div>
          </div>
        </div>

        {/* Updates */}
        <div className="glass rounded-2xl p-4 mb-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,.3), rgba(52,211,153,.15))' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#34d399"><path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
            </div>
            <h3 className="text-emerald-300 font-bold text-sm">آپدیت‌های پیشِ رو</h3>
          </div>
          <div className="space-y-2 text-white/50 text-xs leading-relaxed">
            {[
              'مراحل بی‌نهایت — بدون پایان، تا هر جا دلت بخواد!',
              'هوش مصنوعیِ همراه — سبک بازی‌ات رو می‌فهمه و سختی رو تنظیم می‌کنه',
              'تشخیص هوشمند سختی — آسان / نرمال / سخت',
              'صندوقچه واژه‌ها — کلمات اضافه رو جمع کن، جایزه بگیر',
              'واژه‌یاب حرفه‌ای با هزاران کلمه',
              'سفر به ایران — هر ۱۰۰ مرحله یه شهر جدید با نشان یادگاری',
              'حالت ضرب‌المثل و چالش روزانه',
              'فروشگاه ظاهر: پوست‌ها، پس‌زمینه‌ها و افکت‌های جدید',
              'رویدادهای مناسبتی: نوروز، یلدا و...',
              'حالت دو نفره و رقابت با دوستان',
              'ذخیره ابری و پروفایل بازیکن',
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="text-emerald-400/60 mt-0.5 flex-shrink-0">•</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Credits */}
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-white/30 text-xs mb-2">Made with ❤ by AI</p>
          <p className="text-amber-400 font-bold text-base">PIXELPROFIX</p>
          <p className="text-white/30 text-[10px] mt-1">کاملاً رایگان</p>
        </div>
      </div>
    </div>
  );
}
