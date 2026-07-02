// src/store/os.ts
// OS 全局状态 — 主题、语言、强调色
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light';
export type Lang = 'zh' | 'en';

export interface AccentColor {
  id: string;
  label: string;
  value: string;
  glow: string;
}

export const ACCENT_COLORS: AccentColor[] = [
  { id: 'purple', label: '电光紫',   value: '#7c3aed', glow: 'rgba(124,58,237,0.28)' },
  { id: 'gold',   label: '琥珀金',   value: '#f59e0b', glow: 'rgba(245,158,11,0.28)' },
  { id: 'blue',   label: '极光蓝',   value: '#3b82f6', glow: 'rgba(59,130,246,0.28)' },
  { id: 'rose',   label: '玫瑰红',   value: '#f43f5e', glow: 'rgba(244,63,94,0.28)'  },
  { id: 'cyan',   label: '赛博青',   value: '#06b6d4', glow: 'rgba(6,182,212,0.28)'  },
];

interface OSState {
  theme: Theme;
  lang: Lang;
  accentId: string;

  setTheme: (theme: Theme) => void;
  setLang: (lang: Lang) => void;
  setAccent: (id: string) => void;
}

export const useOSStore = create<OSState>()(
  persist(
    (set) => ({
      theme:    'dark',
      lang:     'zh',
      accentId: 'purple',

      setTheme:  (theme)  => set({ theme }),
      setLang:   (lang)   => set({ lang }),
      setAccent: (accentId) => set({ accentId }),
    }),
    {
      name: 'shimmeros-settings',
      partialize: (state) => ({
        theme:    state.theme,
        lang:     state.lang,
        accentId: state.accentId,
      }),
    }
  )
);
