document.addEventListener('DOMContentLoaded', () => {
    
    // --- Boot Sequence ---
    const bootScreen = document.getElementById('shimmer-boot-screen');
    const progressBar = document.getElementById('progress-bar-inner');
    const desktop = document.getElementById('desktop');
    setTimeout(() => {
        progressBar.style.width = '100%';
        setTimeout(() => {
            bootScreen.classList.add('hidden');
            desktop.classList.add('loaded');
        }, 2200);
    }, 100);

    // --- Window Management ---
    const windows = document.querySelectorAll('.window');
    let activeWindow = null;
    let maxZIndex = 100;

    function activateWindow(win) {
        if (activeWindow === win) return;
        if (activeWindow) activeWindow.classList.remove('active');
        maxZIndex++;
        win.style.zIndex = maxZIndex;
        win.classList.add('active');
        activeWindow = win;
        // 如果是终端窗口，则聚焦到隐藏的输入框
        if (win.id === 'terminal-window') {
            document.getElementById('hidden-terminal-input').focus();
        }
    }

    function openOrActivateWindow(windowId) {
        const win = document.getElementById(windowId);
        if (win) {
            if (win.style.display !== 'flex') {
                win.style.display = 'flex';
                if (windowId === 'terminal-window') {
                    const output = win.querySelector('#terminal-output');
                    output.innerHTML = 'ShimmerOS [Version 1.5.0]\n(c) 2025 Shimmer. All rights reserved.\nType "help" for a list of commands.\n';
                }
            }
            activateWindow(win);
        }
    }

    windows.forEach(win => {
        const titleBar = win.querySelector('.title-bar');
        win.addEventListener('mousedown', () => activateWindow(win));
        
        const startDrag = (e) => {
            if (e.target.closest('.control-button') || win.closest('.no-drag')) return;
            if (window.innerWidth <= 768) return;
            e.preventDefault();
            activateWindow(win);
            
            const isTouchEvent = e.type.startsWith('touch');
            const startX = isTouchEvent ? e.touches[0].clientX : e.clientX;
            const startY = isTouchEvent ? e.touches[0].clientY : e.clientY;
            const startLeft = win.offsetLeft;
            const startTop = win.offsetTop;
            
            const onDrag = (moveEvent) => {
                const moveX = isTouchEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
                const moveY = isTouchEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
                win.style.left = `${startLeft + moveX - startX}px`;
                win.style.top = `${startTop + moveY - startY}px`;
            };
            
            const endDrag = () => {
                document.removeEventListener(isTouchEvent ? 'touchmove' : 'mousemove', onDrag);
                document.removeEventListener(isTouchEvent ? 'touchend' : 'mouseup', endDrag);
            };
            
            document.addEventListener(isTouchEvent ? 'touchmove' : 'mousemove', onDrag);
            document.addEventListener(isTouchEvent ? 'touchend' : 'mouseup', endDrag);
        };

        if (titleBar) {
            titleBar.addEventListener('mousedown', startDrag);
            titleBar.addEventListener('touchstart', startDrag, { passive: false });
        }
        
        const closeBtn = win.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                win.style.animation = 'close-window 0.3s ease-out forwards';
                setTimeout(() => {
                    win.style.display = 'none';
                    win.style.animation = 'open-window 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
                    if (win.id === 'project-window') {
                        document.getElementById('project-list-view').style.display = 'block';
                        document.getElementById('project-detail-view').style.display = 'none';
                    }
                }, 300);
            });
        }
    });

    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `@keyframes close-window { from { transform: scale(1); opacity: 1; } to { transform: scale(0.95); opacity: 0; } }`;
    document.head.appendChild(styleSheet);

    // --- Context Menu Logic ---
    const contextMenu = document.getElementById('context-menu');
    let longPressTimer;
    let longPressTriggered = false;

    const showContextMenu = (e, targetIcon) => {
        e.preventDefault();
        hideContextMenu();
        const windowId = targetIcon ? targetIcon.getAttribute('data-window-id') : null;
        let menuItems = '';
        if (windowId) {
            menuItems = `<div class="context-menu-item" data-action="open" data-window-id="${windowId}">打开</div>`;
        } else {
            menuItems = `<div class="context-menu-item" data-action="settings">显示设置</div>`;
        }
        contextMenu.innerHTML = menuItems;
        const posX = e.touches ? e.touches[0].clientX : e.clientX;
        const posY = e.touches ? e.touches[0].clientY : e.clientY;
        contextMenu.style.left = `${posX}px`;
        contextMenu.style.top = `${posY}px`;
        contextMenu.style.display = 'block';
        document.addEventListener('click', hideContextMenu, { once: true });
    };

    const hideContextMenu = () => contextMenu.style.display = 'none';

    contextMenu.addEventListener('click', (e) => {
        const target = e.target;
        if (target.matches('.context-menu-item')) {
            const action = target.dataset.action;
            const windowId = target.dataset.windowId;
            if (action === 'open' && windowId) openOrActivateWindow(windowId);
            else if (action === 'settings') openOrActivateWindow('settings-window');
            hideContextMenu();
        }
    });

    // --- Event Binding ---
    function setupIconEvents(icon) {
        icon.addEventListener('click', (e) => {
            if (!longPressTriggered) openOrActivateWindow(icon.getAttribute('data-window-id'));
        });
        icon.addEventListener('contextmenu', (e) => showContextMenu(e, icon));
        icon.addEventListener('touchstart', (e) => {
            longPressTriggered = false;
            longPressTimer = setTimeout(() => {
                longPressTriggered = true;
                showContextMenu(e, icon);
            }, 500);
        });
        icon.addEventListener('touchend', () => clearTimeout(longPressTimer));
        icon.addEventListener('touchmove', () => clearTimeout(longPressTimer));
    }

    document.querySelectorAll('.desktop-icon').forEach(setupIconEvents);
    desktop.addEventListener('contextmenu', (e) => { if(e.target === desktop) showContextMenu(e, null); });
    document.querySelectorAll('.nav-button[data-window-id]').forEach(button => {
        button.addEventListener('click', () => openOrActivateWindow(button.getAttribute('data-window-id')));
    });

    // --- Interactive Terminal (Mobile-Friendly with Hidden Input) ---
    const terminalBody = document.getElementById('terminal-body');
    const terminalOutput = document.getElementById('terminal-output');
    const terminalInputDisplay = document.getElementById('terminal-input-display'); // The visible <span>
    const hiddenInput = document.getElementById('hidden-terminal-input'); // The real, hidden <input>

    const commands = {
        help: () => `Available commands:\n  help      - Shows this help message\n  ls        - Lists all desktop apps\n  open <app>- Opens an application (e.g., open blog)\n  date      - Displays the current date and time\n  about     - Shows the player profile\n  clear     - Clears the terminal screen\n  reboot    - Reboots the system`,
        ls: () => 'Desktop Items:\n' + [...document.querySelectorAll('.desktop-icon .icon-label')].map(i => `  - ${i.textContent}`).join('\n'),
        open: (args) => {
            const appName = args[0];
            if (!appName) return 'Usage: open <app_name>';
            const nameMap = { blog: '微光博客', notes: '课业笔记', skills: '技能树', about: '关于我', projects: '项目浏览', travel: '出行足迹', links: '友情链接', api: 'GitHub查询', settings: '设置', clock: '时钟' };
            const targetName = Object.keys(nameMap).find(k => appName.toLowerCase() === k) || appName;
            const icon = [...document.querySelectorAll('.desktop-icon')].find(i => i.querySelector('.icon-label').textContent.toLowerCase().includes(targetName.toLowerCase()));
            if (icon) {
                openOrActivateWindow(icon.dataset.windowId);
                return `Opening ${icon.querySelector('.icon-label').textContent}...`;
            }
            return `Error: Application "${appName}" not found.`;
        },
        date: () => new Date().toLocaleString('ja-JP'),
        about: () => `-- Player Profile --\n${document.querySelector('#about-window .window-body').innerText.trim()}`,
        clear: () => { terminalOutput.innerHTML = ''; return ''; },
        reboot: () => { window.location.reload(); return 'Rebooting system...'; }
    };

    // 1. 点击终端任何区域，都让隐藏的输入框获得焦点
    terminalBody.addEventListener('click', () => {
        hiddenInput.focus();
    });

    // 2. 监听隐藏输入框的 'input' 事件，这是处理文字输入的最佳方式
    hiddenInput.addEventListener('input', () => {
        // 将真实输入框的值同步到我们可见的 <span> 上
        terminalInputDisplay.textContent = hiddenInput.value;
    });

    // 3. 只在隐藏输入框上监听 'keydown' 来处理特殊按键，如 Enter
    hiddenInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            
            const fullCommand = hiddenInput.value;
            const [command, ...args] = fullCommand.trim().split(' ').filter(Boolean);
            
            terminalOutput.innerHTML += `\n<span class="terminal-prompt"></span>${fullCommand}`;
            
            if (fullCommand.toLowerCase().includes('sudo')) {
                const sudoResponses = [
                    "User is not in the sudoers file. This incident will be reported.",
                    "权限不足。检测到越权操作，ShimmerOS觉得你有点可爱并驳回了你的请求。",
                    "嘿，朋友！这只是一个用HTML和JS做的个人主页，不是真正的Linux。但你的探索精神值得鼓励！",
                    "[SECURITY ALERT] Unauthorized privilege escalation attempt detected. System integrity is safe."
                ];
                const response = sudoResponses[Math.floor(Math.random() * sudoResponses.length)];
                terminalOutput.innerHTML += `\n${response}`;
            } else if (command) {
                const response = commands[command] ? commands[command](args) : `Command not found: ${command}`;
                if(response) terminalOutput.innerHTML += `\n${response}`;
            }
            
            // 清空输入框和显示的 span
            hiddenInput.value = '';
            terminalInputDisplay.textContent = '';

            // 滚动到底部
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }
    });

    // --- Clock Widget ---
    const clockElement = document.getElementById('clock-widget');
    function updateClock() {
        clockElement.textContent = new Date().toLocaleTimeString('ja-JP');
    }
    setInterval(updateClock, 1000);
    updateClock();

    // --- Settings Logic ---
    const settingsWindow = document.getElementById('settings-window');
    settingsWindow.querySelectorAll('.theme-button').forEach(button => {
        button.addEventListener('click', () => {
            const theme = button.dataset.theme;
            document.body.dataset.theme = theme;
            settingsWindow.querySelector('.theme-button.active').classList.remove('active');
            button.classList.add('active');
        });
    });

    settingsWindow.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            const color = swatch.dataset.color;
            document.documentElement.style.setProperty('--primary-accent', color);
            settingsWindow.querySelector('.color-swatch.active').classList.remove('active');
            swatch.classList.add('active');
        });
    });

    // --- GitHub API Fetcher Logic ---
    const githubQueryBtn = document.getElementById('github-query-btn');
    const githubUsernameInput = document.getElementById('github-username-input');
    const githubResponseArea = document.getElementById('github-response-area');

    const fetchGitHubUser = async () => {
        const username = githubUsernameInput.value.trim();
        if (!username) {
            githubResponseArea.innerHTML = `<p style="color: var(--secondary-accent);">请输入一个用户名。</p>`;
            return;
        }
        githubResponseArea.innerHTML = `<p>正在查询...</p>`;
        try {
            const response = await fetch(`https://api.github.com/users/${username}`);
            if (!response.ok) {
                if(response.status === 404) throw new Error(`用户 "${username}" 未找到。`);
                throw new Error(`网络错误, 状态: ${response.status}`);
            }
            const data = await response.json();
            githubResponseArea.innerHTML = `
                <div class="github-user-profile">
                    <img src="${data.avatar_url}" alt="${data.login} avatar" class="github-avatar">
                    <div class="github-user-info">
                        <h3>${data.name || data.login} 
                            <a href="${data.html_url}" target="_blank" title="访问GitHub主页">(@${data.login})</a>
                        </h3>
                        <p class="github-bio">${data.bio || '这个用户很神秘，什么也没留下...'}</p>
                        <div class="github-user-stats">
                            <span><span class="stat-value">${data.public_repos}</span> 公开仓库</span>
                            <span><span class="stat-value">${data.followers}</span> 关注者</span>
                            <span><span class="stat-value">${data.following}</span> 正在关注</span>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            githubResponseArea.innerHTML = `<p style="color: var(--secondary-accent);">${error.message}</p>`;
        }
    };

    githubQueryBtn.addEventListener('click', fetchGitHubUser);
    githubUsernameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') fetchGitHubUser();
    });

    // --- Project Browser Logic ---
    const projectsData = {
        'textmining': {
            name: 'Textmining Project',
            description: '《统计机器学习与文本挖掘》实验材料。基于新闻文本和财经数据的多维度分析项目。',
            tags: ['Python', 'Data Mining', 'NLP'],
            contentHTML: `<p>一个基于新闻文本和财经数据进行情感分析、主题建模和可视化的数据科学项目。</p><ul class="file-tree"><li><span class="file-icon">📁</span><strong>src</strong><ul class="file-tree"><li><span class="file-icon">🐍</span>data_collection.py</li><li><span class="file-icon">🐍</span>data_preprocessing.py</li><li><span class="file-icon">🐍</span>sentiment_analysis.py</li><li><span class="file-icon">🐍</span>topic_modeling.py</li><li><span class="file-icon">🐍</span>visualization.py</li></ul></li><li><span class="file-icon">📁</span><strong>data</strong><ul class="file-tree"><li><span class="file-icon">📄</span>news_articles.csv</li><li><span class="file-icon">📄</span>stock_prices.csv</li></ul></li><li><span class="file-icon">📄</span>README.md</li></ul>`
        },
        'personal-os': {
            name: 'Personal OS Homepage',
            description: '您当前正在浏览的这个交互式个人主页。一个使用原生JS构建的仿操作系统界面。',
            tags: ['JavaScript', 'HTML5', 'CSS3', 'UI/UX'],
            contentHTML: `<p>一个使用原生JS、HTML和CSS构建的，模拟桌面操作系统的交互式个人主页，所有代码都在一个文件内。</p><ul class="file-tree"><li><span class="file-icon">📄</span><strong>index.html</strong><ul class="file-tree"><li><span class="file-icon">🎨</span>style.css (Embedded)</li><li><span class="file-icon">📜</span>script.js (Embedded)</li></ul></li><li><span class="file-icon">📁</span><strong>assets</strong><ul class="file-tree"><li><span class="file-icon">🖼️</span>(background-gradients)</li><li><span class="file-icon">✒️</span>(google-fonts)</li></ul></li></ul>`
        }
    };

    const projectListView = document.getElementById('project-list-view');
    const projectDetailView = document.getElementById('project-detail-view');
    const projectDetailContent = document.getElementById('project-detail-content');
    const backToProjectsBtn = document.querySelector('.back-to-projects-btn');

    let projectsHTML = '';
    for (const projectId in projectsData) {
        const project = projectsData[projectId];
        const tagsHTML = project.tags.map(tag => `<span>${tag}</span>`).join('');
        projectsHTML += `
            <div class="project-card" data-project-id="${projectId}">
                <h4>${project.name}</h4>
                <p>${project.description}</p>
                <div class="project-tags">${tagsHTML}</div>
            </div>`;
    }
    projectListView.innerHTML = projectsHTML;

    projectListView.addEventListener('click', (e) => {
        const card = e.target.closest('.project-card');
        if (card) {
            const projectId = card.dataset.projectId;
            projectDetailContent.innerHTML = projectsData[projectId].contentHTML;
            projectListView.style.display = 'none';
            projectDetailView.style.display = 'block';
        }
    });

    backToProjectsBtn.addEventListener('click', () => {
        projectDetailView.style.display = 'none';
        projectListView.style.display = 'block';
    });
});
