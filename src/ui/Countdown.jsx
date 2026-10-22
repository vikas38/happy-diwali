import React, { useEffect, useRef, useState } from 'react'

// ===================================================================
// Countdown — COUNTDOWN_3_2_1 overlay
// ===================================================================
// Shows 3 → 2 → 1 → GLOW! with bouncy neon animation.
// The GameController updates countdownNumber on each beat.

export default function Countdown({ countdownNumber }) {
  const prevRef = useRef(null)
  const [animKey, setAnimKey] = useState(0)

  // Re-trigger bounce animation on each new number
  useEffect(() => {
    if (countdownNumber !== prevRef.current) {
      prevRef.current = countdownNumber
      setAnimKey(k => k + 1)
    }
  }, [countdownNumber])

  const isGlow = countdownNumber === 'GLOW!'

  return (
    <div className="countdown-overlay" aria-live="assertive" aria-label={`Countdown: ${countdownNumber}`}>
      <span className="sr-only">Countdown: {countdownNumber}</span>
      <div
        key={animKey}
        className={`countdown-number${isGlow ? ' countdown-number--glow' : ''} countdown-number--pop`}
        aria-hidden="true"
      >
        {countdownNumber}
      </div>
    </div>
  )
}
