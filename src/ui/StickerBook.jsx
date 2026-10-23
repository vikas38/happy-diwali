import React, { useState } from 'react'
import { CRACKERS } from '../crackers/crackerDefs.js'
import { t } from '../i18n/index.js'

// ===================================================================
// StickerBook — Sticker collection overlay + Parent unlock-all
// ===================================================================
// Shows unlocked stickers (locked = silhouette).
// Long-press (2s hold) on the "Parent Unlock All" button to unlock all.

function StickerTile({ cracker, unlocked }) {
  return (
    <div
      className={`sticker-tile${unlocked ? ' sticker-tile--unlocked' : ' sticker-tile--locked'}`}
      aria-label={
        unlocked
          ? t('sticker_collected_aria', { name: cracker.name })
          : t('sticker_locked_aria', { name: cracker.name })
      }
      role="img"
    >
      <div className="sticker-art-wrap">
        <span
          className={`sticker-tile__emoji${!unlocked ? ' sticker-silhouette' : ''}`}
          aria-hidden="true"
        >
          {cracker.emoji}
        </span>
        {!unlocked && (
          <span className="sticker-lock-badge" aria-hidden="true">
            🔒
          </span>
        )}
      </div>
      <span className="sticker-tile__name">{cracker.name}</span>
      {Array.from({ length: cracker.intensityDots }).map((_, i) => (
        <span key={i} className="sticker-dot" aria-hidden="true">
          ●
        </span>
      ))}
    </div>
  )
}

export default function StickerBook({
  stickers,
  onClose,
  onUnlockAll,
  isMuted = false,
  onToggleMute,
}) {
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
    <div
      className="overlay overlay--sticker"
      role="dialog"
      aria-modal="true"
      aria-label={t('sticker_book_dialog') || t('sticker_book_dialog_aria')}
    >
      <div className="sticker-book">
        <div className="sticker-book__header">
          <h2 className="sticker-book__title">{t('sticker_book_title')}</h2>
          <div className="sticker-book__header-actions">
            {onToggleMute && (
              <button
                type="button"
                className="btn btn--icon sticker-book__mute"
                onClick={onToggleMute}
                aria-pressed={isMuted}
                aria-label={isMuted ? t('unmute_audio') : t('mute_audio')}
                title={isMuted ? t('unmute_audio') : t('mute_audio')}
              >
                <span aria-hidden="true">{isMuted ? '🔇' : '🔊'}</span>
              </button>
            )}
            <button
              className="btn btn--icon sticker-book__close"
              onClick={onClose}
              aria-label={t('sticker_book_close') || t('sticker_book_close_aria')}
            >
              ✕
            </button>
          </div>
        </div>
        <div className="sticker-book__count" aria-live="polite">
          {t('stickers_collected_count', { count: stickers.length, total: CRACKERS.length })}
        </div>
        <div className="sticker-grid">
          {CRACKERS.map((cracker) => (
            <StickerTile
              key={cracker.id}
              cracker={cracker}
              unlocked={stickers.includes(cracker.id)}
            />
          ))}
        </div>
        <div className="sticker-book__parent">
          <p className="sticker-book__parent-label">{t('parent_unlock_label')}</p>
          <button
            className="btn btn--secondary btn--parent-unlock"
            onPointerDown={startHold}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            aria-label={t('parent_unlock_aria')}
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            {holding
              ? t('parent_unlocking_progress', { pct: Math.round(holdProgress * 100) })
              : t('parent_unlock_btn')}
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
