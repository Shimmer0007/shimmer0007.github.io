# ShimmerOS

一个以“桌面操作系统”为交互隐喻的个人网站，集个人介绍、博客、课业笔记、项目展示、旅行足迹和实用工具于一体。

项目使用 Astro 生成静态页面，并由 React 驱动桌面、窗口、Dock、Spotlight 和终端等交互模块。网站默认以中文呈现，同时提供英文界面切换、深浅色主题和多种强调色。

线上地址：<https://shimmer0007.github.io>

## 功能概览

- ShimmerOS 桌面：开机动画、桌面图标、窗口拖拽/最小化/最大化和 Dock。
- 博客与课业笔记：基于 Astro Content Collections 管理 Markdown 内容，支持分类、标签、搜索和文章独立阅读页。
- 独立文章路由：每篇文章都可以通过 `/posts/<slug>/` 访问，并提供 SEO 元数据、Open Graph 和 JSON-LD。
- Spotlight：使用 `Ctrl/⌘ + K` 打开全局搜索。
- Skill Tree：展示技能节点，并与文章标签联动。
- Projects：展示项目集合和相关链接。
- Travel：基于 D3 和 GeoJSON 的旅行足迹地图。
- Toolbox：HokieEhall 资源导航、Markdown 手册和 GitHub 仓库查询。
- Terminal：支持 `help`、`open`、`theme`、`accent`、`sysinfo`、`date`、`contact`、`clear` 和 `reboot` 等命令。
- Guestbook：通过 Utterances 将留言保存为 GitHub Issue 评论。
- 个性化设置：主题、语言和强调色会保存在浏览器本地存储中。

## 技术栈

- [Astro](https://astro.build/)：静态站点生成、内容集合和路由。
- [React](https://react.dev/)：桌面系统及应用窗口交互。
- [Zustand](https://zustand.docs.pmnd.rs/)：窗口、主题和内容联动状态。
- [D3.js](https://d3js.org/)：旅行地图和数据可视化。
- [Marked](https://marked.js.org/)：Markdown 内容渲染。
- GitHub Pages + GitHub Actions：自动构建与部署。

项目要求 Node.js `>=18.17.1`。CI 当前使用 Node.js 22。

## 本地开发

在项目根目录执行：

```bash
npm install
npm run dev
```

开发服务器默认运行在 <http://localhost:4321>。

常用命令：

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建静态生产产物到 `dist/` |
| `npm run preview` | 预览生产构建结果 |
| `npm run astro -- --help` | 查看 Astro CLI 帮助 |

按照本项目的开发约定，启动后台开发服务时可以使用：

```bash
npx astro dev --background
```

## 项目结构

```text
.
├── public/                    # favicon 等静态资源
├── src/
│   ├── components/
│   │   ├── apps/              # About、Writing、Travel、Toolbox 等应用窗口
│   │   ├── desktop/           # 桌面、开机动画、3D 背景、桌面图标
│   │   ├── dock/              # Dock 快捷栏
│   │   ├── spotlight/         # Spotlight 全局搜索
│   │   ├── terminal/          # ShimmerCMD 终端
│   │   └── window/            # 窗口管理器和窗口组件
│   ├── content/
│   │   └── posts/             # Markdown 博客和课业笔记
│   ├── data/                  # 旅行地图、技能和 HokieEhall 数据
│   ├── i18n/                  # 中英文翻译
│   ├── layouts/               # 独立文章页布局
│   ├── lib/                   # URL 等共享工具
│   ├── pages/                 # Astro 页面和动态文章路由
│   ├── store/                 # Zustand 状态仓库
│   └── styles/                # 全局设计令牌和文章样式
├── astro.config.mjs
├── package.json
└── .github/workflows/deploy.yml
```

## 新增文章

在 `src/content/posts/` 下新建 Markdown 文件。文件名会作为文章 ID 和 URL slug，例如：

```markdown
---
title: "文章标题"
date: "2026-09-11"
category: "tech"
summary: "文章摘要，可选。"
tags: ["Astro", "React"]
---

正文内容写在这里。
```

`category` 可选值：

- `tech`：技术文章
- `life`：生活、旅行和经验记录
- `project`：项目或竞赛复盘
- `note`：课业笔记

课业笔记还可以使用以下字段：

```yaml
status: "IN-PROGRESS"
link: "https://example.com/original-note"
```

其中 `status` 可选 `IN-PROGRESS`、`COMPLETED` 或 `STANDBY`；设置 `link` 后，文章页会显示外部文档入口，而不是渲染本地正文。

## 部署

项目通过 GitHub Actions 部署到 GitHub Pages：

1. 将代码推送到 `main` 分支，或在 Actions 页面手动运行工作流。
2. 工作流执行 `npm ci` 和 `npm run build`。
3. `dist/` 会上传为 Pages artifact，并由 `actions/deploy-pages` 发布。

仓库需要在 GitHub Pages 设置中选择 **GitHub Actions** 作为构建来源，并确保工作流具有 Pages 写入权限。

## 外部服务

部分功能依赖第三方服务，离线或网络受限时可能不可用：

- Google Fonts：首页和文章页字体。
- Utterances：留言板，绑定到 `Shimmer0007/shimmer0007.github.io` 仓库的 Issue 评论。
- MapMyVisitors：About 页面访客地图。
- GitHub REST API：Toolbox 中的 GitHub 仓库查询。
- 飞书文档：部分课业笔记的外部正文。

这些服务均在浏览器端加载，不需要在仓库中保存 API 密钥。使用 GitHub API 查询时应注意匿名请求的速率限制。

## 维护说明

- 文章 frontmatter 必须符合 `src/content.config.ts` 中的 schema，否则构建会失败。
- `dist/`、`.astro/` 和 `node_modules/` 属于生成目录或依赖目录，不应提交到仓库。
- 修改窗口 ID、应用标题或翻译键时，需要同步检查 `src/components/desktop/Desktop.tsx`、`src/components/window/WindowManager.tsx` 和 `src/i18n/`。
- 文章独立页使用静态生成；新增或修改文章后需要重新构建才能发布。

## 当前工程状态

截至目前，生产构建可以成功生成首页及文章静态路由。项目仍以交互体验为主，后续可继续补充自动化测试、类型检查和 lint 质量门禁。

## License

除第三方依赖、外部数据和文章中明确注明的内容外，本项目代码与站点内容归 Shimmer 所有。未经许可，请勿直接复制整站设计或内容。
