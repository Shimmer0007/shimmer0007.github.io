// src/components/terminal/Terminal.tsx
import { useEffect, useRef, useState } from 'react';
import { useOSStore, ACCENT_COLORS } from '../../store/os';
import { useWindowsStore } from '../../store/windows';
import { useContentStore } from '../../store/content';
import { useT } from '../../i18n';
import './Terminal.css';

interface HistoryItem {
  type: 'input' | 'output';
  text: string;
  isHtml?: boolean;
}

const ASCII_LOGO = `
   _____ _    _ _____ __  __ __  __ ______ _____  
  / ____| |  | |_   _|  \\/  |  \\/  |  ____|  __ \\ 
 | (___ | |__| | | | | \\  / | \\  / | |__  | |__) |
  \\___ \\|  __  | | | | |\\/| | |\\/| |  __| |  _  / 
  ____) | |  | |_| |_| |  | | |  | | |____| | \\ \\ 
 |_____/|_|  |_|_____|_|  |_|_|  |_|______|_|  \\_\\
`;

// 建站启动时间，用于计算 Uptime
const START_TIME = new Date('2024-10-24T00:00:00+08:00').getTime();

export default function Terminal() {
  const t = useT();
  const openWindow = useWindowsStore(s => s.openWindow);
  const { theme, setTheme, accentId, setAccent, lang } = useOSStore();
  const { posts } = useContentStore();

  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  // 1. 初始化终端，输出欢迎语
  useEffect(() => {
    const welcome = lang === 'zh'
      ? `ShimmerOS [v3.0.0]\n(c) 2026 Shimmer. 保留所有权利。\n\n输入 "help" 查看可用命令列表。\n`
      : `ShimmerOS [v3.0.0]\n(c) 2026 Shimmer. All rights reserved.\n\nType "help" to view the list of available commands.\n`;
    
    setHistory([{ type: 'output', text: welcome }]);
  }, [lang]);

  // 2. 自动滚动到终端底部
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // 3. 点击终端区域自动聚焦输入框
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  // 4. 计算 Uptime 简报
  const getUptimeString = () => {
    const diff = Date.now() - START_TIME;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    return `${days}d ${hours}h`;
  };

  // 5. 命令执行引擎
  const executeCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    // 记录输入历史
    const newHistory = [...history, { type: 'input' as const, text: `shimmer@os:~$ ${trimmed}` }];
    const parts = trimmed.split(/\s+/);
    const primary = parts[0].toLowerCase();
    const args = parts.slice(1);

    // 写入命令回溯列表
    const nextCmdHist = [...commandHistory, trimmed];
    setCommandHistory(nextCmdHist);
    setHistoryPointer(nextCmdHist.length);

    let outputText = '';
    let isHtml = false;

    switch (primary) {
      case 'help':
        outputText = lang === 'zh'
          ? `可用命令列表：
  help               - 显示此命令帮助菜单
  ls / apps          - 列出系统注册的所有应用程序
  open <app_id>      - 打开指定的窗口应用 (例如：open writing)
  theme <dark|light> - 快速切换系统主题模式
  accent <color>     - 切换强调色 (purple/gold/blue/rose/cyan)
  sysinfo / neofetch - 运行系统仪表盘简报
  date               - 显示当前系统日期和时间
  contact            - 查阅站长个人联络通道
  clear / cls        - 清除屏幕历史输出
  reboot             - 重启整个 ShimmerOS 核心`
          : `Available Commands:
  help               - Show this help menu
  ls / apps          - List all registered applications
  open <app_id>      - Open specified window application (e.g. open writing)
  theme <dark|light> - Toggle system theme mode
  accent <color>     - Change accent color (purple/gold/blue/rose/cyan)
  sysinfo / neofetch - Run system diagnostic dashboard
  date               - Display current system date and time
  contact            - View developer contact channels
  clear / cls        - Clear the terminal screen
  reboot             - Hard reboot ShimmerOS kernel`;
        break;

      case 'ls':
      case 'apps':
        outputText = lang === 'zh'
          ? `系统注册应用清单：
  - about            [关于我 - Player Profile]
  - writing          [微光博客 - Writing & Notes]
  - skills           [技能图谱 - Skill Tree]
  - projects         [项目仓库 - Project Browser]
  - travel           [足迹足迹 - Travel footprints]
  - plan             [日程计划 - Plan schedule]
  - links            [友情链接 - Friend Links]
  - settings         [系统设置 - System Settings]
  - terminal         [命令行 - ShimmerCMD]`
          : `Registered Application list:
  - about            [Player Profile]
  - writing          [Writing & Notes]
  - skills           [Skill Tree]
  - projects         [Project Browser]
  - travel           [Travel footprints]
  - plan             [Plan schedule]
  - links            [Friend Links]
  - settings         [System Settings]
  - terminal         [ShimmerCMD]`;
        break;

      case 'open': {
        const target = args[0]?.toLowerCase();
        if (!target) {
          outputText = `Usage: open <app_id>  (e.g., open writing)`;
          break;
        }

        const validApps: Record<string, string> = {
          about: 'Player Profile',
          writing: lang === 'zh' ? '微光博客' : 'Writing & Notes',
          skills: 'Skill Tree',
          projects: lang === 'zh' ? '项目浏览器' : 'Project Browser',
          travel: lang === 'zh' ? '出行足迹' : 'Travel footprints',
          plan: lang === 'zh' ? '二月计划' : 'Plan schedule',
          links: lang === 'zh' ? '友情链接' : 'Friend Links',
          settings: lang === 'zh' ? '系统设置' : 'System Settings',
          terminal: 'ShimmerCMD'
        };

        if (target in validApps) {
          openWindow(target, validApps[target]);
          outputText = lang === 'zh' ? `正在拉起窗口组件: ${validApps[target]}...` : `Opening window component: ${validApps[target]}...`;
        } else {
          outputText = lang === 'zh' 
            ? `错误：未发现标识符为 "${target}" 的应用。输入 "ls" 查看应用列表。` 
            : `Error: App "${target}" not found. Type "ls" to view registered apps.`;
        }
        break;
      }

      case 'theme': {
        const targetTheme = args[0]?.toLowerCase();
        if (targetTheme === 'dark' || targetTheme === 'light') {
          setTheme(targetTheme);
          outputText = lang === 'zh' ? `主题模式已切换为：${targetTheme}` : `Theme has been toggled to: ${targetTheme}`;
        } else {
          outputText = `Usage: theme <dark|light>`;
        }
        break;
      }

      case 'accent': {
        const color = args[0]?.toLowerCase();
        const validColors = ['purple', 'gold', 'blue', 'rose', 'cyan'];
        if (color && validColors.includes(color)) {
          setAccent(color);
          const colorName = ACCENT_COLORS.find(c => c.id === color);
          const name = lang === 'zh' ? colorName?.labelZh : colorName?.labelEn;
          outputText = lang === 'zh' ? `系统强调色已更改为：${name}` : `Accent color has been changed to: ${name}`;
        } else {
          outputText = `Usage: accent <purple|gold|blue|rose|cyan>`;
        }
        break;
      }

      case 'sysinfo':
      case 'neofetch': {
        const activeAccentName = ACCENT_COLORS.find(c => c.id === accentId);
        const accentLabel = lang === 'zh' ? activeAccentName?.labelZh : activeAccentName?.labelEn;
        
        isHtml = true;
        outputText = `<div class="term-sysinfo">
<pre class="term-ascii-logo">${ASCII_LOGO}</pre>
<div class="term-specs">
  <p><span class="spec-label">User:</span> shimmer@github.io</p>
  <p><span class="spec-label">OS:</span> ShimmerOS 2026 (v3.0.0)</p>
  <p><span class="spec-label">Kernel:</span> Astro 7.0.5 + React 19.2</p>
  <p><span class="spec-label">Uptime:</span> ${getUptimeString()}</p>
  <p><span class="spec-label">Theme:</span> ${theme.toUpperCase()}</p>
  <p><span class="spec-label">Accent:</span> ${accentLabel}</p>
  <p><span class="spec-label">Shell:</span> ShimmerCMD v1.0.0</p>
  <p><span class="spec-label">Archives:</span> ${posts.length} articles loaded</p>
</div>
</div>`;
        break;
      }

      case 'date':
        outputText = `${new Date().toString()}`;
        break;

      case 'contact':
        outputText = lang === 'zh' 
          ? `站长联络通道：
  - Email:    xuanming.shimmer@gmail.com
  - GitHub:   https://github.com/Shimmer0007
  - LinkedIn: https://www.linkedin.com/`
          : `Developer Contacts:
  - Email:    xuanming.shimmer@gmail.com
  - GitHub:   https://github.com/Shimmer0007
  - LinkedIn: https://www.linkedin.com/`;
        break;

      case 'clear':
      case 'cls':
        setHistory([]);
        setInputValue('');
        return;

      case 'reboot':
        setHistory([...newHistory, { type: 'output', text: 'REBOOTING SYSTEM KERNEL...' }]);
        setTimeout(() => {
          window.location.reload();
        }, 800);
        setInputValue('');
        return;

      default:
        outputText = lang === 'zh'
          ? `未知命令: "${primary}"。输入 "help" 查看可用命令清单。`
          : `Command not found: "${primary}". Type "help" to view help menu.`;
    }

    setHistory([...newHistory, { type: 'output', text: outputText, isHtml }]);
    setInputValue('');
  };

  // 6. 监听键盘动作
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 回车执行命令
    if (e.key === 'Enter') {
      executeCommand(inputValue);
      return;
    }

    // 方向键 ↑ 回查历史命令
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextPointer = Math.max(0, historyPointer - 1);
      setHistoryPointer(nextPointer);
      setInputValue(commandHistory[nextPointer] || '');
    }

    // 方向键 ↓ 下查历史命令
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextPointer = historyPointer + 1;
      if (nextPointer >= commandHistory.length) {
        setHistoryPointer(commandHistory.length);
        setInputValue('');
      } else {
        setHistoryPointer(nextPointer);
        setInputValue(commandHistory[nextPointer] || '');
      }
    }

    // Tab 自动补全
    if (e.key === 'Tab') {
      e.preventDefault();
      const currentInput = inputValue.trim().toLowerCase();
      if (!currentInput) return;

      const commandsList = [
        'help', 'ls', 'apps', 'open', 'theme', 'accent', 'sysinfo', 'neofetch', 'date', 'contact', 'clear', 'cls', 'reboot'
      ];
      
      const appIds = ['about', 'writing', 'skills', 'projects', 'travel', 'plan', 'links', 'settings', 'terminal'];

      // 处理 "open xxx" 的自动补全
      if (currentInput.startsWith('open ')) {
        const subArg = currentInput.slice(5);
        const match = appIds.find(id => id.startsWith(subArg));
        if (match) {
          setInputValue(`open ${match}`);
        }
        return;
      }

      // 处理基础命令补全
      const match = commandsList.find(cmd => cmd.startsWith(currentInput));
      if (match) {
        setInputValue(match);
      }
    }
  };

  return (
    <div 
      className="terminal-shell" 
      ref={containerRef} 
      onClick={handleContainerClick}
    >
      {/* 全息扫线 */}
      <div className="terminal-scanline" />

      {/* 历史输出流 */}
      <div className="terminal-output-container">
        {history.map((item, idx) => (
          <div key={idx} className={`terminal-row terminal-row--${item.type}`}>
            {item.isHtml ? (
              <div 
                className="terminal-text-raw"
                dangerouslySetInnerHTML={{ __html: item.text }}
              />
            ) : (
              <pre className="terminal-text-raw">{item.text}</pre>
            )}
          </div>
        ))}
        <div ref={historyEndRef} />
      </div>

      {/* 实时命令行输入 */}
      <div className="terminal-row terminal-input-row">
        <span className="terminal-prompt">shimmer@os:~$</span>
        <input
          ref={inputRef}
          type="text"
          className="terminal-input-element"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </div>
    </div>
  );
}
