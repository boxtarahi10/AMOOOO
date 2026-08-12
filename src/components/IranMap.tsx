import { useState, useEffect, useRef } from 'react';
import { IRAN_ROUTE, CITY_ICONS, LEVELS_PER_CITY } from '../data/iranRoute';
import { toPersianNum } from '../data/levelUtils';
import { IconBack, IconStar } from './Icons';

interface Props {
  currentLevel: number;
  completedLevels: Record<number, { stars: number }>;
  onSelectLevel: (level: number) => void;
  onBack: () => void;
  isNight?: boolean;
}

export default function IranMap({ currentLevel, completedLevels, onSelectLevel, onBack }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const curCity = Math.min(Math.floor((currentLevel - 1) / LEVELS_PER_CITY), IRAN_ROUTE.length - 1);
  const [expanded, setExpanded] = useState<number | null>(null);
  const total = IRAN_ROUTE.length;

  // Scroll to current city on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const cards = scrollRef.current.querySelectorAll('[data-city]');
    const cur = cards[curCity] as HTMLElement;
    if (cur) setTimeout(() => cur.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  }, [curCity]);

  return (
    <div className="fixed inset-0 flex flex-col" style={{ zIndex: 20 }}>
      {/* BG - eslimi */}
      <div className="eslimi-bg" />

      {/* Header */}
      <div className="relative flex items-center justify-between px-4 py-3 safe-top" style={{ zIndex: 5 }}>
        <button onClick={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center btn-3d"
          style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.1)' }}>
          <IconBack size={16} />
        </button>
        <div className="text-center">
          <h1 className="text-white font-black text-lg">سفر در ایران</h1>
          <p className="text-amber-400/70 text-[10px] font-bold mt-0.5">
            {IRAN_ROUTE[curCity]} — شهر {toPersianNum(curCity + 1)} از {toPersianNum(total)}
          </p>
        </div>
        <div className="w-10" />
      </div>

      {/* City grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide relative px-3 pb-6" style={{ zIndex: 3 }}>
        <div className="grid grid-cols-3 gap-2.5 max-w-md mx-auto" style={{ direction: 'rtl' }}>
          {IRAN_ROUTE.map((name, i) => {
            const firstLv = i * LEVELS_PER_CITY + 1;
            const lastLv = (i + 1) * LEVELS_PER_CITY;
            const unlocked = firstLv <= currentLevel;
            const done = lastLv < currentLevel;
            const isCur = i === curCity;

            return (
              <div key={i} data-city={i} className="relative">
                <button
                  onClick={() => { if (unlocked) setExpanded(expanded === i ? null : i); }}
                  disabled={!unlocked}
                  className="w-full rounded-2xl flex flex-col items-center justify-center gap-1 py-3 px-1 transition-all duration-200 active:scale-95"
                  style={{
                    background: isCur
                      ? 'linear-gradient(145deg, #d4af37, #b8941e)'
                      : done
                        ? 'linear-gradient(145deg, rgba(16,185,129,.15), rgba(16,185,129,.08))'
                        : unlocked
                          ? 'rgba(255,255,255,.06)'
                          : 'rgba(255,255,255,.02)',
                    border: isCur
                      ? '2px solid #ffd700'
                      : done
                        ? '1.5px solid rgba(16,185,129,.35)'
                        : unlocked
                          ? '1.5px solid rgba(255,255,255,.1)'
                          : '1.5px solid rgba(255,255,255,.04)',
                    boxShadow: isCur
                      ? '0 0 24px rgba(212,175,55,.5), 0 4px 12px rgba(0,0,0,.3)'
                      : '0 2px 8px rgba(0,0,0,.15)',
                    opacity: unlocked ? 1 : .3,
                    filter: unlocked ? 'none' : 'grayscale(.8)',
                  }}
                >
                  {/* Icon */}
                  <span className="text-2xl leading-none" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.2))' }}>
                    {CITY_ICONS[i] || '📍'}
                  </span>

                  {/* City name - BIG & BOLD */}
                  <span className="font-black text-center leading-tight px-0.5" style={{
                    fontSize: 'clamp(11px, 3vw, 14px)',
                    color: isCur ? '#1a1209' : done ? '#6ee7b7' : '#fff',
                    textShadow: isCur ? 'none' : '0 1px 3px rgba(0,0,0,.4)',
                  }}>
                    {name}
                  </span>

                  {/* Status badges */}
                  {done && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#10b981"><polyline points="20 6 9 17 4 12" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      <span className="text-emerald-400 text-[8px] font-bold">تکمیل</span>
                    </div>
                  )}
                  {isCur && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <span className="text-[9px] font-bold" style={{ color: '#5c3d10' }}>📍 اینجایی</span>
                    </div>
                  )}
                  {!unlocked && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,.3)" className="mt-0.5">
                      <path d="M18 10V8c0-3.31-2.69-6-6-6S6 4.69 6 8v2H4v12h16V10h-2zM12 4c2.21 0 4 1.79 4 4v2H8V8c0-2.21 1.79-4 4-4z" />
                    </svg>
                  )}
                </button>

                {/* Pulsing ring for current */}
                {isCur && (
                  <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
                    border: '2px solid rgba(255,215,0,.4)',
                    animation: 'mapRing 2s ease-in-out infinite',
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Level select modal */}
      {expanded !== null && (
        <div className="fixed inset-0 flex items-center justify-center px-4" style={{ zIndex: 50, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setExpanded(null)}>
          <div className="w-full max-w-sm rounded-3xl p-5 animate-slide-up" onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(180deg, #141428 0%, #0c0c1e 100%)',
              border: '2px solid rgba(212,175,55,.3)',
              boxShadow: '0 20px 60px rgba(0,0,0,.6), 0 0 30px rgba(212,175,55,.1)',
            }}>
            {/* City header */}
            <div className="text-center mb-4">
              <span className="text-3xl">{CITY_ICONS[expanded] || '📍'}</span>
              <h2 className="text-white font-black text-xl mt-1">{IRAN_ROUTE[expanded]}</h2>
              <p className="text-amber-400/60 text-xs mt-0.5">
                مراحل {toPersianNum(expanded * LEVELS_PER_CITY + 1)} تا {toPersianNum(Math.min((expanded + 1) * LEVELS_PER_CITY, 2550))}
              </p>
            </div>

            {/* Level grid */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Array.from({ length: LEVELS_PER_CITY }, (_, j) => {
                const lv = expanded * LEVELS_PER_CITY + j + 1;
                if (lv > 2550) return null;
                const dn = !!completedLevels[lv];
                const ac = lv <= currentLevel;
                const isCurLv = lv === currentLevel;
                return (
                  <button key={lv} onClick={() => { if (ac) { onSelectLevel(lv); setExpanded(null); } }} disabled={!ac}
                    className="aspect-square rounded-xl flex flex-col items-center justify-center font-bold btn-3d transition-all"
                    style={{
                      fontSize: '12px',
                      background: dn
                        ? 'linear-gradient(145deg, rgba(16,185,129,.2), rgba(16,185,129,.08))'
                        : isCurLv
                          ? 'linear-gradient(145deg, rgba(212,175,55,.3), rgba(212,175,55,.15))'
                          : ac
                            ? 'rgba(255,255,255,.05)'
                            : 'rgba(255,255,255,.015)',
                      border: dn
                        ? '1.5px solid rgba(16,185,129,.4)'
                        : isCurLv
                          ? '1.5px solid rgba(212,175,55,.6)'
                          : '1.5px solid rgba(255,255,255,.06)',
                      color: dn ? '#6ee7b7' : isCurLv ? '#fbbf24' : ac ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.12)',
                      boxShadow: isCurLv ? '0 0 12px rgba(212,175,55,.3)' : 'none',
                    }}>
                    <span>{toPersianNum(lv)}</span>
                    {dn && completedLevels[lv] && (
                      <div className="flex gap-px mt-0.5">
                        {[1, 2, 3].map(s => (
                          <IconStar key={s} size={6} filled={s <= completedLevels[lv].stars}
                            color={s <= completedLevels[lv].stars ? '#fbbf24' : 'rgba(255,255,255,.08)'} />
                        ))}
                      </div>
                    )}
                    {!ac && (
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="rgba(255,255,255,.15)" className="mt-0.5">
                        <path d="M18 10V8c0-3.31-2.69-6-6-6S6 4.69 6 8v2H4v12h16V10h-2z" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Close */}
            <button onClick={() => setExpanded(null)}
              className="w-full py-2.5 rounded-xl text-white/50 text-sm font-medium btn-3d"
              style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}>
              بستن
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes mapRing {
          0%, 100% { transform: scale(1); opacity: .6; }
          50% { transform: scale(1.06); opacity: .2; }
        }
      `}</style>
    </div>
  );
}
