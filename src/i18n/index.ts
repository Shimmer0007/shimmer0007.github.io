// src/i18n/index.ts — i18n hook & utilities
import { useOSStore } from '../store/os';
import zh from './zh';
import en from './en';

type DictValue = string | ((...args: string[]) => string);
const dicts: Record<string, Record<string, DictValue>> = { zh, en };

/**
 * useT — 翻译 hook
 * 用法：const t = useT()
 *       t('app.about.label')            → '关于我'
 *       t('term.opening', 'Blog')       → '正在打开 Blog…'
 */
export function useT() {
  const lang = useOSStore(s => s.lang);

  return function t(key: string, ...args: string[]): string {
    const dict = dicts[lang];
    const fallback = dicts['zh'];

    const val = dict[key] ?? fallback[key];
    if (val === undefined) return key;

    if (typeof val === 'function') {
      return (val as (...a: string[]) => string)(...args);
    }
    return val as string;
  };
}

/**
 * getT — 非 hook 版本，用于非组件上下文（如 terminal commands）
 */
export function getT(lang: string) {
  const dict = dicts[lang] ?? dicts['zh'];
  const fallback = dicts['zh'];

  return function t(key: string, ...args: string[]): string {
    const val = dict[key] ?? fallback[key];
    if (val === undefined) return key;
    if (typeof val === 'function') {
      return (val as (...a: string[]) => string)(...args);
    }
    return val as string;
  };
}
