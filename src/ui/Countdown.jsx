import React, { useEffect, useRef, useState } from 'react'
import { t } from '../i18n/index.js'

// ===================================================================
// Countdown — COUNTDOWN_3_2_1 overlay
// ===================================================================
// Shows 3 → 2 → 1 → GLOW! in one fixed position with a progress ring.
// Announce through a polite live region (shared with T03).

export default function Countdown({ countdownNumber }) {
  const prevRef = useRef(null)
  const [animKey, setAnimKey] = useState(0)

  // Re-trigger bounce animation on each new number
  useEffect(() => {
    if (countdownNumber !== prevRef.current) {
      prevRef.current = countdownNumber
      setAnimKey((k) => k + 1)
    }
  }, [countdownNumber])

  const glowText = t('countdown_glow')
  const isGlow = countdownNumber === 'GLOW!' || countdownNumber === glowText

  // Progress mapping: 3 -> 25%, 2 -> 50%, 1 -> 75%, 'GLOW!' -> 100%
  const progressMap = {
    3: 0.25,
    2: 0.5,
    1: 0.75,
    'GLOW!': 1.0,
    [glowText]: 1.0,
  }
  const pct = progressMap[countdownNumber] ?? 0.25
  const radius = 64
  const circumference = 2 * Math.PI * radius // ~402.12
  const strokeDashoffset = circumference * (1 - pct)

  const displayText = countdownNumber === 'GLOW!' ? glowText : countdownNumber
  const ariaText = t('countdown_aria', { number: displayText })

  return (
    <div className="countdown-overlay countdown-overlay--fixed" role="status" aria-live="polite">
      <span className="sr-only">{ariaText}</span>
      <div className="countdown-wrap" aria-hidden="true">
        <svg className="countdown-progress-ring" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={radius} className="countdown-ring-bg" />
          <circle
            cx="80"
            cy="80"
            r={radius}
            className="countdown-ring-fill"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
            }}
          />
        </svg>
        <div
          key={animKey}
          className={`countdown-number${isGlow ? ' countdown-number--glow' : ''} countdown-number--pop`}
        >
          {displayText}
        </div>
      </div>
    </div>
  )
}
