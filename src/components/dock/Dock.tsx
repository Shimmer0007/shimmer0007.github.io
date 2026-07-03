// src/components/dock/Dock.tsx
// macOS 风格 Dock — 放大效果 + 运行指示 + Spotlight 入口
import { useRef, useState, useCallback } from 'react';
import { useWindowsStore } from '../../store/windows';
import { useContentStore } from '../../store/content';
import { useT } from '../../i18n';
import AppIcon from '../ui/AppIcon';
import './Dock.css';

const DOCK_APPS = [
  { id: 'toolbox',  pinned: true  },
  { id: 'terminal', pinned: true  },
  { id: 'links',    pinned: true  },
  { id: 'settings', pinned: true  },
] as const;

const MAGNIFICATION = 1.6;  // 最大放大倍率
const SPREAD_RANGE  = 100;   // 影响半径 px

export default function Dock() {
  const t = useT();
  const dockRef      = useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);

  const openWindow    = useWindowsStore(s => s.openWindow);
  const isOpen        = useWindowsStore(s => s.isOpen);
  const openSpotlight = useContentStore(s => s.openSpotlight);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMouseX(e.clientX);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMouseX(null);
  }, []);

  const getScale = useCallback((itemRef: HTMLButtonElement | null): number => {
    if (!itemRef || mouseX === null) return 1;
    const rect   = itemRef.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const dist   = Math.abs(mouseX - center);
    if (dist > SPREAD_RANGE) return 1;
    const t = 1 - dist / SPREAD_RANGE;
    return 1 + (MAGNIFICATION - 1) * Math.pow(t, 2);
  }, [mouseX]);

  return (
    <nav
      className="dock"
      ref={dockRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-label="Dock"
    >
      {/* Spotlight 搜索按钮 */}
      <DockButton
        label="搜索"
        mouseX={mouseX}
        getScale={getScale}
        onClick={openSpotlight}
        isSpotlight
      />

      <div className="dock__divider" aria-hidden />

      {/* App 快捷方式 */}
      {DOCK_APPS.map(app => (
        <DockButton
          key={app.id}
          appId={app.id}
          label={t(`app.${app.id}.label`)}
          mouseX={mouseX}
          getScale={getScale}
          isRunning={isOpen(app.id)}
          onClick={() => openWindow(app.id, t(`app.${app.id}.title`))}
        />
      ))}
    </nav>
  );
}

/* ===== 单个 Dock 按钮 ===== */
interface DockButtonProps {
  appId?: string;
  label: string;
  mouseX: number | null;
  getScale: (el: HTMLButtonElement | null) => number;
  isRunning?: boolean;
  isSpotlight?: boolean;
  onClick: () => void;
}

function DockButton({ appId, label, getScale, isRunning, isSpotlight, onClick }: DockButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const scale  = getScale(btnRef.current);

  return (
    <div className="dock-item" style={{ '--scale': scale } as React.CSSProperties}>
      <button
        ref={btnRef}
        className={`dock-btn ${isSpotlight ? 'dock-btn--spotlight' : ''}`}
        title={label}
        aria-label={label}
        onClick={onClick}
        style={{ transform: `scale(${scale}) translateY(${(scale - 1) * -6}px)` }}
      >
        {isSpotlight ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="dock-btn__icon">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        ) : (
          <AppIcon appId={appId!} className="dock-btn__icon" />
        )}
      </button>
      {/* 运行指示点 */}
      {isRunning && <div className="dock-item__dot" aria-hidden />}
    </div>
  );
}
