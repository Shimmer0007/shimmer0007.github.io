// src/components/apps/PlanApp.tsx
// 二月计划（Janus Blueprint）：以两个月为基本单位的中长期指导性文件。
import './PlanApp.css';

export default function PlanApp() {
  return (
    <div className="plan-app">
      <header className="plan-hero">
        <p className="plan-kicker">JANUS BLUEPRINT</p>
        <h2>二月计划</h2>
        <p className="plan-intro">
          一系列以两个月为一个基本单位的中长期指导性文件。
        </p>
      </header>

      <dl className="plan-facts">
        <div><dt>基本单位</dt><dd>两个月</dd></div>
        <div><dt>文件定位</dt><dd>中长期指导</dd></div>
      </dl>

      <section className="plan-archive" aria-labelledby="plan-archive-title">
        <h3 id="plan-archive-title">指导性文件</h3>
        <p>文件目录待整理。</p>
      </section>
    </div>
  );
}
