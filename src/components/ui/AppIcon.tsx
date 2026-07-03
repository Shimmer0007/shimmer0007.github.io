// src/components/ui/AppIcon.tsx
// SVG 应用图标注册表 — 统一风格，渐变描边，不用 Emoji
import type { SVGProps } from 'react';

interface AppIconProps extends SVGProps<SVGSVGElement> {
  appId: string;
  className?: string;
}

// 共用属性
const BASE = {
  viewBox: '0 0 24 24',
  fill: 'none',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const ICONS: Record<string, (id: string) => JSX.Element> = {
  about: (id) => (
    <svg {...BASE} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="8" r="4" stroke={`url(#g-${id})`} />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={`url(#g-${id})`} />
    </svg>
  ),

  writing: (id) => (
    <svg {...BASE} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path d="M14.5 2.5a2.121 2.121 0 013 3L7 16l-4 1 1-4L14.5 2.5z" stroke={`url(#g-${id})`} />
      <path d="M3 21h18" stroke={`url(#g-${id})`} />
    </svg>
  ),

  skills: (id) => (
    <svg {...BASE} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="3" stroke={`url(#g-${id})`} />
      <circle cx="4"  cy="6"  r="2" stroke={`url(#g-${id})`} />
      <circle cx="20" cy="6"  r="2" stroke={`url(#g-${id})`} />
      <circle cx="4"  cy="18" r="2" stroke={`url(#g-${id})`} />
      <circle cx="20" cy="18" r="2" stroke={`url(#g-${id})`} />
      <path d="M6 7l4 3M14 7l4 3M6 17l4-3M14 17l4-3" stroke={`url(#g-${id})`} strokeWidth="1" />
    </svg>
  ),

  projects: (id) => (
    <svg {...BASE} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <rect x="2" y="3" width="8" height="8" rx="1.5" stroke={`url(#g-${id})`} />
      <rect x="14" y="3" width="8" height="8" rx="1.5" stroke={`url(#g-${id})`} />
      <rect x="2" y="13" width="8" height="8" rx="1.5" stroke={`url(#g-${id})`} />
      <rect x="14" y="13" width="8" height="8" rx="1.5" stroke={`url(#g-${id})`} />
    </svg>
  ),

  travel: (id) => (
    <svg {...BASE} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="9" stroke={`url(#g-${id})`} />
      <path d="M2 12h20M12 2a14 14 0 010 20M12 2a14 14 0 000 20" stroke={`url(#g-${id})`} />
    </svg>
  ),

  plan: (id) => (
    <svg {...BASE} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <rect x="3" y="4" width="18" height="18" rx="2" stroke={`url(#g-${id})`} />
      <path d="M8 2v4M16 2v4M3 10h18" stroke={`url(#g-${id})`} />
      <path d="M8 14h2M14 14h2M8 18h2M14 18h2" stroke={`url(#g-${id})`} />
    </svg>
  ),

  toolbox: (id) => (
    <svg {...BASE} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path d="M4 10h16v10a2 2 0 01-2 2H6a2 2 0 01-2-2V10z" stroke={`url(#g-${id})`} />
      <path d="M8 10V7a4 4 0 018 0v3" stroke={`url(#g-${id})`} />
      <path d="M4 15h16" stroke={`url(#g-${id})`} />
    </svg>
  ),

  links: (id) => (
    <svg {...BASE} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke={`url(#g-${id})`} />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke={`url(#g-${id})`} />
    </svg>
  ),

  guestbook: (id) => (
    <svg {...BASE} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <path d="M21 15a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14l4-4h14z" stroke={`url(#g-${id})`} />
      <path d="M7 7h10M7 11h7" stroke={`url(#g-${id})`} strokeWidth="1.2" />
    </svg>
  ),

  settings: (id) => (
    <svg {...BASE} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6b7280" />
          <stop offset="100%" stopColor="#9d8ec9" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="3" stroke={`url(#g-${id})`} />
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={`url(#g-${id})`} />
    </svg>
  ),

  terminal: (id) => (
    <svg {...BASE} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect x="2" y="3" width="20" height="18" rx="2" stroke={`url(#g-${id})`} />
      <path d="M7 9l3 3-3 3M13 15h4" stroke={`url(#g-${id})`} />
    </svg>
  ),
};

// 默认图标
const DefaultIcon = ({ id }: { id: string }) => (
  <svg {...BASE} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
    </defs>
    <rect x="3" y="3" width="18" height="18" rx="3" stroke={`url(#g-${id})`} />
    <path d="M9 12h6M12 9v6" stroke={`url(#g-${id})`} />
  </svg>
);

export default function AppIcon({ appId, className, ...rest }: AppIconProps) {
  const renderFn = ICONS[appId];
  const uniqueId = `icon-${appId}`;

  return (
    <span className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {renderFn ? renderFn(uniqueId) : <DefaultIcon id={uniqueId} />}
    </span>
  );
}
