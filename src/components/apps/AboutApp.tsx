// src/components/apps/AboutApp.tsx
import { useState, useEffect, useRef } from 'react';
import { useT } from '../../i18n';
import { useWindow } from '../window/Window';
import { useWindowsStore } from '../../store/windows';
import './AboutApp.css';

type Tab = 'overview' | 'experience' | 'skills' | 'projects';

interface StatBarProps {
  label: string;
  value: number; // 0 - 100
  colorVar: string;
}

function StatBar({ label, value, colorVar }: StatBarProps) {
  return (
    <div className="profile-stat-bar">
      <div className="profile-stat-bar__info">
        <span className="profile-stat-bar__label">{label}</span>
        <span className="profile-stat-bar__value" style={{ color: `var(${colorVar})` }}>{value}%</span>
      </div>
      <div className="profile-stat-bar__track">
        <div 
          className="profile-stat-bar__fill" 
          style={{ 
            width: `${value}%`, 
            background: `linear-gradient(90deg, var(--color-accent), var(${colorVar}))`,
            boxShadow: `0 0 10px var(${colorVar}-glow)`
          } as React.CSSProperties} 
        />
      </div>
    </div>
  );
}

export default function AboutApp() {
  const t = useT();
  const { winId } = useWindow();
  const setWindowNavigation = useWindowsStore(s => s.setWindowNavigation);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [historyStack, setHistoryStack] = useState<Tab[]>(['overview']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isNavigatingRef = useRef(false);

  // 动态加载并销毁 mapmyvisitors 访客地球打点脚本
  useEffect(() => {
    if (activeTab !== 'overview') return;

    const cleanUpWidget = () => {
      const existingScript = document.getElementById('mapmyvisitors');
      if (existingScript) existingScript.remove();
      const widget = document.getElementById('mapmyvisitors-widget');
      if (widget) widget.remove();
    };

    cleanUpWidget();

    // 寻找影子挂载点
    const container = document.getElementById('visitor-map-mount');
    if (!container) return;

    // 动态创建并插入 Script 标签
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.id = 'mapmyvisitors';
    script.src = '//mapmyvisitors.com/map.js?d=IYu8iNH6bZ7whJUi54OooLM7iOqBUPxR_nqajHvb2CI&cl=ffffff&w=a';
    
    container.appendChild(script);

    return () => {
      cleanUpWidget();
    };
  }, [activeTab]);

  // 用户主动切换 Tab
  const handleTabChange = (tab: Tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);

    if (!isNavigatingRef.current) {
      const nextStack = historyStack.slice(0, historyIndex + 1);
      nextStack.push(tab);
      setHistoryStack(nextStack);
      setHistoryIndex(nextStack.length - 1);
    }
  };

  // 绑定窗口前进后退协议
  useEffect(() => {
    const handleGoBack = () => {
      if (historyIndex > 0) {
        isNavigatingRef.current = true;
        const prevIndex = historyIndex - 1;
        setHistoryIndex(prevIndex);
        setActiveTab(historyStack[prevIndex]);
        setTimeout(() => { isNavigatingRef.current = false; }, 0);
      }
    };

    const handleGoForward = () => {
      if (historyIndex < historyStack.length - 1) {
        isNavigatingRef.current = true;
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setActiveTab(historyStack[nextIndex]);
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
  }, [winId, historyIndex, historyStack, setWindowNavigation]);

  // 技能数据
  const skillBars = [
    { label: 'Python (Pandas, NumPy, Scikit-learn)', value: 88, colorVar: '--color-accent-bright' },
    { label: 'SQL (Data Querying, ETL & Integration)', value: 85, colorVar: '--color-accent-bright' },
    { label: 'BI & Data Visualization (Power BI, Excel, Matplotlib)', value: 92, colorVar: '--color-gold' },
    { label: 'Statistical Principles & Modeling', value: 80, colorVar: '--color-gold' },
    { label: 'Machine Learning Algorithms', value: 75, colorVar: '--color-blue' }
  ];

  return (
    <div className="about-app-container">
      {/* 侧边导航栏 */}
      <aside className="about-sidebar">
        <div className="about-profile-header">
          <div className="about-profile-avatar">S</div>
          <h2 className="about-profile-name">Shimmer</h2>
          <p className="about-profile-class">Lv.22 Data Analyst</p>
        </div>
        
        <nav className="about-nav" role="tablist">
          <button 
            role="tab"
            aria-selected={activeTab === 'overview'}
            className={`about-nav-item ${activeTab === 'overview' ? 'about-nav-item--active' : ''}`}
            onClick={() => handleTabChange('overview')}
          >
            📊 基础属性
          </button>
          <button 
            role="tab"
            aria-selected={activeTab === 'experience'}
            className={`about-nav-item ${activeTab === 'experience' ? 'about-nav-item--active' : ''}`}
            onClick={() => handleTabChange('experience')}
          >
            🗺️ 升级路线 (教育)
          </button>
          <button 
            role="tab"
            aria-selected={activeTab === 'skills'}
            className={`about-nav-item ${activeTab === 'skills' ? 'about-nav-item--active' : ''}`}
            onClick={() => handleTabChange('skills')}
          >
            ⚡ 技能面板
          </button>
          <button 
            role="tab"
            aria-selected={activeTab === 'projects'}
            className={`about-nav-item ${activeTab === 'projects' ? 'about-nav-item--active' : ''}`}
            onClick={() => handleTabChange('projects')}
          >
            🏆 副本竞赛 (项目)
          </button>
        </nav>
      </aside>

      {/* 主展示区 */}
      <main className="about-main-content">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="about-tab-panel animate-fade-in-up">
            <section className="about-bio-section">
              <h3 className="about-section-heading">个人志</h3>
              <p className="about-description">
                现就读于 <strong>Virginia Tech (统计与计算方向)</strong> & <strong>西安电子科技大学 (大管理与应用)</strong>。
                擅长使用数据工具作为杠杆，探索信息背后的逻辑与规律，并倾向于将晦涩的数字可视化为直观的业务洞察。
              </p>
            </section>

            <section className="about-grid-stats">
              <div className="stat-card">
                <span className="stat-card__icon">📈</span>
                <span className="stat-card__number">GPA 3.8/4.0</span>
                <span className="stat-card__label">西电成绩排名前 10%</span>
              </div>
              <div className="stat-card">
                <span className="stat-card__icon">🗣️</span>
                <span className="stat-card__number">CUDC 二等奖</span>
                <span className="stat-card__label">全国大学生英语辩论赛</span>
              </div>
            </section>

            <section className="about-skills-cloud">
              <h3 className="about-section-heading">特质标签</h3>
              <div className="profile-tags">
                {['数据挖掘', '商业分析', 'ETL建模', '机器学习', '英语辩论', '科技创新', '薅羊毛'].map(tag => (
                  <span key={tag} className="profile-tag-item">{tag}</span>
                ))}
              </div>
            </section>

            <section className="about-social-channels">
              <h3 className="about-section-heading">社交联系</h3>
              <div className="social-links-grid">
                <a href="mailto:xuanmi777@outlook.com" className="social-link-btn">
                  ✉️ xuanmi777@outlook.com
                </a>
                <a href="https://github.com/shimmer0007" target="_blank" rel="noreferrer" className="social-link-btn">
                  🐙 GitHub (shimmer0007)
                </a>
              </div>
            </section>

            <section className="about-visitor-map">
              <h3 className="about-section-heading">访客雷达 (读者足迹)</h3>
              <div id="visitor-map-mount" className="visitor-map-mount-box" />
            </section>
          </div>
        )}

        {/* TAB 2: EXPERIENCE */}
        {activeTab === 'experience' && (
          <div className="about-tab-panel animate-fade-in-up">
            <h3 className="about-section-heading">学术探索升级线</h3>
            <div className="experience-timeline">
              <div className="timeline-item">
                <div className="timeline-marker" />
                <div className="timeline-content">
                  <span className="timeline-date">2025.08 - 2026.05 (Expected)</span>
                  <h4 className="timeline-title">Virginia Tech (弗吉尼亚理工)</h4>
                  <p className="timeline-sub">B.S. in Entrepreneurship, Innovation & Technology Management</p>
                  <p className="timeline-desc">专注于计算创新商业化，结合数理统计模型在创新市场策略中的落地实践。</p>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-marker" />
                <div className="timeline-content">
                  <span className="timeline-date">2022.09 - 2026.06 (Expected)</span>
                  <h4 className="timeline-title">西安电子科技大学</h4>
                  <p className="timeline-sub">B.S. in Big Data Management and Application (大管理与应用)</p>
                  <p className="timeline-desc">
                    GPA: 3.8/4.0 (Top 10%)。
                    荣获校级科技优秀毕业生、一二等优秀学生奖学金、校友创新科技奖学金。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SKILLS */}
        {activeTab === 'skills' && (
          <div className="about-tab-panel animate-fade-in-up">
            <h3 className="about-section-heading">技术栈熟练度</h3>
            <div className="skills-stat-list">
              {skillBars.map(bar => (
                <StatBar 
                  key={bar.label} 
                  label={bar.label} 
                  value={bar.value} 
                  colorVar={bar.colorVar} 
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="about-tab-panel animate-fade-in-up">
            <h3 className="about-section-heading">副本通关记录 (竞赛与项目)</h3>
            <div className="projects-quest-list">
              
              <div className="quest-card">
                <div className="quest-card__badge">课程项目</div>
                <h4 className="quest-card__title">信贷风险评估与贷款决策分析</h4>
                <p className="quest-card__subtitle">Adobe Inc. 标普500财务评级案例研究</p>
                <ul className="quest-card__bullets">
                  <li>通过计算超10个关键财务比率对 Adobe 进行多维信用度评估。</li>
                  <li>构建现金流预测回归模型 (Adj. R²=0.71) 并通过 Altman Z-Score 验证低破产风险。</li>
                </ul>
              </div>

              <div className="quest-card">
                <div className="quest-card__badge gold">全国亚军</div>
                <h4 className="quest-card__title">隆基绿能全球商业精英挑战赛</h4>
                <p className="quest-card__subtitle">Жарық 光伏一体化市场进入策略</p>
                <ul className="quest-card__bullets">
                  <li>主导中亚能源市场的 PESTEL 模型分析，发掘太阳能转型的空白潜力。</li>
                  <li>主笔光伏系统投资回收率模型、资金财务计划及本地化分销预算。</li>
                </ul>
              </div>

              <div className="quest-card">
                <div className="quest-card__badge">国际奖项</div>
                <h4 className="quest-card__title">MCM/ICM 美赛 (数学建模竞赛)</h4>
                <p className="quest-card__subtitle">Honorable Mention (Top 25%)</p>
                <ul className="quest-card__bullets">
                  <li>创新结合 Beta 概率分布与 Lotka-Volterra 动态方程建立复杂种群稳态平衡模型。</li>
                  <li>使用 Python 对极度缺乏的数据集进行了多次蒙特卡洛参数拟合与稳健性检验。</li>
                </ul>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
