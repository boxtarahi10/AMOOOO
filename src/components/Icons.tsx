// Premium SVG icons - no emoji, clean and minimal/3D style

export const IconPlay = ({ size = 20, color = '#fff' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8 5v14l11-7z"/></svg>
);

export const IconPause = ({ size = 20, color = '#fff' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
);

export const IconBack = ({ size = 20, color = '#fff' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
);

export const IconShuffle = ({ size = 24, color = '#ffd700' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
);

export const IconHint = ({ size = 20, color = '#ffd700' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>
);

export const IconCoin = ({ size = 18, color = '#ffd700' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill={color} opacity="0.9"/><circle cx="12" cy="12" r="7" fill="none" stroke="#b8941e" strokeWidth="1.5"/><text x="12" y="16" textAnchor="middle" fill="#8B6914" fontSize="11" fontWeight="bold">$</text></svg>
);

export const IconChest = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect x="3" y="14" width="26" height="14" rx="3" fill="#8B4513" stroke="#d4af37" strokeWidth="1.5"/>
    <rect x="3" y="8" width="26" height="10" rx="3" fill="#A0522D" stroke="#d4af37" strokeWidth="1.5"/>
    <rect x="13" y="12" width="6" height="6" rx="1" fill="#ffd700"/>
    <circle cx="16" cy="15" r="1.5" fill="#8B6914"/>
    <path d="M6 14h20" stroke="#d4af37" strokeWidth="0.5" opacity="0.5"/>
  </svg>
);

export const IconFire = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 23c-4.97 0-9-3.58-9-8 0-3.07 2.17-6.09 4-7.5-.5 3.5 2.5 5.5 2.5 5.5-.28-2.97 1.5-5.97 4.5-8 0 2 1 4 2 5s2.5 2.5 2.5 5c0 4.42-4.03 8-9 8z" fill="#f59e0b"/><path d="M12 23c-2.76 0-5-1.79-5-4 0-1.52 1-3.04 2-3.75 0 1.5 1.5 2.75 1.5 2.75-.14-1.49.75-2.99 2.25-4 0 1 .5 2 1 2.5s1.25 1.25 1.25 2.5c0 2.21-2.24 4-5 4z" fill="#fbbf24"/></svg>
);

export const IconStar = ({ size = 20, filled = true, color = '#fbbf24' }: { size?: number; filled?: boolean; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
);

export const IconGrid = ({ size = 20, color = '#fff' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" opacity="0.8"/></svg>
);

export const IconSpeed = ({ size = 20, color = '#a855f7' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13.01 3h1l-1 7h3.51c.4 0 .62.19.4.66C12.97 17.55 11 21 11 21z"/></svg>
);

export const IconSearch = ({ size = 20, color = '#ffd700' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>
);

export const IconHelp = ({ size = 20, color = '#fff' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);

export const IconInfo = ({ size = 20, color = '#fff' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
);

export const IconHome = ({ size = 20, color = '#fff' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
);

export const IconRefresh = ({ size = 20, color = '#fff' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
);

export const IconGift = ({ size = 20, color = '#a855f7' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M20 12v10H4V12m16-4H4a2 2 0 0 1 0-4h16a2 2 0 0 1 0 4m-8-4v4m0 0v14m-4-14h8" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>
);

export const IconTrophy = ({ size = 32, color = '#ffd700' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2C9 2 7 4 7 6v1H4c-1 0-2 1-2 2v1c0 2.97 2.16 5.43 5 5.91V18H5v2h14v-2h-2v-2.09c2.84-.48 5-2.94 5-5.91V9c0-1-1-2-2-2h-3V6c0-2-2-4-5-4zM4 9h3v3c-1.66-.05-3-1.4-3-3zm13 3V9h3c0 1.6-1.34 2.95-3 3z"/></svg>
);

export const IconCheck = ({ size = 14, color = '#10b981' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);

export const IconLock = ({ size = 12, color = 'rgba(255,255,255,0.3)' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M18 10V8c0-3.31-2.69-6-6-6S6 4.69 6 8v2H4v12h16V10h-2zM12 4c2.21 0 4 1.79 4 4v2H8V8c0-2.21 1.79-4 4-4z"/></svg>
);

export const IconCelebrate = ({ size = 48 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="20" fill="url(#cg)" opacity="0.15"/>
    <path d="M15 33l3-12 12-3-3 12z" fill="#ffd700" stroke="#d4af37" strokeWidth="1"/>
    <circle cx="24" cy="24" r="3" fill="#d4af37"/>
    <path d="M24 8v4M24 36v4M8 24h4M36 24h4M13 13l3 3M32 32l3 3M13 35l3-3M32 16l3-3" stroke="#ffd700" strokeWidth="1.5" strokeLinecap="round"/>
    <defs><radialGradient id="cg"><stop offset="0%" stopColor="#ffd700"/><stop offset="100%" stopColor="transparent"/></radialGradient></defs>
  </svg>
);

export const IconLogo = ({ size = 48 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#lg1)"/>
    <rect x="8" y="8" width="48" height="48" rx="12" fill="url(#lg2)" opacity="0.5"/>
    <path d="M20 44V24l6-4v20m4-16v16m4-20v20l6-4V20" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
    <circle cx="32" cy="16" r="3" fill="#ffd700"/>
    <defs>
      <linearGradient id="lg1" x1="4" y1="4" x2="60" y2="60"><stop stopColor="#d4af37"/><stop offset="1" stopColor="#8B6914"/></linearGradient>
      <linearGradient id="lg2" x1="8" y1="8" x2="56" y2="56"><stop stopColor="#ffd700" stopOpacity="0.3"/><stop offset="1" stopColor="transparent"/></linearGradient>
    </defs>
  </svg>
);
