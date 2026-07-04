// src/components/apps/ToolboxApp.tsx
import { useState, useMemo, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { useOSStore } from '../../store/os';
import { useContentStore } from '../../store/content';
import { useWindowsStore } from '../../store/windows';
import handbookContent from '../../data/HokieEhall.md?raw';
import './ToolboxApp.css';

// ==========================================
// 1. 数据结构定义
// ==========================================
interface SubApp {
  id: string;
  name: string;
  icon: string;
  desc: string;
  themeClass: string;
}

interface Resource {
  name: string;
  url: string;
  keywords: string;
  tip: string;
}

interface Category {
  title: string;
  icon: string;
  img: string;
  keywords: string;
  resources: Resource[];
}

// 7 大校级分类资源库
const RESOURCE_DATA: Category[] = [
  {
    title: "学业命脉",
    icon: "fas fa-graduation-cap",
    img: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=300&q=60",
    keywords: "学业 命脉 Academics Success 课程 注册 成绩 时间表 校历 图书馆 辅导 写作 荣誉 Genio AI TLOS",
    resources: [
      { name: "课程时间表", url: "https://apps.es.vt.edu/ssb/vt/index.html", keywords: "Timetable 选课 Schedule", tip: "查询每学期课程开设时间、地点和教授信息，用于选课和排课" },
      { name: "Genio (AI学习工具)", url: "https://tlos.vt.edu/tools/genio.html", keywords: "人工智能 笔记 AI", tip: "VT官方AI助教工具，可对课程材料、课件进行智能问答和摘要" },
      { name: "TLOS 学术工具集", url: "https://tlos.vt.edu/tools.html", keywords: "Kaltura Gradescope Turnitin Canvas", tip: "包含Kaltura录屏、Gradescope评分、Turnitin查重等核心教学挂件" },
      { name: "大学图书馆", url: "https://lib.vt.edu/", keywords: "Library 借书 自习室", tip: "查找学术文献、预约Newman自习室、借阅图书、教材和3D扫描设备" },
      { name: "学生成功中心 (辅导)", url: "https://studentsuccess.vt.edu/", keywords: "tutoring 挂科 辅导 Knack", tip: "提供免费课程辅导、学学业规划咨询服务以及一对一朋辈支持" },
      { name: "写作中心", url: "https://studentsuccess.vt.edu/writing_center", keywords: "writing center 论文 修改", tip: "预约一对一英文写作辅导，帮助修改论文、学术报告 and 申请信" },
      { name: "荣誉代码办公室", url: "https://honorsystem.vt.edu/", keywords: "Honor Code 抄袭 违规", tip: "了解VT学术诚信规定，重点防范考试抄袭、代码违规合作等红线行为" }
    ]
  },
  {
    title: "钱包与生计",
    icon: "fas fa-wallet",
    img: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=300&q=60",
    keywords: "钱包 生计 Finances Employment Hokie Wallet 学费 账单 经济援助 奖学金 工作 实习",
    resources: [
      { name: "财务处 (学费账单)", url: "https://www.bursar.vt.edu/", keywords: "Bursar Office tuition bill 缴费", tip: "查看学费明细、在线缴纳学费、设置分期付款计划（Payment Plan）" },
      { name: "经济援助办公室", url: "https://finaid.vt.edu/", keywords: "Financial Aid 贷款 助学金", tip: "了解和申请联邦贷款、助学金政策与具体审核进度流程" },
      { name: "奖学金申请", url: "https://vt.academicworks.com/", keywords: "Scholarships 拿钱", tip: "浏览和在线申请VT各类学院及社会第三方赞助的奖学金机会" },
      { name: "学生就业办公室", url: "https://www.seo.vt.edu/", keywords: "student employment 兼职 打工", tip: "查找校内兼职、TA/RA岗位发布，了解打工申请规定与社会安全号申请材料" },
      { name: "Hokie Passport (校园卡)", url: "https://hokiepassport.vt.edu/", keywords: "校园卡 充值 Hokie Wallet", tip: "在线管理校园卡余额、挂失补办、充值Flex In/Dining Dollars" }
    ]
  },
  {
    title: "生存必需",
    icon: "fas fa-utensils",
    img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=60",
    keywords: "生存 必需 Campus Life Logistics 吃 住 行 住宿 餐饮 邮件 包裹 公交 停车 地图",
    resources: [
      { name: "餐饮服务/菜单", url: "https://dining.vt.edu/", keywords: "Dining Services 食堂 菜单 Meal Plan", tip: "查看West End, Owens等食堂每日实时菜单、营业时间及Meal Plan余额" },
      { name: "邮件包裹服务", url: "https://mailservices.vt.edu/student-mail.html", keywords: "Mail Services 寄信 快递 Owens", tip: "查询校内包裹到达通知、邮件收发地址规范和包裹柜（Locker）领取方式" },
      { name: "BT Transit (黑堡公交)", url: "https://ridebt.org/", keywords: "bus 公交车 线路 站牌", tip: "查看黑堡公交BT路线和实时到站时间，凭学生证刷卡免费乘车" },
      { name: "停车服务", url: "https://parking.vt.edu/", keywords: "Parking 停车证 罚单", tip: "购买校园停车许可证（Permit）、查询停车场分布及申诉停车罚单" },
      { name: "校园地图", url: "https://www.vt.edu/about/locations/maps.html", keywords: "map 导航 教学楼", tip: "查找教学楼、宿舍等校园建筑位置、公交站点分布的交互地图" }
    ]
  },
  {
    title: "健康与安全",
    icon: "fas fa-shield-alt",
    img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=300&q=60",
    keywords: "健康 安全 Health Safety 医疗 心理 Schiffert Cook 警报 警察 VTPD Safe Ride",
    resources: [
      { name: "Student Medicover医疗保险", url: "https://smcovered.com/cn/", keywords: "insurance 医疗保险 SM 报销", tip: "VT留学生最常用的医疗保险，提供全中文客服理赔指南及网络诊所查询" },
      { name: "Schiffert 健康中心", url: "https://healthcenter.vt.edu/", keywords: "校医院 medical 疫苗 预约", tip: "校内医院预约看诊、开药、流感接种和免疫证明（Hold）解除" },
      { name: "Cook 咨询中心", url: "https://ucc.vt.edu/", keywords: "心理健康 counseling 压力 焦虑", tip: "提供免费心理咨询与心理危机干预，支持申请中文翻译陪同" },
      { name: "VT Alerts 紧急警报", url: "https://www.alerts.vt.edu/", keywords: "Emergency Alert 暴雪 枪击 警报", tip: "绑定手机和邮箱，接收学校紧急停课、极端天气或安全预警通知" },
      { name: "校园警察 (VTPD)", url: "https://police.vt.edu/", keywords: "police 报警 安全", tip: "校园警察局官方入口。遇到危险紧急情况请拨打911，非紧急拨打540-231-6411" },
      { name: "Safe Ride 夜间护送", url: "https://police.vt.edu/vtpd-services/safe-ride.html", keywords: "夜间安全送回 护送 独行", tip: "晚间至凌晨的校园内免费安全车送护送服务，适合在图书馆自习至深夜的留子" }
    ]
  },
  {
    title: "社交与成长",
    icon: "fas fa-users",
    img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=300&q=60",
    keywords: "社交 成长 Involvement Career GobblerConnect 社团 活动 职业 CPD 创业 转学生",
    resources: [
      { name: "GobblerConnect (社团广场)", url: "https://gobblerconnect.vt.edu/", keywords: "clubs organizations 社团 活动", tip: "浏览900+学生社团，加入感兴趣的组织并参与Gobblerfest等招新活动" },
      { name: "大学活动日历", url: "https://news.vt.edu/events.html", keywords: "events calendar 讲座 展览", tip: "查看全校大型讲座、学术研讨会、文化活动等官方日程表" },
      { name: "职业与专业发展中心", url: "https://career.vt.edu/", keywords: "CPD 简历 面试 招聘会", tip: "提供简历修改（Resume Review）、模拟面试及校会招聘（Career Fair）日程" },
      { name: "Apex 创业中心", url: "https://apex.vt.edu/", keywords: "entrepreneurship 创业 投资 竞赛", tip: "提供创新孵化支持，举办创业竞赛，链接风投资源与行业顾问" },
      { name: "转学生资源", url: "https://studentsuccess.vt.edu/transfer-student-initiatives.html", keywords: "transfer students 转学 社交", tip: "转学生专属学业辅导、社交聚会、信誉转换和融入黑堡指导" }
    ]
  },
  {
    title: "技术支持",
    icon: "fas fa-laptop-code",
    img: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=300&q=60",
    keywords: "技术 支持 Tech IT 4Help 软件 eduroam Duo",
    resources: [
      { name: "4Help (IT服务台)", url: "https://4help.vt.edu/", keywords: "IT help desk 密码 网络", tip: "VT技术支持总入口，解决无线网中断、账号锁死、Duo失效等故障" },
      { name: "软件下载中心", url: "https://software.vt.edu/", keywords: "software download 正版 免费 Office MATLAB", tip: "学生可凭VT账户免费下载正版Windows, Office365, MATLAB, Adobe等软件" },
      { name: "eduroam设置指南", url: "https://4help.vt.edu/sp?id=kb_article&sys_id=e7000d070f360a40d3244b9ce1050e93", keywords: "Wifi 密码 无线网", tip: "指导如何在本校配置安全的 eduroam 全局无线学术网络" },
      { name: "Duo双因素认证", url: "https://it.vt.edu/services/2fa.html", keywords: "two factor Duo 二步验证 安全", tip: "设置和管理两步验证终端，用于日常安全登录Hokie Spa and Canvas" }
    ]
  }
];

// 12 步留美生命周期指南
const TIMELINE_STEPS = [
  { title: "来美前夕行李清单", postSlug: "20260703luggage", summary: "详细的行李打包清单，包括必备文件、衣物、药品及海关违禁品注意事项。", tips: ["护照、I-20、录取通知书、体检免签本随身携带，千万不要托运！", "准备少量备用现金（少于10000美元，超过需要申报）。", "严禁携带任何肉类（包括香肠、牛肉干）、新鲜水果、种子类产品。"] },
  { title: "起飞、中转与落地入境", postSlug: "20260703flight", summary: "从国内出发到落地清关的全流程指南，涵盖海关申报卡填写及海关面试常见问题。", tips: ["准备好I-20和护照，海关问起学校名称时，大声回答 Virginia Tech！", "中转联程机票请预留至少3小时的清关与重新托运行李时间。", "落地后可先在机场连上公共WiFi，给家里报平安。"] },
  { title: "入境首日生存攻略", postSlug: "20260703survival", summary: "抵达黑堡后的第一天生存指南：倒时差、购买必需品、注册 BT 公交系统。", tips: ["黑堡公交 BT Transit 凭学生证免费，建议立刻下载 BT App 以便查看线路。", "前去 Squires Student Center 办理 Hokie Passport 校园实体卡。", "建议前去 Walmart 或 Target 采购最初两天的生活用品、防寒被褥。"] },
  { title: "医保激活与免疫 Hold 解除", postSlug: "20260703insurance", summary: "解读学校健康保险要求，如何提交疫苗注射记录并解除系统选课 Hold 限制。", tips: ["Schiffert Health Center 会强制检查免疫证明，若疫苗不全需在此补打。", "如不购买学校默认昂贵保险，须在截止日期前申请 Insurance Waiver 替换。", "确保系统中的 Immunization Hold 已被官方盖章注销，否则无法进行 Add/Drop 选课。"] },
  { title: "电话卡套餐与硬件配置", postSlug: "20260703phone", summary: "美国三大主流运营商对比，学生折扣套餐选择建议及国内手机频段兼容核算。", tips: ["校园内 eduroam 无线信号覆盖广，室外一般使用 AT&T 或 T-Mobile。", "黑堡地势起伏，部分山区和公寓信号较弱，建议选择带有 Wi-Fi Calling 功能的手机。", "可以考虑加入多人的 Family Plan 家庭共享套餐，能大幅缩减月租。"] },
  { title: "打工、SSN和社会信用体系", postSlug: "20260703ssn", summary: "校内勤工俭学申请流程，SSN（社会安全号）办理技巧及美国个人信用累积方法。", tips: ["只有获得校内正式工作录用信（Job Offer）才能前往 SSA 申请 SSN 账号。", "拿到 SSN 后可以申请第一张入门信用卡（如 Discover），开始累积信用分数。", "切忌将 SSN 透露给陌生电话或钓鱼邮件，谨防个人身份信息被窃取受损。"] },
  { title: "Gobblerfest与融入社团", postSlug: "20260703gobblerfest", summary: "如何利用每年开学初的社团招新节找到志同道合的朋友并融入大学社区。", tips: ["Gobblerfest 每年在秋季学期初的周五下午举行，全校社团都会在草坪设摊。", "利用 GobblerConnect 查找和登记你的社团成员身份。", "不要害怕口语不够好，VT 拥有非常友好包容的多元文化氛围，勇敢迈出第一步。"] },
  { title: "实测：各教学楼自习大盘点", postSlug: "20260703studyspace", summary: "盘点校园主要教学楼 of 自习室、插座分布、静音自习区及空调温度实测指南。", tips: ["Newman 图书馆 2 楼 and 4 楼设有专门的 Quiet Zone，适合深度静音学习。", "Squires 学生中心有丰富的讨论沙发和电源插头，是组会交流首选。", "在期末考试周（Final Week）期间，许多教学楼如 Torgersen Bridge 将 24 小时开放。"] },
  { title: "吃在VT：各食堂避雷指南", postSlug: "20260703dining", summary: "全美顶尖大学食堂实地盘点：招牌菜品推荐，点单App使用技巧与剩饭避雷。", tips: ["West End Market 的牛排（London Broil）和 Owens 的中式盖浇饭（Frank's）是明星产品。", "下载并绑定 Grubhub 校园版，可以提前在线点单免去排长队之苦。", "Dining Dollars 在消费时可享受 5% 的免税优惠，合理规划 Meal Plan 额度。"] },
  { title: "McComas 体育馆游玩指南", postSlug: "20260703gym", summary: "McComas 和 War Memorial 健身房设施介绍，室内泳池预约及团体操课申请。", tips: ["进入 McComas 必须刷 Hokie Passport 或扫校内 App 动态二维码验证。", "健身房备有干净的毛巾和消毒喷雾，使用完器材后请自觉擦拭干净归位。", "室内温水游泳池和室内篮球场部分时段受校队训练限制，请提前在 Rec Sports 官网确认。"] },
  { title: "防范诈骗与校园报警安全", postSlug: "20260703safety", summary: "解析专门针对中国留学生的电信诈骗套路，如何识别钓鱼邮件并使用校园求助求警。", tips: ["凡是声称“中国使领馆、国内公安局、DHL快递包裹异常”的电话，100% 为诈骗！", "VT 邮箱经常会收到冒充教授招募助理（Research Assistant）并发放假支票的邮件，切勿相信。", "夜间独自在图书馆待到太晚，请拨打 VTPD Safe Ride 电话让校警驾车护送你回公寓。"] },
  { title: "黑堡吃喝玩乐与日常购物", postSlug: "20260703shopping", summary: "周边大型超市与商圈采购攻略，以及亚马逊学生会员、亚米网省钱优惠技巧。", tips: ["黑堡本地有 Kroger 和 Target 满足日常需求，买中国佐料需乘 BT 公交去 Christiansburg 的亚洲超市。", "可以使用 VT 邮箱注册 Amazon Student，能免费享受半年的 Prime 快速配送会员服务。", "Christiansburg 的 New River Valley Mall 拥有更大的商场、AMC 影院以及丰富的餐厅选择。"] }
];

// ==========================================
// 2. 主工具箱集装箱
// ==========================================
export default function ToolboxApp() {
  const [activeSubAppId, setActiveSubAppId] = useState<string>('ehall');

  const subApps: SubApp[] = [
    { id: 'ehall', name: 'HokiesEhall', icon: '🎓', desc: 'VT 一站式资源与留美百科大厅', themeClass: 'vt-theme' },
    { id: 'github', name: 'GitHub Query', icon: '🐙', desc: '实时仓库检索与星标追踪', themeClass: 'git-theme' },
    { id: 'stats', name: 'Stats Lab', icon: '📊', desc: '统计分析实验室与计算沙盒', themeClass: 'stats-theme' },
    { id: 'size', name: '窗口尺寸', icon: '📏', desc: '实时视口与媒体查询监测器', themeClass: 'size-theme' }
  ];

  const activeAppMeta = useMemo(() => {
    return subApps.find(a => a.id === activeSubAppId) || subApps[0];
  }, [activeSubAppId]);

  return (
    <div className={`toolbox-main-layout ${activeAppMeta.themeClass}`}>
      {/* ===== 左侧 Launcher 导航抽屉 ===== */}
      <aside className="toolbox-launcher-sidebar">
        <div className="launcher-brand">
          <span className="brand-pulse"></span>
          SHIMMER_BOX
        </div>
        
        <nav className="launcher-nav-list">
          {subApps.map(app => (
            <button
              key={app.id}
              className={`launcher-item-btn ${activeSubAppId === app.id ? 'active' : ''}`}
              onClick={() => setActiveSubAppId(app.id)}
            >
              <span className="launcher-icon">{app.icon}</span>
              <div className="launcher-meta">
                <span className="launcher-name">{app.name}</span>
                <span className="launcher-desc">{app.desc}</span>
              </div>
            </button>
          ))}
        </nav>

        <div className="launcher-footer">
          v3.0.0 • STABLE
        </div>
      </aside>

      {/* ===== 右侧主渲染舞台 ===== */}
      <main className="toolbox-stage-arena">
        {activeSubAppId === 'ehall' && <HokiesEhallSubApp />}
        {activeSubAppId === 'github' && <GitHubQuerySubApp />}
        {activeSubAppId === 'stats' && <StatsLabSubApp />}
        {activeSubAppId === 'size' && <ViewportSubApp />}
      </main>
    </div>
  );
}

// ==========================================
// 3. 子工具组件 1: HokiesEhall
// ==========================================
function HokiesEhallSubApp() {
  const lang = useOSStore(s => s.lang);
  const { posts, setActivePostId } = useContentStore();
  const openWindow = useWindowsStore(s => s.openWindow);

  const [activeTab, setActiveTab] = useState<'portal' | 'timeline' | 'handbook'>('portal');
  const [searchQuery, setSearchQuery] = useState('');
  const [hudTip, setHudTip] = useState<string>('📡 WAITING FOR RESOURCE SIGNAL... HOVER ANY LINK TO DECODE TIPS.');
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<string>('sec-1');
  
  const handbookContainerRef = useRef<HTMLDivElement>(null);

  const parsedHandbookHtml = useMemo(() => {
    return marked.parse(handbookContent);
  }, []);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return RESOURCE_DATA;
    return RESOURCE_DATA.map(cat => {
      const catMatch = cat.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       cat.keywords.toLowerCase().includes(searchQuery.toLowerCase());
      const matchedResources = cat.resources.filter(res => 
        res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.keywords.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.tip.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (catMatch) return cat;
      if (matchedResources.length > 0) return { ...cat, resources: matchedResources };
      return null;
    }).filter((cat): cat is Category => cat !== null);
  }, [searchQuery]);

  const handbookToc = [
    { id: 'sec-1', label: '1. 数字基石 (核心门户)', textId: '第 1 节' },
    { id: 'sec-2', label: '2. 学术与知识探索', textId: '第 2 节' },
    { id: 'sec-3', label: '3. 财务管理与业务', textId: '第 3 节' },
    { id: 'sec-4', label: '4. 校园生活与社区参与', textId: '第 4 节' },
    { id: 'sec-5', label: '5. 健康、福祉与安全', textId: '第 5 节' },
    { id: 'sec-6', label: '6. 职业路径与深造发展', textId: '第 6 节' },
    { id: 'sec-7', label: '7. 校园服务与后勤保障', textId: '第 7 节' },
    { id: 'sec-8', label: '8. 网站实施与战略建议', textId: '第 8 节' }
  ];

  const handleScrollToSection = (tocItem: typeof handbookToc[0]) => {
    setActiveSection(tocItem.id);
    const container = handbookContainerRef.current;
    if (!container) return;
    const headers = container.querySelectorAll('h2');
    let targetEl: HTMLElement | null = null;
    for (let i = 0; i < headers.length; i++) {
      if (headers[i].textContent?.includes(tocItem.textId)) {
        targetEl = headers[i];
        break;
      }
    }
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="sub-app-wrapper ehall-stage animate-slide-in">
      <header className="toolbox-app-header">
        <div className="header-badge">VT</div>
        <div className="header-titles">
          <h2>Hokie Hub</h2>
          <p>弗吉尼亚理工一站式资源门户 • Virginia Tech Resources Portal</p>
        </div>

        <div className="toolbox-tabs">
          <button className={`toolbox-tab-btn ${activeTab === 'portal' ? 'active' : ''}`} onClick={() => setActiveTab('portal')}>📡 资源导航</button>
          <button className={`toolbox-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>📘 生存指南</button>
          <button className={`toolbox-tab-btn ${activeTab === 'handbook' ? 'active' : ''}`} onClick={() => setActiveTab('handbook')}>🎓 Hokie 百科</button>
        </div>
      </header>

      {activeTab === 'portal' && (
        <div className="tab-content portal-tab">
          <div className="portal-quick-cockpit">
            {[
              { name: "Canvas", url: "https://canvas.vt.edu/", logo: "🎨", color: "#861F41", desc: "平时作业与日常网课学术驾驶舱", tip: "【学术中心】VT 官方学习管理系统，包含课程大纲、日常作业提交、在线测试及实时评分" },
              { name: "Hokie Spa", url: "https://apps.es.vt.edu/ssb/vt/index.html", logo: "🔑", color: "#E87722", desc: "学业行政、账单缴费及选课系统", tip: "【教务中心】官方学生行政档案库。用于 Add/Drop 选课、电子账单查看、GPA查询" },
              { name: "OneCampus", url: "https://onecampus.vt.edu/", logo: "🧭", color: "#451a03", desc: "校级系统官方应用聚合商店", tip: "【校园入口】VT 官方入口服务聚合平台。提供快捷搜索，堪称校园 App Store" },
              { name: "StarRez", url: "https://starrez.housing.vt.edu/starrezportal/", logo: "🏠", color: "#065f46", desc: "宿舍申请签署及餐饮计划管理", tip: "【宿办服务】选房与宿舍签约。支持选房、申请宿舍 LLC 社区及 Meal Plan 变更" },
              { name: "Handshake", url: "https://vt.joinhandshake.com/", logo: "🤝", color: "#1e3a8a", desc: "校园勤工俭学职位及求职大厅", tip: "【职业发展】寻找校内兼职/勤工俭学（Work-Study）、申请 SSN 的官方渠道" }
            ].map(item => (
              <a 
                href={item.url} target="_blank" rel="noreferrer" key={item.name} className="cockpit-card"
                style={{ '--glow-color': item.color } as React.CSSProperties}
                onMouseEnter={() => setHudTip(item.tip)}
                onMouseLeave={() => setHudTip('📡 WAITING FOR RESOURCE SIGNAL... HOVER ANY LINK TO DECODE TIPS.')}
              >
                <span className="cockpit-logo">{item.logo}</span>
                <div className="cockpit-info">
                  <h4>{item.name}</h4>
                  <p>{item.desc}</p>
                </div>
                <div className="cockpit-glow-bg" />
              </a>
            ))}
          </div>

          <div className="portal-search-bar">
            <span className="search-icon">🔍</span>
            <input 
              type="text" placeholder="输入关键词搜索 VT 校园链接（例如：选课、缴费、WiFi、校医院、安全护送）..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && <button className="search-clear-btn" onClick={() => setSearchQuery('')}>×</button>}
          </div>

          <div className="portal-resource-grid">
            {filteredCategories.map(category => (
              <div key={category.title} className="resource-category-card">
                <div className="category-card-header">
                  <div className="category-title-group">
                    <span className="category-badge-dot"></span>
                    <h3>{category.title}</h3>
                  </div>
                  <img src={category.img} alt={category.title} className="category-bg-image" />
                </div>
                <div className="category-links-list">
                  {category.resources.map(res => (
                    <a 
                      key={res.name} href={res.url} target="_blank" rel="noreferrer" className="resource-item-link"
                      onMouseEnter={() => setHudTip(`🔍 ${res.name.toUpperCase()} TIP: ${res.tip}`)}
                      onMouseLeave={() => setHudTip('📡 WAITING FOR RESOURCE SIGNAL... HOVER ANY LINK TO DECODE TIPS.')}
                    >
                      <span className="link-arrow">&gt;</span>
                      <span className="link-name">{res.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="portal-hud-console">
            <div className="hud-console-header">
              <span className="hud-console-pulse"></span>
              <span className="hud-console-title">HOKIE_SYSTEM_TIPS_DECODER</span>
            </div>
            <div className="hud-console-body">
              <p className="hud-output-text">{hudTip}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="tab-content timeline-tab">
          <div className="timeline-layout">
            <div className="timeline-scroll-axis">
              <div className="timeline-decor-line" />
              {TIMELINE_STEPS.map((step, index) => {
                const stepNum = index + 1;
                const isSelected = activeStep === index;
                return (
                  <div 
                    key={step.title} className={`timeline-step-node ${isSelected ? 'active' : ''}`}
                    onClick={() => setActiveStep(isSelected ? null : index)}
                  >
                    <div className="node-marker">{stepNum}</div>
                    <div className="node-label">
                      <h4>{step.title}</h4>
                      <p>{step.summary.substring(0, 15)}...</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="timeline-detail-display">
              {activeStep !== null ? (
                <div className="timeline-card-content animate-slide-in">
                  <div className="step-card-header">
                    <span className="step-number-tag">STEP 0{activeStep + 1}</span>
                    <h3>{TIMELINE_STEPS[activeStep].title}</h3>
                  </div>
                  <p className="step-summary-text">&gt; 阶段概要：{TIMELINE_STEPS[activeStep].summary}</p>
                  
                  <div className="step-checklist-box">
                    <div className="box-title">🛠️ 避坑行动 Checklists</div>
                    <ul className="checklist-items">
                      {TIMELINE_STEPS[activeStep].tips.map((tip, idx) => (
                        <li key={idx} className="checklist-item-raw">
                          <span className="item-check-icon">✓</span>
                          <span className="item-text">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 跨应用动态攻略博文联动 */}
                  {(() => {
                    const slug = TIMELINE_STEPS[activeStep].postSlug;
                    const hasArticle = posts.some(p => p.id === slug);
                    if (hasArticle) {
                      return (
                        <div className="step-article-link-box">
                          <button 
                            className="step-article-link-btn"
                            onClick={() => {
                              openWindow('writing', lang === 'zh' ? '微光博客' : 'Blog');
                              setActivePostId(slug);
                            }}
                          >
                            📖 阅读详细攻略文章 →
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div className="step-article-pending">
                        📝 详细指南博文撰写中，敬请期待...
                      </div>
                    );
                  })()}

                  <div className="step-footer-alert">
                    ⚠️ 此项生存攻略为根据黑堡留学生实际案例整理的预警手册。建议严格对照自查。
                  </div>
                </div>
              ) : (
                <div className="timeline-placeholder-panel">
                  <span className="placeholder-arrow">⬅</span>
                  <h3>点击左侧“留美生命周期指南”航点</h3>
                  <p>解密行李自查表、入学疫苗解 Hold、校内求职 SSN 以及食堂避雷的保姆级 Checklist 指南。</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'handbook' && (
        <div className="tab-content handbook-tab">
          <aside className="handbook-toc-sidebar">
            <div className="toc-title">VT_ENCYCLOPEDIA_TOC</div>
            <nav className="toc-list">
              {handbookToc.map(item => (
                <button
                  key={item.id} className={`toc-item-btn ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => handleScrollToSection(item)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="toc-footer-decor">STATUS: LOCAL_ Wiki_CACHED</div>
          </aside>

          <div className="handbook-content-scroll" ref={handbookContainerRef} dangerouslySetInnerHTML={{ __html: parsedHandbookHtml }} />
        </div>
      )}
    </div>
  );
}

