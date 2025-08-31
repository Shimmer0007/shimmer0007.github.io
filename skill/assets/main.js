document.addEventListener('DOMContentLoaded', async function() {
    // --- 异步加载数据 ---
    let skillsData;
    try {
        const response = await fetch('data.json'); // 从相对路径加载 JSON 文件
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        skillsData = await response.json();
    } catch (error) {
        console.error("无法加载技能数据:", error);
        // 你可以在此处向用户显示错误消息
        return;
    }

    // --- 配置项 ---
    const CONFIG = {
        colors: { ds: 'var(--ds-color)', ef: 'var(--ef-color)', bm: 'var(--bm-color)', gs: 'var(--gs-color)', core: 'var(--core-color)' },
        radii: { core: 60, branch: 45, leaf: 35 },
        forces: { charge: -450, linkDistance: { core: 250, branch: 120, leaf: 70 }, radialStrength: 0.8 }
    };

    // --- 全局变量 ---
    const graphContainer = document.getElementById('skills-graph');
    const detailPanel = document.getElementById('detail-panel');
    const backdrop = document.getElementById('panel-backdrop');
    let width = graphContainer.clientWidth, height = graphContainer.clientHeight;
    let simulation, svg, g, link, node, zoom, initialTransform;
    let currentFilter = 'all';

    // --- 初始化流程 ---
    initGraph();
    initSimulation();
    drawElements();
    setupInteractions();
    initAnimations();

    // --- 1. 初始化SVG画布 ---
    function initGraph() {
        svg = d3.select('#skills-graph').append('svg').attr('width', '100%').attr('height', '100%');
        g = svg.append('g');
        // 为跨学科节点定义渐变色
        const defs = svg.append('defs');
        const tsGradient = defs.append('linearGradient').attr('id', 'grad-time-series').attr('gradientTransform', 'rotate(45)');
        tsGradient.append('stop').attr('offset', '0%').attr('stop-color', CONFIG.colors.ds);
        tsGradient.append('stop').attr('offset', '100%').attr('stop-color', CONFIG.colors.ef);
    }

    // --- 2. 初始化力导向模拟 ---
    function initSimulation() {
        simulation = d3.forceSimulation(skillsData.nodes)
            .force('link', d3.forceLink(skillsData.links).id(d => d.id)
                .distance(d => CONFIG.forces.linkDistance[d.source.type] || CONFIG.forces.linkDistance.leaf).strength(1))
            .force('charge', d3.forceManyBody().strength(CONFIG.forces.charge))
            .force('collision', d3.forceCollide().radius(d => getNodeRadius(d) + 10))
            .force('radial', d3.forceRadial(d => d.type === 'branch' ? CONFIG.forces.linkDistance.core : 0)
                .strength(d => d.type === 'branch' ? CONFIG.forces.radialStrength : 0))
            .force('center', d3.forceCenter(0, 0));
    }

    // --- 3. 绘制SVG元素 ---
    function drawElements() {
        link = g.append('g').selectAll('line').data(skillsData.links).enter()
            .append('line').attr('class', d => d.type === 'cross-discipline' ? 'link cross-discipline' : 'link');

        node = g.append('g').selectAll('g').data(skillsData.nodes).enter()
            .append('g').attr('class', d => `node node-${d.type} node-${d.category || 'core'}`);

        node.append('polygon').attr('class', 'node-shape')
            .attr('points', d => getHexagonPoints(getNodeRadius(d)))
            .attr('stroke', d => CONFIG.colors[d.category || 'core'])
            .attr('fill', d => d.id === 'time-series' ? 'url(#grad-time-series)' : CONFIG.colors[d.category || 'core']);

        const text = node.append('text').attr('class', 'node-text').attr('dy', '0.3em');
        text.each(function(d) { wrapText(d3.select(this), d.name, getNodeRadius(d) * 1.6); });

        simulation.on('tick', () => {
            link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
            node.attr('transform', d => `translate(${d.x}, ${d.y})`);
        });
    }
    
    // --- 4. 设置所有交互事件 ---
    function setupInteractions() {
        zoom = d3.zoom().scaleExtent([0.3, 5]).on('zoom', (event) => g.attr('transform', event.transform));
        updateViewBox(); 

        node.on('click', handleNodeClick)
            .on('dblclick', handleNodeDblClick)
            .on('mouseover', handleMouseOver)
            .on('mouseout', resetFocus);
        
        svg.on('click', () => { hideDetails(); resetFocus(); });
        
        node.call(d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended));

        setupControls();
        setupFilters();

        window.addEventListener('resize', debounce(handleResize, 200));
    }

    // --- 5. 入场动画 ---
    function initAnimations() {
        node.style('opacity', 0).attr('transform', 'scale(0.5)');
        node.transition().duration(800).delay((d, i) => i * 15)
            .style('opacity', 1).attr('transform', 'scale(1)');
    }

    // --- 事件处理函数 ---
    function handleNodeClick(event, d) { event.stopPropagation(); showDetails(d); focusOnNode(d); }
    function handleNodeDblClick(event, d) {
        event.stopPropagation(); d.fx = d.fx ? null : d.x; d.fy = d.fy ? null : d.y;
        d3.select(this).classed('is-pinned', !!d.fx);
        simulation.alpha(0.1).restart();
    }
    function handleMouseOver(event, d) {
        const connectedIds = new Set([d.id]);
        skillsData.links.forEach(l => { if (l.source.id === d.id) connectedIds.add(l.target.id); if (l.target.id === d.id) connectedIds.add(l.source.id); });
        node.style('opacity', n => (currentFilter !== 'all' && !isVisible(n, currentFilter)) ? 0.1 : (connectedIds.has(n.id) ? 1 : 0.2));
        link.style('stroke-opacity', l => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.1)
            .classed('is-highlighted', l => l.source.id === d.id || l.target.id === d.id)
            .style('stroke', l => { if (l.source.id === d.id || l.target.id === d.id) return CONFIG.colors[d.category || 'core']; return null; });
    }
    function dragstarted(event, d) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
    function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
    function dragended(event, d) { if (!event.active) simulation.alphaTarget(0); if (!d3.select(this).classed('is-pinned')) { d.fx = null; d.fy = null; } }

    // --- 核心功能函数 ---
    function showDetails(d) {
        if (!d.detail) { hideDetails(); return; }
        document.body.classList.add('panel-visible');
        backdrop.classList.add('visible');
        const categoryColorVar = CONFIG.colors[d.category || 'core'];
        detailPanel.style.color = categoryColorVar;
        
        let html = `<button class="close-btn" id="close-detail-btn">×</button><h2>${d.detail.title}</h2>`;
        const detailMap = { courses: '相关课程', projects: '项目经验', experience: '经历详情', achievements: '竞赛成果', certificates: '技能证书' };
        for(const [key, title] of Object.entries(detailMap)) {
            if(d.detail[key]) {
                html += `<div class="detail-item"><h3>${title}</h3><ul>`;
                const items = Array.isArray(d.detail[key]) ? d.detail[key] : [d.detail[key]];
                items.forEach(item => { html += `<li>${item}</li>`; });
                html += `</ul></div>`;
            }
        }
        html += `<div class="tag-container"><span class="tag" style="border-color: ${categoryColorVar}; color: ${categoryColorVar};">${getCategoryName(d.category)}</span>`;
        if(d.also) { html += `<span class="tag" style="border-color: ${CONFIG.colors[d.also]}; color: ${CONFIG.colors[d.also]};">${getCategoryName(d.also)}</span>`; }
        html += '</div>';

        detailPanel.innerHTML = html;
        detailPanel.classList.add('visible');
        document.getElementById('close-detail-btn').onclick = (e) => { e.stopPropagation(); hideDetails(); resetFocus(); };
    }
    function hideDetails() { detailPanel.classList.remove('visible'); backdrop.classList.remove('visible'); document.body.classList.remove('panel-visible'); }
    function focusOnNode(d) {
        node.classed('is-focused', n => n.id === d.id);
        const scale = 1.2, x = -d.x * scale, y = -d.y * scale;
        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity.translate(width/2 + x, height/2 + y).scale(scale));
    }
    function resetFocus() {
        node.classed('is-focused', false);
        filterNodes(currentFilter);
        link.style('stroke-opacity', null).style('stroke', null).classed('is-highlighted', false);
    }
    function filterNodes(category) {
        currentFilter = category;
        node.style('opacity', d => isVisible(d, category) ? 1 : 0.1)
            .style('pointer-events', d => isVisible(d, category) ? 'all' : 'none');
        link.style('stroke-opacity', l => (isVisible(l.source, category) && isVisible(l.target, category)) ? 1 : 0.05);
    }

    // --- 控件与筛选器设置 ---
    function setupControls() {
        document.getElementById('zoom-in').addEventListener('click', () => svg.transition().duration(500).call(zoom.scaleBy, 1.2));
        document.getElementById('zoom-out').addEventListener('click', () => svg.transition().duration(500).call(zoom.scaleBy, 0.8));
        document.getElementById('reset-view').addEventListener('click', () => svg.transition().duration(750).call(zoom.transform, initialTransform));
        document.getElementById('unpin-all').addEventListener('click', () => {
            skillsData.nodes.forEach(n => { n.fx = null; n.fy = null; });
            node.classed('is-pinned', false);
            simulation.alpha(0.3).restart();
        });
        backdrop.addEventListener('click', () => { hideDetails(); resetFocus(); });
    }
    function setupFilters() {
        document.querySelectorAll('.filter-btn').forEach(button => {
            button.addEventListener('click', function() {
                document.querySelector('.filter-btn.active').classList.remove('active');
                this.classList.add('active');
                filterNodes(this.dataset.category);
            });
        });
    }

    // --- 辅助与响应式函数 ---
    function updateViewBox() {
        width = graphContainer.clientWidth;
        height = graphContainer.clientHeight;
        const scale = Math.min(width, height) / 1000;
        svg.attr('viewBox', [-width / 2 / scale, -height / 2 / scale, width / scale, height / scale]);
        initialTransform = d3.zoomIdentity;
        svg.call(zoom).call(zoom.transform, initialTransform);
    }
    function handleResize() { updateViewBox(); simulation.alpha(0.1).restart(); }
    function getNodeRadius(d) { return CONFIG.radii[d.type] || CONFIG.radii.leaf; }
    function getCategoryName(c) { return {'ds':'数据科学','ef':'经济金融','bm':'商业管理','gs':'通用技能'}[c]||c; }
    function isVisible(d, category) {
        if (category === 'all' || d.type === 'core') return true;
        return d.category === category || d.also === category;
    }
    function getHexagonPoints(r) { return Array.from({length: 6}, (_, i) => [r * Math.cos(Math.PI/3*i+Math.PI/6), r * Math.sin(Math.PI/3*i+Math.PI/6)]).map(p=>p.join(',')).join(' '); }
    function debounce(func, wait) { let timeout; return function(...args) { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait); }; }
    function wrapText(textEl, text, width) {
        textEl.each(function() {
            let textNode = d3.select(this), words = text.replace(/-/g, '- ').split(/\s+/).reverse(), word, line = [],
                lineNum = 0, lineHeight = 1.1, y = textNode.attr("y"), dy = parseFloat(textNode.attr("dy")),
                tspan = textNode.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
            while (word = words.pop()) {
                line.push(word); tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop(); tspan.text(line.join(" ")); line = [word];
                    tspan = textNode.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNum*lineHeight+dy+"em").text(word);
                }
            }
            const tspans = textNode.selectAll('tspan');
            if (tspans.size() > 1) {
                const vOffset = -( (tspans.size() - 1) * lineHeight / 2 );
                tspans.attr('dy', (d, i) => (parseFloat(tspans.nodes()[0].getAttribute('dy')) + vOffset + i * lineHeight) + 'em');
            }
        });
    }
});