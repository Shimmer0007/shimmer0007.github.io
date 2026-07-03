// src/components/apps/GuestbookApp.tsx
import { useEffect, useRef, useState } from 'react';
import { useOSStore } from '../../store/os';
import { useT } from '../../i18n';
import './GuestbookApp.css';

export default function GuestbookApp() {
  const t = useT();
  const theme = useOSStore(s => s.theme);
  const lang = useOSStore(s => s.lang);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  // 1. 初始化并注入 Utterances 留言板 script
  useEffect(() => {
    if (!containerRef.current) return;

    // 清理可能遗留的旧 iframe 节点，保证单例实例化
    containerRef.current.innerHTML = '';
    setLoaded(false);

    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.setAttribute('repo', 'Shimmer0007/shimmer0007.github.io');
    script.setAttribute('issue-term', 'guestbook'); // 将留言汇聚于标题为 "guestbook" 的单条 Issue 下
    script.setAttribute('label', '💬 guestbook');   // 自动标记标签
    script.setAttribute('theme', theme === 'dark' ? 'github-dark' : 'github-light');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    // 监听加载成功状态
    script.onload = () => {
      setLoaded(true);
    };

    containerRef.current.appendChild(script);
  }, []);

  // 2. 动态监听全局系统主题变化，实时向 Utterances 核心通信，进行无缝换肤
  useEffect(() => {
    const iframe = containerRef.current?.querySelector('iframe');
    if (!iframe || !iframe.contentWindow) return;

    const targetTheme = theme === 'dark' ? 'github-dark' : 'github-light';
    iframe.contentWindow.postMessage(
      { type: 'set-theme', theme: targetTheme },
      'https://utteranc.es'
    );
  }, [theme]);

  return (
    <div className="guestbook-app-container">
      {/* 头部面板 */}
      <header className="guestbook-header">
        <h2 className="guestbook-title-glowing">
          {lang === 'zh' ? '📡 星际留言板' : '📡 Guestbook Terminal'}
        </h2>
        <p className="guestbook-subtitle">
          {lang === 'zh' 
            ? '欢迎来到微光太空舱！你可以在下方通过 GitHub 登录并留下你的足迹。留言会以 Issue Comments 的形式永久存储在站长的 GitHub 仓库中。' 
            : 'Welcome to Shimmer Space Capsule! You can log in via GitHub below to leave your footprint. Messages are securely stored as Issue Comments in my repo.'}
        </p>
      </header>

      {/* 骨架屏 Loading 指示器 */}
      {!loaded && (
        <div className="guestbook-loading-skeleton">
          <div className="guestbook-loading-spinner" />
          <span>CONNECTING TO GITHUB DATABASE...</span>
        </div>
      )}

      {/* 挂载 Utterances 留言板组件的 DOM 节点 */}
      <div 
        ref={containerRef} 
        className={`guestbook-widget-wrapper ${loaded ? 'visible' : 'hidden'}`}
      />
    </div>
  );
}
