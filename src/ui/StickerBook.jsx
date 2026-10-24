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
      <span className="sticker-tile__name">
        {cracker.name}
        {cracker.descriptor && (
          <small className="sticker-tile__descriptor"> · {cracker.descriptor}</small>
        )}
      </span>
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
  const [showConfirm, setShowConfirm] = useState(false)
  const holdStartRef = React.useRef(null)
  const rafRef = React.useRef(null)
  const isUnlockedAll = stickers.length >= CRACKERS.length

  const stopHold = React.useCallback(() => {
    setHolding(false)
    setHoldProgress(0)
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const startHold = React.useCallback(() => {
    if (isUnlockedAll) return
    setHolding(true)
    holdStartRef.current = Date.now()
    function tick() {
      const elapsed = Date.now() - holdStartRef.current
      const prog = Math.min(1, elapsed / 2000)
      setHoldProgress(prog)
      if (prog < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        stopHold()
        onUnlockAll()
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [isUnlockedAll, onUnlockAll, stopHold])

  React.useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (showConfirm) {
          setShowConfirm(false)
        } else {
          stopHold()
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
      stopHold()
    }
  }, [onClose, showConfirm, stopHold])

  const handleConfirmUnlock = () => {
    setShowConfirm(false)
    stopHold()
    onUnlockAll()
  }

  const handleCancelConfirm = () => {
    setShowConfirm(false)
    stopHold()
  }

  const handleClose = () => {
    stopHold()
    setShowConfirm(false)
    onClose()
  }

  return (
    <div
      className="overlay overlay--sticker"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sticker-book-title"
    >
      <div className="sticker-book">
        <div className="sticker-book__header">
          <h2 id="sticker-book-title" className="sticker-book__title">
            {t('sticker_book_title')}
          </h2>
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
              onClick={handleClose}
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
          {showConfirm ? (
            <div
              className="parent-confirm-box"
              role="alertdialog"
              aria-modal="true"
              aria-label={t('parent_confirm_title')}
            >
              <p className="parent-confirm-desc">{t('parent_confirm_desc')}</p>
              <div className="parent-confirm-actions">
                <button
                  type="button"
                  className="btn btn--primary parent-confirm-btn"
                  onClick={handleConfirmUnlock}
                  autoFocus
                >
                  {t('parent_confirm_btn')}
                </button>
                <button
                  type="button"
                  className="btn btn--secondary parent-cancel-btn"
                  onClick={handleCancelConfirm}
                >
                  {t('parent_cancel_btn')}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className={`btn btn--secondary btn--parent-unlock ${holding ? 'is-holding' : ''}`}
              onPointerDown={startHold}
              onPointerUp={stopHold}
              onPointerCancel={stopHold}
              onPointerLeave={stopHold}
              onBlur={stopHold}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setShowConfirm(true)
                }
              }}
              onClick={() => {
                if (!holding && holdProgress === 0) {
                  setShowConfirm(true)
                }
              }}
              disabled={isUnlockedAll}
              aria-label={isUnlockedAll ? t('parent_unlock_done') : t('parent_unlock_aria')}
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              {isUnlockedAll
                ? t('parent_unlock_done')
                : holding
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
          )}
        </div>
      </div>
    </div>
  )
}
