// src/components/window/Window.tsx
// 单个窗口组件 — 拖拽、最大化、标题栏红绿灯
import { useRef, useCallback, useEffect, createContext, useContext } from 'react';
import { isCompactViewport, useWindowsStore, type AppWindow } from '../../store/windows';
import './Window.css';

interface WindowContextType {
  winId: string;
}
const WindowContext = createContext<WindowContextType | null>(null);

interface WindowProps {
  win: AppWindow;
  children: React.ReactNode;
}

export default function Window({ win, children }: WindowProps) {
  const { activateWindow, closeWindow, minimizeWindow, toggleMaximize, moveWindow, resizeWindow } =
    useWindowsStore();
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const winRef  = useRef<HTMLDivElement>(null);

  const isMaximized = win.state === 'maximized';
  const isMinimized = win.state === 'minimized';

  // 原生 resize 会改变 DOM 尺寸；同步到状态后，最大化再还原仍保持用户的尺寸。
  useEffect(() => {
    const element = winRef.current;
    if (!element || isMaximized || isMinimized) return;
    const observer = new ResizeObserver(() => {
      if (isCompactViewport() || !element.offsetWidth || !element.offsetHeight) return;
      const current = useWindowsStore.getState().windows.find(item => item.id === win.id);
      if (current && (current.rect.width !== element.offsetWidth || current.rect.height !== element.offsetHeight)) {
        resizeWindow(win.id, element.offsetWidth, element.offsetHeight);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [win.id, isMaximized, isMinimized, resizeWindow]);

  /* ===== Drag ===== */
  const onTitlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
      if (isMaximized || isCompactViewport()) return;
      e.preventDefault();
      e.stopPropagation();
      activateWindow(win.id);
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX:  win.rect.x,
        origY:  win.rect.y,
      };

    },
    [win.id, win.rect, isMaximized, activateWindow]
  );

  // 双击标题栏 → 最大化/还原
  const onTitleDblClick = useCallback((e: React.MouseEvent) => {
    if (isCompactViewport() || (e.target as HTMLElement).closest('button')) return;
    toggleMaximize(win.id);
  }, [win.id, toggleMaximize]);

  /* ===== Computed style ===== */
  const style: React.CSSProperties = isMaximized
    ? {
        left: 0, top: 0,
        width: '100%',
        height: '100%',
        zIndex: win.zIndex,
      }
    : {
        left:   win.rect.x,
        top:    win.rect.y,
        width:  win.rect.width,
        height: win.rect.height,
        zIndex: win.zIndex,
      };

  if (isMinimized) return null;

  return (
    <div
      ref={winRef}
      className={`window ${win.isActive ? 'window--active' : ''} ${isMaximized ? 'window--maximized' : ''}`}
      style={style}
      onPointerDown={() => { if (!win.isActive) activateWindow(win.id); }}
      role="dialog"
      aria-label={win.title}
    >
      {/* ===== Title Bar ===== */}
      <div
        className="win-titlebar"
        onPointerDown={onTitlePointerDown}
        onPointerMove={e => {
          const drag = dragRef.current;
          if (drag) moveWindow(win.id, drag.origX + e.clientX - drag.startX, drag.origY + e.clientY - drag.startY);
        }}
        onPointerUp={e => {
          dragRef.current = null;
          if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        onPointerCancel={() => { dragRef.current = null; }}
        onLostPointerCapture={() => { dragRef.current = null; }}
        onDoubleClick={onTitleDblClick}
      >
        {/* 左侧控制区 */}
        <div className="win-header-left">
          {/* 红绿灯控制按钮 */}
          <div className="win-controls" role="group" aria-label="窗口控制">
            <button
              className="win-control win-control--close"
              title="关闭"
              onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
              aria-label="关闭窗口"
            >
              <span className="win-control__icon">×</span>
            </button>
            <button
              className="win-control win-control--minimize"
              title="最小化"
              onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}
              aria-label="最小化窗口"
            >
              <span className="win-control__icon">−</span>
            </button>
            <button
              className="win-control win-control--maximize"
              title={isMaximized ? '还原' : '最大化'}
              onClick={(e) => { e.stopPropagation(); toggleMaximize(win.id); }}
              aria-label={isMaximized ? '还原窗口' : '最大化窗口'}
            >
              <span className="win-control__icon">{isMaximized ? '⤡' : '⤢'}</span>
            </button>
          </div>

          {/* 导航前进后退 */}
          <div className="win-nav-buttons">
            <button
              className="win-nav-btn"
              onClick={(e) => { e.stopPropagation(); win.onBack?.(); }}
              disabled={!win.canGoBack}
              title="后退"
              aria-label="后退"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="win-nav-icon">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              className="win-nav-btn"
              onClick={(e) => { e.stopPropagation(); win.onForward?.(); }}
              disabled={!win.canGoForward}
              title="前进"
              aria-label="前进"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="win-nav-icon">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* 标题 */}
        <span className="win-title">{win.title}</span>

        {/* 占位（使标题居中） */}
        <div className="win-header-right-phantom" aria-hidden />
      </div>

      {/* ===== Body ===== */}
      <div className="window-body">
        <WindowContext.Provider value={{ winId: win.id }}>
          {children}
        </WindowContext.Provider>
      </div>
    </div>
  );
}

export function useWindow() {
  const context = useContext(WindowContext);
  if (!context) {
    throw new Error('useWindow must be used within a Window component');
  }
  return context;
}
