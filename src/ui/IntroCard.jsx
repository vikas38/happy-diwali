import React from 'react'
import CrackerArt from './CrackerArt.jsx'

// ===================================================================
// IntroCard — CRACKER_INTRO_CARD bounce-in modal
// ===================================================================
// Shown the first time a cracker is selected.
// Displays cracker name, animated icon, description, "Put on Street" button.

function IntensityDots({ count }) {
  return (
    <div className="intensity-dots" aria-label={`Intensity level ${count} of 4`}>
      {[1, 2, 3, 4].map(i => (
        <span
          key={i}
          className={`intensity-dot${i <= count ? ' intensity-dot--active' : ''}`}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export default function IntroCard({ cracker, onPutOnStreet }) {
  if (!cracker) return null

  return (
    <div className="overlay overlay--intro" role="dialog" aria-modal="true" aria-label={`Meet ${cracker.name}!`}>
      <div className="intro-card intro-card--bounce-in">
        <div className="intro-card__emoji" aria-hidden="true"><CrackerArt index={cracker.id} /></div>
        <h2 className="intro-card__title">Meet <span className="neon">{cracker.name}</span>!</h2>
        <p className="intro-card__desc">{cracker.description}</p>
        <div className="intro-card__meta">
          <span className="intro-card__audio">{cracker.audioProfile}</span>
          <IntensityDots count={cracker.intensityDots} />
        </div>
        <button
          className="btn btn--primary"
          onClick={onPutOnStreet}
          autoFocus
          aria-label={`Watch ${cracker.name}`}
        >
          Watch this firework →
        </button>
      </div>
    </div>
  )
}
