// src/components/apps/SettingsApp.tsx
// 设置窗口 — 主题/强调色/语言
import { useOSStore, ACCENT_COLORS } from '../../store/os';
import { useT } from '../../i18n';
import './SettingsApp.css';

export default function SettingsApp() {
  const t = useT();
  const { theme, setTheme, accentId, setAccent, lang, setLang } = useOSStore();

  return (
    <div className="settings">
      {/* ===== 主题 ===== */}
      <section className="settings-section">
        <h3 className="settings-section__title">{t('settings.theme')}</h3>
        <div className="settings-toggle" role="group" aria-label={t('settings.theme')}>
          {(['dark', 'light'] as const).map(mode => (
            <button
              key={mode}
              className={`settings-toggle__btn ${theme === mode ? 'settings-toggle__btn--active' : ''}`}
              onClick={() => setTheme(mode)}
              aria-pressed={theme === mode}
            >
              {mode === 'dark' ? '🌙 ' : '☀️ '}{t(`settings.theme.${mode}`)}
            </button>
          ))}
        </div>
      </section>

      {/* ===== 强调色 ===== */}
      <section className="settings-section">
        <h3 className="settings-section__title">{t('settings.accent')}</h3>
        <div className="settings-swatches" role="group" aria-label={t('settings.accent')}>
          {ACCENT_COLORS.map(color => (
            <button
              key={color.id}
              className={`settings-swatch ${accentId === color.id ? 'settings-swatch--active' : ''}`}
              style={{ '--swatch-color': color.value, '--swatch-glow': color.glow } as React.CSSProperties}
              onClick={() => setAccent(color.id)}
              title={color.label}
              aria-label={color.label}
              aria-pressed={accentId === color.id}
            />
          ))}
        </div>
      </section>

      {/* ===== 语言 ===== */}
      <section className="settings-section">
        <h3 className="settings-section__title">{t('settings.language')}</h3>
        <div className="settings-toggle" role="group" aria-label={t('settings.language')}>
          {(['zh', 'en'] as const).map(l => (
            <button
              key={l}
              className={`settings-toggle__btn ${lang === l ? 'settings-toggle__btn--active' : ''}`}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
            >
              {t(`settings.lang.${l}`)}
            </button>
          ))}
        </div>
      </section>

      {/* ===== 关于 ===== */}
      <section className="settings-section settings-about">
        <p className="settings-about__name">ShimmerOS</p>
        <p className="settings-about__version">v3.0.0 · 2026 · Built with Astro + React</p>
      </section>
    </div>
  );
}
