// src/components/apps/WritingApp.tsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { useT } from '../../i18n';
import { useWindow } from '../window/Window';
import { useWindowsStore } from '../../store/windows';
import { useContentStore, type PostItem } from '../../store/content';
import { getPostUrl } from '../../lib/post-url';
import { marked } from 'marked';
import './WritingApp.css';

type FilterCategory = 'all' | 'tech' | 'life' | 'project' | 'note';

export default function WritingApp() {
  const t = useT();
  const { winId } = useWindow();
  const setWindowNavigation = useWindowsStore(s => s.setWindowNavigation);
  
  // 全局内容联动 store
  const { posts, activePostId, setActivePostId, activeTag, setActiveTag } = useContentStore();

  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 5. 监听技能树等其他应用发出的 activeTag 检索信号
  useEffect(() => {
    if (activeTag) {
      setSearchQuery(activeTag);
      setActiveCategory('all'); // 重置分类至 ALL 保证检索可见性
      setActiveTag(null); // 即刻销毁总线信号，避免阻碍用户二次检索
    }
  }, [activeTag, setActiveTag]);

  // 内部导航历史状态栈 (以存储文章的 ID 为准，如果 ID 为空表示列表首页)
  const [historyStack, setHistoryStack] = useState<(string | null)[]>([activePostId]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isNavigatingRef = useRef(false);

  // 1. 过滤和搜索文章列表
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchCat = activeCategory === 'all' || post.data.category === activeCategory;
      const matchSearch = !searchQuery || 
        post.data.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.data.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.data.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [posts, activeCategory, searchQuery]);

  // 获取当前选中的文章详情
  const currentPost = useMemo(() => {
    return posts.find(p => p.id === activePostId) || null;
  }, [posts, activePostId]);

  // 2. 选择文章（推动导航栈）
  const handleSelectPost = (postId: string | null) => {
    if (postId === activePostId) return;
    setActivePostId(postId);

    if (!isNavigatingRef.current) {
      const nextStack = historyStack.slice(0, historyIndex + 1);
      nextStack.push(postId);
      setHistoryStack(nextStack);
      setHistoryIndex(nextStack.length - 1);
    }
  };

  // 3. 绑定窗口前进后退协议
  useEffect(() => {
    const handleGoBack = () => {
      if (historyIndex > 0) {
        isNavigatingRef.current = true;
        const prevIndex = historyIndex - 1;
        setHistoryIndex(prevIndex);
        setActivePostId(historyStack[prevIndex]);
        setTimeout(() => { isNavigatingRef.current = false; }, 0);
      }
    };

    const handleGoForward = () => {
      if (historyIndex < historyStack.length - 1) {
        isNavigatingRef.current = true;
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setActivePostId(historyStack[nextIndex]);
        setTimeout(() => { isNavigatingRef.current = false; }, 0);
      }
    };

    setWindowNavigation(winId, {
      canGoBack: historyIndex > 0,
      canGoForward: historyIndex < historyStack.length - 1,
      onBack: handleGoBack,
      onForward: handleGoForward,
    });

    return () => {
      setWindowNavigation(winId, {
        canGoBack: false,
        canGoForward: false,
        onBack: undefined,
        onForward: undefined,
      });
    };
  }, [winId, historyIndex, historyStack, setWindowNavigation, setActivePostId]);

  // 4. 当全局 activePostId 被其它应用（如 Spotlight 搜索结果）改变时，同步更新内部导航栈
  useEffect(() => {
    if (activePostId !== historyStack[historyIndex]) {
      // 外部改变引起的 activePostId 变更
      const nextStack = historyStack.slice(0, historyIndex + 1);
      nextStack.push(activePostId);
      setHistoryStack(nextStack);
      setHistoryIndex(nextStack.length - 1);
    }
  }, [activePostId]);

  // 将 Markdown 转为 HTML
  const renderedHTML = useMemo(() => {
    if (!currentPost || currentPost.data.link) return '';
    try {
      return marked.parse(currentPost.body);
    } catch (e) {
      return '<p>文章解析失败...</p>';
    }
  }, [currentPost]);

  return (
    <div className="writing-app-container">
      {/* ===== 左栏: 文章列表 ===== */}
      <aside className="writing-sidebar">
        {/* 顶部搜索框 */}
        <div className="writing-search">
          <input 
            type="text" 
            placeholder="搜索文章与 mission..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* 分类过滤器 */}
        <div className="writing-categories">
          {(['all', 'tech', 'life', 'project', 'note'] as const).map(cat => (
            <button
              key={cat}
              className={`writing-cat-btn ${activeCategory === cat ? 'writing-cat-btn--active' : ''}`}
              onClick={() => {
                setActiveCategory(cat);
                handleSelectPost(null); // 切换分类时默认回到首页
              }}
            >
              {cat === 'all' && '📚 ALL'}
              {cat === 'tech' && '💻 TECH'}
              {cat === 'life' && '🌿 LIFE'}
              {cat === 'project' && '⚡ PROJ'}
              {cat === 'note' && '📝 NOTE'}
            </button>
          ))}
        </div>

        {/* 滚动列表 */}
        <div className="writing-list">
          {filteredPosts.map(post => {
            const isActive = post.id === activePostId;
            const isNote = post.data.category === 'note';
            
            return (
              <div
                key={post.id}
                className={`writing-item-card ${isActive ? 'writing-item-card--active' : ''} ${isNote ? 'writing-item-card--note' : ''}`}
                onClick={() => handleSelectPost(post.id)}
              >
                <div className="writing-item-header">
                  <span className="writing-item-date">{post.data.date}</span>
                  <div className="writing-item-actions">
                    {post.data.status && (
                      <span className={`writing-note-status writing-note-status--${post.data.status.toLowerCase()}`}>
                        {post.data.status}
                      </span>
                    )}
                    <a
                      className="writing-item-permalink"
                      href={getPostUrl(post.slug)}
                      onClick={event => event.stopPropagation()}
                      aria-label={`在独立页面阅读《${post.data.title}》`}
                      title="独立阅读"
                    >
                      ↗
                    </a>
                  </div>
                </div>
                <h4 className="writing-item-title">{post.data.title}</h4>
                <p className="writing-item-summary">{post.data.summary}</p>
                <div className="writing-item-tags">
                  {post.data.tags.slice(0, 3).map(t => (
                    <span key={t} className="writing-item-tag">#{t}</span>
                  ))}
                </div>
              </div>
            );
          })}
          {filteredPosts.length === 0 && (
            <div className="writing-list-empty">无相关匹配文章</div>
          )}
        </div>
      </aside>

      {/* ===== 右栏: 正文阅读器 ===== */}
      <main className="writing-reader">
        {currentPost ? (
          <div className="writing-article animate-fade-in-up">
            {/* 文章头部信息 */}
            <header className="writing-article-header">
              <div className="writing-article-meta">
                <div className="writing-article-meta__primary">
                  <span className="writing-article-category">
                    {currentPost.data.category.toUpperCase()}
                  </span>
                  <span className="writing-article-date">{currentPost.data.date}</span>
                </div>
                <a
                  className="writing-article-permalink"
                  href={getPostUrl(currentPost.slug)}
                  aria-label={`在独立页面阅读《${currentPost.data.title}》`}
                >
                  独立阅读 <span aria-hidden="true">↗</span>
                </a>
              </div>
              <h1 className="writing-article-title">{currentPost.data.title}</h1>
              
              <div className="writing-article-tags">
                {currentPost.data.tags.map(t => (
                  <span key={t} className="writing-article-tag">#{t}</span>
                ))}
              </div>
            </header>

            {/* 文章正文区 */}
            {currentPost.data.link ? (
              /* 外部链接课业笔记渲染 (飞书等) */
              <div className="writing-note-external">
                <div className="writing-note-external__box">
                  <span className="writing-note-external__icon">📋</span>
                  <h3>外部使命数据源托管</h3>
                  <p>该课业笔记与大纲托管于飞书云文档平台，点击下方按钮将脱离系统沙盒启动外部使命阅览器。</p>
                  <a 
                    href={currentPost.data.link} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="writing-note-launch-btn"
                  >
                    🚀 LAUNCH MISSION (进入文档)
                  </a>
                </div>
              </div>
            ) : (
              /* 普通本地 MD / HTML 渲染 */
              <article 
                className="writing-article-body markdown-body" 
                dangerouslySetInnerHTML={{ __html: renderedHTML }}
              />
            )}
          </div>
        ) : (
          /* ===== 未选中文章的欢迎终端屏 ===== */
          <div className="writing-welcome-screen">
            <div className="writing-welcome-terminal">
              <div className="terminal-header">
                <span className="terminal-dot red"></span>
                <span className="terminal-dot yellow"></span>
                <span className="terminal-dot green"></span>
                <span className="terminal-title">mission_control.sh</span>
              </div>
              <div className="terminal-body">
                <p className="term-prompt">&gt; LOADING WRITING ARCHIVES...</p>
                <p className="term-success">SUCCESS: {posts.length} ARCHIVES LOADED.</p>
                <p className="term-text">------------------------------------------------</p>
                <p className="term-text">ShimmerOS 知识库终端控制台 v3.0</p>
                <p className="term-text">类别分布:</p>
                <p className="term-text">  - 💻 技术成长 (TECH): {posts.filter(p => p.data.category === 'tech').length} 篇</p>
                <p className="term-text">  - 🌿 日常思考 (LIFE): {posts.filter(p => p.data.category === 'life').length} 篇</p>
                <p className="term-text">  - ⚡ 项目竞赛 (PROJ): {posts.filter(p => p.data.category === 'project').length} 篇</p>
                <p className="term-text">  - 📝 课业笔记 (NOTE): {posts.filter(p => p.data.category === 'note').length} 篇</p>
                <p className="term-text">------------------------------------------------</p>
                <p className="term-prompt">&gt; SELECT A MISSION FROM THE SIDEBAR TO BEGIN.</p>
                <span className="term-cursor">_</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
