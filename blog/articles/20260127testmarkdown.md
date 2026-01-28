# Markdown 测试文章

这是一篇使用 **Markdown** 编写的测试文章，用于验证博客系统的 Markdown 渲染功能。

## 基础语法测试

### 文本格式

- **粗体文本**
- *斜体文本*
- ~~删除线~~
- `行内代码`

### 列表

有序列表：

1. 第一项
2. 第二项
3. 第三项

无序列表：

- 项目 A
- 项目 B
  - 子项目 B1
  - 子项目 B2
- 项目 C

## 数学公式测试

### 行内公式

爱因斯坦的质能方程：$E = mc^2$

圆的面积公式：$A = \pi r^2$

### 块级公式

高斯积分：

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

麦克斯韦方程组：

$$
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\epsilon_0} \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0\mathbf{J} + \mu_0\epsilon_0\frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
$$

## 代码高亮测试

### Python 代码

```python
def fibonacci(n):
    """计算斐波那契数列"""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# 测试
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")
```

### JavaScript 代码

```javascript
// 快速排序算法
function quickSort(arr) {
    if (arr.length <= 1) return arr;
  
    const pivot = arr[0];
    const left = arr.slice(1).filter(x => x < pivot);
    const right = arr.slice(1).filter(x => x >= pivot);
  
    return [...quickSort(left), pivot, ...quickSort(right)];
}

console.log(quickSort([3, 1, 4, 1, 5, 9, 2, 6]));
```

## 表格测试

| 功能              | 支持情况 | 说明         |
| ----------------- | -------- | ------------ |
| Markdown 基础语法 | ✅       | 完全支持     |
| 数学公式          | ✅       | KaTeX 渲染   |
| 代码高亮          | ✅       | Highlight.js |
| 侧边栏目录        | ✅       | 自动生成     |
| 自定义样式        | ✅       | 继承博客主题 |

## 引用块测试

> 这是一个引用块示例。
>
> 引用块可以包含多段内容，并且会自动应用博客的主题样式。
>
> —— 沃兹·基硕德

## 链接测试

这是一个 [外部链接示例](https://shimmer0007.github.io/)。

也可以创建内部链接，比如跳转到 [数学公式测试](#数学公式测试) 章节。

## 图片测试

![示例图片](https://via.placeholder.com/600x300?text=Markdown+Blog+Test)

## 分隔线

---

## 总结

通过这篇测试文章，我们验证了：

1. ✅ 基础 Markdown 语法完全支持
2. ✅ 数学公式（行内和块级）正确渲染
3. ✅ 代码语法高亮工作正常
4. ✅ 表格、引用块、链接等元素显示正确
5. ✅ 样式与博客主题完美融合

现在你可以直接用 Markdown 写博客了！🎉
