// src/components/desktop/Desktop.tsx
// 桌面组件 — 图标网格、极光背景
import { useWindowsStore } from '../../store/windows';
import { useT } from '../../i18n';
import DesktopIcon from './DesktopIcon';
import Interactive3DBackground from './Interactive3DBackground';
import UptimeClock from './UptimeClock';
import './Desktop.css';

const APPS = [
  // L1 核心身份
  { id: 'about',    tier: 1, svgPath: 'about'    },
  // L2 智识+能力
  { id: 'writing',  tier: 2, svgPath: 'writing'  },
  { id: 'skills',   tier: 2, svgPath: 'skills'   },
  { id: 'projects', tier: 2, svgPath: 'projects' },
  // L3 生活切面
  { id: 'travel',   tier: 3, svgPath: 'travel'   },
  { id: 'plan',     tier: 3, svgPath: 'plan'      },
  { id: 'links',    tier: 3, svgPath: 'links'     },
] as const;

interface DesktopProps {
  loaded: boolean;
}

export default function Desktop({ loaded }: DesktopProps) {
  const t = useT();
  const openWindow = useWindowsStore(s => s.openWindow);

  const handleIconClick = (appId: string) => {
    openWindow(appId, t(`app.${appId}.title`));
  };

  return (
    <div className={`desktop ${loaded ? 'desktop--loaded' : ''}`} id="desktop">
      {/* 3D 几何互动背景 (支持 PC 视差 / PE 排斥 / 强调色换肤) */}
      <Interactive3DBackground />

      {/* 极光背景层 */}
      <div className="desktop-aurora" aria-hidden>
        <div className="aurora-blob aurora-blob--1" />
        <div className="aurora-blob aurora-blob--2" />
        <div className="aurora-blob aurora-blob--3" />
      </div>

      {/* 具有呼吸感的全息 Uptime 计时时钟 */}
      <UptimeClock />

      {/* 图标区域 */}
      <div className="desktop-icons">
        {APPS.map((app, i) => (
          <DesktopIcon
            key={app.id}
            appId={app.id}
            label={t(`app.${app.id}.label`)}
            tier={app.tier}
            animDelay={i * 60}
            onClick={() => handleIconClick(app.id)}
          />
        ))}
      </div>
    </div>
  );
}
