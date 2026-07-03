// src/components/apps/SkillsApp.tsx
import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useWindow } from '../window/Window';
import { useWindowsStore } from '../../store/windows';
import { useContentStore } from '../../store/content';
import { useT } from '../../i18n';
import skillsDataRaw from '../../data/skills.json';
import './SkillsApp.css';

interface SkillNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'core' | 'branch' | 'leaf';
  category?: 'ds' | 'ef' | 'bm' | 'gs';
  also?: string;
  detail?: {
    title: string;
    courses?: string[];
    projects?: string;
    experience?: string;
    achievements?: string[];
    certificates?: string[];
  };
}

interface SkillLink extends d3.SimulationLinkDatum<SkillNode> {
  type?: string;
}

export default function SkillsApp() {
  const t = useT();
  const { winId } = useWindow();
  const openWindow = useWindowsStore(s => s.openWindow);
  
  // 联动总线
  const { setActiveTag } = useContentStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // 选中的节点，用于侧边栏渲染
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  // 当前筛选分类 (all, ds, ef, bm, gs)
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // 复制一份数据供 D3 变异计算
  const graphData = useMemo(() => {
    const nodes: SkillNode[] = JSON.parse(JSON.stringify(skillsDataRaw.nodes));
    const links: SkillLink[] = JSON.parse(JSON.stringify(skillsDataRaw.links));
    return { nodes, links };
  }, []);

  const d3Refs = useRef<{
    simulation?: d3.Simulation<SkillNode, SkillLink>;
    zoomBehavior?: d3.ZoomBehavior<SVGSVGElement, unknown>;
    svgGroup?: d3.Selection<SVGGElement, unknown, null, undefined>;
    nodeSelection?: d3.Selection<SVGGElement, SkillNode, SVGGElement, unknown>;
    linkSelection?: d3.Selection<SVGLineElement, SkillLink, SVGGElement, unknown>;
  }>({});

  useEffect(() => {
    const container = containerRef.current;
    const svgEl = svgRef.current;
    if (!container || !svgEl) return;

    // 清空历史 SVG 元素
    d3.select(svgEl).selectAll('*').remove();

    const width = container.clientWidth || 550;
    const height = container.clientHeight || 450;

    const svg = d3.select(svgEl)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`);

    // 画布缩放支持
    const g = svg.append('g').attr('class', 'graph-group');
    d3Refs.current.svgGroup = g;

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 2.5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);
    d3Refs.current.zoomBehavior = zoom;

    // 适配发光发热滤镜 (Shadow Glow for SVG)
    const defs = svg.append('defs');
    const categories = ['ds', 'ef', 'bm', 'gs', 'core'];
    const colors: Record<string, string> = {
      ds: '#00b8d4', // 数据科学
      ef: '#10b981', // 经济金融
      bm: '#f59e0b', // 商业管理
      gs: '#7c3aed', // 通用技能
      core: '#ede9fe' // 核心点
    };

    categories.forEach(cat => {
      const filter = defs.append('filter')
        .attr('id', `glow-${cat}`)
        .attr('x', '-20%')
        .attr('y', '-20%')
        .attr('width', '140%')
        .attr('height', '140%');
      filter.append('feGaussianBlur')
        .attr('stdDeviation', '4')
        .attr('result', 'blur');
      filter.append('feMerge').selectAll('feMergeNode')
        .data(['blur', 'SourceGraphic'])
        .enter().append('feMergeNode')
        .attr('in', d => d);
    });

    // 建立力学仿真
    const simulation = d3.forceSimulation<SkillNode>(graphData.nodes)
      .force('link', d3.forceLink<SkillNode, SkillLink>(graphData.links)
        .id(d => d.id)
        .distance(d => {
          // 连线间距分配
          if (d.source.type === 'core' || d.target.type === 'core') return 130;
          return 75;
        })
        .strength(1.0)
      )
      .force('charge', d3.forceManyBody().strength(-150)) // 斥力
      .force('center', d3.forceCenter(width / 2, height / 2)) // 中心力
      .force('collision', d3.forceCollide().radius(28)); // 防重叠

    d3Refs.current.simulation = simulation;

    // 2. 绘制棱线 (Links)
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll<SVGLineElement, SkillLink>('line')
      .data(graphData.links)
      .enter().append('line')
      .attr('class', d => d.type === 'cross-discipline' ? 'link link--cross' : 'link')
      .attr('stroke', '#30363d')
      .attr('stroke-width', d => d.type === 'cross-discipline' ? 1.0 : 1.5);
    d3Refs.current.linkSelection = link;

    // 3. 绘制节点组 (Nodes)
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll<SVGGElement, SkillNode>('g')
      .data(graphData.nodes)
      .enter().append('g')
      .attr('class', d => `node-group node--${d.type} node-cat--${d.category || 'core'}`)
      .call(d3.drag<SVGGElement, SkillNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );
    d3Refs.current.nodeSelection = node;

    // 节点背景圆圈
    node.append('circle')
      .attr('r', d => {
        if (d.type === 'core') return 24;
        if (d.type === 'branch') return 16;
        return 9;
      })
      .attr('fill', d => {
        if (d.type === 'core') return colors.core;
        return colors[d.category || 'core'];
      })
      .style('filter', d => `url(#glow-${d.category || 'core'})`);

    // 节点文字标签
    node.append('text')
      .attr('dy', d => d.type === 'leaf' ? 16 : 4)
      .attr('text-anchor', 'middle')
      .text(d => d.name)
      .attr('fill', '#ede9fe')
      .style('font-size', d => {
        if (d.type === 'core') return '0.75rem';
        if (d.type === 'branch') return '0.7rem';
        return '0.62rem';
      })
      .style('font-weight', d => d.type === 'leaf' ? '400' : '700')
      .style('pointer-events', 'none');

    // 4. 事件绑定
    node.on('click', (event, d) => {
      event.stopPropagation();
      setSelectedNode(d);
      
      // 聚焦平移放大动画
      const scale = 1.3;
      const x = -d.x! * scale + width / 2;
      const y = -d.y! * scale + height / 2;
      svg.transition().duration(600).call(
        zoom.transform,
        d3.zoomIdentity.translate(x, y).scale(scale)
      );
    });

    // 悬停高亮相连节点
    node.on('mouseover', (event, d) => {
      const connectedIds = new Set<string>([d.id]);
      graphData.links.forEach(l => {
        const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
        const targetId = typeof l.target === 'object' ? l.target.id : l.target;
        if (sourceId === d.id) connectedIds.add(targetId as string);
        if (targetId === d.id) connectedIds.add(sourceId as string);
      });

      node.style('opacity', n => connectedIds.has(n.id) ? 1.0 : 0.15);
      link
        .style('stroke-opacity', l => {
          const sId = typeof l.source === 'object' ? l.source.id : l.source;
          const tId = typeof l.target === 'object' ? l.target.id : l.target;
          return (sId === d.id || tId === d.id) ? 1.0 : 0.05;
        })
        .style('stroke', l => {
          const sId = typeof l.source === 'object' ? l.source.id : l.source;
          const tId = typeof l.target === 'object' ? l.target.id : l.target;
          return (sId === d.id || tId === d.id) ? colors[d.category || 'core'] : '#30363d';
        });
    });

    node.on('mouseout', () => {
      // 恢复常规不透明度
      resetHighlight();
    });

    // 点击 SVG 空白重置聚焦
    svg.on('click', () => {
      setSelectedNode(null);
      resetHighlight();
      svg.transition().duration(650).call(
        zoom.transform,
        d3.zoomIdentity.translate(0, 0).scale(1)
      );
    });

    function resetHighlight() {
      node.style('opacity', n => isFiltered(n, activeFilter) ? 1.0 : 0.15);
      link
        .style('stroke-opacity', l => (isFiltered(l.source as SkillNode, activeFilter) && isFiltered(l.target as SkillNode, activeFilter)) ? 0.6 : 0.05)
        .style('stroke', '#30363d');
    }

    // 更新力学学步
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as SkillNode).x!)
        .attr('y1', d => (d.source as SkillNode).y!)
        .attr('x2', d => (d.target as SkillNode).x!)
        .attr('y2', d => (d.target as SkillNode).y!);

      node.attr('transform', d => `translate(${d.x!}, ${d.y!})`);
    });

    // D3 拖拽动作逻辑
    function dragstarted(event: d3.D3DragEvent<SVGGElement, SkillNode, SkillNode>, d: SkillNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event: d3.D3DragEvent<SVGGElement, SkillNode, SkillNode>, d: SkillNode) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event: d3.D3DragEvent<SVGGElement, SkillNode, SkillNode>, d: SkillNode) {
      if (!event.active) simulation.alphaTarget(0);
      // 如果没有按特定键，释放固定拖拽
      d.fx = null;
      d.fy = null;
    }

    // 初始缩放至中心
    svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(0.95));

    return () => {
      simulation.stop();
    };
  }, [graphData]);

  // 5. 分类筛选响应式过滤
  useEffect(() => {
    const { nodeSelection, linkSelection } = d3Refs.current;
    if (!nodeSelection || !linkSelection) return;

    nodeSelection.transition().duration(250)
      .style('opacity', n => isFiltered(n, activeFilter) ? 1.0 : 0.15)
      .style('pointer-events', n => isFiltered(n, activeFilter) ? 'all' : 'none');

    linkSelection.transition().duration(250)
      .style('stroke-opacity', l => {
        const s = l.source as SkillNode;
        const t = l.target as SkillNode;
        return (isFiltered(s, activeFilter) && isFiltered(t, activeFilter)) ? 0.6 : 0.05;
      });
  }, [activeFilter]);

  function isFiltered(n: SkillNode, filter: string) {
    if (filter === 'all') return true;
    if (n.type === 'core') return true;
    return n.category === filter || n.also === filter;
  }

  // 重置视角快捷键
  const handleResetView = () => {
    const svgEl = svgRef.current;
    const zoom = d3Refs.current.zoomBehavior;
    if (!svgEl || !zoom) return;
    d3.select(svgEl).transition().duration(600).call(
      zoom.transform,
      d3.zoomIdentity.translate(0, 0).scale(0.95)
    );
    setSelectedNode(null);
  };

  // 联动穿梭：寻找博客中相关的文章
  const handleSearchArticles = (skillName: string) => {
    // 设定检索 Tag 信号
    setActiveTag(skillName);
    // 唤起微光博客窗口
    openWindow('writing', t('app.writing.title'));
  };

  const getCategoryName = (cat?: string) => {
    switch(cat) {
      case 'ds': return '💻 数据科学';
      case 'ef': return '📈 经济金融';
      case 'bm': return '💼 商业管理';
      case 'gs': return '🧰 通用技能';
      default: return '🌌 核心领域';
    }
  };

  return (
    <div className="skills-container" ref={containerRef}>
      {/* ===== A. 左侧拓扑网络图 ===== */}
      <div className="skills-graph-area">
        {/* 顶部分类选择 */}
        <div className="skills-filters">
          {[
            { id: 'all', label: 'ALL' },
            { id: 'ds', label: '💻 DATA' },
            { id: 'ef', label: '📈 ECON' },
            { id: 'bm', label: '💼 MGMT' },
            { id: 'gs', label: '🧰 GEN' }
          ].map(f => (
            <button
              key={f.id}
              className={`skills-filter-btn ${activeFilter === f.id ? 'skills-filter-btn--active' : ''}`}
              onClick={() => setActiveFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 拓扑图 SVG */}
        <svg ref={svgRef} className="skills-svg-canvas" />

        {/* 覆盖控制面板 */}
        <div className="skills-controls">
          <button onClick={() => d3.select(svgRef.current!).transition().duration(400).call(d3Refs.current.zoomBehavior!.scaleBy, 1.2)} title="放大">+</button>
          <button onClick={() => d3.select(svgRef.current!).transition().duration(400).call(d3Refs.current.zoomBehavior!.scaleBy, 0.8)} title="缩小">-</button>
          <button onClick={handleResetView} title="重设">🏠</button>
        </div>
      </div>

      {/* ===== B. 右侧属性雷达详情栏 ===== */}
      <aside className={`skills-detail-sidebar ${selectedNode ? 'visible' : ''}`}>
        {selectedNode ? (
          <div className="skills-detail-content">
            <button className="skills-detail-close" onClick={() => setSelectedNode(null)}>×</button>
            <span className="skills-detail-badge" data-cat={selectedNode.category}>
              {getCategoryName(selectedNode.category)}
            </span>
            <h2 className="skills-detail-title">
              {selectedNode.detail?.title || selectedNode.name}
            </h2>
            
            <div className="skills-detail-body">
              {/* 经历描述 / 默认说明 */}
              {selectedNode.detail?.experience ? (
                <div className="skills-detail-sec">
                  <h3>经历概览</h3>
                  <p>{selectedNode.detail.experience}</p>
                </div>
              ) : selectedNode.type !== 'core' ? (
                <div className="skills-detail-sec">
                  <h3>技能说明</h3>
                  <p>已掌握【{selectedNode.name}】相关知识体系，并应用于课程学习或个人项目实践中。</p>
                </div>
              ) : (
                <div className="skills-detail-sec">
                  <h3>核心画像</h3>
                  <p>Shimmer 个人智识与专业技能图谱。点击外围分枝节点可查看详细修读情况与项目实战。</p>
                </div>
              )}

              {/* 相关课程 */}
              {selectedNode.detail?.courses && (
                <div className="skills-detail-sec">
                  <h3>修读课程</h3>
                  <ul>
                    {selectedNode.detail.courses.map(c => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 项目经验 */}
              {selectedNode.detail?.projects && (
                <div className="skills-detail-sec">
                  <h3>实战项目</h3>
                  <p className="skills-detail-project">{selectedNode.detail.projects}</p>
                </div>
              )}

              {/* 证书与奖项 */}
              {selectedNode.detail?.achievements && (
                <div className="skills-detail-sec">
                  <h3>通关成就</h3>
                  <ul>
                    {selectedNode.detail.achievements.map(a => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 核心联动按钮 */}
            {selectedNode.type !== 'core' && (
              <button 
                className="skills-portal-launch-btn"
                onClick={() => handleSearchArticles(selectedNode.name)}
              >
                🔍 检索博客中关于【{selectedNode.name}】的引文
              </button>
            )}
          </div>
        ) : (
          <div className="skills-sidebar-empty">
            <span className="skills-empty-icon">📡</span>
            <p>请点击拓扑图中的任意技能节点查看详细能力属性板</p>
          </div>
        )}
      </aside>
    </div>
  );
}
