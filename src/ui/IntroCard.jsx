import React, { useEffect } from 'react'
import CrackerArt from './CrackerArt.jsx'
import { t } from '../i18n/index.js'

// ===================================================================
// IntroCard — CRACKER_INTRO_CARD bounce-in modal
// ===================================================================
// Shown the first time a cracker is selected.
// Displays cracker name, animated icon, description, "Put on Street" button.

function IntensityDots({ count }) {
  return (
    <div className="intensity-dots" aria-label={t('intro_intensity_aria', { count })}>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`intensity-dot${i <= count ? ' intensity-dot--active' : ''}`}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export default function IntroCard({ cracker, onPutOnStreet, onCancel }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onCancel])

  if (!cracker) return null

  return (
    <div
      className="overlay overlay--intro"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-card-title"
    >
      <div className="intro-card intro-card--bounce-in">
        {onCancel && (
          <button
            type="button"
            className="btn btn--icon intro-card__close"
            onClick={onCancel}
            aria-label={t('close_dialog')}
          >
            ✕
          </button>
        )}
        <div className="intro-card__emoji" aria-hidden="true">
          <CrackerArt index={cracker.id} />
        </div>
        <h2 id="intro-card-title" className="intro-card__title">
          {t('intro_meet_prefix')} <span className="neon">{cracker.name}</span>!
        </h2>
        <p className="intro-card__desc">{cracker.description}</p>
        <div className="intro-card__meta">
          <span className="intro-card__audio">{cracker.audioProfile}</span>
          <IntensityDots count={cracker.intensityDots} />
        </div>
        <button
          className="btn btn--primary"
          onClick={onPutOnStreet}
          autoFocus
          aria-label={t('intro_watch_aria', { name: cracker.name })}
        >
          {t('intro_watch_btn')}
        </button>
      </div>
    </div>
  )
}
