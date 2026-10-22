import React, { useEffect, useRef } from 'react'

// ===================================================================
// CalmCorner — CALM_CORNER_OVERLAY breathing guide
// ===================================================================
// Accessible from any state via "Take a breath".
// Pauses the courtyard and guides the child through a peaceful 4-second
// inhale/exhale breathing rhythm with Pip the Diya.

function BreathingCircle() {
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
      el.style.transition = 'transform 4s cubic-bezier(0.4, 0, 0.2, 1)'
      el.style.transform = 'scale(1.32)'
      txt.textContent = 'Breathe in slowly… ☾'

      timerRef.current = setTimeout(() => {
        if (!running) return
        // Exhale — 4s contract
        el.style.transition = 'transform 4s cubic-bezier(0.4, 0, 0.2, 1)'
        el.style.transform = 'scale(1.0)'
        txt.textContent = 'Breathe out gently… ✧'

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
          <svg className="breathing-diya" viewBox="0 0 80 70" width="50" height="44" aria-hidden="true">
            <path className="breathing-flame" d="M40 8 C33 22, 28 32, 40 46 C52 32, 47 22, 40 8 Z" fill="#ffbc53" />
            <path className="breathing-flame-inner" d="M40 16 C36 25, 34 32, 40 42 C46 32, 44 25, 40 16 Z" fill="#fff5d0" />
            <path d="M10 44 Q40 68 70 44 Z" fill="#bf5e48" />
            <ellipse cx="40" cy="44" rx="30" ry="8" fill="#ed9a60" />
            <ellipse cx="40" cy="43.5" rx="24" ry="5" fill="#763c48" />
            <path d="M14 47 Q40 63 66 47" stroke="#ffcf86" strokeWidth="2" fill="none" />
            <circle cx="40" cy="43.5" r="2" fill="#fff2b7" />
          </svg>
        </div>
      </div>
      <p className="breathing-text" ref={textRef}>Breathe in slowly… ☾</p>
    </div>
  )
}

export default function CalmCorner({ onResume }) {
  return (
    <div className="overlay overlay--calm" role="dialog" aria-modal="true" aria-label="Calm Corner">
      <div className="calm-corner">
        <button className="calm-corner__close" onClick={onResume} aria-label="Close Calm Corner">×</button>
        <span className="calm-corner__tag" aria-hidden="true">A QUIET MOMENT</span>
        <h2 className="calm-corner__title">
          Calm <span className="title-accent">Corner</span>
        </h2>
        <p className="calm-corner__subtitle">
          Take a gentle breath with Pip. Everything is peaceful here.
        </p>
        <BreathingCircle />
        <button
          className="btn btn--primary calm-corner__resume"
          onClick={onResume}
          autoFocus
          aria-label="Step back into the courtyard"
        >
          Step back into the courtyard →
        </button>
      </div>
    </div>
  )
}
