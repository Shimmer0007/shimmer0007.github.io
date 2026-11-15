// src/store/windows.ts
// 窗口管理状态 — 打开/关闭/最小化/最大化/层级/位置
import { create } from 'zustand';

export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type WindowState = 'normal' | 'minimized' | 'maximized';

export interface AppWindow {
  id: string;
  appId: string;
  title: string;
  state: WindowState;
  restoreState: 'normal' | 'maximized';
  rect: WindowRect;
  prevRect: WindowRect | null; // 最大化前的尺寸，用于还原
  zIndex: number;
  isActive: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack?: () => void;
  onForward?: () => void;
}

interface WindowsState {
  windows: AppWindow[];
  maxZIndex: number;
  nextZIndex: () => number;

  openWindow:     (appId: string, title: string, defaultRect?: Partial<WindowRect>) => void;
  closeWindow:    (id: string) => void;
  activateWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  minimizeAll:    () => void;
  restoreWindow:  (id: string) => void;
  maximizeWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  moveWindow:     (id: string, x: number, y: number) => void;
  resizeWindow:   (id: string, width: number, height: number) => void;
  fitWindowsToViewport: () => void;
  setWindowNavigation: (
    id: string,
    nav: { canGoBack: boolean; canGoForward: boolean; onBack?: () => void; onForward?: () => void }
  ) => void;

  isOpen: (appId: string) => boolean;
}

const DEFAULT_RECTS: Record<string, Partial<WindowRect>> = {
  about:    { width: 560,  height: 620,  x: 200, y: 80  },
  writing:  { width: 820,  height: 640,  x: 140, y: 70  },
  skills:   { width: 760,  height: 580,  x: 180, y: 90  },
  projects: { width: 700,  height: 580,  x: 160, y: 80  },
  travel:   { width: 860,  height: 600,  x: 120, y: 70  },
  plan:     { width: 680,  height: 580,  x: 200, y: 80  },
  toolbox:  { width: 580,  height: 480,  x: 240, y: 100 },
  links:    { width: 420,  height: 480,  x: 300, y: 120 },
  settings: { width: 460,  height: 520,  x: 280, y: 100 },
  terminal: { width: 580,  height: 400,  x: 260, y: 140 },
};

// 与 Window.css 的全屏布局断点保持一致，覆盖手机横屏。
export const isCompactViewport = () => window.matchMedia(
  '(max-width: 768px), (max-height: 500px) and (pointer: coarse)'
).matches;

function fitWindowRect(rect: WindowRect): WindowRect {
  // 手机上的全屏样式不覆盖桌面窗口尺寸，旋转/切回大屏后可以恢复。
  if (isCompactViewport()) return rect;
  const area = document.querySelector<HTMLElement>('.window-manager');
  const areaWidth = area?.clientWidth ?? window.innerWidth;
  const areaHeight = area?.clientHeight ?? window.innerHeight;
  const width = Math.min(Math.max(320, rect.width), areaWidth);
  const height = Math.min(Math.max(200, rect.height), areaHeight);
  const x = Math.max(0, Math.min(rect.x, areaWidth - width));
  const y = Math.max(0, Math.min(rect.y, areaHeight - height));
  if (x === rect.x && y === rect.y && width === rect.width && height === rect.height) return rect;
  return { x, y, width, height };
}

