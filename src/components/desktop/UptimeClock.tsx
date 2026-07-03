// src/components/desktop/UptimeClock.tsx
import { useEffect, useState } from 'react';
import './UptimeClock.css';

// 设定建站启动锚点时间 (2024-10-24)
const START_TIME = new Date('2024-10-24T00:00:00+08:00').getTime();

export default function UptimeClock() {
  const [uptime, setUptime] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const [currentSystemTime, setCurrentSystemTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = Date.now();
      const diff = now - START_TIME;

      // 累进运行时间
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setUptime({ days, hours, minutes, seconds });

      // 当前本地时间展示 (HH:MM:SS)
      const dateObj = new Date();
      const hh = String(dateObj.getHours()).padStart(2, '0');
      const mm = String(dateObj.getMinutes()).padStart(2, '0');
      const ss = String(dateObj.getSeconds()).padStart(2, '0');
      setCurrentSystemTime(`${hh}:${mm}:${ss}`);
    };

    // 立即执行一次，防止空白闪烁
    updateClock();

    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="uptime-clock-card" title="ShimmerOS 运行计时器">
      {/* 扫线装饰 & 渐变底纹 */}
      <div className="uptime-crt-scanline" />
      
      {/* 头部标题与脉动指示器 */}
      <div className="uptime-header">
        <span className="uptime-led" />
        <span className="uptime-header-text">SYSTEM ACTIVE</span>
      </div>

      {/* 主运行秒表 */}
      <div className="uptime-counter">
        <div className="counter-item">
          <span className="counter-val">{uptime.days}</span>
          <span className="counter-unit">D</span>
        </div>
        <div className="counter-item">
          <span className="counter-val">{String(uptime.hours).padStart(2, '0')}</span>
          <span className="counter-unit">H</span>
        </div>
        <div className="counter-item">
          <span className="counter-val">{String(uptime.minutes).padStart(2, '0')}</span>
          <span className="counter-unit">M</span>
        </div>
        <div className="counter-item">
          <span className="counter-val">{String(uptime.seconds).padStart(2, '0')}</span>
          <span className="counter-unit">S</span>
        </div>
      </div>

      {/* 底部副时钟 (当前系统时间 & 年月日) */}
      <div className="uptime-footer">
        <span className="uptime-time-now">{currentSystemTime}</span>
        <span className="uptime-ver">V2.6.0</span>
      </div>
    </div>
  );
}
