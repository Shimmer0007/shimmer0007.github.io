// src/components/window/WindowManager.tsx
// 窗口管理器 — 渲染所有已开窗口，懒加载各 App
import { lazy, Suspense, Component, type ReactNode } from 'react';
import { useWindowsStore } from '../../store/windows';
import Window from './Window';
import './WindowManager.css';

// 懒加载各 App 组件
const AboutApp    = lazy(() => import('../apps/AboutApp'));
const WritingApp  = lazy(() => import('../apps/WritingApp'));
const SkillsApp   = lazy(() => import('../apps/SkillsApp'));
const ProjectsApp = lazy(() => import('../apps/ProjectsApp'));
const TravelApp   = lazy(() => import('../apps/TravelApp'));
const PlanApp     = lazy(() => import('../apps/PlanApp'));
const ToolboxApp  = lazy(() => import('../apps/ToolboxApp'));
const LinksApp    = lazy(() => import('../apps/LinksApp'));
const SettingsApp = lazy(() => import('../apps/SettingsApp'));
const Terminal    = lazy(() => import('../terminal/Terminal'));

// 隔离舱：防应用崩溃牵连系统
class AppErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("App crashed:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const APP_COMPONENTS: Record<string, React.ComponentType> = {
  about:    AboutApp,
  writing:  WritingApp,
  skills:   SkillsApp,
  projects: ProjectsApp,
  travel:   TravelApp,
  plan:     PlanApp,
  toolbox:  ToolboxApp,
  links:    LinksApp,
  settings: SettingsApp,
  terminal: Terminal,
};

function AppLoader() {
  return (
    <div className="app-loader">
      <div className="app-loader__spinner" />
    </div>
  );
}

export default function WindowManager() {
  const windows = useWindowsStore(s => s.windows);

  return (
    <div className="window-manager" aria-live="polite">
      {windows.map(win => {
        const AppComponent = APP_COMPONENTS[win.appId];
        if (!AppComponent) return null;

        return (
          <Window key={win.id} win={win}>
            <AppErrorBoundary fallback={<div style={{padding: '20px', color: 'var(--color-red)', fontFamily: 'var(--font-sans)', fontSize: '0.82rem'}}>⚠️ 应用载入发生严重错误。已安全沙盒化隔离。</div>}>
              <Suspense fallback={<AppLoader />}>
                <AppComponent />
              </Suspense>
            </AppErrorBoundary>
          </Window>
        );
      })}
    </div>
  );
}
