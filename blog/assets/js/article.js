import { initTheme } from './theme.js';
import { initTOC } from './toc.js';

class ArticleViewer {
    constructor() {
        this.articleId = new URLSearchParams(window.location.search).get('id');
        this.allArticles = [];
        this.currentArticle = null;

        if (!this.articleId) {
            this.handleError('未找到文章ID，即将返回首页。');
            return;
        }
        
        initTheme();
        this.init();
    }

    async init() {
        try {
            const articlesRes = await fetch('data/articles.json');
            this.allArticles = await articlesRes.json();
            this.currentArticle = this.allArticles.find(a => a.id === this.articleId);

            if (!this.currentArticle) {
                this.handleError('无法找到该文章，即将返回首页。');
                return;
            }

            await this.loadArticleContent();
            this.updateMetadata();
            initTOC();
            this.renderRelatedPosts();
            this.setupNavigation();
        } catch (error) {
            console.error('初始化文章页面失败:', error);
            this.handleError('加载文章失败。');
        }
    }

    async loadArticleContent() {
        const res = await fetch(this.currentArticle.url);
        if (!res.ok) throw new Error(`无法加载文章文件: ${this.currentArticle.url}`);
        const content = await res.text();
        document.getElementById('article-content').innerHTML = content;
    }

    updateMetadata() {
        document.title = `${this.currentArticle.title} | 微光博客`;
        
        const header = `
            <header class="article-header">
                <h1>${this.currentArticle.title}</h1>
                <div class="article-meta">
                    <span>作者: ${this.currentArticle.author}</span>
                    <span>发布于: ${new Date(this.currentArticle.date).toLocaleDateString()}</span>
                    <span>分类: <a href="index.html?category=${this.currentArticle.category}">${this.currentArticle.category}</a></span>
                </div>
            </header>
        `;
        document.getElementById('article-content').insertAdjacentHTML('afterbegin', header);
    }

    renderRelatedPosts() {
        const container = document.getElementById('related-posts');
        const related = this.allArticles.filter(
            a => a.category === this.currentArticle.category && a.id !== this.currentArticle.id
        ).slice(0, 5); // 最多显示5篇相关文章

        if (related.length === 0) {
            container.innerHTML = '<li>暂无相关文章</li>';
            return;
        }

        container.innerHTML = related.map(a => `
            <li><a href="article.html?id=${a.id}">${a.title}</a></li>
        `).join('');
    }

    setupNavigation() {
        const currentIndex = this.allArticles.findIndex(a => a.id === this.articleId);
        
        const prevArticle = this.allArticles[currentIndex + 1]; // 数组是倒序的，新文章在前
        const nextArticle = this.allArticles[currentIndex - 1];

        const prevLink = document.getElementById('prev-article');
        const nextLink = document.getElementById('next-article');

        if (prevArticle) {
            prevLink.href = `article.html?id=${prevArticle.id}`;
            prevLink.textContent = `← ${prevArticle.title}`;
        } else {
            prevLink.textContent = '已经是第一篇';
            prevLink.classList.add('disabled');
        }

        if (nextArticle) {
            nextLink.href = `article.html?id=${nextArticle.id}`;
            nextLink.textContent = `${nextArticle.title} →`;
        } else {
            nextLink.textContent = '已经是最后一篇';
            nextLink.classList.add('disabled');
        }
    }

    handleError(message) {
        console.error(message);
        // 可以在此处显示一个错误提示
        setTimeout(() => window.location.href = 'index.html', 3000);
    }
}

new ArticleViewer();