export const useWindowsStore = create<WindowsState>()((set, get) => ({
  windows: [],
  maxZIndex: 100,

  nextZIndex: () => {
    const next = get().maxZIndex + 1;
    set({ maxZIndex: next });
    return next;
  },

  openWindow: (appId, title, defaultRect) => {
    const { windows, nextZIndex, activateWindow, restoreWindow } = get();
    // 如果已打开，激活即可
    const existing = windows.find(w => w.appId === appId);
    if (existing) {
      if (existing.state === 'minimized') {
        restoreWindow(existing.id);
      } else {
        activateWindow(existing.id);
      }
      return;
    }

    const rect: WindowRect = {
      x:      defaultRect?.x      ?? window.innerWidth  * 0.15,
      y:      defaultRect?.y      ?? window.innerHeight * 0.10,
      width:  defaultRect?.width  ?? 640,
      height: defaultRect?.height ?? 520,
      ...DEFAULT_RECTS[appId],
      ...defaultRect,
    };

    const id = `${appId}-${Date.now()}`;
    const z  = nextZIndex();
    const newWin: AppWindow = {
      id, appId, title,
      state: 'normal',
      restoreState: 'normal',
      rect: fitWindowRect(rect),
      prevRect: null,
      zIndex: z,
      isActive: true,
      canGoBack: false,
      canGoForward: false,
    };

    set(s => ({
      windows: [
        ...s.windows.map(w => ({ ...w, isActive: false })),
        newWin,
      ],
    }));
  },

  closeWindow: (id) => {
    set(s => ({ windows: s.windows.filter(w => w.id !== id) }));
  },

  activateWindow: (id) => {
    const z = get().nextZIndex();
    set(s => ({
      windows: s.windows.map(w => ({
        ...w,
        isActive: w.id === id,
        zIndex:   w.id === id ? z : w.zIndex,
      })),
    }));
  },

  minimizeWindow: (id) => {
    set(s => ({
      windows: s.windows.map(w =>
        w.id === id && w.state !== 'minimized'
          ? { ...w, restoreState: w.state, state: 'minimized', isActive: false }
          : w
      ),
    }));
  },

  minimizeAll: () => {
    set(s => ({
      windows: s.windows.map(w => w.state === 'minimized' ? w : {
        ...w, restoreState: w.state, state: 'minimized', isActive: false,
      }),
    }));
  },

  restoreWindow: (id) => {
    const { activateWindow } = get();
    set(s => ({
      windows: s.windows.map(w =>
        w.id === id ? { ...w, state: w.restoreState, rect: fitWindowRect(w.rect) } : w
      ),
    }));
    activateWindow(id);
  },

  maximizeWindow: (id) => {
    set(s => ({
      windows: s.windows.map(w =>
        w.id === id
          ? { ...w, state: 'maximized', prevRect: w.rect }
          : w
      ),
    }));
  },

  toggleMaximize: (id) => {
    const win = get().windows.find(w => w.id === id);
    if (!win) return;
    if (win.state === 'maximized') {
      set(s => ({
        windows: s.windows.map(w =>
          w.id === id
            ? { ...w, state: 'normal', rect: fitWindowRect(w.prevRect ?? w.rect), prevRect: null }
            : w
        ),
      }));
    } else {
      get().maximizeWindow(id);
    }
  },

  moveWindow: (id, x, y) => {
    set(s => ({
      windows: s.windows.map(w =>
        w.id === id ? { ...w, rect: fitWindowRect({ ...w.rect, x, y }) } : w
      ),
    }));
  },

  resizeWindow: (id, width, height) => {
    set(s => ({
      windows: s.windows.map(w =>
        w.id === id ? { ...w, rect: fitWindowRect({ ...w.rect, width, height }) } : w
      ),
    }));
  },

  fitWindowsToViewport: () => {
    if (isCompactViewport()) return;
    set(s => {
      let changed = false;
      const windows = s.windows.map(w => {
        const rect = fitWindowRect(w.rect);
        const prevRect = w.prevRect ? fitWindowRect(w.prevRect) : null;
        if (rect === w.rect && prevRect === w.prevRect) return w;
        changed = true;
        return { ...w, rect, prevRect };
      });
      return changed ? { windows } : s;
    });
  },

  setWindowNavigation: (id, nav) => {
    set(s => ({
      windows: s.windows.map(w =>
        w.id === id
          ? {
              ...w,
              canGoBack: nav.canGoBack,
              canGoForward: nav.canGoForward,
              onBack: nav.onBack,
              onForward: nav.onForward,
            }
          : w
      ),
    }));
  },

  isOpen: (appId) => get().windows.some(w => w.appId === appId && w.state !== 'minimized'),
}));
