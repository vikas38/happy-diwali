import React, { useEffect } from 'react'
import { t } from '../i18n/index.js'

// ===================================================================
// SafetySplash — SAFETY_SPLASH modal (one-time)
// ===================================================================
// Shown on first load. Large bouncy "I Promise! Let's Play!" button
// initializes/resumes the AudioContext.

export default function SafetySplash({ onStart }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onStart?.()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onStart])

  return (
    <div
      className="overlay overlay--safety"
      role="dialog"
      aria-modal="true"
      aria-labelledby="safety-splash-title"
    >
      <div className="safety-splash">
        <div className="safety-splash__diya" aria-hidden="true">
          🪔
        </div>
        <h1 id="safety-splash-title" className="safety-splash__title">
          {t('safety_title_line1')}
          <br />
          <span className="neon">{t('safety_title_accent')}</span>
        </h1>
        <div className="safety-splash__notice" role="note">
          <span className="safety-splash__icon" aria-hidden="true">
            👂
          </span>
          <p>
            {t('safety_rule_adults_prefix')} <strong>{t('safety_rule_adults_bold')}</strong>.<br />
            {t('safety_rule_distance_prefix')} <strong>{t('safety_rule_distance_bold1')}</strong>{' '}
            {t('safety_rule_distance_mid')} <strong>{t('safety_rule_distance_bold2')}</strong>
          </p>
        </div>
        <button
          className="btn btn--primary btn--bounce safety-splash__btn"
          onClick={onStart}
          autoFocus
          aria-label={t('safety_start_aria')}
        >
          {t('safety_start_btn')}
        </button>
        <p className="safety-splash__subtext">{t('safety_subtext')}</p>
      </div>
    </div>
  )
}