// ==========================================
// 4. 子工具组件 2: GitHub Query (真实接口查询工具)
// ==========================================
interface GithubRepo {
  name: string;
  html_url: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
}

function GitHubQuerySubApp() {
  const [username, setUsername] = useState('Shimmer0007');
  const [loading, setLoading] = useState(false);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`https://api.github.com/users/${username.trim()}/repos?sort=updated&per_page=30`);
      if (!res.ok) {
        throw new Error(res.status === 404 ? '用户不存在 (404)' : '网络接口请求频率超限，请稍后再试');
      }
      const data = await res.json();
      setRepos(data);
    } catch (err: any) {
      setRepos([]);
      setErrorMsg(err.message || '数据检索失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="sub-app-wrapper git-stage animate-slide-in">
      <header className="toolbox-app-header">
        <div className="header-badge git-badge">GIT</div>
        <div className="header-titles">
          <h2>GitHub Explorer</h2>
          <p>实时公有 API 仓库检索与状态追踪面板 • Public Repos Monitor</p>
        </div>
      </header>

      <div className="tab-content git-content">
        <div className="git-search-console">
          <input 
            type="text" placeholder="输入任意 GitHub 用户名（如 Shimmer0007, torvalds）..."
            value={username} onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={loading}>
            {loading ? '正在检索...' : '发射查询 ⚡'}
          </button>
        </div>

        {errorMsg && <div className="git-error-panel">❌ 错误：{errorMsg}</div>}

        <div className="git-repos-grid">
          {repos.map(repo => (
            <a key={repo.name} href={repo.html_url} target="_blank" rel="noreferrer" className="git-repo-card">
              <div className="repo-card-header">
                <h4>{repo.name}</h4>
                {repo.language && <span className="repo-lang-tag">{repo.language}</span>}
              </div>
              <p className="repo-desc">{repo.description || 'No description provided.'}</p>
              <div className="repo-stats">
                <span>⭐ {repo.stargazers_count}</span>
                <span>🍴 {repo.forks_count}</span>
              </div>
            </a>
          ))}
          {!loading && repos.length === 0 && !errorMsg && (
            <div className="git-empty">该用户没有公开发布的仓库。</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. 子工具组件 3: Stats Lab (统计计算小沙盒)
// ==========================================
function StatsLabSubApp() {
  const [inputVal, setInputVal] = useState('86, 77, 95, 88, 92, 60, 84, 91, 78, 89');
  const [stats, setStats] = useState<{
    count: number;
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
    sortedNums: number[];
  } | null>(null);

  const calculateStats = () => {
    const nums = inputVal
      .split(',')
      .map(v => parseFloat(v.trim()))
      .filter(v => !isNaN(v));

    if (nums.length === 0) {
      setStats(null);
      return;
    }

    const sorted = [...nums].sort((a, b) => a - b);
    const count = nums.length;
    
    const sum = nums.reduce((acc, curr) => acc + curr, 0);
    const mean = sum / count;

    const mid = Math.floor(count / 2);
    const median = count % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

    const sqDiffSum = nums.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0);
    const stdDev = Math.sqrt(sqDiffSum / count);

    setStats({
      count,
      mean: Math.round(mean * 100) / 100,
      median: Math.round(median * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      min: sorted[0],
      max: sorted[count - 1],
      sortedNums: sorted
    });
  };

  useEffect(() => {
    calculateStats();
  }, []);

  return (
    <div className="sub-app-wrapper stats-stage animate-slide-in">
      <header className="toolbox-app-header">
        <div className="header-badge stats-badge">STATS</div>
        <div className="header-titles">
          <h2>Stats Laboratory</h2>
          <p>统计分析实验室 — 快速数据特征结算与可视化沙箱 • Stats Desk</p>
        </div>
      </header>

      <div className="tab-content stats-content">
        <div className="stats-input-section">
          <label>请输入一组以英文逗号间隔的数值样本（数据分析与成绩测算）：</label>
          <div className="stats-input-bar">
            <input 
              type="text" value={inputVal} onChange={(e) => setInputVal(e.target.value)}
              placeholder="e.g. 10.5, 20.3, 15.2, 8.4"
            />
            <button onClick={calculateStats}>计算特征 📊</button>
          </div>
        </div>

        {stats && (
          <div className="stats-report-layout">
            <div className="stats-grid-dashboard">
              <div className="stats-dash-card">
                <span className="card-label">样本总量 (Count)</span>
                <span className="card-value">{stats.count}</span>
              </div>
              <div className="stats-dash-card">
                <span className="card-label">样本均值 (Mean)</span>
                <span className="card-value">{stats.mean}</span>
              </div>
              <div className="stats-dash-card">
                <span className="card-label">中位数 (Median)</span>
                <span className="card-value">{stats.median}</span>
              </div>
              <div className="stats-dash-card">
                <span className="card-label">标准差 (Std Dev)</span>
                <span className="card-value">{stats.stdDev}</span>
              </div>
              <div className="stats-dash-card">
                <span className="card-label">极小值 / 极大值</span>
                <span className="card-value">{stats.min} / {stats.max}</span>
              </div>
            </div>

            <div className="stats-distribution-chart">
              <h4>📊 样本序列数值分布柱状图</h4>
              <div className="chart-bars-container">
                {stats.sortedNums.map((val, idx) => {
                  const percent = stats.max > 0 ? (val / stats.max) * 100 : 0;
                  return (
                    <div key={idx} className="chart-bar-col" style={{ '--bar-height': `${percent}%` } as React.CSSProperties}>
                      <span className="bar-hover-val">{val}</span>
                      <div className="bar-color-fill"></div>
                      <span className="bar-index-label">{idx + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 6. 子工具组件 4: Viewport Inspector (窗口尺寸)
// ==========================================
function ViewportSubApp() {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    screenW: typeof window !== 'undefined' ? window.screen.width : 1920,
    screenH: typeof window !== 'undefined' ? window.screen.height : 1080,
    dpr: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        screenW: window.screen.width,
        screenH: window.screen.height,
        dpr: window.devicePixelRatio,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const breakpoint = useMemo(() => {
    const w = viewport.width;
    if (w <= 768) {
      return { id: 'mobile', name: 'Mobile (移动视口)', color: '#ef4444', desc: '≤ 768px • 自适应布局 & 折叠抽屉侧栏开启' };
    } else if (w <= 1024) {
      return { id: 'tablet', name: 'Tablet (平板视口)', color: '#f59e0b', desc: '769px - 1024px • 页面双栏栅格自适应模式开启' };
    } else {
      return { id: 'desktop', name: 'Desktop (桌面宽屏)', color: '#10b981', desc: '> 1024px • ShimmerOS 多窗口并列操作系统完全舒展' };
    }
  }, [viewport.width]);

  return (
    <div className="sub-app-wrapper size-stage animate-slide-in">
      <header className="toolbox-app-header">
        <div className="header-badge size-badge">SIZE</div>
        <div className="header-titles">
          <h2>Viewport Inspector</h2>
          <p>实时窗口大小与断点监听器 — 调整窗口以实时更新 • Viewport Desk</p>
        </div>
      </header>

      <div className="tab-content size-content">
        <div className="size-dashboard-layout">
          {/* 左侧：实时核心指标 */}
          <div className="size-indicators-grid">
            <div className="size-stat-card primary-card">
              <span className="card-lbl">浏览器当前视口大小 (Viewport)</span>
              <span className="card-val highlight-blue">
                {viewport.width} <span className="val-cross">×</span> {viewport.height} <span className="val-unit">px</span>
              </span>
            </div>
            
            <div className="size-stat-card-row">
              <div className="size-sub-card">
                <span className="card-lbl">物理分辨率 (Screen)</span>
                <span className="card-sub-val">{viewport.screenW} × {viewport.screenH} px</span>
              </div>
              <div className="size-sub-card">
                <span className="card-lbl">设备像素比 (DPR)</span>
                <span className="card-sub-val">@{viewport.dpr.toFixed(1)}x {viewport.dpr > 1 ? 'Retina' : 'Standard'}</span>
              </div>
            </div>

            {/* 响应式媒体查询断点卡片 */}
            <div className="size-breakpoint-card" style={{ '--bp-color': breakpoint.color } as React.CSSProperties}>
              <div className="bp-header">
                <span className="bp-indicator-led"></span>
                <span className="bp-title">{breakpoint.name}</span>
              </div>
              <p className="bp-desc">{breakpoint.desc}</p>
            </div>
          </div>

          {/* 右侧：实时蓝图线框缩放模型 */}
          <div className="size-blueprint-visualizer">
            <div className="blueprint-title">📐 虚线蓝图自适应布局模型 (Interactive Blueprint)</div>
            <div className="blueprint-stage-box">
              <div className="blueprint-canvas-frame">
                {/* 蓝图测量辅助线 */}
                <div className="bp-line bp-line-w">
                  <span className="bp-line-text">{viewport.width}px</span>
                </div>
                <div className="bp-line bp-line-h">
                  <span className="bp-line-text">{viewport.height}px</span>
                </div>

                <div className="blueprint-mockup-inner">
                  <div className="mock-os-header">
                    <span className="dot dot-r"></span>
                    <span className="dot dot-y"></span>
                    <span className="dot dot-g"></span>
                    <span className="mock-title">ShimmerOS Simulator</span>
                  </div>
                  <div className="mock-os-desktop">
                    <div className="mock-uptime-clock">
                      <div className="mock-clock-header">SYSTEM ACTIVE</div>
                      <div className="mock-clock-body">00 : 00 : 00</div>
                    </div>
                    <div className="mock-icons-column">
                      <div className="mock-icon"></div>
                      <div className="mock-icon"></div>
                      <div className="mock-icon"></div>
                    </div>
                    <div className="mock-dock-bar"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
