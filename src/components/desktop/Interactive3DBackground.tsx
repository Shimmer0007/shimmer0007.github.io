// src/components/desktop/Interactive3DBackground.tsx
import { useEffect, useRef, useState, useMemo } from 'react';
import { useWindowsStore } from '../../store/windows';
import { useContentStore } from '../../store/content';
import { useT } from '../../i18n';
import './Interactive3DBackground.css';

interface Node3D {
  id: number;
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  phaseX: number;
  phaseY: number;
  phaseZ: number;
  speed: number;
  radius: number;
  colorType: 'purple' | 'gold';
}

interface FireworkParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number; // 1.0 -> 0.0
  color: string;
}

// 黄金比例，用于构建正二十面体 (Icosahedron)
const PHI = (1 + Math.sqrt(5)) / 2;
const ICOSAHEDRON_VERTICES = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]
].map(([x, y, z]) => {
  const len = Math.sqrt(x*x + y*y + z*z);
  return { x: (x/len) * 160, y: (y/len) * 160, z: (z/len) * 160 };
});

const ICOSAHEDRON_EDGES: [number, number][] = [];
for (let i = 0; i < ICOSAHEDRON_VERTICES.length; i++) {
  for (let j = i + 1; j < ICOSAHEDRON_VERTICES.length; j++) {
    const dx = ICOSAHEDRON_VERTICES[i].x - ICOSAHEDRON_VERTICES[j].x;
    const dy = ICOSAHEDRON_VERTICES[i].y - ICOSAHEDRON_VERTICES[j].y;
    const dz = ICOSAHEDRON_VERTICES[i].z - ICOSAHEDRON_VERTICES[j].z;
    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
    if (dist < 185) {
      ICOSAHEDRON_EDGES.push([i, j]);
    }
  }
}

