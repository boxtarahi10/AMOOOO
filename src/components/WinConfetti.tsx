import { useEffect, useRef, memo } from 'react';

export default memo(function WinConfetti() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext('2d')!;
    cv.width = innerWidth;
    cv.height = innerHeight;
    const cols = ['#ffd60a', '#ff2d75', '#00d4ff', '#16b979', '#c77dff', '#ff8c42'];
    const ps = Array.from({ length: 150 }, () => ({
      x: cv.width / 2 + (Math.random() - .5) * 60,
      y: cv.height / 3,
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -12 - 4,
      g: 0.4 + Math.random() * 0.2,
      w: 5 + Math.random() * 6,
      h: 7 + Math.random() * 8,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      c: cols[Math.floor(Math.random() * cols.length)],
    }));
    let f = 0;
    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      ps.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += p.g; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.globalAlpha = Math.max(0, 1 - f / 120);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      f++;
      if (f < 140) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, cv.width, cv.height);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60 }} />;
});
