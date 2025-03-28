/**
 * 工具函数模块
 */

// 从本地存储加载数据
export function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error(`Error loading ${key} from localStorage:`, error);
        return defaultValue;
    }
}

// 保存数据到本地存储
export function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
    }
}

// 防抖函数
export function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// 获取节点路径
export function getNodePath(node, data) {
    const path = [];
    let current = node;
    
    while (current && current.id !== 'root') {
        path.unshift(current);
        const parentLink = data.links.find(l => l.target.id === current.id);
        current = parentLink ? parentLink.source : null;
    }
    
    return path;
}

// 格式化日期
export function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}