import { useState } from 'react';
import { dictionaryNorm, DICT_SIZE } from '../data/dictionary';

const FA = '۰۱۲۳۴۵۶۷۸۹';
const fa = (n: number | string) => String(n).replace(/\d/g, (d) => FA[+d]);
const norm = (w: string) =>
  w.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/‌/g, '')
    .replace(/ة/g, 'ه').replace(/أ|إ|آ/g, 'ا');

export default function WordFinder({ onBack }: { onBack: () => void }) {
  const [letters, setLetters] = useState('');
  const [len, setLen] = useState(0);
  const [results, setResults] = useState<string[]>([]);
  const [searched, setSearched] = useState(false);

  const onInput = (v: string) =>
    setLetters(v.replace(/[^؀-ۿ]/g, '').slice(0, 8));

  const build = () => {
    const ls = norm(letters).split('');
    if (ls.length < 2) { setResults([]); setSearched(true); return; }
    const counts: Record<string, number> = {};
    ls.forEach((c) => (counts[c] = (counts[c] || 0) + 1));
    const res: string[] = [];
    for (const item of dictionaryNorm) {
      if (len && item.n.length !== len) continue;
      if (item.n.length > ls.length) continue;
      const need: Record<string, number> = {};
      let ok = true;
      for (const ch of item.n) {
        need[ch] = (need[ch] || 0) + 1;
        if (need[ch] > (counts[ch] || 0)) { ok = false; break; }
      }
      if (ok) res.push(item.w);
    }
    res.sort((a, b) => b.length - a.length || a.localeCompare(b, 'fa'));
    setResults(res);
    setSearched(true);
  };

  const copy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(results.join('، '));
  };

  return (
    <div className="wf-screen" dir="rtl">
      <style>{css}</style>

      {/* Header */}
      <div className="wf-header">
        <button onClick={onBack} className="wf-back">←</button>
        <div className="wf-title-wrap">
          <div className="wf-title">🔤 واژه‌یاب</div>
          <div className="wf-sub">حروف رو بده تا همه کلمات واقعی رو پیدا کنم!</div>
        </div>
        <div className="wf-dict-badge">{fa(DICT_SIZE)} واژه</div>
      </div>

      {/* Letter input */}
      <div className="wf-wrap">
        <div className="wf-boxes">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}
              className={'wf-box' + (letters[i] ? ' filled' : '') + (i === letters.length ? ' caret' : '')}>
              {letters[i] || ''}
            </div>
          ))}
        </div>
        <input value={letters} onChange={(e) => onInput(e.target.value)}
          maxLength={8} className="wf-input" placeholder="حروف فارسی..." autoFocus />
      </div>

      {/* Actions */}
      <div className="wf-actions">
        <button className="wf-clear"
          onClick={() => { setLetters(''); setResults([]); setSearched(false); }}>✖</button>
        <div className="len-chips">
          <button className={'len-chip' + (len === 0 ? ' active' : '')}
            onClick={() => setLen(0)}>همه</button>
          {[2, 3, 4, 5, 6, 7, 8].map((l) => (
            <button key={l} className={'len-chip' + (len === l ? ' active' : '')}
              onClick={() => setLen(l)}>{fa(l)} حرفی</button>
          ))}
        </div>
      </div>

      {/* Build button */}
      <button className="wf-build" onClick={build} disabled={letters.length < 2}>
        <span className="wf-build-icon">🔍</span>
        <span>جستجو کن!</span>
      </button>

      {/* Results count */}
      {searched && (
        <div className={results.length > 0 ? 'wf-count success' : 'wf-count empty'}>
          {results.length > 0
            ? `🎉 ${fa(results.length)} کلمه واقعی پیدا شد!`
            : '😔 کلمه‌ای پیدا نشد. حروف بیشتری وارد کن.'}
        </div>
      )}

      {/* Results */}
      <div className="wf-results">
        {results.slice(0, 500).map((w, i) => (
          <div key={i} className="wf-word" style={{ animationDelay: `${Math.min(i * 0.02, 0.5)}s` }}>
            {w}
            <span className="wf-word-len">{fa(w.length)}</span>
          </div>
        ))}
      </div>

      {/* Copy button */}
      {results.length > 0 && (
        <button className="wf-copy" onClick={copy}>📋 کپی همه نتایج</button>
      )}
    </div>
  );
}

