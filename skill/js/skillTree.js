/**
 * 技能树可视化组件
 */

import { loadFromLocalStorage, saveToLocalStorage, debounce, getNodePath } from './utils.js';

export class SkillTree {
    constructor(containerId, dataUrl) {
        this.containerId = containerId;
        this.dataUrl = dataUrl;
        this.data = null;
        this.simulation = null;
        this.zoom = null;
        this.svg = null;
        this.g = null;
        this.link = null;
        this.node = null;
        this.currentTransform = null;
        
        this.init();
    }
    
    async init() {
        await this.loadData();
        this.createSVG();
        this.createSimulation();
        this.setupEventListeners();
        this.loadViewPreference();
        this.animateNodes();
    }
    
    async loadData() {
        try {
            const response = await fetch(this.dataUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            this.data = await response.json();
            
            // 合并本地评估数据
            const assessments = loadFromLocalStorage('skillAssessments', {});
            this.data.nodes.forEach(node => {
                if (assessments[node.id]) {
                    node.level = assessments[node.id];
                }
            });
        } catch (error) {
            console.error('Error loading skill data:', error);
            this.data = {
                nodes: [{ id: 'error', name: '加载数据失败', type: 'root' }],
                links: []
            };
        }
    }
    
    createSVG() {
        const container = document.querySelector(`#${this.containerId}`);
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        // 清除之前的SVG
        d3.select(`#${this.containerId}`).selectAll('*').remove();
        
        // 创建SVG
        this.svg = d3.select(`#${this.containerId}`)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [0, 0, width, height]);
        
        // 添加缩放行为
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 8])
            .on('zoom', (event) => this.zoomed(event));
        
        this.svg.call(this.zoom);
        
        // 创建组用于所有元素
        this.g = this.svg.append('g');
        
        // 创建连接线
        this.link = this.g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(this.data.links)
            .enter().append('line')
            .attr('class', 'link')
            .attr('stroke-width', 2);
        
        // 创建节点
        this.node = this.g.append('g')
            .attr('class', 'nodes')
            .selectAll('.node')
            .data(this.data.nodes)
            .enter().append('g')
            .attr('class', d => `node node-${d.id} node-${d.type} ${d.level ? d.level : ''}`)
            .call(d3.drag()
                .on('start', (event, d) => this.dragstarted(event, d))
                .on('drag', (event, d) => this.dragged(event, d))
                .on('end', (event, d) => this.dragended(event, d)))
            .on('click', (event, d) => this.nodeClicked(event, d));
        
        // 添加圆形到节点
        this.node.append('circle')
            .attr('r', d => {
                if (d.type === 'root') return 30;
                if (d.type === 'category') return 24;
                return 20;
            })
            .attr('stroke-width', 2);
        
        // 添加图标到节点
        this.node.each(function(d) {
            const nodeGroup = d3.select(this);
            
            if (d.type === 'root') {
                nodeGroup.append('use')
                    .attr('xlink:href', '#icon-root')
                    .attr('x', -12)
                    .attr('y', -12)
                    .attr('width', 24)
                    .attr('height', 24);
            } else if (d.type === 'category') {
                nodeGroup.append('use')
                    .attr('xlink:href', '#icon-category')
                    .attr('x', -10)
                    .attr('y', -10)
                    .attr('width', 20)
                    .attr('height', 20);
            } else if (d.level === 'locked') {
                nodeGroup.append('use')
                    .attr('xlink:href', '#icon-locked')
                    .attr('x', -8)
                    .attr('y', -8)
                    .attr('width', 16)
                    .attr('height', 16)
                    .attr('fill', '#999');
            } else {
                nodeGroup.append('use')
                    .attr('xlink:href', '#icon-skill')
                    .attr('x', -8)
                    .attr('y', -8)
                    .attr('width', 16)
                    .attr('height', 16)
                    .attr('fill', () => {
                        switch(d.level) {
                            case 'beginner': return '#8bc34a';
                            case 'intermediate': return '#ffc107';
                            case 'advanced': return '#ff9800';
                            case 'master': return '#f44336';
                            default: return '#4a6fa5';
                        }
                    });
                
                // 为技能节点添加进度环
                if (d.level && d.level !== 'locked') {
                    const radius = 20;
                    const circumference = 2 * Math.PI * radius;
                    const progress = {
                        beginner: 0.25,
                        intermediate: 0.5,
                        advanced: 0.75,
                        master: 1
                    }[d.level] || 0;
                    
                    nodeGroup.append('circle')
                        .attr('class', 'progress-ring')
                        .attr('r', radius + 4)
                        .attr('stroke', () => {
                            switch(d.level) {
                                case 'beginner': return '#8bc34a';
                                case 'intermediate': return '#ffc107';
                                case 'advanced': return '#ff9800';
                                case 'master': return '#f44336';
                                default: return '#4a6fa5';
                            }
                        })
                        .attr('stroke-width', 3)
                        .attr('stroke-dasharray', circumference)
                        .attr('stroke-dashoffset', circumference * (1 - progress))
                        .attr('fill', 'none');
                }
            }
        });
        
        // 添加文本标签
        this.node.append('text')
            .attr('dy', d => d.type === 'root' ? 40 : d.type === 'category' ? 32 : 28)
            .text(d => d.name)
            .attr('class', 'node-label');
    }
    
    createSimulation() {
        const width = document.querySelector(`#${this.containerId}`).clientWidth;
        const height = document.querySelector(`#${this.containerId}`).clientHeight;
        
        this.simulation = d3.forceSimulation(this.data.nodes)
            .force('link', d3.forceLink(this.data.links).id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-500))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('x', d3.forceX(width / 2).strength(0.05))
            .force('y', d3.forceY(height / 2).strength(0.05))
            .on('tick', () => this.ticked());
        
        // 初始布局调整
        setTimeout(() => {
            const bounds = this.g.node().getBBox();
            const fullWidth = bounds.width + 100;
            const fullHeight = bounds.height + 100;
            const midX = bounds.x + bounds.width / 2;
            const midY = bounds.y + bounds.height / 2;
            
            const scale = 0.9 / Math.max(fullWidth / width, fullHeight / height);
            const translate = [width / 2 - scale * midX, height / 2 - scale * midY];
            
            this.svg.call(this.zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
        }, 100);
    }
    
    setupEventListeners() {
        // 节点悬停效果
        this.node.on('mouseover', (event, d) => {
            // 高亮相关连接线
            this.link.attr('stroke', l => (l.source === d || l.target === d) ? '#4fc3f7' : '#ccc')
                .attr('stroke-width', l => (l.source === d || l.target === d) ? 3 : 2);
            
            // 高亮相关节点
            this.node.classed('node-highlighted', n => {
                return n === d || this.data.links.some(l => 
                    (l.source === d && l.target === n) || 
                    (l.source === n && l.target === d)
                );
            });
        })
        .on('mouseout', () => {
            this.link.attr('stroke', '#ccc')
                .attr('stroke-width', 2);
            
            this.node.classed('node-highlighted', false);
        });
        
        // 窗口大小调整
        window.addEventListener('resize', debounce(() => this.handleResize(), 200));
    }
    
    animateNodes() {
        gsap.from(this.node.nodes(), {
            duration: 1,
            opacity: 0,
            y: 20,
            stagger: 0.05,
            ease: "power2.out"
        });
        
        gsap.from(this.link.nodes(), {
            duration: 1.5,
            strokeDashoffset: function() {
                return this.getTotalLength();
            },
            strokeDasharray: function() {
                return this.getTotalLength();
            },
            ease: "power2.inOut"
        });
    }
    
    // 事件处理函数
    ticked() {
        this.link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        this.node
            .attr('transform', d => `translate(${d.x},${d.y})`);
    }
    
    zoomed(event) {
        this.currentTransform = event.transform;
        this.g.attr('transform', event.transform);
        this.saveViewPreference();
    }
    
    dragstarted(event, d) {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    dragended(event, d) {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
    
    nodeClicked(event, d) {
        // 中心化点击的节点
        if (d.type !== 'locked') {
            const transform = d3.zoomTransform(this.svg.node());
            const width = this.svg.node().clientWidth;
            const height = this.svg.node().clientHeight;
            const x = -d.x * transform.k + width / 2;
            const y = -d.y * transform.k + height / 2;
            
            this.svg.transition()
                .duration(750)
                .call(this.zoom.transform, d3.zoomIdentity.translate(x, y).scale(transform.k));
        }
        
        // 触发自定义事件以更新详情面板
        document.dispatchEvent(new CustomEvent('nodeSelected', { detail: d }));
        
        // 显示节点路径
        this.revealNodePath(d);
    }
    
    revealNodePath(node) {
        const path = getNodePath(node, this.data);
        
        path.forEach((n, i) => {
            gsap.to(this.svg.select(`.node-${n.id}`).node(), {
                duration: 0.5,
                delay: i * 0.1,
                scale: 1.2,
                yoyo: true,
                repeat: 1
            });
        });
    }
    
    // 视图管理
    zoomIn() {
        this.svg.transition()
            .call(this.zoom.scaleBy, 1.2);
    }
    
    zoomOut() {
        this.svg.transition()
            .call(this.zoom.scaleBy, 0.8);
    }
    
    resetView() {
        const width = this.svg.node().clientWidth;
        const height = this.svg.node().clientHeight;
        
        this.svg.transition()
            .duration(750)
            .call(this.zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));
    }
    
    saveViewPreference() {
        if (this.currentTransform) {
            saveToLocalStorage('skillTreeView', {
                x: this.currentTransform.x,
                y: this.currentTransform.y,
                k: this.currentTransform.k
            });
        }
    }
    
    loadViewPreference() {
        const saved = loadFromLocalStorage('skillTreeView');
        if (saved) {
            this.svg.call(this.zoom.transform, 
                d3.zoomIdentity.translate(saved.x, saved.y).scale(saved.k));
        }
    }
    
    handleResize() {
        const width = document.querySelector(`#${this.containerId}`).clientWidth;
        const height = document.querySelector(`#${this.containerId}`).clientHeight;
        
        this.svg.attr('width', width).attr('height', height);
        this.simulation.force('center', d3.forceCenter(width / 2, height / 2));
        this.simulation.alpha(0.3).restart();
    }
    
    filterNodes(searchTerm) {
        if (!searchTerm) {
            this.node.classed('node-hidden', false)
                .classed('node-highlighted', false);
            return;
        }
        
        this.node.each((d, i, nodes) => {
            const nodeElement = d3.select(nodes[i]);
            const nameMatch = d.name.toLowerCase().includes(searchTerm);
            const descMatch = d.details && d.details.description && 
                             d.details.description.toLowerCase().includes(searchTerm);
            const courseMatch = d.details && d.details.courses && 
                              d.details.courses.some(c => c.name.toLowerCase().includes(searchTerm));
            
            const isMatch = nameMatch || descMatch || courseMatch;
            
            nodeElement.classed('node-hidden', !isMatch)
                      .classed('node-highlighted', isMatch);
            
            // 自动展开匹配节点的路径
            if (isMatch) {
                this.revealNodePath(d);
            }
        });
    }
    
    updateNodeAssessment(nodeId, level) {
        const node = this.data.nodes.find(n => n.id === nodeId);
        if (node) {
            node.level = level;
            
            // 更新节点视觉
            const nodeElement = this.svg.select(`.node-${nodeId}`);
            
            // 更新颜色
            nodeElement.select('circle')
                .attr('stroke', () => {
                    switch(level) {
                        case 'beginner': return '#8bc34a';
                        case 'intermediate': return '#ffc107';
                        case 'advanced': return '#ff9800';
                        case 'master': return '#f44336';
                        default: return '#4a6fa5';
                    }
                });
            
            // 更新进度环
            if (level !== 'locked') {
                const radius = 20;
                const circumference = 2 * Math.PI * radius;
                const progress = {
                    beginner: 0.25,
                    intermediate: 0.5,
                    advanced: 0.75,
                    master: 1
                }[level] || 0;
                
                nodeElement.select('.progress-ring')
                    .attr('stroke-dashoffset', circumference * (1 - progress));
            }
            
            // 更新类名
            nodeElement.classed('beginner', level === 'beginner')
                      .classed('intermediate', level === 'intermediate')
                      .classed('advanced', level === 'advanced')
                      .classed('master', level === 'master');
        }
    }
}