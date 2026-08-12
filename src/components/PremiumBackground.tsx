import { memo, useMemo } from 'react';

// LIGHTWEIGHT version: no blur() on animated elements, fewer orbs, 
// uses only transform/opacity for GPU-accelerated animations
function PremiumBackgroundInner() {
  const orbs = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    left: 10 + (i * 15),
    size: 3 + (i % 3) * 2,
    dur: 10 + i * 3,
    delay: -i * 3,
    hue: [340, 265, 190, 150, 50, 300][i],
  })), []);

  return (
    <div className="pbg" aria-hidden="true">
      <div className="aurora" />
      <div className="pattern" />
      {orbs.map((o, i) => (
        <span key={i} className="orb" style={{
          left: o.left + '%', width: o.size, height: o.size,
          animationDuration: o.dur + 's', animationDelay: o.delay + 's',
          background: `hsl(${o.hue} 80% 60%)`,
        }} />
      ))}
    </div>
  );
}

const PremiumBackground = memo(PremiumBackgroundInner);
export default PremiumBackground;
