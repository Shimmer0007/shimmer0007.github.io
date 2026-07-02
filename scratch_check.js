// D:\Projects\shimmer0007.github.io\scratch_check.js
import * as markedModule from 'marked';

console.log('--- MARKED EXPORTS ---');
console.log('Keys:', Object.keys(markedModule));
console.log('typeof default:', typeof markedModule.default);
console.log('typeof marked:', typeof markedModule.marked);

try {
  // 测试解析
  const result = markedModule.marked.parse('# Hello World');
  console.log('Parse success:', result.trim());
} catch(e) {
  console.error('Parse failed:', e);
}
