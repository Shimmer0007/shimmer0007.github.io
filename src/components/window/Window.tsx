// src/components/window/Window.tsx
// 单个窗口组件 — 拖拽、最大化、标题栏红绿灯
import { useRef, useCallback, useEffect, createContext, useContext } from 'react';
import { useWindowsStore, type AppWindow } from '../../store/windows';
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
  const { activateWindow, closeWindow, minimizeWindow, toggleMaximize, moveWindow } =
    useWindowsStore();
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const winRef  = useRef<HTMLDivElement>(null);

  const isMaximized = win.state === 'maximized';
  const isMinimized = win.state === 'minimized';

  /* ===== Drag ===== */
  const onTitleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.win-control')) return;
      if (isMaximized || window.innerWidth <= 768) return;
      e.preventDefault();
      activateWindow(win.id);

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX:  win.rect.x,
        origY:  win.rect.y,
      };

      const onMove = (me: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = me.clientX - dragRef.current.startX;
        const dy = me.clientY - dragRef.current.startY;
        const newX = dragRef.current.origX + dx;
        const newY = dragRef.current.origY + dy;
        // 边界限制：不超出屏幕顶部
        moveWindow(win.id, newX, Math.max(0, newY));
      };

      const onUp = () => {
        dragRef.current = null;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [win.id, win.rect, isMaximized, activateWindow, moveWindow]
  );

  // 双击标题栏 → 最大化/还原
  const onTitleDblClick = useCallback(() => {
    toggleMaximize(win.id);
  }, [win.id, toggleMaximize]);

  /* ===== Computed style ===== */
  const style: React.CSSProperties = isMaximized
    ? {
        left: 0, top: 0,
        width: '100vw',
        height: 'calc(100vh - 84px)', // 留出 Dock 空间
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
      onMouseDown={() => activateWindow(win.id)}
      role="dialog"
      aria-label={win.title}
    >
      {/* ===== Title Bar ===== */}
      <div
        className="win-titlebar"
        onMouseDown={onTitleMouseDown}
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
