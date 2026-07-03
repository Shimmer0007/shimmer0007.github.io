// src/components/apps/LinksApp.tsx
import { useOSStore } from '../../store/os';
import { useT } from '../../i18n';
import './LinksApp.css';

interface FriendLink {
  id: string;
  nameZh: string;
  nameEn: string;
  url: string;
  icon: string;
  descZh: string;
  descEn: string;
  color: string; // 自定义该卡片的特定科幻微光色
}

const FRIEND_LINKS: FriendLink[] = [
  {
    id: 'wonderbox',
    nameZh: 'Shimmer 的收藏夹',
    nameEn: "Shimmer's Favorites",
    url: 'https://shimmer0007.github.io/wonderbox/',
    icon: '🎨',
    descZh: '灵感汇聚与有趣的开源宝盒',
    descEn: 'A cabinet of curated inspirations & open source wonder',
    color: '#a855f7' // 紫
  },
  {
    id: 'hyacehila',
    nameZh: 'Hyacehila 的博客',
    nameEn: "Hyacehila's Blog",
    url: 'https://hyacehila.github.io/',
    icon: '🌍',
    descZh: '记录生活与技术思考的旷野',
    descEn: 'A wilderness recording life insights & technical thoughts',
    color: '#10b981' // 绿
  },
  {
    id: 'xducy',
    nameZh: '招生总队张老师',
    nameEn: 'Teacher Zhang of Admission Team',
    url: 'https://xducy.github.io/',
    icon: '🦁',
    descZh: '学长与招生团队的智慧空间',
    descEn: 'The wisdom hub of school admission & senior mentoring',
    color: '#f59e0b' // 金
  },
  {
    id: 'nexmoe',
    nameZh: 'Nexmoe 的产品画廊',
    nameEn: "Nexmoe's Product Gallery",
    url: 'https://nexmoe.com/',
    icon: '💡',
    descZh: '极简美学设计与精致数码艺术',
    descEn: 'Minimalist aesthetic design & delicate digital gallery',
    color: '#06b6d4' // 青
  },
  {
    id: 'emvyh',
    nameZh: 'Emily 的个人站',
    nameEn: "Emily's Personal Website",
    url: 'https://emvyh.github.io/profile',
    icon: '🐰',
    descZh: '温暖细腻的日常分享与前端探索',
    descEn: 'Warm and delicate daily sharing & frontend exploration',
    color: '#f43f5e' // 红
  },
  {
    id: 'patrick',
    nameZh: 'Patrick 的领英',
    nameEn: "Patrick's LinkedIn",
    url: 'https://www.linkedin.com/in/patrick-vyn-badiang',
    icon: '🖥️',
    descZh: '国际化工程人才与职业生涯网络',
    descEn: 'Global engineering talent & professional career network',
    color: '#3b82f6' // 蓝
  },
  {
    id: 'kiakizhang',
    nameZh: '宸总的说明书',
    nameEn: "Chen's Manual",
    url: 'https://kiakizhang.github.io/personal-portfolio/',
    icon: '📘',
    descZh: '宸总的个人说明书与作品空间',
    descEn: "Chen's personal manual & portfolio showcase",
    color: '#0ea5e9' // 珂朵莉蓝
  }
];

export default function LinksApp() {
  const lang = useOSStore(s => s.lang);
  const t = useT();

  return (
    <div className="links-app-container">
      {/* 头部面板 */}
      <header className="links-app-header">
        <h2 className="links-title-glowing">{t('links.title')}</h2>
        <p className="links-intro-text">{t('links.intro')}</p>
      </header>

      {/* 传送卡片网格 */}
      <div className="links-portal-grid">
        {FRIEND_LINKS.map(link => {
          const name = lang === 'zh' ? link.nameZh : link.nameEn;
          const desc = lang === 'zh' ? link.descZh : link.descEn;

          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="links-portal-card"
              style={{ '--link-theme-color': link.color } as React.CSSProperties}
            >
              {/* 卡片高透磨砂扫线 */}
              <div className="links-card-scanline" />

              {/* 左侧 Emoji 科幻圆形徽章 */}
              <div className="links-card-badge">
                <span className="links-badge-icon">{link.icon}</span>
              </div>

              {/* 右侧文本信息 */}
              <div className="links-card-info">
                <h3 className="links-card-name">{name}</h3>
                <p className="links-card-desc">{desc}</p>
                <div className="links-card-portal-hint">
                  <span>{lang === 'zh' ? 'LAUNCH TRANSPORT' : 'LAUNCH TRANSPORT'}</span>
                  <span className="links-arrow-right">→</span>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* 底部寄语 */}
      <footer className="links-app-footer">
        <p className="links-footer-note">
          {lang === 'zh' 
            ? '✨ 宇宙浩瀚，幸而在此相连。' 
            : '✨ In this vast universe, thankfully we are connected here.'}
        </p>
      </footer>
    </div>
  );
}
