class ErrorPage {
    constructor() {
        this.canvas = document.getElementById('error-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.exploreBtn = document.getElementById('explore-btn');
        this.init();
    }

    init() {
        this.setupCanvas();
        this.createParticles();
        this.animate();
        this.setupEventListeners();
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }

    createParticles() {
        const particleCount = Math.floor(window.innerWidth / 10);
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                color: `hsla(${Math.random() * 60 + 200}, 70%, 60%, ${Math.random() * 0.3 + 0.1})`
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 更新位置
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            // 边界检查
            if (particle.x < 0 || particle.x > this.canvas.width) {
                particle.speedX = -particle.speedX;
            }
            if (particle.y < 0 || particle.y > this.canvas.height) {
                particle.speedY = -particle.speedY;
            }
        });
        
        requestAnimationFrame(() => this.animate());
    }

    setupEventListeners() {
        this.exploreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.simulateLoading();
        });
    }

    simulateLoading() {
        const terminal = document.querySelector('.error-terminal');
        terminal.innerHTML = `
            <div class="terminal-header">ShimmerCMD [Exploration Protocol]</div>
            <div class="terminal-body">
                <p>> <span class="command">initiate random_exploration</span></p>
                <p><span class="success">Scanning knowledge base...</span></p>
            </div>
        `;
        
        setTimeout(() => {
            const popularArticles = [
                'textmining', 'usergrowth', 'shimmeros-dev'
            ];
            const randomArticle = popularArticles[
                Math.floor(Math.random() * popularArticles.length)
            ];
            window.location.href = `article.html?id=${randomArticle}`;
        }, 2000);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new ErrorPage();
    
    // 继承父窗口主题 (当作为iframe时)
    if (window !== window.top) {
        const parentTheme = window.parent.document.documentElement.dataset.theme;
        document.documentElement.dataset.theme = parentTheme || 'dark';
    }
});