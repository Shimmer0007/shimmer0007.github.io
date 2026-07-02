// src/components/apps/ProjectsApp.tsx
import { useState, useEffect } from 'react';
import { useWindow } from '../window/Window';
import { useWindowsStore } from '../../store/windows';
import { useContentStore } from '../../store/content';
import { useT } from '../../i18n';
import './ProjectsApp.css';

interface ProjectItem {
  id: string;
  nameZh: string;
  nameEn: string;
  category: 'ds' | 'ml' | 'qf' | 'rm' | 'strategy';
  categoryLabelZh: string;
  categoryLabelEn: string;
  date: string;
  roleZh: string;
  roleEn: string;
  summaryZh: string;
  summaryEn: string;
  techStack: string[];
  highlightsZh: string[];
  highlightsEn: string[];
  linkedPostId?: string; // 关联的博客博文ID，用于跨应用跳转
}

const PROJECTS_DATA: ProjectItem[] = [
  {
    id: 'textmining',
    nameZh: '基于银发经济的学术文本挖掘与情感分析',
    nameEn: 'Silver Economy Academic Text Mining & NLP',
    category: 'ds',
    categoryLabelZh: '数据科学 / 文本挖掘',
    categoryLabelEn: 'Data Science / NLP',
    date: '2025.03 - 2025.06',
    roleZh: '独立研究员 & 开发',
    roleEn: 'Independent Researcher & Developer',
    summaryZh: '对“银发经济”（老年产业）领域的学术文献进行大规模多维度分析。利用 Python 进行文本预处理、TF-IDF 文本表征，构建 LDA 主题模型提取核心研究热点，并设计中英文混合文本分类和细粒度情感分析管道。',
    summaryEn: 'Conducted large-scale multi-dimensional analysis on academic literature in the "Silver Economy" (elderly industry) domain. Used Python for text preprocessing, TF-IDF text representation, built LDA topic models to extract research hotspots, and designed text classification and fine-grained sentiment analysis pipelines.',
    techStack: ['Python', 'NLTK / Jieba', 'Scikit-Learn', 'LDA Topic Model', 'Matplotlib'],
    highlightsZh: [
      '清洗并解析了超过 5,000 篇中英文文献摘要与正文数据，处理了复杂的编码与停用词过滤。',
      '利用 TF-IDF 和 LDA 聚类将研究热点归纳为 6 个核心研究主题（智慧养老、老年金融、慢病管理等）。',
      '运用双向情感分类对媒体报道进行极性挖掘，揭示了社会公众对智慧养老产品的核心关注点。'
    ],
    highlightsEn: [
      'Cleaned and parsed 5,000+ Chinese & English literature abstracts and full texts, handling encoding and stopword filtering.',
      'Grouped research hotspots into 6 core themes (smart elderly care, geriatric finance, chronic disease management, etc.) using TF-IDF and LDA.',
      'Utilized sentiment classification to mine media reports, revealing public attitudes toward smart elderly care products.'
    ],
    linkedPostId: '20250602textmining'
  },
  {
    id: 'usergrowth',
    nameZh: '科大讯飞用户新增预测挑战赛',
    nameEn: 'iFLYTEK User Growth Prediction Challenge',
    category: 'ml',
    categoryLabelZh: '机器学习 / 数据建模',
    categoryLabelEn: 'Machine Learning / Tabular Data',
    date: '2025.07',
    roleZh: '建模组长 (Top Tier Ranking)',
    roleEn: 'Modeling Team Lead (Top Tier)',
    summaryZh: '参赛于 DW2025 夏令营科大讯飞“用户新增预测挑战赛”。面对高维稀疏特征与不平衡样本，主导特征工程建设，并采用 LightGBM、XGBoost 与 CatBoost 融合模型在时序划分验证集上完成了高精度的用户新增概率建模。',
    summaryEn: 'Participated in the iFLYTEK User Growth Prediction Challenge (DW2025). Tackled high-dimensional sparse features and class imbalance by leading feature engineering and deploying ensemble models of LightGBM, XGBoost, and CatBoost.',
    techStack: ['Python', 'LightGBM / XGBoost', 'Pandas / Optuna', 'Feature Engineering', 'Ensemble Learning'],
    highlightsZh: [
      '主导提取用户历史行为的滑动窗口统计特征、转换率特征和目标编码，特征维度由原始 20+ 拓展至 150+。',
      '利用 Bayesian Optimization (Optuna) 对三个强分类器进行了超参数自动寻优，防止过拟合。',
      '使用 Rank Averaging 与 Stacking 策略混合模型，大幅提升了模型在未登录冷启动测试集上的 AUC 稳定性。'
    ],
    highlightsEn: [
      'Led the extraction of rolling window statistics, conversion rates, and target encodings, expanding feature dimensions from 20 to 150+.',
      'Utilized Optuna (Bayesian Optimization) for hyperparameter tuning of LightGBM, XGBoost, and CatBoost models.',
      'Employed Rank Averaging and Stacking strategies to significantly stabilize AUC metrics on cold-start test sets.'
    ],
    linkedPostId: '20250712usergrowth'
  },
  {
    id: 'factor-investment',
    nameZh: 'A股市场的因子投资宏观风险暴露研究',
    nameEn: 'Factor Investing & Macro Risk Exposure on A-Share Market',
    category: 'qf',
    categoryLabelZh: '量化金融 / 因子投资',
    categoryLabelEn: 'Quantitative Finance / Factor Model',
    date: '2025.10 - 2025.12',
    roleZh: '独立研究员 (量化分析)',
    roleEn: 'Independent Quantitative Analyst',
    summaryZh: '研究 A 股市场常见学术与风格因子（如 Fama-French 三因子、动量、流动性因子）在宏观经济状态（通胀、利率、汇率）变化下的风险暴露与收益偏移。基于中证全指构建回测引擎，评估宏观环境对因子有效性的冲击。',
    summaryEn: 'Investigated risk exposures and return shifts of standard academic and style factors (e.g., Fama-French 3-factor, momentum, liquidity) under varying macroeconomic regimes (inflation, interest rates, FX). Built a backtesting engine on the CSI All Share Index.',
    techStack: ['Python', 'Statsmodels / Pandas', 'Fama-French Model', 'Macroeconomic Regimes', 'Factor Backtest'],
    highlightsZh: [
      '清洗处理了 10 年期的 A 股上市公司财务报表及行情日频数据，构建了稳健的多因子持仓组合回测。',
      '利用多元线性回归评估因子在不同宏观指标下的贝塔系数，绘制了宏观周期的因子风险暴露图谱。',
      '设计了宏观状态下的风格轮动因子策略，回测显示在通胀上行周期，防御性与低估值因子显著超越基准。'
    ],
    highlightsEn: [
      'Processed 10 years of daily trading data and financial statements of A-share listed companies for multi-factor portfolio backtests.',
      'Evaluated factor betas under various macro indicators via multivariate linear regressions, mapping factor exposures across cycles.',
      'Designed a regime-switching style rotation strategy, yielding significant outperformance for defensive and low-value factors during inflation.'
    ]
  },
  {
    id: 'credit-risk',
    nameZh: 'Adobe 信贷风险评估与授信额度预测项目',
    nameEn: 'Adobe Credit Risk Assessment & Limit Optimization',
    category: 'rm',
    categoryLabelZh: '风险管理 / 信用评分',
    categoryLabelEn: 'Risk Management / Credit Scoring',
    date: '2025.11 - 2025.12',
    roleZh: '数据分析顾问',
    roleEn: 'Data Analytics Consultant',
    summaryZh: '模拟分析 Adobe 会员用户的信用履约数据，设计了信用违约风险预测（Probability of Default）与授信额度（Credit Limit）优化决策系统。结合逻辑回归记分卡与决策树模型，提供金融业务层面的信用评级标准。',
    summaryEn: 'Analyzed member performance datasets to predict Probability of Default (PD) and optimize Credit Limit assignment. Combined Logistic Regression scorecards and decision trees to deliver business-level credit ratings.',
    techStack: ['Python', 'Logistic Regression Scorecard', 'Decision Tree', 'WoE / IV Analysis', 'SHAP Explainability'],
    highlightsZh: [
      '采用 WoE (Weight of Evidence) 对分类型和连续型特征进行分箱编码，使用 IV (Information Value) 筛选高预测力因子。',
      '将逻辑回归模型拟合结果转化为标准的 1000 分制信用评分卡，并设定违约概率的分界点。',
      '利用 SHAP 值对极端高授信用户的画像进行了归因解析，有效提升了风控审核流程的可解释性。'
    ],
    highlightsEn: [
      'Applied WoE (Weight of Evidence) binning and filtered predictive variables using IV (Information Value).',
      'Translated logistic regression log-odds into a standard 1000-point credit scorecard with optimized cutoff points.',
      'Utilized SHAP values to explain predictive profiles of high-limit members, increasing risk management transparency.'
    ]
  },
  {
    id: 'longi-energy',
    nameZh: '隆基绿能全球新能源商业大赛亚军项目',
    nameEn: 'LONGI Global Green Energy Business Case Challenge',
    category: 'strategy',
    categoryLabelZh: '商业策略 / 新能源估值',
    categoryLabelEn: 'Business Strategy / Green Valuation',
    date: '2025.04 - 2025.05',
    roleZh: '商业估值与战略规划师 (全球亚军)',
    roleEn: 'Financial Valuation & Strategy Planner (Global Runner-Up)',
    summaryZh: '参与“隆基全球新能源商业挑战赛”，为特定区域的光伏制氢与微网储能电站设计商业可行性方案。负责电站财务估值模型构建，计算 LCOE（平准化度电成本）及项目 IRR，并进行多维度的敏感性分析与风险对冲战略规划。',
    summaryEn: 'Participated in the LONGI Green Energy Business Case Challenge, designing commercial blueprints for photovoltaic hydrogen generation and micro-grid storage. Led financial valuation, calculating LCOE and project IRR.',
    techStack: ['Excel Financial Model', 'LCOE / NPV / IRR Valuation', 'Sensitivity Analysis', 'Clean Energy Strategy'],
    highlightsZh: [
      '构建了 25 年全周期的清洁能源项目财务报表预测模型，精密计算了不同光照和电价水平下的敏感性。',
      '通过平准化度电成本 (LCOE) 测算，证明了光伏-制氢一体化在特定工业园区的商业闭环可能性。',
      '方案最终在与全球高校的角逐中脱颖而出，荣获“全球总决赛亚军”的顶尖奖项。'
    ],
    highlightsEn: [
      'Constructed a 25-year financial forecast model for clean energy projects, accounting for solar radiation and tariff sensitivity.',
      'Proved commercial viability of PV-hydrogen integration in selected industrial zones via LCOE benchmarks.',
      'The proposal outperformed international university teams to secure the Global Runner-Up award.'
    ]
  }
];

