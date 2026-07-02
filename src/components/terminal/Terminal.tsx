// src/components/terminal/Terminal.tsx
import { useState, useRef, useEffect } from 'react';
import { useWindowsStore } from '../../store/windows';
import { useOSStore, ACCENT_COLORS } from '../../store/os';
import { useT } from '../../i18n';
import './Terminal.css';

interface HistoryLine {
  type: 'input' | 'output' | 'error' | 'success' | 'system';
  text: string;
  isHTML?: boolean;
}

const SUDO_RESPONSES = [
  "Permission denied. User is not in the sudoers file. This incident will be reported.",
  "权限不足。检测到越权操作，ShimmerOS觉得你有点可爱并驳回了你的请求。",
  "嘿，朋友！这只是一个用 React 做的模拟终端，不是真正的 Linux。但你的探索精神值得鼓励！",
  "[SECURITY ALERT] Unauthorized privilege escalation attempt detected. System integrity is safe."
];

export default function Terminal() {
  const t = useT();
  const openWindow = useWindowsStore(s => s.openWindow);
  
  // OS 状态联动
  const { theme, setTheme, accentId, setAccent, lang } = useOSStore();
  const currentAccent = ACCENT_COLORS.find(c => c.id === accentId) || ACCENT_COLORS[0];

  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryLine[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 1. 初始化欢迎词
  useEffect(() => {
    setHistory([
      {
        type: 'system',
        text: `ShimmerOS [Version 3.0.0]\n(c) 2026 Shimmer. All rights reserved.\n\n欢迎来到 ShimmerCMD 终端控制台！\n输入 <span class="term-hl">help</span> 可查看可用指令列表。\n`,
        isHTML: true
      }
    ]);
  }, []);

  // 2. 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // 点击终端任意处自动聚焦输入框
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  // 3. 执行命令行核心解析
  const executeCommand = (rawCommand: string) => {
    const trimmed = rawCommand.trim();
    if (!trimmed) {
      setHistory(prev => [...prev, { type: 'input', text: '' }]);
      return;
    }

    // 记录历史指令
    const nextCmdHistory = [...commandHistory, trimmed];
    setCommandHistory(nextCmdHistory);
    setHistoryPointer(nextCmdHistory.length);

    // 将执行的输入打印出来
    setHistory(prev => [...prev, { type: 'input', text: trimmed }]);

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    let outputText = '';
    let outputType: HistoryLine['type'] = 'output';
    let isHTML = false;

    switch (cmd) {
      case 'help':
        isHTML = true;
        outputText = `可用命令如下:
  <span class="term-hl">help</span>          - 显示帮助手册
  <span class="term-hl">ls [-l]</span>       - 列出所有可用的系统应用清单 (-l 查看详情)
  <span class="term-hl">open &lt;app&gt;</span>   - 启动指定的窗口应用 (如: open writing)
  <span class="term-hl">theme &lt;l|d&gt;</span>   - 切换系统主题外观 (l: 亮色 / d: 暗色)
  <span class="term-hl">accent &lt;c&gt;</span>    - 切换全局强调色 (blue/purple/rose/gold/cyan)
  <span class="term-hl">sysinfo</span>       - Neofetch 硬件规格与软件版本看板
  <span class="term-hl">date</span>          - 查看系统当前的日期和时间
  <span class="term-hl">contact</span>       - 获取研究员的联系管道
  <span class="term-hl">clear</span>         - 清空屏幕记录
  <span class="term-hl">reboot</span>        - 物理重载整个操作系统`;
        break;

      case 'ls':
        const showDetails = args[0] === '-l';
        const apps = [
          { id: 'about', name: 'Player Profile', desc: '关于我（属性面板）' },
          { id: 'writing', name: 'Writing Reader', desc: '微光博客 & 课业笔记' },
          { id: 'skills', name: 'Skill Tree', desc: 'D3 力学星轨技能树' },
          { id: 'projects', name: 'Projects Browser', desc: '全息机甲项目集 Portfolio' },
          { id: 'travel', name: 'Travel footprints', desc: '出行足迹互动地图' },
          { id: 'plan', name: 'February Plan', desc: 'Janus 二月计划大纲' },
          { id: 'settings', name: 'System Settings', desc: '系统显示与强调色设置' },
          { id: 'terminal', name: 'ShimmerCMD', desc: '等宽字符终端控制台' }
        ];

        if (showDetails) {
          isHTML = true;
          outputText = `桌面应用程序详细清单:\n` + apps.map(a => 
            `  - <span class="term-hl">${a.id.padEnd(10, ' ')}</span> : ${a.name.padEnd(18, ' ')} (${a.desc})`
          ).join('\n');
        } else {
          outputText = `桌面应用:  ` + apps.map(a => a.id).join('  |  ');
        }
        break;

      case 'open':
        const targetApp = args[0]?.toLowerCase();
        if (!targetApp) {
          outputText = `用法错误。示例: open writing (可使用 ls 指令查看可用列表)`;
          outputType = 'error';
          break;
        }

        const appTitles: Record<string, string> = {
          about: 'Player Profile',
          writing: '微光博客',
          skills: 'Skill Tree',
          projects: '项目浏览器',
          travel: '出行足迹',
          plan: '二月计划',
          settings: '系统设置',
          terminal: 'ShimmerCMD'
        };

        if (appTitles[targetApp]) {
          openWindow(targetApp, appTitles[targetApp]);
          outputText = `正在开启窗口应用 [${appTitles[targetApp]} (id: ${targetApp})]...`;
          outputType = 'success';
        } else {
          outputText = `未知应用: "${targetApp}"。输入 ls 查看所有有效 App ID。`;
          outputType = 'error';
        }
        break;

      case 'theme':
        const mode = args[0]?.toLowerCase();
        if (mode === 'light' || mode === 'l') {
          setTheme('light');
          outputText = `系统外观已成功切换为：简洁亮色 (Light Mode)`;
          outputType = 'success';
        } else if (mode === 'dark' || mode === 'd') {
          setTheme('dark');
          outputText = `系统外观已成功切换为：深邃暗色 (Dark Void Mode)`;
          outputType = 'success';
        } else {
          outputText = `用法错误。示例: theme d (d: 深色 / l: 亮色)`;
          outputType = 'error';
        }
        break;

      case 'accent':
        const colorInput = args[0]?.toLowerCase();
        // 兼容 red -> rose，以及 ACCENT_COLORS 现有的 id
        const mappedColor = colorInput === 'red' ? 'rose' : colorInput;
        const matched = ACCENT_COLORS.find(c => c.id === mappedColor);

        if (matched) {
          setAccent(matched.id);
          outputText = `全局强调色已变更为：${matched.label} (${matched.value})`;
          outputType = 'success';
        } else {
          const colorsList = ACCENT_COLORS.map(c => c.id).join('/');
          outputText = `无效强调色。当前支持: ${colorsList} (或 red 别名)`;
          outputType = 'error';
        }
        break;

      case 'sysinfo':
        isHTML = true;
        outputText = `
<span style="color: ${currentAccent.value}; font-weight: bold;">
       _     _                                _____  _____ 
      | |   (_)                              |  _  |/  ___|
   ___| |__  _ _ __ ___  _ __ ___   ___ _ __ | | | |\\ \`--. 
  / __| '_ \\| | '_ \` _ \\| '_ \` _ \\ / _ \\ '__|| | | | \`--. \\
  \\__ \\ | | | | | | | | | | | | | |  __/ |   \\ \\_/ //\\__/ /
  |___/_| |_|_|_| |_| |_|_| |_| |_|\\___|_|    \\___/ \\____/ 
</span>
  ---------------------------------------------------------
  <span style="color: ${currentAccent.value};">Host:</span>       Shimmer's Digital Sanctuary (xxd-VT)
  <span style="color: ${currentAccent.value};">OS:</span>         ShimmerOS v3.0.0 (Astro5 + React19 Kernel)
  <span style="color: ${currentAccent.value};">Uptime:</span>     ${Math.floor(performance.now() / 60000)} mins
  <span style="color: ${currentAccent.value};">Theme:</span>      ${theme === 'dark' ? 'Void Violet (Dark)' : 'Aurora Snow (Light)'}
  <span style="color: ${currentAccent.value};">Accent:</span>     ${currentAccent.label} (${currentAccent.value})
  <span style="color: ${currentAccent.value};">Browser:</span>    Interactive-Client-Bridge
  <span style="color: ${currentAccent.value};">Engine:</span>     Vite + Astro Content Layer
  <span style="color: ${currentAccent.value};">CPU:</span>        A-Chain Cognitive Processor @ 5.0 GHz
  <span style="color: ${currentAccent.value};">Memory:</span>     512 MB / 1024 MB
  ---------------------------------------------------------`;
        break;

      case 'date':
        outputText = `系统当前时间: ${new Date().toLocaleString(lang === 'en' ? 'en-US' : 'zh-CN')}`;
        break;

      case 'contact':
        isHTML = true;
        outputText = `📬 联络信道绑定成功:
  - <span class="term-hl">Email:</span>  <a href="mailto:xuanmi777@outlook.com" class="term-link">xuanmi777@outlook.com</a>
  - <span class="term-hl">GitHub:</span> <a href="https://github.com/shimmer0007" target="_blank" class="term-link">github.com/shimmer0007</a>`;
        break;

      case 'clear':
        setHistory([]);
        return; // 直接返回，不添加任何输出

      case 'reboot':
        outputText = `正在进行系统热重载与物理重置，请稍候...`;
        outputType = 'system';
        setTimeout(() => {
          window.location.reload();
        }, 1200);
        break;

      case 'sudo':
        const randomResp = SUDO_RESPONSES[Math.floor(Math.random() * SUDO_RESPONSES.length)];
        outputText = randomResp;
        outputType = 'error';
        break;

      case 'sudo rm':
      case 'rm':
        if (trimmed.includes('sudo rm') || trimmed === 'rm -rf /') {
          isHTML = true;
          outputText = `<span style="color: var(--color-red); font-weight: bold;">[DANGER COMMAND DETECTED]</span>
检测到危险毁灭指令！ShimmerOS 系统超驰已自动启动。
正在向研究员注入快乐，顺便拦截了你的删库跑路行为... 😉`;
          outputType = 'error';
        } else {
          outputText = `rm: 缺少参数。ShimmerOS 拒绝执行空空如也的删除动作。`;
          outputType = 'error';
        }
        break;

      default:
        outputText = `未找到命令 "${cmd}"。输入 help 查看可用列表。`;
        outputType = 'error';
        break;
    }

    setHistory(prev => [...prev, { type: outputType, text: outputText, isHTML }]);
  };

  // 4. 输入框键盘事件监听
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      // 翻阅历史往上
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextPointer = historyPointer > 0 ? historyPointer - 1 : 0;
        setHistoryPointer(nextPointer);
        setInput(commandHistory[nextPointer]);
      }
    } else if (e.key === 'ArrowDown') {
      // 翻阅历史往下
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextPointer = historyPointer < commandHistory.length - 1 ? historyPointer + 1 : commandHistory.length;
        setHistoryPointer(nextPointer);
        if (nextPointer === commandHistory.length) {
          setInput('');
        } else {
          setInput(commandHistory[nextPointer]);
        }
      }
    }
  };

  return (
    <div 
      className="terminal-container" 
      ref={containerRef} 
      onClick={handleContainerClick}
      style={{ '--terminal-accent': currentAccent.value } as React.CSSProperties}
    >
      <div className="terminal-history">
        {history.map((line, index) => {
          if (line.type === 'input') {
            return (
              <div key={index} className="terminal-line terminal-line--input">
                <span className="terminal-prompt-symbol">shimmeros:~ shim$</span>
                <span className="terminal-input-echo">{line.text}</span>
              </div>
            );
          }

          const lineClass = `terminal-line terminal-line--${line.type}`;
          return (
            <div key={index} className={lineClass}>
              {line.isHTML ? (
                <div dangerouslySetInnerHTML={{ __html: line.text }} />
              ) : (
                <pre>{line.text}</pre>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="terminal-prompt-bar">
        <span className="terminal-prompt-symbol">shimmeros:~ shim$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="terminal-real-input"
          autoFocus
          autoCapitalize="off"
          autoComplete="off"
          spellCheck="false"
        />
      </div>
    </div>
  );
}
