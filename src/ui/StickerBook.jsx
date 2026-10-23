import React, { useState } from 'react'
import { CRACKERS } from '../crackers/crackerDefs.js'

// ===================================================================
// StickerBook — Sticker collection overlay + Parent unlock-all
// ===================================================================
// Shows unlocked stickers (locked = silhouette).
// Long-press (2s hold) on the "Parent Unlock All" button to unlock all.

function StickerTile({ cracker, unlocked }) {
  return (
    <div
      className={`sticker-tile${unlocked ? ' sticker-tile--unlocked' : ' sticker-tile--locked'}`}
      aria-label={unlocked ? `${cracker.name} sticker collected` : `${cracker.name} sticker locked`}
      role="img"
    >
      <span className="sticker-tile__emoji" aria-hidden="true">
        {unlocked ? cracker.emoji : '🔒'}
      </span>
      <span className="sticker-tile__name">{cracker.name}</span>
      {Array.from({ length: cracker.intensityDots }).map((_, i) => (
        <span key={i} className="sticker-dot" aria-hidden="true">●</span>
      ))}
    </div>
  )
}

export default function StickerBook({ stickers, onClose, onUnlockAll }) {
  const [holdProgress, setHoldProgress] = useState(0)
  const [holding, setHolding] = useState(false)
  const holdTimerRef = React.useRef(null)
  const holdStartRef = React.useRef(null)
  const rafRef = React.useRef(null)

  React.useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  function startHold() {
    setHolding(true)
    holdStartRef.current = Date.now()
    function tick() {
      const elapsed = Date.now() - holdStartRef.current
      const prog = Math.min(1, elapsed / 2000)
      setHoldProgress(prog)
      if (prog < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        onUnlockAll()
        stopHold()
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  function stopHold() {
    setHolding(false)
    setHoldProgress(0)
    cancelAnimationFrame(rafRef.current)
    clearTimeout(holdTimerRef.current)
  }

  return (
    <div className="overlay overlay--sticker" role="dialog" aria-modal="true" aria-label="Sticker Book">
      <div className="sticker-book">
        <div className="sticker-book__header">
          <h2 className="sticker-book__title">Sticker Book 📖</h2>
          <button className="btn btn--icon sticker-book__close" onClick={onClose} aria-label="Close Sticker Book">✕</button>
        </div>
        <div className="sticker-book__count" aria-live="polite">
          {stickers.length} / {CRACKERS.length} collected
        </div>
        <div className="sticker-grid">
          {CRACKERS.map(cracker => (
            <StickerTile
              key={cracker.id}
              cracker={cracker}
              unlocked={stickers.includes(cracker.id)}
            />
          ))}
        </div>
        <div className="sticker-book__parent">
          <p className="sticker-book__parent-label">Parents: Hold to unlock all crackers</p>
          <button
            className="btn btn--secondary btn--parent-unlock"
            onPointerDown={startHold}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            aria-label="Parent Unlock All — hold for 2 seconds"
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            {holding
              ? `Unlocking… ${Math.round(holdProgress * 100)}%`
              : '🔓 Parent Unlock All'}
            {holding && (
              <span
                className="parent-unlock-progress"
                style={{ width: `${holdProgress * 100}%` }}
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
