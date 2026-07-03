// src/components/apps/TravelApp.tsx
import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useOSStore } from '../../store/os';
import { useT } from '../../i18n';
import travelDataRaw from '../../data/travel.json';
import worldDataRaw from '../../data/world.json';
import './TravelApp.css';

interface TravelCity {
  name: string;
  value: [number, number]; // [lng, lat]
  visits: number;
  type: string;
  details: string;
}

// 核心大本营 (Hubs) 坐标
const HUB_VT: [number, number] = [-80.4139, 37.2296]; // 布莱克斯堡 (美国大本营)
const HUB_BJ: [number, number] = [116.4074, 39.9042]; // 北京 (中国大本营)

export default function TravelApp() {
  const t = useT();
  const theme = useOSStore(s => s.theme);
  const lang = useOSStore(s => s.lang);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [selectedCity, setSelectedCity] = useState<TravelCity | null>(null);
  const [hoveredCity, setHoveredCity] = useState<TravelCity | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // D3 Refs
  const d3Refs = useRef<{
    zoomBehavior?: d3.ZoomBehavior<SVGSVGElement, unknown>;
    svgGroup?: d3.Selection<SVGGElement, unknown, null, undefined>;
    projection?: d3.GeoProjection;
  }>({});

  // 1. 过滤和搜索城市列表
  const filteredCities = useMemo(() => {
    return (travelDataRaw as TravelCity[]).filter(c => {
      const matchFilter = activeFilter === 'all' || c.type.includes(activeFilter);
      const matchSearch = !searchQuery || c.name.includes(searchQuery) || c.details.includes(searchQuery);
      return matchFilter && matchSearch;
    });
  }, [searchQuery, activeFilter]);

  // 2. 统计概览
  const stats = useMemo(() => {
    const list = travelDataRaw as TravelCity[];
    const totalVisits = list.reduce((acc, c) => acc + c.visits, 0);
    const uniqueCountries = new Set(['中国', '美国', '加拿大', '阿联酋']).size;
    return {
      totalCities: list.length,
      totalVisits,
      uniqueCountries
    };
  }, []);

  // 3. 地图绘制主生命周期
  useEffect(() => {
    const container = containerRef.current;
    const svgEl = svgRef.current;
    if (!container || !svgEl) return;

    // 清空历史 SVG 元素
    d3.select(svgEl).selectAll('*').remove();

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 建立墨卡托投影，将比例尺拉大并定位中美两国中心
    const projection = d3.geoMercator()
      .scale(width / 5.8)
      .translate([width / 2.05, height / 1.48]);
    
    d3Refs.current.projection = projection;

    const pathGenerator = d3.geoPath().projection(projection);

    const svg = d3.select(svgEl)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`);

    // 画布缩放支持
    const g = svg.append('g').attr('class', 'map-group');
    d3Refs.current.svgGroup = g;

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8.0])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        const k = event.transform.k;
        
        // 动态逆向缩放点标记，保持绝对物理大小不随滚轮放大而膨胀 (Billboard Effect)
        g.selectAll('.city-marker-group')
          .attr('transform', (d: any) => `translate(${d.x}, ${d.y}) scale(${1 / k})`);
        
        g.selectAll('.travel-hub-node')
          .attr('transform', (d: any) => `translate(${d.x}, ${d.y}) scale(${1 / k})`);
      });
    svg.call(zoom);
    d3Refs.current.zoomBehavior = zoom;

    // A. 绘制经纬度雷达格网
    const graticule = d3.geoGraticule();
    g.append('path')
      .datum(graticule)
      .attr('class', 'travel-graticule')
      .attr('d', pathGenerator);

    // B. 绘制半透明全息陆地
    g.selectAll('path.land')
      .data((worldDataRaw as any).features)
      .join('path')
      .attr('class', 'travel-land')
      .attr('d', pathGenerator as any);

    // C. 绘制大本营枢纽节点 (VT 和 北京)
    const renderHub = (coords: [number, number], label: string) => {
      const pos = projection(coords);
      if (!pos) return;
      const hubG = g.append('g')
        .datum({ x: pos[0], y: pos[1] }) // 绑定地理投影坐标作为逆缩放锚点
        .attr('class', 'travel-hub-node')
        .attr('transform', `translate(${pos[0]}, ${pos[1]})`);
      hubG.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 4.5)
        .attr('fill', '#f59e0b');
      hubG.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 11)
        .attr('class', 'travel-hub-pulse')
        .attr('fill', 'none')
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 1.5);
    };

    renderHub(HUB_BJ, 'BEIJING');
    renderHub(HUB_VT, 'VIRGINIA TECH');

    // D. 绘制普通足迹打点
    const citiesGroup = g.append('g').attr('class', 'cities-markers');

    (travelDataRaw as TravelCity[]).forEach(city => {
      const pos = projection(city.value);
      if (!pos) return;

      const marker = citiesGroup.append('g')
        .datum({ x: pos[0], y: pos[1] }) // 绑定地理投影坐标作为逆缩放锚点
        .attr('class', 'city-marker-group')
        .attr('transform', `translate(${pos[0]}, ${pos[1]})`)
        .style('cursor', 'pointer')
        .on('click', (event) => {
          event.stopPropagation();
          handleSelectCity(city);
        })
        .on('mouseover', () => {
          setHoveredCity(city);
        })
        .on('mouseout', () => {
          setHoveredCity(null);
        });

      // 脉冲环 (居中局部原点)
      marker.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 8)
        .attr('class', 'city-pulse-ring');

      // 核心打点 (居中局部原点)
      marker.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 3.5)
        .attr('class', 'city-core-dot');
    });

  }, []);

  // 4. 选择城市后的视角缩放和飞线绘制
  const activeCity = hoveredCity || selectedCity;

  // 使用 D3.js 副作用渲染飞线，避免 React 渲染周期 DOM 查询引发白屏崩溃
  useEffect(() => {
    const g = d3Refs.current.svgGroup;
    const proj = d3Refs.current.projection;
    if (!g || !proj) return;

    // 清理之前的历史飞线
    g.selectAll('.travel-flight-lines').remove();

    if (!activeCity) return;

    const startCoords = activeCity.value[0] < -20 ? HUB_VT : HUB_BJ;
    const pStart = proj(startCoords);
    const pEnd = proj(activeCity.value);
    
    if (!pStart || !pEnd) return;

    const [x1, y1] = pStart;
    const [x2, y2] = pEnd;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 5) return; // 距离太近不画线

    const offset = len * 0.2; // 抛物弧度高度
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const cx = mx - dy * (offset / len);
    const cy = my + dx * (offset / len);

    const pathD = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;

    // 将飞线挂载在 D3 组的底部，使其自动平移和放大，且隐藏在城市打点之下
    const linesG = g.insert('g', ':first-child')
      .attr('class', 'travel-flight-lines')
      .style('pointer-events', 'none');

    // 飞线底轨
    linesG.append('path')
      .attr('d', pathD)
      .attr('class', 'travel-flight-track');

    // 飞线发光导轨
    linesG.append('path')
      .attr('d', pathD)
      .attr('class', 'travel-flight-glow');
  }, [activeCity]);

  // 触发选中城市动作（带平滑视角追踪）
  const handleSelectCity = (city: TravelCity) => {
    setSelectedCity(city);

    const proj = d3Refs.current.projection;
    const zoom = d3Refs.current.zoomBehavior;
    const svgEl = svgRef.current;
    
    if (!proj || !zoom || !svgEl || !city.value) return;

    const pos = proj(city.value);
    if (!pos) return;

    const width = svgEl.clientWidth || 600;
    const height = svgEl.clientHeight || 450;

    // 平滑聚焦至目标节点，放大 3 倍
    d3.select(svgEl)
      .transition()
      .duration(750)
      .call(
        zoom.transform,
        d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(3.5)
          .translate(-pos[0], -pos[1])
      );
  };

  // 重置视角
  const handleResetView = () => {
    setSelectedCity(null);
    const svgEl = svgRef.current;
    const zoom = d3Refs.current.zoomBehavior;
    if (!svgEl || !zoom) return;

    d3.select(svgEl)
      .transition()
      .duration(600)
      .call(zoom.transform, d3.zoomIdentity);
  };

  return (
    <div className="travel-app-container">
      {/* ===== 左栏: D3 雷达地图 ===== */}
      <div className="travel-map-pane" ref={containerRef}>
        <svg ref={svgRef} className="travel-svg-canvas" />

        {/* 覆盖控制面板 */}
        <div className="travel-map-controls">
          <button onClick={() => d3.select(svgRef.current!).transition().duration(300).call(d3Refs.current.zoomBehavior!.scaleBy, 1.3)} title="放大">+</button>
          <button onClick={() => d3.select(svgRef.current!).transition().duration(300).call(d3Refs.current.zoomBehavior!.scaleBy, 0.7)} title="缩小">-</button>
          <button onClick={handleResetView} title="重设">🏠</button>
        </div>
      </div>

      {/* ===== 右栏: 时光手札日志侧栏 ===== */}
      <aside className="travel-info-pane">
        {/* A. 时光简报 HUD */}
        <div className="travel-hud-stats">
          <div className="hud-stat-box">
            <span className="hud-stat-value">{stats.totalCities}</span>
            <span className="hud-stat-label">CITIES</span>
          </div>
          <div className="hud-stat-box">
            <span className="hud-stat-value">{stats.totalVisits}</span>
            <span className="hud-stat-label">VISITS</span>
          </div>
          <div className="hud-stat-box">
            <span className="hud-stat-value">{stats.uniqueCountries}</span>
            <span className="hud-stat-label">REGIONS</span>
          </div>
        </div>

        {/* B. 检索过滤区 */}
        <div className="travel-search-box">
          <input 
            type="text"
            placeholder={lang === 'zh' ? '搜索足迹城市...' : 'Search city logs...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="travel-filter-bar">
          {[
            { id: 'all', label: 'ALL' },
            { id: '旅行', label: lang === 'zh' ? '✈️ 旅行' : '✈️ TOUR' },
            { id: '读书', label: lang === 'zh' ? '🎓 读书' : '🎓 STUDY' },
            { id: '暂驻', label: lang === 'zh' ? '⛺ 暂驻' : '⛺ STAY' },
            { id: '途经', label: lang === 'zh' ? '🚗 途经' : '🚗 PASS' }
          ].map(f => (
            <button
              key={f.id}
              className={`travel-filter-btn ${activeFilter === f.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* C. 城市日志时光列表 */}
        <div className="travel-city-list">
          {filteredCities.map(city => (
            <div 
              key={city.name}
              className={`travel-city-item ${selectedCity?.name === city.name ? 'active' : ''}`}
              onClick={() => handleSelectCity(city)}
            >
              <div className="city-item-header">
                <span className="city-item-name">📍 {city.name}</span>
                <span className="city-item-visits">{city.visits} {lang === 'zh' ? '次' : 'runs'}</span>
              </div>
              <span className="city-item-badge" data-type={city.type}>{city.type}</span>
            </div>
          ))}
          {filteredCities.length === 0 && (
            <div className="travel-list-empty">无匹配的航点日志</div>
          )}
        </div>

        {/* D. 时光手札面板 */}
        <div className="travel-journal-console">
          <div className="console-header">
            <span className="console-dot"></span>
            <span className="console-title">TIMELINE_LOG</span>
          </div>
          <div className="console-body">
            {selectedCity ? (
              <div className="journal-content animate-typewriter">
                <p className="journal-meta">&gt; ACCESSING DATA: {selectedCity.name.toUpperCase()}</p>
                <p className="journal-type">&gt; MISSION TYPE: {selectedCity.type}</p>
                <p className="journal-visits">&gt; FREQUENCY: {selectedCity.visits} visits recorded.</p>
                <p className="journal-text">&gt; MEMO: {selectedCity.details}</p>
              </div>
            ) : (
              <div className="journal-placeholder">
                <span className="placeholder-radar-icon">📡</span>
                <p>&gt; WAITING FOR HUB LINK...</p>
                <p>&gt; CLICK A MARKER OR LIST ITEM TO ACCESS TIMELINE LOGS.</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
