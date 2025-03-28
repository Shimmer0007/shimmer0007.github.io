/**
 * 主应用逻辑
 */

import { SkillTree } from './skillTree.js';
import { loadFromLocalStorage, saveToLocalStorage, debounce } from './utils.js';

// 初始化应用
document.addEventListener('DOMContentLoaded', async function() {
    // 创建技能树实例
    const skillTree = new SkillTree('skill-tree', 'data/skills.json');
    window.skillTree = skillTree; // 挂载到window以便调试
    
    // 设置控制按钮事件
    document.getElementById('zoom-in').addEventListener('click', () => skillTree.zoomIn());
    document.getElementById('zoom-out').addEventListener('click', () => skillTree.zoomOut());
    document.getElementById('reset-view').addEventListener('click', () => skillTree.resetView());
    
    // 设置搜索框事件
    document.querySelector('.search-box input').addEventListener('input', (e) => {
        skillTree.filterNodes(e.target.value.toLowerCase());
    });
    
    // 监听节点选择事件
    document.addEventListener('nodeSelected', (e) => {
        updateDetailPanel(e.detail);
    });
    
    // 监听评估按钮点击
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('rating-btn')) {
            const level = e.target.dataset.level;
            const nodeId = document.querySelector('.detail-panel').dataset.nodeId;
            
            if (nodeId) {
                // 更新技能树
                skillTree.updateNodeAssessment(nodeId, level);
                
                // 保存评估
                saveAssessment(nodeId, level);
                
                // 更新详情面板中的活动按钮状态
                updateActiveRatingButton(nodeId, level);
            }
        }
    });
});

// 更新详情面板
function updateDetailPanel(node) {
    const panel = document.querySelector('.detail-panel');
    panel.dataset.nodeId = node.id;
    
    if (!node.details) {
        panel.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" class="empty-icon">
                    <path fill="#999" d="M12,2L4,5V11.09C4,16.14 7.41,20.85 12,22C16.59,20.85 20,16.14 20,11.09V5L12,2M12,4.15L18,6.54V11.09C18,15.09 15.45,18.79 12,20C8.55,18.79 6,15.1 6,11.09V6.54L12,4.15M12,7A3,3 0 0,0 9,10A3,3 0 0,0 12,13A3,3 0 0,0 15,10A3,3 0 0,0 12,7Z"/>
                </svg>
                <h3>${node.name}</h3>
                <p>${node.description || '暂无详细信息'}</p>
            </div>
        `;
        return;
    }
    
    let levelBadge = '';
    if (node.level && node.level !== 'locked') {
        const levelText = {
            beginner: '初级',
            intermediate: '中级',
            advanced: '高级',
            master: '精通'
        }[node.level] || node.level;
        
        levelBadge = `<span class="detail-level level-${node.level}">${levelText}</span>`;
    }
    
    let html = `
        <div class="detail-header">
            <h1 class="detail-title">${node.name}</h1>
            ${node.details.description ? `<p class="detail-subtitle">${node.details.description}</p>` : ''}
            ${levelBadge}
            ${node.details.experience ? `<p>经验: ${node.details.experience}</p>` : ''}
        </div>
    `;
    
    // 添加自我评估部分
    if (node.type === 'skill' && node.level !== 'locked') {
        html += `
            <div class="detail-section" id="self-assessment">
                <h3 class="section-title">自我评估</h3>
                <div class="detail-item">
                    <p>您对此技能的掌握程度:</p>
                    <div class="rating-container">
                        <button class="rating-btn" data-level="beginner">初级</button>
                        <button class="rating-btn" data-level="intermediate">中级</button>
                        <button class="rating-btn" data-level="advanced">高级</button>
                        <button class="rating-btn" data-level="master">精通</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // 添加课程部分
    if (node.details.courses && node.details.courses.length > 0) {
        html += `
            <div class="detail-section">
                <h3 class="section-title">相关课程</h3>
                ${node.details.courses.map(course => `
                    <div class="detail-item">
                        <strong>${course.name}</strong><br>
                        <em>${course.source}</em>${course.score ? ` · 成绩: ${course.score}` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // 添加项目部分
    if (node.details.projects && node.details.projects.length > 0) {
        html += `
            <div class="detail-section">
                <h3 class="section-title">项目经验</h3>
                ${node.details.projects.map(project => `
                    <div class="detail-item">
                        <strong>${project.name}</strong><br>
                        角色: ${project.role}${project.technologies ? ` · 技术: ${project.technologies}` : ''}${project.duration ? ` · 时长: ${project.duration}` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // 添加证书部分
    if (node.details.certificates && node.details.certificates.length > 0) {
        html += `
            <div class="detail-section">
                <h3 class="section-title">证书与认证</h3>
                ${node.details.certificates.map(cert => `
                    <div class="detail-item">
                        <strong>${cert.name}</strong><br>
                        颁发机构: ${cert.issuer}${cert.year ? ` · 年份: ${cert.year}` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    panel.innerHTML = html;
    
    // 高亮当前选择的评估级别
    if (node.level && node.level !== 'locked') {
        updateActiveRatingButton(node.id, node.level);
    }
}

// 更新活动评分按钮状态
function updateActiveRatingButton(nodeId, level) {
    const panel = document.querySelector('.detail-panel');
    if (!panel) return;
    
    // 移除所有按钮的活动状态
    panel.querySelectorAll('.rating-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.innerHTML = btn.textContent.replace(' ✓', '');
    });
    
    // 设置当前活动按钮
    const activeBtn = panel.querySelector(`.rating-btn[data-level="${level}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.innerHTML += ' ✓';
    }
}

// 保存评估结果
function saveAssessment(nodeId, level) {
    const assessments = loadFromLocalStorage('skillAssessments', {});
    assessments[nodeId] = level;
    saveToLocalStorage('skillAssessments', assessments);
}