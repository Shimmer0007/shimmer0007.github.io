---
title: "iFLYTEK 用户新增预测挑战赛复盘"
date: "2025-07-12"
category: "project"
summary: "DW2025夏令营分享记录，主要使用LightGBM 模型，并进行了详细的特征工程，也遭遇了十分经典的数据泄露问题。"
tags: ["机器学习","竞赛","特征工程"]
---

<style>
    .ug-center-text { text-align: center; }
    .ug-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; align-items: center; }
    .ug-info-card { background: var(--input-bg); padding: 2rem; border-radius: var(--border-radius-main); }
    .ug-score-box { padding: 1rem; border-radius: var(--border-radius-small); margin-bottom: 1rem; }
    .ug-score-box-green { background-color: color-mix(in srgb, var(--success-green) 15%, transparent); }
    .ug-score-box-blue { background-color: color-mix(in srgb, var(--primary-accent) 15%, transparent); }
    .ug-score-title { font-weight: bold; font-size: 1.1em; }
    .ug-score-number { font-size: 2.5rem; font-weight: bold; letter-spacing: -0.05em; }
    .ug-code-block { background-color: #1F2937; border: 1px solid #374151; border-radius: 0.75rem; padding: 1.5rem; margin-top: 1.5rem; font-size: 0.875rem; line-height: 1.6; overflow-x: auto; }
    .ug-text-red { color: #f87171; }
    .ug-text-green { color: #4ade80; }
    .ug-text-blue { color: #60a5fa; }
    .ug-text-yellow { color: #facc15; }
    .ug-text-purple { color: #c084fc; }
    .ug-text-teal { color: #5eead4; }

    /* 响应式调整 */
    @media (max-width: 768px) {
        .ug-grid-2 { grid-template-columns: 1fr; }
    }
</style>

<div class="ug-center-text">
    <h1 class="text-5xl md:text-6xl font-bold mb-4 leading-tight" style="font-size: 2.5em; margin-bottom: 1rem;">虚假繁荣之下</h1>
    <p class="text-2xl text-gray-400 mt-6" style="font-size: 1.5em; color: var(--text-medium);">——复盘数据泄露与模型评估</p>
</div>

<h2 id="s2-baseline">起点：夏令营的Baseline (0.637分)</h2>
<p>打卡完Task1再回过头来看我们的baseline，它的特征工程非常基础，直接对类别进行编码。这是一个简单的起点，但是使用 `StratifiedKFold` 为后续埋下了伏笔。</p>
<div class="ug-code-block">
<pre><code class="language-python">
# Baseline 特征工程: 对所有类别特征（包括udmap）进行简单的整数编码
cat_features = [
    'device_brand', 'ntt', 'operator', 'common_country',
    'common_province', 'common_city', 'appver', 'channel',
    'os_type', 'udmap' # 直接对udmap字符串编码，丢失内部信息
]

for feature in cat_features:
    le = LabelEncoder()
    # ...fit_transform...

# Baseline 验证方法: 使用 StratifiedKFold
kf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
</code></pre>
</div>

<h2 id="s3-surprise">“意外”的惊喜</h2>
<div class="ug-grid-2">
    <div>
        <h3 id="s3-my-features" style="font-size: 1.5em; font-weight: 600; margin-bottom: 1rem;">特征工程探索</h3>
        <p>我的工作主要集中在两个方面：</p>
        <ul style="list-style: disc; padding-left: 20px; margin-top: 1rem;">
            <li>解析了复杂的`udmap`字段，提取结构化信息。</li>
            <li style="font-weight: 600;">最重要地，构建了大量的用户级别聚合特征。</li>
        </ul>
        <div class="ug-code-block">
<pre><code class="language-python">
# 按用户ID分组，统计其累积行为
aggregations = {
    'mid': ['count', 'nunique'],
    'common_ts': ['min', 'max'],
    'hour': ['mean', 'std'],
}
did_agg_df = full_df.groupby('did').agg(aggregations)
</code></pre>
        </div>
    </div>
    <div class="ug-info-card ug-center-text">
        <h3 id="s3-results" style="font-size: 1.5em; font-weight: 600; margin-bottom: 1rem;">效果拔群！</h3>
        <div class="ug-score-box ug-score-box-green">
            <p class="ug-score-title">本地验证 (StratifiedKFold, F1-Score)</p>
            <p class="ug-score-number ug-text-green">0.902</p>
        </div>
        <div class="ug-score-box ug-score-box-blue">
            <p class="ug-score-title">线上A榜提交</p>
            <p class="ug-score-number ug-text-blue">0.905</p>
        </div>
        <p style="margin-top: 1.5rem; color: var(--text-medium);">难道说？</p>
    </div>
</div>

<h2 id="s4-investigation">敲响警钟：数据集的“CT扫描”报告</h2>
<p>以我的水平，上分岂是如此容易之事？拜托Dpsk来写一个诊断脚本，给数据集做一次彻底的检查。</p>
<div class="ug-info-card">
    <div class="ug-grid-2">
        <div>
            <h3 id="s4-analysis" class="ug-text-blue" style="font-size: 1.5em; font-weight: bold; border-bottom: 2px solid; padding-bottom: 0.5rem; margin-bottom: 1rem;">📊 数据分布分析</h3>
            <p>训练集DID数: <span style="font-family: monospace;">270,837</span></p>
            <p>测试集DID数: <span style="font-family: monospace;">206,342</span></p>
            <p class="ug-text-red" style="font-size: 1.2em; font-weight: 600; margin-top: 0.5rem;">重叠DID数量: <span style="font-family: monospace;">192,393</span> (高达 <span style="font-family: monospace;">93.24%</span>)</p>
            <h4 style="font-weight: 600; font-size: 1.1em; margin-top: 1rem;">⏱️ 时间范围</h4>
            <p>训练集: <span style="font-family: monospace;">2025-02-28</span> 至 <span style="font-family: monospace;">2025-03-31</span></p>
            <p>测试集: <span style="font-family: monospace;">2025-02-28</span> 至 <span style="font-family: monospace;">2025-03-31</span> <span class="ug-text-yellow" style="font-weight: bold;">(完全重叠!)</span></p>
        </div>
        <div style="border-left: 2px solid var(--border-color); padding-left: 2rem;">
            <h3 id="s4-conclusion" class="ug-text-green" style="font-size: 1.5em; font-weight: bold; border-bottom: 2px solid; padding-bottom: 0.5rem; margin-bottom: 1rem;">🔧 结果解读</h3>
            <ul style="list-style: disc; padding-left: 20px; space-y-2;">
                <li>测试集中绝大部分用户在训练集中都有行为记录。</li>
                <li>训练集和测试集的划分不是按“过去”和“未来”划分的。</li>
                <li class="ug-text-green" style="font-weight: 600;">任何能区分“训练集出现过”的特征，都会成为作弊捷径。</li>
                <li class="ug-text-green" style="font-weight: 600;">咋办？必须改用基于分组的交叉验证。</li>
            </ul>
        </div>
    </div>
</div>
<p style="margin-top: 1rem; font-size: 1.2em; font-weight: 600; text-align: center;">问题的根源是贯穿A榜的系统性问题——<span class="ug-text-blue">数据泄露</span>。</p>

<h2 id="s5-leakage-explained">主题聚焦：本赛题中的“数据泄露”</h2>
<div class="ug-grid-2">
    <div class="ug-info-card">
        <h3 id="s5-fold-leak" class="ug-text-blue" style="font-size: 1.5em; font-weight: 600; margin-bottom: 1rem;">1. 验证集污染</h3>
        <p>理想的验证集应该充满“陌生人”。但 `StratifiedKFold` 像洗牌一样，把同一个用户的记录切分到了训练和验证集里。模型在训练时“偷看”了验证集用户的部分行为，污染了考卷的纯洁性。</p>
    </div>
    <div class="ug-info-card">
        <h3 id="s5-target-leak" class="ug-text-blue" style="font-size: 1.5em; font-weight: 600; margin-bottom: 1rem;">2. 目标泄露</h3>
        <p>做聚合特征（比如，“用户行为总次数”）时，计算横跨了整个数据集。这导致本应属于“未来”的信息，泄露给了“当下”，直接告诉了模型“这个用户不是新人”。</p>
    </div>
</div>

<h2 id="s6-open-book-exam">一言以蔽之：一场心照不宣的“开卷考试”</h2>
<p>我的0.9分并非来自模型的智慧，而是它对这种泄露规则的 <span class="ug-text-red" style="font-weight: bold; font-size: 1.5em;">机械记忆</span>。</p>
<div class="ug-grid-2">
    <div class="ug-code-block">
        <h4 style="font-weight: bold; margin-bottom: 1em;">“作弊”的验证方法 (StratifiedKFold)</h4>
<pre><code class="language-python">
# 它会将同一个did的行为打散到训练和验证集
for train_idx, val_idx in kf.split(X, y):
    # 模型在训练时看到了did=A的部分行为
    # 然后在验证时又看到了did=A的剩余行为
    # 聚合特征(如count)直接泄露了答案
    ...
</code></pre>
    </div>
    <div class="ug-code-block" style="border-color: var(--success-green);">
        <h4 style="font-weight: bold; margin-bottom: 1em;">“诚实”的验证方法 (GroupKFold)</h4>
<pre><code class="language-python">
# 保证同一个did的所有行为要么都在训练集，
# 要么都在验证集
from sklearn.model_selection import GroupKFold

kf = GroupKFold(n_splits=5)

# 传入groups参数，按did进行分组
for train_idx, val_idx in kf.split(X, y, groups=did_groups):
    # 验证集里的did是模型完全没见过的
    # 考验的是模型的真实泛化能力
    ...
</code></pre>
    </div>
</div>

<h2 id="s7-b-list-strategy">猜测：A榜的“陷阱”与B榜的对策</h2>
<p>这是一个经典的竞赛模式：A榜是供大家探索的模拟场，而B榜才是一锤定音的真实考场。战略目标不应是最大化A榜分数，而是构建一个能在 <span class="ug-text-blue" style="font-weight: bold;">B榜</span> 上生存的稳健模型。</p>

<h2 id="s8-honest-score">为B榜而战：拥抱“诚实”的分数</h2>
<p>换用能保证“闭卷考试”的`GroupKFold`后，分数被打回原形——虽然回落，但它很 <span class="ug-text-green" style="font-weight: bold;">“诚实”</span>。它代表了模型在面对未知用户时的真实能力，是继续优化的坚实地基。</p>
<div class="ug-center-text" style="margin-top: 2rem;">
    <p style="color: var(--text-medium);">打回原形的F1-Score</p>
    <p style="font-size: 5rem; font-weight: 800; margin: 1rem 0;" class="ug-text-red">0.67</p>
</div>

<h2 id="s9-future-plan">下一步备战策略：深度时序模型</h2>
<p>从“手动”理解时序到让模型“自动”学习序列模式。</p>
<div class="ug-grid-2">
    <div class="ug-info-card" style="border-color: var(--primary-accent);">
        <h3 id="s9-end-to-end" class="ug-text-purple" style="font-size: 1.5em; font-weight: 600; margin-bottom: 1rem;">策略一：端到端时序模型</h3>
        <p>直接用一个深度学习模型（如LSTM或Transformer）来端到端地完成预测任务。模型将自动学习整个用户行为序列中的复杂模式。</p>
    </div>
    <div class="ug-info-card" style="border-color: var(--primary-accent);">
        <h3 id="s9-hybrid-model" class="ug-text-teal" style="font-size: 1.5em; font-weight: 600; margin-bottom: 1rem;">策略二：混合模型 (推荐)</h3>
        <p>时序模型作为特征提取器。用它“阅读”用户行为序列，生成深度特征，再与手动设计的聚合特征拼接，最后喂给LightGBM做分类，兼顾解释性与效果。</p>
    </div>
</div>

<h2 id="s10-conclusion">结语：保持怀疑</h2>
<p class="ug-center-text" style="font-size: 1.2em; color: var(--text-medium);">初出茅庐，对“过于美好”的分数保持一份怀疑，是数据科学路上非常宝贵的一课。</p>