// src/components/desktop/BootScreen.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useOSStore } from '../../store/os';
import './BootScreen.css';

interface BootScreenProps {
  onComplete: () => void;
}

const LETTERS = ['S', 'h', 'i', 'm', 'm', 'e', 'r'];

export default function BootScreen({ onComplete }: BootScreenProps) {
  const [phase, setPhase] = useState<'letters' | 'progress' | 'done'>('letters');
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);
  const timeoutIdsRef = useRef<number[]>([]);
  const intervalIdRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const theme = useOSStore(s => s.theme);

  const clearBootTimers = useCallback(() => {
    timeoutIdsRef.current.forEach(window.clearTimeout);
    timeoutIdsRef.current = [];

    if (intervalIdRef.current !== null) {
      window.clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  }, []);

  const completeBoot = useCallback((skipAnimation = false) => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearBootTimers();
    setProgress(100);

    if (skipAnimation) {
      setHidden(true);
      onComplete();
      return;
    }

    setPhase('done');
    const exitTimer = window.setTimeout(() => {
      setHidden(true);
      onComplete();
    }, 600);
    timeoutIdsRef.current.push(exitTimer);
  }, [clearBootTimers, onComplete]);

  useEffect(() => {
    // Phase 1: 文字出现 (0ms → 800ms)
    const t1 = window.setTimeout(() => setPhase('progress'), 900);

    // Phase 2: 进度条 (900ms → 2600ms)
    const t2 = window.setTimeout(() => {
      let p = 0;
      intervalIdRef.current = window.setInterval(() => {
        p += Math.random() * 18 + 8;
        if (p >= 100) {
          p = 100;
          if (intervalIdRef.current !== null) {
            window.clearInterval(intervalIdRef.current);
            intervalIdRef.current = null;
          }
          setProgress(100);
          // Phase 3: 消失
          const finishTimer = window.setTimeout(() => completeBoot(), 350);
          timeoutIdsRef.current.push(finishTimer);
        } else {
          setProgress(p);
        }
      }, 90);
    }, 900);

    timeoutIdsRef.current.push(t1, t2);
    return clearBootTimers;
  }, [clearBootTimers, completeBoot]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') completeBoot(true);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [completeBoot]);

  if (hidden) return null;

  return (
    <div
      className={`boot-screen ${phase === 'done' ? 'boot-screen--exit' : ''}`}
      data-theme={theme}
    >
      <button
        type="button"
        className="boot-skip"
        onClick={() => completeBoot(true)}
        aria-label="跳过开机动画"
      >
        <span>跳过启动</span>
        <kbd>Esc</kbd>
      </button>

      {/* 极光背景 */}
      <div className="boot-aurora" aria-hidden />

      {/* Logo */}
      <div className="boot-logo" aria-label="ShimmerOS">
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            className="boot-logo__letter"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {letter}
          </span>
        ))}
        <span className="boot-logo__os">OS</span>
      </div>

      {/* 版本 */}
      <p className="boot-version">v3.0.0 · PERSONAL KNOWLEDGE OS</p>

      {/* 进度条 */}
      {phase !== 'letters' && (
        <div className="boot-progress" role="progressbar" aria-valuenow={Math.round(progress)}>
          <div
            className="boot-progress__bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