const css = `
.wf-screen{max-width:560px;margin:0 auto;padding:12px 14px 100px;font-family:Vazirmatn,Tahoma,sans-serif;color:#fff;min-height:100vh;position:relative;z-index:20}
.wf-header{display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-top:env(safe-area-inset-top,0)}
.wf-back{width:42px;height:42px;border-radius:14px;background:rgba(255,255,255,.08);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.1);color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .15s}
.wf-back:active{transform:scale(.93)}
.wf-title-wrap{flex:1;min-width:0}
.wf-title{font-size:24px;font-weight:900;background:linear-gradient(135deg,#ffd700,#ff8c42,#d4af37);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.wf-sub{font-size:11px;color:rgba(255,255,255,.55);margin-top:2px}
.wf-dict-badge{flex-shrink:0;padding:6px 12px;border-radius:12px;background:linear-gradient(135deg,rgba(212,175,55,.2),rgba(255,215,0,.1));border:1px solid rgba(212,175,55,.3);font-size:11px;font-weight:700;color:#ffd700}
.wf-wrap{position:relative;margin-bottom:14px}
.wf-boxes{display:grid;grid-template-columns:repeat(8,1fr);gap:5px}
.wf-box{aspect-ratio:1;border-radius:14px;background:rgba(255,255,255,.06);backdrop-filter:blur(20px);border:2px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#ffd700;transition:all .2s;box-shadow:inset 0 2px 8px rgba(0,0,0,.25)}
.wf-box.filled{background:linear-gradient(135deg,rgba(212,175,55,.25),rgba(255,140,66,.15));border-color:rgba(212,175,55,.5);box-shadow:0 0 18px rgba(212,175,55,.3),inset 0 1px 4px rgba(255,255,255,.1);transform:scale(1.04)}
.wf-box.caret{border-color:rgba(212,175,55,.6);animation:wfCaretBlink 1s infinite}
@keyframes wfCaretBlink{0%,100%{box-shadow:0 0 8px rgba(212,175,55,.2)}50%{box-shadow:0 0 22px rgba(212,175,55,.6)}}
.wf-input{position:absolute;inset:0;opacity:0;font-size:16px;border:none;outline:none;background:transparent;width:100%;height:100%;z-index:2}
.wf-actions{display:flex;gap:8px;margin-bottom:14px;align-items:center}
.wf-clear{width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,rgba(239,68,68,.2),rgba(220,38,38,.15));border:1px solid rgba(239,68,68,.35);color:#f87171;font-size:18px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .15s}
.wf-clear:active{transform:scale(.92)}
.len-chips{display:flex;gap:5px;overflow-x:auto;flex:1;padding:4px 0;scrollbar-width:none}
.len-chips::-webkit-scrollbar{display:none}
.len-chip{flex-shrink:0;padding:9px 14px;border-radius:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.7);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s}
.len-chip.active{background:linear-gradient(135deg,#d4af37,#f59e0b);color:#1a1a2e;border-color:transparent;box-shadow:0 4px 16px rgba(212,175,55,.4);font-weight:800}
.len-chip:active{transform:scale(.94)}
.wf-build{width:100%;padding:16px;border:none;border-radius:18px;font-family:inherit;font-size:17px;font-weight:800;color:#1a1a2e;cursor:pointer;background:linear-gradient(135deg,#d4af37,#ffd700,#f59e0b);box-shadow:0 6px 25px rgba(212,175,55,.4),inset 0 1px 2px rgba(255,255,255,.3);margin-bottom:14px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .15s}
.wf-build:disabled{opacity:.4;cursor:not-allowed}
.wf-build:active:not(:disabled){transform:translateY(2px);box-shadow:0 2px 12px rgba(212,175,55,.3)}
.wf-build-icon{font-size:22px}
.wf-count{text-align:center;font-size:14px;margin-bottom:12px;font-weight:700;padding:10px;border-radius:14px}
.wf-count.success{color:#ffd700;background:rgba(212,175,55,.1);border:1px solid rgba(212,175,55,.2)}
.wf-count.empty{color:#f87171;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.15)}
.wf-results{display:flex;flex-wrap:wrap;gap:7px;justify-content:center;padding-bottom:16px}
.wf-word{padding:8px 16px;border-radius:14px;background:linear-gradient(135deg,rgba(212,175,55,.12),rgba(255,215,0,.06));border:1px solid rgba(212,175,55,.2);font-size:15px;font-weight:600;color:#fff;animation:wfPopIn .35s cubic-bezier(.34,1.56,.64,1) both;position:relative;display:flex;align-items:center;gap:6px}
.wf-word-len{font-size:9px;color:rgba(212,175,55,.6);background:rgba(212,175,55,.1);padding:2px 5px;border-radius:6px;font-weight:700}
@keyframes wfPopIn{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
.wf-copy{display:block;margin:12px auto 0;padding:12px 28px;border-radius:14px;background:rgba(255,255,255,.08);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.12);color:#ffd700;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;transition:all .15s}
.wf-copy:active{transform:scale(.95)}
`;