export default function ProjectsApp() {
  const t = useT();
  const { winId } = useWindow();
  
  // 窗口与内容跳转总线
  const openWindow = useWindowsStore(s => s.openWindow);
  const { setActivePostId, setActiveTag } = useContentStore();

  const [selectedProjId, setSelectedProjId] = useState<string | null>(null);
  const [lang, setLang] = useState<'zh' | 'en'>('zh');

  // 获取当前的语言环境
  useEffect(() => {
    // 监听系统语言 (i18n state) 变化，这里直接使用 i18n 系统当前的语系
    const rootLang = document.documentElement.lang || 'zh';
    setLang(rootLang === 'en' ? 'en' : 'zh');
    
    // 如果系统语言发生变化，自动更新 state
    const observer = new MutationObserver(() => {
      const nextLang = document.documentElement.lang || 'zh';
      setLang(nextLang === 'en' ? 'en' : 'zh');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    return () => observer.disconnect();
  }, []);

  const selectedProject = PROJECTS_DATA.find(p => p.id === selectedProjId);

  // 跨窗口联动：启动技术复盘博文
  const handleLaunchBlog = (postId: string) => {
    setActivePostId(postId);
    openWindow('writing', t('app.writing.title'));
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'ds': return 'var(--color-cyan)';
      case 'ml': return 'var(--color-purple)';
      case 'qf': return 'var(--color-green)';
      case 'rm': return 'var(--color-red)';
      default: return 'var(--color-gold)';
    }
  };

  return (
    <div className="projects-app-container">
      {selectedProject ? (
        /* ===== B. 项目全息蓝图详情视图 (Detail Spec Sheet) ===== */
        <article className="project-detail-view">
          {/* 返回按钮 */}
          <header className="project-detail-header">
            <button 
              className="project-back-btn" 
              onClick={() => setSelectedProjId(null)}
            >
              ← {lang === 'zh' ? '返回档案目录' : 'Back to Dossier Catalog'}
            </button>
            <span 
              className="project-detail-badge"
              style={{ 
                color: getCategoryColor(selectedProject.category),
                borderColor: getCategoryColor(selectedProject.category),
                backgroundColor: `${getCategoryColor(selectedProject.category)}18`
              }}
            >
              {lang === 'zh' ? selectedProject.categoryLabelZh : selectedProject.categoryLabelEn}
            </span>
          </header>

          <div className="project-detail-main">
            {/* 项目标题及时间 */}
            <div className="project-detail-meta">
              <h1 className="project-detail-title">
                {lang === 'zh' ? selectedProject.nameZh : selectedProject.nameEn}
              </h1>
              <div className="project-detail-submeta">
                <span>⏱️ <b>{lang === 'zh' ? '项目周期' : 'Timeline'}:</b> {selectedProject.date}</span>
                <span>👤 <b>{lang === 'zh' ? '承担角色' : 'My Role'}:</b> {lang === 'zh' ? selectedProject.roleZh : selectedProject.roleEn}</span>
              </div>
            </div>

            {/* 项目概述 */}
            <section className="project-detail-section">
              <h2>{lang === 'zh' ? '📋 任务概要 / Mission Briefing' : '📋 Mission Briefing'}</h2>
              <p className="project-detail-summary">
                {lang === 'zh' ? selectedProject.summaryZh : selectedProject.summaryEn}
              </p>
            </section>

            {/* 技术兵器库 */}
            <section className="project-detail-section">
              <h2>{lang === 'zh' ? '🛠️ 武器装备 / Technical Arsenal' : '🛠️ Technical Arsenal'}</h2>
              <div className="project-tech-chips">
                {selectedProject.techStack.map(tech => (
                  <span key={tech} className="project-tech-chip">{tech}</span>
                ))}
              </div>
            </section>

            {/* 实战闪光点 */}
            <section className="project-detail-section">
              <h2>{lang === 'zh' ? '🎯 关键战果 / Major Highlights' : '🎯 Major Highlights'}</h2>
              <ul className="project-detail-highlights">
                {(lang === 'zh' ? selectedProject.highlightsZh : selectedProject.highlightsEn).map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </section>

            {/* 跨应用联动传送门 */}
            {selectedProject.linkedPostId && (
              <footer className="project-detail-footer">
                <button 
                  className="project-portal-btn"
                  onClick={() => handleLaunchBlog(selectedProject.linkedPostId!)}
                  style={{
                    boxShadow: `0 4px 15px ${getCategoryColor(selectedProject.category)}40`,
                    borderColor: getCategoryColor(selectedProject.category)
                  }}
                >
                  🚀 {lang === 'zh' ? '调阅本项目的技术复盘博文 / Launch Post' : 'Launch Technical Review'}
                </button>
              </footer>
            )}
          </div>
        </article>
      ) : (
        /* ===== A. 档案卡片网格列表 (Dossier Catalog Grid) ===== */
        <div className="projects-grid-view">
          <header className="projects-list-header">
            <h2>📂 {lang === 'zh' ? '机密档案集 / Secret Projects Catalog' : 'Secret Projects Catalog'}</h2>
            <p>{lang === 'zh' ? '记录了我在人工智能、数据挖掘、金融量化及商业分析领域的实践工程蓝图。' : 'Blueprints of my engineering projects across AI, ML, Quantitative Finance, and Business Valuation.'}</p>
          </header>

          <div className="projects-grid">
            {PROJECTS_DATA.map(proj => (
              <div 
                key={proj.id} 
                className="project-card"
                onClick={() => setSelectedProjId(proj.id)}
                style={{
                  '--card-accent': getCategoryColor(proj.category)
                } as React.CSSProperties}
              >
                <div className="project-card-header">
                  <span className="project-card-date">{proj.date}</span>
                  <span 
                    className="project-card-badge"
                    style={{
                      color: getCategoryColor(proj.category),
                      backgroundColor: `${getCategoryColor(proj.category)}12`
                    }}
                  >
                    {lang === 'zh' ? proj.categoryLabelZh.split(' ')[0] : proj.categoryLabelEn.split(' ')[0]}
                  </span>
                </div>

                <h3 className="project-card-title">
                  {lang === 'zh' ? proj.nameZh : proj.nameEn}
                </h3>

                <p className="project-card-desc">
                  {lang === 'zh' ? proj.summaryZh.substring(0, 75) + '...' : proj.summaryEn.substring(0, 110) + '...'}
                </p>

                <div className="project-card-footer">
                  <div className="project-card-tags">
                    {proj.techStack.slice(0, 3).map(tech => (
                      <span key={tech}>{tech}</span>
                    ))}
                  </div>
                  <span className="project-card-arrow">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