export default function Interactive3DBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = useT();
  const openWindow = useWindowsStore(s => s.openWindow);
  
  // 从全局 Zustand 仓库中拉取动态文章集合
  const { posts, setActivePostId } = useContentStore();

  // 全息卡片状态
  const [hologram, setHologram] = useState<{
    x: number;
    y: number;
    text: string;
    type: string;
    title?: string;
    app?: string;
    postId?: string;
  } | null>(null);

  // 用 Ref 保持当前渲染投影粒子的 2D 屏幕位置，以便全局点击命中检测和鼠标 Hover 检测
  const projectedNodesRef = useRef<{ id: number; x: number; y: number; z: number; colorType: string; radius: number }[]>([]);
  const fireworksRef = useRef<FireworkParticle[]>([]);
  
  // 鼠标实时像素位置坐标
  const mouseRef = useRef({ x: -9999, y: -9999 });

  // ===== 动态生成引文与传送门数据库 =====
  const dynamicMemes = useMemo(() => {
    interface MemeItem {
      text: string;
      type: string;
      title?: string;
      app?: string;
      postId?: string;
    }
    // 基础系统内置句子与常设传送门
    const list: MemeItem[] = [
      { text: '“用 linear-gradient，让紫与金在夜空撞色呼吸。”', type: 'quote' },
      { text: '“ShimmerOS 核心终端已加载完毕。你可以双击图标拉开对应的系统窗口。”', type: 'quote' },
      { text: '“发现了一条系统传送门！可直接穿梭进入关于我角色面板：”', type: 'portal', title: '关于我 (Player Profile)', app: 'about' },
      { text: '“发现了一条系统传送门！可直接启动全局控制面板：”', type: 'portal', title: '系统控制面板 (Settings)', app: 'settings' }
    ];

    // 动态提取 Markdown 博文中的摘要作为金句，并注册传送门
    posts.forEach(post => {
      // 1. 如果有引言/摘要，将其作为引言金句加入
      if (post.data.summary) {
        list.push({
          text: `“${post.data.summary}”`,
          type: 'quote'
        });
      }

      // 2. 为每篇文章自动注册一个时空传送门，点击直达
      const isNote = post.data.category === 'note';
      list.push({
        text: isNote 
          ? `“发现了一条时空传送门！该课业笔记托管于外部，可点击直接跃迁：”`
          : `“发现了一条时空传送门！可直接穿梭进入对应博文使命中：”`,
        type: 'portal',
        title: isNote ? `📝 课业笔记: ${post.data.title}` : `📄 博文文章: ${post.data.title}`,
        app: 'writing',
        postId: post.id
      });
    });

    return list;
  }, [posts]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 1. 初始化 3D 浮动粒子 (50% 紫, 50% 金)
    const particleCount = Math.min(60, Math.floor((width * height) / 24000));
    const particles: Node3D[] = [];
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const dist = 140 + Math.random() * 260;

      const x = dist * Math.sin(phi) * Math.cos(theta);
      const y = dist * Math.sin(phi) * Math.sin(theta);
      const z = dist * Math.cos(phi);

      particles.push({
        id: i,
        x, y, z,
        baseX: x, baseY: y, baseZ: z,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        phaseZ: Math.random() * Math.PI * 2,
        speed: 0.15 + Math.random() * 0.3,
        radius: 1.2 + Math.random() * 2.2,
        colorType: i % 2 === 0 ? 'purple' : 'gold'
      });
    }

    // 2. 实时鼠标像素位置捕获 (用于 Hover 高亮)
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current.x = e.touches[0].clientX;
        mouseRef.current.y = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchstart', handleTouchMove, { passive: true });

    // 3. 背景空白处点击拦截与爆炸
    const handleBackgroundClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('.window') || 
        target.closest('.dock') || 
        target.closest('.desktop-icon') || 
        target.closest('.spotlight') ||
        target.closest('.hologram-card')
      ) {
        return;
      }

      const clickX = e.clientX;
      const clickY = e.clientY;

      // 检测距离 22px 以内是否命中星点
      let hitNode = null;
      let minDistance = 22;

      for (let i = 0; i < projectedNodesRef.current.length; i++) {
        const node = projectedNodesRef.current[i];
        const dx = node.x - clickX;
        const dy = node.y - clickY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < minDistance) {
          minDistance = dist;
          hitNode = node;
        }
      }

      if (hitNode) {
        // A. 触发 3D 烟花物理喷射
        const htmlStyle = getComputedStyle(document.documentElement);
        const purpleColor = htmlStyle.getPropertyValue('--color-purple').trim() || '#7c3aed';
        const goldColor = htmlStyle.getPropertyValue('--color-gold').trim() || '#f59e0b';
        const particleColor = hitNode.colorType === 'purple' ? purpleColor : goldColor;

        for (let k = 0; k < 16; k++) {
          const angle = Math.random() * Math.PI * 2;
          const speed3D = 3 + Math.random() * 4;
          fireworksRef.current.push({
            x: hitNode.x - width / 2,
            y: hitNode.y - height / 2,
            z: hitNode.z,
            vx: Math.cos(angle) * speed3D + (Math.random() - 0.5) * 2,
            vy: Math.sin(angle) * speed3D + (Math.random() - 0.5) * 2,
            vz: (Math.random() - 0.5) * 6,
            life: 1.0,
            color: particleColor
          });
        }

        // B. 从【动态数据库】随机抽取文案弹出卡片
        const items = dynamicMemes;
        if (items.length > 0) {
          const randomItem = items[Math.floor(Math.random() * items.length)];
          setHologram({
            x: clickX,
            y: clickY,
            text: randomItem.text,
            type: randomItem.type,
            title: randomItem.title,
            app: randomItem.app,
            postId: randomItem.postId
          });
        }
      } else {
        setHologram(null);
      }
    };

    window.addEventListener('click', handleBackgroundClick);

    let time = 0;
    const focalLength = 400;
    const cameraZ = 500;

    const render = () => {
      time += 0.003;

      const rotY = time * 0.35;
      const rotX = time * 0.15;

      ctx.clearRect(0, 0, width, height);

      const htmlStyle = getComputedStyle(document.documentElement);
      const purpleColor = htmlStyle.getPropertyValue('--color-purple').trim() || '#7c3aed';
      const goldColor = htmlStyle.getPropertyValue('--color-gold').trim() || '#f59e0b';
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';

      const rotate3D = (x: number, y: number, z: number) => {
        let cosY = Math.cos(rotY), sinY = Math.sin(rotY);
        let x1 = x * cosY - z * sinY;
        let z1 = x * sinY + z * cosY;

        let cosX = Math.cos(rotX), sinX = Math.sin(rotX);
        let y2 = y * cosX - z1 * sinX;
        let z2 = y * sinX + z1 * cosX;

        return { x: x1, y: y2, z: z2 };
      };

      const project = (x: number, y: number, z: number) => {
        const scale = focalLength / (z + cameraZ);
        return {
          x: width / 2 + x * scale,
          y: height / 2 + y * scale,
          scale
        };
      };

      const breathing = 1 + 0.08 * Math.sin(time * 3);

      // ===== 1. 二十面体 =====
      const projectedVertices = ICOSAHEDRON_VERTICES.map(v => {
        const rotated = rotate3D(v.x * breathing, v.y * breathing, v.z * breathing);
        return project(rotated.x, rotated.y, rotated.z);
      });

      ICOSAHEDRON_EDGES.forEach(([i, j]) => {
        const vi = projectedVertices[i];
        const vj = projectedVertices[j];
        ctx.strokeStyle = isLight ? 'rgba(217, 119, 6, 0.25)' : 'rgba(245, 158, 11, 0.16)';
        ctx.lineWidth = isLight ? 1.0 : 0.6;
        ctx.beginPath();
        ctx.moveTo(vi.x, vi.y);
        ctx.lineTo(vj.x, vj.y);
        ctx.stroke();
      });

      projectedVertices.forEach(v => {
        ctx.fillStyle = goldColor;
        ctx.beginPath();
        ctx.arc(v.x, v.y, 3 * v.scale, 0, Math.PI * 2);
        ctx.fill();
      });

      // ===== 2. 渲染星宿粒子 =====
      const currentProjectedNodes: any[] = [];
      
      // 检测鼠标 Hover：寻找距离鼠标 20px 以内的最邻近粒子
      let hoveredIdx = -1;
      let minMouseDist = 20;

      const projectedParticles = particles.map((p, idx) => {
        p.phaseX += 0.008 * p.speed;
        p.phaseY += 0.008 * p.speed;
        p.phaseZ += 0.008 * p.speed;

        const offsetX = Math.sin(p.phaseX) * 12;
        const offsetY = Math.cos(p.phaseY) * 12;
        const offsetZ = Math.sin(p.phaseZ) * 12;

        const rotated = rotate3D(p.baseX + offsetX, p.baseY + offsetY, p.baseZ + offsetZ);
        const projected = project(rotated.x, rotated.y, rotated.z);
        const radius = p.radius * projected.scale * 1.2;

        // 计算与鼠标的投影距离
        const mdx = projected.x - mouseRef.current.x;
        const mdy = projected.y - mouseRef.current.y;
        const mdist = Math.sqrt(mdx*mdx + mdy*mdy);
        if (mdist < minMouseDist) {
          minMouseDist = mdist;
          hoveredIdx = idx;
        }

        currentProjectedNodes.push({
          id: p.id,
          x: projected.x,
          y: projected.y,
          z: rotated.z,
          colorType: p.colorType,
          radius
        });

        return {
          ...projected,
          z: rotated.z,
          radius,
          colorType: p.colorType
        };
      });

      projectedNodesRef.current = currentProjectedNodes;

      // 动态修改鼠标光标手势
      if (hoveredIdx !== -1) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'default';
      }

      // 连线
      for (let i = 0; i < projectedParticles.length; i++) {
        for (let j = i + 1; j < projectedParticles.length; j++) {
          const pi = projectedParticles[i];
          const pj = projectedParticles[j];
          const dx = pi.x - pj.x;
          const dy = pi.y - pj.y;
          const dist = Math.sqrt(dx*dx + dy*dy);

          if (dist < 100) {
            const alpha = (1 - dist / 100) * (isLight ? 0.12 : 0.22);
            ctx.strokeStyle = isLight 
              ? `rgba(124, 58, 237, ${alpha * 0.5})` 
              : `rgba(255, 255, 255, ${alpha * 0.45})`;
            ctx.lineWidth = 0.45;
            ctx.beginPath();
            ctx.moveTo(pi.x, pi.y);
            ctx.lineTo(pj.x, pj.y);
            ctx.stroke();
          }
        }
      }

      // 绘制粒子 (如果处于 Hover 状态，加上锁定圆环高光)
      projectedParticles.forEach((p, idx) => {
        const c = p.colorType === 'purple' ? purpleColor : goldColor;
        const isHovered = idx === hoveredIdx;

        if (isHovered) {
          // Hover 状态：粒子放大 2.0 倍并高亮白色-强调色混合
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = isLight ? 0 : 16;
          ctx.shadowColor = c;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 2.0, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // 绘制科幻风格的 HUD 锁定圆环 (Concentric Glow Ring)
          ctx.strokeStyle = c;
          ctx.lineWidth = 1.0;
          ctx.setLineDash([4, 2]); // 虚线锁定环效果
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 3.8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]); // 还原实线
        } else {
          // 常规状态
          ctx.fillStyle = c;
          ctx.shadowBlur = isLight ? 0 : 5;
          ctx.shadowColor = c;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // ===== 3. 烟花物理颗粒 =====
      const activeFireworks: FireworkParticle[] = [];
      fireworksRef.current.forEach(f => {
        f.x += f.vx;
        f.y += f.vy;
        f.z += f.vz;
        f.vx *= 0.94;
        f.vy *= 0.94;
        f.vz *= 0.94;
        f.life -= 0.015;

        if (f.life > 0) {
          const proj = project(f.x, f.y, f.z);
          const rad = 2 * proj.scale * f.life;
          
          ctx.fillStyle = f.color;
          ctx.globalAlpha = f.life;
          ctx.shadowBlur = isLight ? 0 : 4;
          ctx.shadowColor = f.color;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, rad, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1.0;

          activeFireworks.push(f);
        }
      });
      fireworksRef.current = activeFireworks;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', handleBackgroundClick);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchstart', handleTouchMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [dynamicMemes]); // 每当动态文章列表更新，自动重组句子词库

  const handlePortalLaunch = (app: string, postId?: string) => {
    if (postId) {
      setActivePostId(postId);
    }
    openWindow(app, t(`app.${app}.title`));
    setHologram(null);
  };

  return (
    <>
      <canvas ref={canvasRef} className="interactive-3d-bg" aria-hidden />

      {/* 全息投影卡片 HTML 容器 */}
      {hologram && (
        <div 
          className="hologram-card animate-fade-in-up"
          style={{ 
            left: Math.min(hologram.x, window.innerWidth - 300), 
            top: Math.min(hologram.y, window.innerHeight - 240)
          }}
        >
          <div className="hologram-header">
            <span className="hologram-icon">📡</span>
            <span className="hologram-title">NEURAL_DECODER_v3.0</span>
          </div>
          <div className="hologram-body">
            <p className="hologram-text">{hologram.text}</p>
            {hologram.type === 'portal' && hologram.app && (
              <button 
                className="hologram-portal-btn"
                onClick={() => handlePortalLaunch(hologram.app!, hologram.postId)}
              >
                🌌 穿越传送门: {hologram.title}
              </button>
            )}
          </div>
          <button className="hologram-close-btn" onClick={() => setHologram(null)}>×</button>
        </div>
      )}
    </>
  );
}
