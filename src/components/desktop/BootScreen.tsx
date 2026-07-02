// src/components/desktop/BootScreen.tsx
import { useEffect, useRef, useState } from 'react';
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
  const theme = useOSStore(s => s.theme);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let interval: NodeJS.Timeout | number;

    // Phase 1: 文字出现 (0ms → 800ms)
    const t1 = setTimeout(() => setPhase('progress'), 900);

    // Phase 2: 进度条 (900ms → 2600ms)
    const t2 = setTimeout(() => {
      let p = 0;
      interval = setInterval(() => {
        p += Math.random() * 18 + 8;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
          setProgress(100);
          // Phase 3: 消失
          setTimeout(() => {
            setPhase('done');
            setTimeout(() => {
              setHidden(true);
              onCompleteRef.current();
            }, 600);
          }, 350);
        } else {
          setProgress(p);
        }
      }, 90);
    }, 900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (interval) clearInterval(interval);
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      className={`boot-screen ${phase === 'done' ? 'boot-screen--exit' : ''}`}
      data-theme={theme}
    >
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
      <p className="boot-version">v3.0.0 · 2026</p>

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
