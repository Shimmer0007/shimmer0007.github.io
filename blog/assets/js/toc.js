let tocObserver = null;
const tocLinks = [];

/**
 * 根据文章内容生成分层目录
 */
function buildTOC() {
    const content = document.getElementById('article-content');
    const container = document.getElementById('toc-container');
    const headings = Array.from(content.querySelectorAll('h2, h3'));

    if (headings.length < 2) {
        container.innerHTML = '<p style="color: var(--text-medium);">本文结构简单，无需目录。</p>';
        return;
    }

    const tocList = document.createElement('ul');
    tocList.className = 'toc-list';

    headings.forEach((heading, index) => {
        const id = `toc-heading-${index}`;
        heading.id = id;

        const level = parseInt(heading.tagName.charAt(1), 10);
        const li = document.createElement('li');
        li.className = `toc-item toc-level-${level}`;

        const link = document.createElement('a');
        link.className = 'toc-link';
        link.textContent = heading.textContent;
        link.href = `#${id}`;
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // 更新URL的hash，但不触发页面跳转
            history.pushState(null, null, `#${id}`);
        });

        li.appendChild(link);
        tocList.appendChild(li);
        tocLinks.push(link);
    });
    
    // 添加进度条元素
    const progressBar = document.createElement('div');
    progressBar.className = 'toc-progress-bar';
    tocList.appendChild(progressBar);

    container.appendChild(tocList);
}

/**
 * 设置滚动监听，高亮当前阅读的标题
 */
function setupScrollSpy() {
    // 先断开旧的监听器
    if (tocObserver) tocObserver.disconnect();
    
    let activeLink = null;

    const observerCallback = (entries) => {
        entries.forEach(entry => {
            const link = document.querySelector(`.toc-link[href="#${entry.target.id}"]`);
            if (!link) return;

            if (entry.isIntersecting && entry.intersectionRatio > 0) {
                if (activeLink) {
                    activeLink.classList.remove('active');
                }
                link.classList.add('active');
                activeLink = link;
            } else {
                link.classList.remove('active');
            }
        });
    };

    tocObserver = new IntersectionObserver(observerCallback, {
        rootMargin: '0px 0px -80% 0px', // 仅当标题到达屏幕上方20%时触发
        threshold: 0
    });

    document.querySelectorAll('#article-content h2, #article-content h3').forEach(h => tocObserver.observe(h));
}

/**
 * 更新阅读进度条
 */
function updateProgressBar() {
    const content = document.querySelector('.article-full');
    const progressBar = document.querySelector('.toc-progress-bar');
    if (!content || !progressBar) return;
    
    const scrollY = window.scrollY;
    const contentTop = content.offsetTop;
    const contentHeight = content.scrollHeight;
    const viewportHeight = window.innerHeight;

    let progress = 0;
    // 只有当滚动到文章区域后才开始计算进度
    if (scrollY > contentTop) {
        const scrolledInContent = scrollY - contentTop;
        const totalScrollable = contentHeight - viewportHeight;
        if (totalScrollable > 0) {
            progress = Math.min(100, (scrolledInContent / totalScrollable) * 100);
        }
    }
    
    // 进度条本身的高度是固定的，我们用其父元素的高度来计算
    const tocListHeight = progressBar.parentElement.clientHeight;
    progressBar.style.height = `${(tocListHeight * progress) / 100}px`;
}


/**
 * 主入口函数
 */
export function initTOC() {
    buildTOC();
    if (tocLinks.length > 0) {
        setupScrollSpy();
        window.addEventListener('scroll', updateProgressBar, { passive: true });
        updateProgressBar(); // 初始调用
    }
}