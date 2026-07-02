// src/i18n/zh.ts — 中文（主语言，优先完善）
const zh = {
  // ===== 系统 =====
  'os.name':    'ShimmerOS',
  'os.version': 'v3.0.0',
  'os.booting': '正在启动…',
  'os.welcome': '欢迎回来，Shimmer',

  // ===== 桌面图标 =====
  'app.about.label':    '关于我',
  'app.writing.label':  '微光博客',
  'app.skills.label':   '技能树',
  'app.projects.label': '项目集',
  'app.travel.label':   '足迹',
  'app.plan.label':     '二月计划',
  'app.toolbox.label':  '工具箱',
  'app.links.label':    '友链',
  'app.settings.label': '设置',
  'app.terminal.label': '终端',

  // ===== 窗口标题 =====
  'app.about.title':    'Player Profile',
  'app.writing.title':  '微光博客',
  'app.skills.title':   'Skill Tree',
  'app.projects.title': '项目浏览器',
  'app.travel.title':   '出行足迹',
  'app.plan.title':     '二月计划',
  'app.toolbox.title':  '工具箱',
  'app.links.title':    '友情链接',
  'app.settings.title': '系统设置',
  'app.terminal.title': 'ShimmerCMD',

  // ===== 关于我 =====
  'about.subtitle': '数据分析 & 前端探索者',
  'about.bio':      '你好！我是 Shimmer，现就读于 Virginia Tech，研究方向为统计与计算。喜欢用数据讲故事，也喜欢把想法变成可交互的界面。',
  'about.currently': '当前状态',
  'about.contact':   '联系方式',
  'about.status.studying': '📚 正在学习',
  'about.status.building': '🔨 正在构建',
  'about.status.reading':  '📖 正在阅读',

  // ===== 博客 =====
  'writing.all':      '全部',
  'writing.blog':     '博客',
  'writing.notes':    '课业笔记',
  'writing.essays':   '随笔',
  'writing.empty':    '该分类下暂无内容。',
  'writing.readmore': '继续阅读 →',

  // ===== 项目 =====
  'projects.all':     '全部项目',
  'projects.view':    '查看详情',
  'projects.back':    '← 返回',
  'projects.demo':    '演示',
  'projects.source':  '源码',

  // ===== 技能树 =====
  'skills.intro':     '点击节点查看详细说明',
  'skills.level':     '掌握程度',
  'skills.related':   '相关文章',

  // ===== 旅行 =====
  'travel.visited':   '到访城市',
  'travel.countries': '国家/地区',

  // ===== 设置 =====
  'settings.theme':     '外观',
  'settings.theme.dark':  '深色',
  'settings.theme.light': '浅色',
  'settings.accent':    '强调色',
  'settings.language':  '语言',
  'settings.lang.zh':   '中文',
  'settings.lang.en':   'English',
  'settings.about.os':  '关于 ShimmerOS',

  // ===== 终端 =====
  'term.welcome':  'ShimmerOS [v3.0.0]\n(c) 2026 Shimmer. 保留所有权利。\n\n输入 "help" 查看可用命令。\n',
  'term.not_found': (cmd: string) => `命令未找到: ${cmd}。输入 "help" 获取帮助。`,
  'term.opening':   (app: string) => `正在打开 ${app}…`,
  'term.err_open':  (app: string) => `错误：应用 "${app}" 不存在。`,
  'term.rebooting': '正在重启系统…',
  'term.help': `可用命令：
  help        — 显示此帮助
  ls          — 列出所有应用
  open <app>  — 打开应用
  theme <d|l> — 切换主题 (dark/light)
  accent <颜色>— 切换强调色
  sysinfo     — 系统信息
  date        — 显示日期时间
  contact     — 联系方式
  clear       — 清空终端
  reboot      — 重启系统`,

  // ===== 友情链接 =====
  'links.title':   '友情链接',
  'links.intro':   '认识的、欣赏的、有趣的人们 ✨',

  // ===== 通用 =====
  'common.close':    '关闭',
  'common.minimize': '最小化',
  'common.maximize': '最大化',
  'common.back':     '返回',
  'common.loading':  '加载中…',
  'common.error':    '加载失败',
  'common.empty':    '暂无内容',
  'common.search.placeholder': '搜索应用、文章、项目…',
};

export default zh;
export type TranslationKey = keyof typeof zh;
