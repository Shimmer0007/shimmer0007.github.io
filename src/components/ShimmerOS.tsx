// src/components/ShimmerOS.tsx
// 主 OS 容器 — 协调 boot 动画、主题同步、全局按键
import { useState, useEffect } from 'react';
import { useOSStore, ACCENT_COLORS } from '../store/os';
import { useContentStore, type PostItem } from '../store/content';

interface ShimmerOSProps {
  posts: PostItem[];
}
import BootScreen from './desktop/BootScreen';
import Desktop from './desktop/Desktop';
import WindowManager from './window/WindowManager';
import Dock from './dock/Dock';
import Spotlight from './spotlight/Spotlight';
import './ShimmerOS.css';

const ACCENT_MAP: Record<string, {
  dim: string;
  base: string;
  mid: string;
  bright: string;
  soft: string;
  glow: string;
  borderSubtle: string;
}> = {
  purple: {
    dim: '#2d1f5c',
    base: '#7c3aed',
    mid: '#9333ea',
    bright: '#a855f7',
    soft: 'rgba(124, 58, 237, 0.12)',
    glow: 'rgba(168, 85, 247, 0.28)',
    borderSubtle: 'rgba(168, 85, 247, 0.08)',
  },
  gold: {
    dim: '#78450a',
    base: '#f59e0b',
    mid: '#d97706',
    bright: '#fcd34d',
    soft: 'rgba(245, 158, 11, 0.12)',
    glow: 'rgba(245, 158, 11, 0.28)',
    borderSubtle: 'rgba(245, 158, 11, 0.08)',
  },
  blue: {
    dim: '#1e3a8a',
    base: '#3b82f6',
    mid: '#2563eb',
    bright: '#60a5fa',
    soft: 'rgba(59, 130, 246, 0.12)',
    glow: 'rgba(59, 130, 246, 0.28)',
    borderSubtle: 'rgba(59, 130, 246, 0.08)',
  },
  rose: {
    dim: '#881337',
    base: '#f43f5e',
    mid: '#e11d48',
    bright: '#fda4af',
    soft: 'rgba(244, 63, 94, 0.12)',
    glow: 'rgba(244, 63, 94, 0.28)',
    borderSubtle: 'rgba(244, 63, 94, 0.08)',
  },
  cyan: {
    dim: '#164e63',
    base: '#06b6d4',
    mid: '#0891b2',
    bright: '#67e8f9',
    soft: 'rgba(6, 182, 212, 0.12)',
    glow: 'rgba(6, 182, 212, 0.28)',
    borderSubtle: 'rgba(6, 182, 212, 0.08)',
  }
};

export default function ShimmerOS({ posts }: ShimmerOSProps) {
  const [booted, setBooted] = useState(false);
  const { theme, accentId } = useOSStore();
  const { spotlightOpen, openSpotlight, closeSpotlight, setPosts } = useContentStore();

  useEffect(() => {
    setPosts(posts);
  }, [posts, setPosts]);

  /* ===== 将 theme/accent 同步到 DOM ===== */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const config = ACCENT_MAP[accentId];
    if (config) {
      const root = document.documentElement;
      root.style.setProperty('--color-accent-dim', config.dim);
      root.style.setProperty('--color-accent', config.base);
      root.style.setProperty('--color-accent-mid', config.mid);
      root.style.setProperty('--color-accent-bright', config.bright);
      root.style.setProperty('--color-accent-soft', config.soft);
      root.style.setProperty('--color-accent-glow', config.glow);
      root.style.setProperty('--color-border-subtle', config.borderSubtle);
      
      // 动态覆写玻璃态边框，使其配合强调色微发光
      root.style.setProperty('--glass-border', `1px solid ${config.soft}`);
      root.style.setProperty('--glass-border-active', `1px solid ${config.bright}`);
      
      // 保持旧变量的向后兼容，以防其它地方引用
      root.style.setProperty('--color-purple', config.base);
      root.style.setProperty('--color-purple-glow', config.glow);
    }
  }, [accentId]);

  /* ===== 全局快捷键 ===== */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K → Spotlight
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        spotlightOpen ? closeSpotlight() : openSpotlight();
      }
      // Escape → 关闭 Spotlight
      if (e.key === 'Escape' && spotlightOpen) {
        closeSpotlight();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [spotlightOpen, openSpotlight, closeSpotlight]);

  return (
    <div className="shimmeros" data-theme={theme}>
      {/* 开机动画 */}
      {!booted && <BootScreen onComplete={() => setBooted(true)} />}

      {/* 桌面 */}
      <Desktop loaded={booted} />

      {/* 窗口层 */}
      <WindowManager />

      {/* Dock */}
      {booted && <Dock />}

      {/* Spotlight 全局搜索 */}
      {spotlightOpen && <Spotlight />}
    </div>
  );
}

