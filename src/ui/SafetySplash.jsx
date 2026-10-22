import React from 'react'

// ===================================================================
// SafetySplash — SAFETY_SPLASH modal (one-time)
// ===================================================================
// Shown on first load. Large bouncy "I Promise! Let's Play!" button
// initializes/resumes the AudioContext.

export default function SafetySplash({ onStart }) {
  return (
    <div className="overlay overlay--safety" role="dialog" aria-modal="true" aria-label="Safety information">
      <div className="safety-splash">
        <div className="safety-splash__diya" aria-hidden="true">🪔</div>
        <h1 className="safety-splash__title">The night is yours.<br /><span className="neon">Let it glow.</span></h1>
        <div className="safety-splash__notice" role="note">
          <span className="safety-splash__icon" aria-hidden="true">👂</span>
          <p>
            Real crackers are only lit by <strong>grown-ups</strong>.<br />
            Always <strong>stand far away</strong> and <strong>cover your ears!</strong>
          </p>
        </div>
        <button
          className="btn btn--primary btn--bounce safety-splash__btn"
          onClick={onStart}
          autoFocus
          aria-label="Step into the courtyard"
        >
          Step into the courtyard →
        </button>
        <p className="safety-splash__subtext">
          Pretend fireworks only. Chhotu and Pip watch while a grown-up handles the fuse.
        </p>
      </div>
    </div>
  )
}

