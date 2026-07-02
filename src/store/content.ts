// src/store/content.ts
// 内容联动状态 — 跨窗口标签/技能/搜索协调
import { create } from 'zustand';

export interface PostItem {
  id: string;
  slug: string;
  body: string;
  data: {
    title: string;
    date: string;
    category: 'tech' | 'life' | 'project' | 'note';
    summary?: string;
    tags: string[];
    link?: string;
    status?: 'IN-PROGRESS' | 'COMPLETED' | 'STANDBY';
  };
}

interface ContentState {
  // 文章和笔记
  posts: PostItem[];
  setPosts: (posts: PostItem[]) => void;
  activePostId: string | null;
  setActivePostId: (id: string | null) => void;

  // 标签联动
  activeTag: string | null;
  setActiveTag: (tag: string | null) => void;

  // 技能节点联动
  activeSkillId: string | null;
  setActiveSkillId: (id: string | null) => void;

  // 全局 Spotlight 搜索
  spotlightOpen: boolean;
  spotlightQuery: string;
  openSpotlight:  () => void;
  closeSpotlight: () => void;
  setSpotlightQuery: (q: string) => void;

  // 阅读历史（最近5篇）
  readingHistory: string[];
  pushReading: (articleId: string) => void;
}

export const useContentStore = create<ContentState>()((set, get) => ({
  posts: [],
  activePostId: null,
  activeTag:     null,
  activeSkillId: null,
  spotlightOpen:  false,
  spotlightQuery: '',
  readingHistory: [],

  setPosts: (posts) => set({ posts }),
  setActivePostId: (id) => set({ activePostId: id }),
  setActiveTag: (tag) => set({ activeTag: tag }),
  setActiveSkillId: (id) => set({ activeSkillId: id }),

  openSpotlight:  () => set({ spotlightOpen: true,  spotlightQuery: '' }),
  closeSpotlight: () => set({ spotlightOpen: false, spotlightQuery: '' }),
  setSpotlightQuery: (q) => set({ spotlightQuery: q }),

  pushReading: (articleId) => {
    const history = [articleId, ...get().readingHistory.filter(id => id !== articleId)].slice(0, 5);
    set({ readingHistory: history });
  },
}));
