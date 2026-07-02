// src/components/desktop/DesktopIcon.tsx
// 单个桌面图标 — SVG 图标 + 标签 + 层级视觉差异
import { useState } from 'react';
import { useWindowsStore } from '../../store/windows';
import AppIcon from '../ui/AppIcon';
import './DesktopIcon.css';

interface DesktopIconProps {
  appId: string;
  label: string;
  tier: 1 | 2 | 3 | 4;
  animDelay: number;
  onClick: () => void;
}

export default function DesktopIcon({ appId, label, tier, animDelay, onClick }: DesktopIconProps) {
  const [pressed, setPressed] = useState(false);
  const isOpen = useWindowsStore(s => s.isOpen(appId));

  return (
    <div
      className={`desktop-icon desktop-icon--tier${tier} ${pressed ? 'desktop-icon--pressed' : ''}`}
      style={{ animationDelay: `${animDelay}ms` }}
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      role="button"
      tabIndex={0}
      aria-label={`打开 ${label}`}
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      {/* 图标容器 */}
      <div className="desktop-icon__img-wrap">
        <AppIcon appId={appId} className="desktop-icon__img" />
        {/* L1 金色光晕 */}
        {tier === 1 && <div className="desktop-icon__glow" aria-hidden />}
      </div>

      {/* 标签 */}
      <span className="desktop-icon__label">{label}</span>

      {/* 运行指示点 */}
      {isOpen && <div className="desktop-icon__dot" aria-label="运行中" />}
    </div>
  );
}
