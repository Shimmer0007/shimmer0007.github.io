/**
 * 初始化并同步父窗口的主题。
 * 确保 iframe 内的博客样式与 ShimmerOS 保持一致。
 */
export function initTheme() {
    // 如果不在 iframe 中，则不执行任何操作
    if (window.self === window.top) return;

    const parentDoc = window.parent.document;
    const parentBody = parentDoc.body;
    const parentHtml = parentDoc.documentElement;
    const thisBody = document.body;
    const thisHtml = document.documentElement;

    const syncStyles = () => {
        // 同步亮/暗主题
        const currentTheme = parentBody.dataset.theme || 'dark';
        if (thisBody.dataset.theme !== currentTheme) {
            thisBody.dataset.theme = currentTheme;
        }

        // 同步强调色
        const currentAccent = parentHtml.style.getPropertyValue('--primary-accent');
        if (currentAccent) {
            thisHtml.style.setProperty('--primary-accent', currentAccent);
        }
    };

    // 初始同步
    syncStyles();

    // 使用 MutationObserver 监听父窗口变化
    const observer = new MutationObserver(syncStyles);
    observer.observe(parentBody, { attributes: true, attributeFilter: ['data-theme'] });
    observer.observe(parentHtml, { attributes: true, attributeFilter: ['style'] });

    // 页面卸载时停止监听
    window.addEventListener('unload', () => observer.disconnect());
}