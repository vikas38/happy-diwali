import Diya from './Diya.jsx'
import React, { useEffect, useRef } from 'react'
import { getSoundEngine } from '../audio/SoundEngine.js'
import { t } from '../i18n/index.js'

// ===================================================================
// CalmCorner — CALM_CORNER_OVERLAY breathing guide
// ===================================================================
// Accessible from any state via "Take a breath".
// Pauses the courtyard and guides the child through a peaceful 4-second
// inhale/exhale breathing rhythm with Pip the Diya.

function BreathingCircle({ reducedMotion = false }) {
  const circleRef = useRef(null)
  const textRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    const el = circleRef.current
    const txt = textRef.current
    if (!el || !txt) return

    if (reducedMotion) {
      // In reduced motion mode: zero scaling transforms, static peaceful position,
      // and calm rhythmic text cadence without any snapping transforms
      el.style.transition = 'none'
      el.style.transform = 'none'

      let running = true
      let inhale = true
      txt.textContent = t('breathe_in')

      function cycleText() {
        if (!running) return
        inhale = !inhale
        txt.textContent = inhale ? t('breathe_in') : t('breathe_out')
        timerRef.current = setTimeout(cycleText, 4200)
      }

      timerRef.current = setTimeout(cycleText, 4200)
      return () => {
        running = false
        clearTimeout(timerRef.current)
      }
    }

    let running = true

    function runCycle() {
      if (!running) return
      // Inhale — 4s expand
      el.style.transition = 'transform 4s cubic-bezier(0.4, 0, 0.2, 1)'
      el.style.transform = 'scale(1.32)'
      txt.textContent = t('breathe_in')

      timerRef.current = setTimeout(() => {
        if (!running) return
        // Exhale — 4s contract
        el.style.transition = 'transform 4s cubic-bezier(0.4, 0, 0.2, 1)'
        el.style.transform = 'scale(1.0)'
        txt.textContent = t('breathe_out')

        timerRef.current = setTimeout(() => {
          if (running) runCycle()
        }, 4200)
      }, 4200)
    }

    runCycle()

    return () => {
      running = false
      clearTimeout(timerRef.current)
    }
  }, [reducedMotion])

  return (
    <div className="breathing-guide" aria-live="polite">
      <div className="breathing-circle-wrap">
        <div
          className={`breathing-circle ${reducedMotion ? 'breathing-circle--static' : ''}`}
          ref={circleRef}
          aria-hidden="true"
        >
          <Diya className="breathing-diya" />
        </div>
      </div>
      <p className="breathing-text" ref={textRef}>
        {t('breathe_in')}
      </p>
    </div>
  )
}

export default function CalmCorner({
  onResume,
  isMuted = false,
  onToggleMute,
  reducedMotion = false,
}) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onResume()
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
      getSoundEngine().stopCalmPad()
    }
  }, [onResume])

  return (
    <div
      className="overlay overlay--calm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calm-corner-title"
    >
      <div className="calm-corner">
        <button
          className="calm-corner__close"
          onClick={onResume}
          aria-label={t('calm_corner_close')}
        >
          ×
        </button>
        <span className="calm-corner__tag" aria-hidden="true">
          {t('calm_corner_tag')}
        </span>
        <h2 id="calm-corner-title" className="calm-corner__title">
          {t('calm_corner_title_prefix')}{' '}
          <span className="title-accent">{t('calm_corner_title_accent')}</span>
        </h2>
        <p className="calm-corner__subtitle">{t('calm_corner_subtitle')}</p>
        <BreathingCircle reducedMotion={reducedMotion} />
        <div className="calm-corner__controls">
          {onToggleMute && (
            <button
              type="button"
              className="btn btn--secondary calm-corner__mute"
              onClick={onToggleMute}
              aria-pressed={isMuted}
              aria-label={isMuted ? t('unmute_audio') : t('mute_audio')}
            >
              <span aria-hidden="true">{isMuted ? '🔇' : '🔊'}</span>{' '}
              <span>{isMuted ? t('unmute') : t('mute')}</span>
            </button>
          )}
          <button
            className="btn btn--primary calm-corner__resume"
            onClick={onResume}
            autoFocus
            aria-label={t('calm_corner_resume_aria')}
          >
            {t('calm_corner_resume')}
          </button>
        </div>
      </div>
    </div>
  )
}
