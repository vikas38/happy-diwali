import React, { useEffect, useRef } from 'react'

// ===================================================================
// CalmCorner — CALM_CORNER_OVERLAY breathing guide
// ===================================================================
// Accessible from any state. Pauses everything, dims the screen,
// guides the child through a 4-second inhale/exhale cycle with Pip.

function BreathingCircle() {
  const phaseRef = useRef('inhale')
  const circleRef = useRef(null)
  const textRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    let running = true

    function runCycle() {
      if (!running) return
      const el = circleRef.current
      const txt = textRef.current
      if (!el || !txt) return

      // Inhale — 4s expand
      phaseRef.current = 'inhale'
      el.style.transition = 'transform 4s ease-in-out'
      el.style.transform = 'scale(1.6)'
      txt.textContent = 'Breathe in… 🌙'

      timerRef.current = setTimeout(() => {
        if (!running) return
        // Exhale — 4s contract
        phaseRef.current = 'exhale'
        el.style.transition = 'transform 4s ease-in-out'
        el.style.transform = 'scale(1.0)'
        txt.textContent = 'Breathe out… 🌬️'

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
  }, [])

  return (
    <div className="breathing-guide" aria-live="polite">
      <div className="breathing-circle-wrap">
        <div className="breathing-circle" ref={circleRef} aria-hidden="true">
          <span className="breathing-pip" role="img" aria-label="Pip the Diya">🪔</span>
        </div>
      </div>
      <p className="breathing-text" ref={textRef}>Breathe in… 🌙</p>
    </div>
  )
}

export default function CalmCorner({ onResume }) {
  return (
    <div className="overlay overlay--calm" role="dialog" aria-modal="true" aria-label="Calm Corner">
      <div className="calm-corner">
        <h2 className="calm-corner__title">
          <span className="neon">Calm Corner</span> 🫧
        </h2>
        <p className="calm-corner__subtitle">Take a breath with Pip…</p>
        <BreathingCircle />
        <button
          className="btn btn--primary calm-corner__resume"
          onClick={onResume}
          aria-label="Resume Game"
        >
          I'm Ready! ▶️
        </button>
      </div>
    </div>
  )
}
