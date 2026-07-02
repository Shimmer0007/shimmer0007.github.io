// src/components/spotlight/Spotlight.tsx
// Cmd+K 全局搜索 — 跨窗口内容搜索
import { useRef, useEffect, useMemo } from 'react';
import { useContentStore } from '../../store/content';
import { useWindowsStore } from '../../store/windows';
import { useOSStore } from '../../store/os';
import { useT } from '../../i18n';
import './Spotlight.css';

// 可搜索的 App 列表（后续扩展到文章、项目）
const SEARCHABLE_APPS = [
  { id: 'about',    keywords: ['关于我', 'about', 'profile'] },
  { id: 'writing',  keywords: ['博客', 'blog', 'notes', '笔记', '文章'] },
  { id: 'skills',   keywords: ['技能', 'skill', 'tree'] },
  { id: 'projects', keywords: ['项目', 'project', 'portfolio'] },
  { id: 'travel',   keywords: ['旅行', 'travel', '足迹', 'map'] },
  { id: 'plan',     keywords: ['计划', 'plan', '二月'] },
  { id: 'toolbox',  keywords: ['工具', 'tool', 'github'] },
  { id: 'links',    keywords: ['友链', 'links', '友情'] },
  { id: 'settings', keywords: ['设置', 'setting', 'theme'] },
  { id: 'terminal', keywords: ['终端', 'terminal', 'cmd'] },
];

export default function Spotlight() {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const { posts, setActivePostId, spotlightQuery: query, setSpotlightQuery, closeSpotlight } = useContentStore();
  const { openWindow } = useWindowsStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 混合检索：应用 + 博文文章/笔记
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    
    // 1. 过滤 App
    const matchedApps = SEARCHABLE_APPS.filter(app =>
      !q ||
      app.id.includes(q) ||
      app.keywords.some(k => k.includes(q))
    ).map(app => ({
      type: 'app' as const,
      id: app.id,
      label: t(`app.${app.id}.label`),
      icon: ({
        about: '🧑‍💻', writing: '✍️', skills: '🌐', projects: '📂',
        travel: '🗺️', plan: '📅', toolbox: '🛠️', links: '🔗',
        settings: '⚙️', terminal: '💻'
      } as Record<string, string>)[app.id] ?? '📄',
      detail: '系统应用'
    }));

    // 2. 过滤博文/笔记
    const matchedPosts = posts.filter(post =>
      q && (
        post.data.title.toLowerCase().includes(q) ||
        post.data.summary?.toLowerCase().includes(q) ||
        post.data.tags.some(tag => tag.toLowerCase().includes(q))
      )
    ).map(post => ({
      type: 'post' as const,
      id: post.id,
      label: post.data.title,
      icon: post.data.category === 'note' ? '📝' : '✍️',
      detail: post.data.category === 'note' ? '课业笔记' : '博文文章'
    }));

    return [...matchedApps, ...matchedPosts];
  }, [query, posts, t]);

  const handleSelect = (item: { type: 'app' | 'post'; id: string; label: string }) => {
    if (item.type === 'app') {
      openWindow(item.id, t(`app.${item.id}.title`));
    } else {
      // 设定当前活跃文章，并唤醒博客窗口
      setActivePostId(item.id);
      openWindow('writing', t('app.writing.title'));
    }
    closeSpotlight();
  };

  return (
    <>
      {/* 遮罩 */}
      <div className="spotlight-overlay" onClick={closeSpotlight} aria-hidden />

      {/* 搜索框 */}
      <div className="spotlight" role="dialog" aria-label="Spotlight 搜索" aria-modal>
        <div className="spotlight__input-wrap">
          <svg className="spotlight__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            className="spotlight__input"
            type="text"
            placeholder={t('common.search.placeholder')}
            value={query}
            onChange={e => setSpotlightQuery(e.target.value)}
            aria-autocomplete="list"
            aria-controls="spotlight-results"
          />
          {query && (
            <button className="spotlight__clear" onClick={() => setSpotlightQuery('')} aria-label="清空">
              ×
            </button>
          )}
        </div>

        {/* 结果列表 */}
        <ul className="spotlight__results" id="spotlight-results" role="listbox">
          {results.map(item => (
            <li
              key={item.id}
              className="spotlight__item"
              role="option"
              onClick={() => handleSelect(item)}
              onKeyDown={e => e.key === 'Enter' && handleSelect(item)}
              tabIndex={0}
              aria-selected={false}
            >
              <span className="spotlight__item-icon">{item.icon}</span>
              <span className="spotlight__item-label">{item.label}</span>
              <span className="spotlight__item-type">{item.detail}</span>
            </li>
          ))}
          {results.length === 0 && (
            <li className="spotlight__empty">没有找到 "{query}" 相关内容</li>
          )}
        </ul>

        <div className="spotlight__hint">
          <kbd>↵</kbd> 打开 &nbsp; <kbd>Esc</kbd> 关闭
        </div>
      </div>
    </>
  );
}
