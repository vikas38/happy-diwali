import React, { useContext, useEffect, useState } from 'react'
import { t } from '../i18n/index.js'
import { GameStoreContext, MOTION_POLICY } from '../store/gameStore.jsx'

// ===================================================================
// SafetySplash — SAFETY_SPLASH modal (one-time)
// ===================================================================
// Shown on first load. Offers pre-start Silent, Gentle sound, and
// Gentle visuals choices before entering the courtyard.
// Large bouncy button initializes audio with chosen preferences.

export default function SafetySplash({ onStart, isMuted = false, reducedMotion = false }) {
  const store = useContext(GameStoreContext)
  const [silent, setSilent] = useState(() => {
    if (store?.state) {
      return Boolean(store.state.muted || store.state.masterVolume === 0)
    }
    return isMuted
  })
  const [gentleVisuals, setGentleVisuals] = useState(() => {
    if (store?.state) {
      return Boolean(store.state.motionPolicy === MOTION_POLICY.REDUCED || store.state.calmVisuals)
    }
    return reducedMotion
  })

  const handleConfirm = React.useCallback(() => {
    store?.markSplashSeen?.()
    onStart?.({ silent, gentleVisuals })
  }, [gentleVisuals, onStart, silent, store])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') handleConfirm()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleConfirm])

  const toggleSilent = () => {
    const next = !silent
    setSilent(next)
    if (store) {
      if (next) {
        store.setMasterVolume(0)
      } else {
        const restoreVol = store.state.lastNonZeroVolume > 0 ? store.state.lastNonZeroVolume : 0.7
        store.setMasterVolume(restoreVol)
      }
    }
  }

  const toggleVisuals = () => {
    const next = !gentleVisuals
    setGentleVisuals(next)
    if (store) {
      store.setMotionPolicy(next ? MOTION_POLICY.REDUCED : MOTION_POLICY.FULL)
      store.setCalmVisuals(next)
    }
  }

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

        <div
          className="safety-splash__preferences"
          role="group"
          aria-label={t('safety_preferences_title')}
        >
          <button
            type="button"
            className={`btn btn--secondary safety-opt-btn ${silent ? 'is-active' : ''}`}
            onClick={toggleSilent}
            aria-pressed={silent}
          >
            <span aria-hidden="true">{silent ? '🔇' : '🔉'}</span>{' '}
            {silent ? t('safety_silent') : t('safety_gentle_sound')}
          </button>
          <button
            type="button"
            className={`btn btn--secondary safety-opt-btn ${gentleVisuals ? 'is-active' : ''}`}
            onClick={toggleVisuals}
            aria-pressed={gentleVisuals}
          >
            <span aria-hidden="true">🍃</span>{' '}
            {gentleVisuals ? t('safety_gentle_visuals') : t('safety_full_visuals')}
          </button>
        </div>

        <button
          className="btn btn--primary btn--bounce safety-splash__btn"
          onClick={handleConfirm}
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
