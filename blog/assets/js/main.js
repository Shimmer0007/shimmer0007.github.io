import { initTheme } from './theme.js';

class BlogApp {
    constructor() {
        this.articles = [];
        this.categories = {};
        this.tags = {};
        this.articlesContainer = document.getElementById('articles-container');
        this.categoryList = document.getElementById('category-list');
        this.popularPostsList = document.getElementById('popular-posts');
        this.tagCloud = document.getElementById('tag-cloud');
        this.searchInput = document.getElementById('search-input');
        
        initTheme();
        this.init();
    }

    async init() {
        this.showLoadingSpinner(true);
        await this.loadData();
        this.showLoadingSpinner(false);
        
        this.renderArticles(this.articles);
        this.renderSidebar();
        this.setupEventListeners();
    }

    showLoadingSpinner(show) {
        if (show) {
            this.articlesContainer.innerHTML = '<div class="loading-spinner"></div>';
        } else {
            this.articlesContainer.innerHTML = '';
        }
    }

    async loadData() {
        try {
            // 使用 Promise.all 并行加载数据
            const [articlesRes, categoriesRes] = await Promise.all([
                fetch('data/articles.json'),
                fetch('data/categories.json')
            ]);
            if (!articlesRes.ok || !categoriesRes.ok) {
                throw new Error('网络响应错误');
            }
            this.articles = await articlesRes.json();
            this.categories = await categoriesRes.json();
        } catch (error) {
            console.error('加载数据失败:', error);
            this.articlesContainer.innerHTML = '<p class="error-message">内容加载失败，请检查网络或联系管理员。</p>';
        }
    }

    renderArticles(articlesToRender) {
        if (!articlesToRender.length) {
            this.articlesContainer.innerHTML = '<p class="info-message">没有找到匹配的文章。</p>';
            return;
        }

        this.articlesContainer.innerHTML = articlesToRender
            .map(article => this.createArticleCard(article))
            .join('');
    }

    createArticleCard(article) {
        return `
            <article class="article-card">
                <div class="card-content">
                    <h2 class="card-title"><a href="article.html?id=${article.id}">${article.title}</a></h2>
                    <p class="card-excerpt">${article.excerpt}</p>
                    <div class="card-footer">
                        <div class="article-meta">
                            <span>${new Date(article.date).toLocaleDateString()}</span>
                            <span>•</span>
                            <a href="#" class="meta-category" data-category="${article.category}">${article.category}</a>
                        </div>
                        <div class="article-tags">
                            ${article.tags.map(tag => `<a href="#" class="tag" data-tag="${tag}">${tag}</a>`).join('')}
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    renderSidebar() {
        this.renderCategories();
        this.renderPopularPosts();
        this.renderTagCloud();
    }

    renderCategories() {
        // 使用 categories.json 的数据来渲染
        this.categoryList.innerHTML = Object.entries(this.categories)
            .map(([name, data]) => `
                <li>
                    <a href="#" data-category="${name}">
                        ${name} <span>(${data.count})</span>
                    </a>
                </li>
            `).join('');
    }

    renderPopularPosts() {
        const popular = [...this.articles]
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 5);
        this.popularPostsList.innerHTML = popular
            .map(p => `<li><a href="article.html?id=${p.id}">${p.title}</a></li>`)
            .join('');
    }

    renderTagCloud() {
        const tagCounts = {};
        this.articles.forEach(article => {
            article.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        this.tagCloud.innerHTML = Object.entries(tagCounts)
            .sort((a,b) => b[1] - a[1]) // 按热度排序
            .map(([tag, count]) => `<a href="#" class="tag" data-tag="${tag}">${tag}</a>`)
            .join('');
    }

    setupEventListeners() {
        // 搜索功能 (实时响应)
        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = this.articles.filter(article => 
                article.title.toLowerCase().includes(query) || 
                article.excerpt.toLowerCase().includes(query)
            );
            this.renderArticles(filtered);
        });

        // 分类和标签筛选 (事件委托)
        document.body.addEventListener('click', (e) => {
            const category = e.target.closest('[data-category]')?.dataset.category;
            const tag = e.target.closest('[data-tag]')?.dataset.tag;

            if (category) {
                e.preventDefault();
                const filtered = this.articles.filter(a => a.category === category);
                this.renderArticles(filtered);
                this.searchInput.value = ''; // 清空搜索框
            }

            if (tag) {
                e.preventDefault();
                const filtered = this.articles.filter(a => a.tags.includes(tag));
                this.renderArticles(filtered);
                this.searchInput.value = ''; // 清空搜索框
            }
        });
        
        // "首页" 链接重置所有筛选
        const homeLink = document.querySelector('.blog-nav-links a[href="#"]');
        homeLink?.addEventListener('click', (e) => {
           e.preventDefault();
           this.renderArticles(this.articles);
           this.searchInput.value = '';
           // 移除其他链接的 active 状态，并给自己加上
           document.querySelectorAll('.nav-link.active').forEach(l => l.classList.remove('active'));
           e.target.classList.add('active');
        });
    }
}

// 启动应用
new BlogApp();