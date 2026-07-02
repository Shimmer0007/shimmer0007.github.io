import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders'; // 引入全新的 Glob 加载器

const posts = defineCollection({
  // 使用 glob 加载器，指向我们存放 md 博文的文件夹
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.string(), // YYYY-MM-DD
    category: z.enum(['tech', 'life', 'project', 'note']),
    summary: z.string().optional(),
    tags: z.array(z.string()).default([]),
    link: z.string().url().optional(), // 外部飞书等笔记链接
    status: z.enum(['IN-PROGRESS', 'COMPLETED', 'STANDBY']).optional(), // 课业笔记状态
  }),
});

export const collections = { posts };
