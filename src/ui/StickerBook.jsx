import React, { useState } from 'react'
import { CRACKERS, CATALOG_GROUPS, getAllCrackers } from '../crackers/crackerDefs.js'
import { t } from '../i18n/index.js'

// ===================================================================
// StickerBook — Rich Discovery Album + Gentle Goals + Parent unlock-all
// DIW-032: Timeless gentle discovery goals
// DIW-033: 14-sticker discovery album grouped by catalog release
// ===================================================================

function StickerTile({ cracker, unlocked, onSelect }) {
  const handleClick = () => {
    if (unlocked && onSelect) {
      onSelect(cracker.id)
    }
  }

  return (
    <div
      className={`sticker-tile${unlocked ? ' sticker-tile--unlocked' : ' sticker-tile--locked'}`}
      aria-label={
        unlocked
          ? t('sticker_collected_aria', { name: cracker.name })
          : t('sticker_locked_aria', { name: cracker.name })
      }
      role="img"
      onClick={handleClick}
      tabIndex={unlocked && onSelect ? 0 : undefined}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && unlocked && onSelect) {
          e.preventDefault()
          onSelect(cracker.id)
        }
      }}
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
      {Array.from({ length: cracker.intensityDots || 2 }).map((_, i) => (
        <span key={i} className="sticker-dot" aria-hidden="true">
          ●
        </span>
      ))}
    </div>
  )
}

export default function StickerBook({
  stickers = [],
  onClose,
  onUnlockAll,
  isMuted = false,
  onToggleMute,
  gentleGoals = {},
  onSelectCracker,
}) {
  const [activeTab, setActiveTab] = useState('stickers')
  const [holdProgress, setHoldProgress] = useState(0)
  const [holding, setHolding] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const holdStartRef = React.useRef(null)
  const rafRef = React.useRef(null)
  const allCrackers = getAllCrackers()
  const isUnlockedAll = stickers.length >= CRACKERS.length || stickers.length >= allCrackers.length

  const groups = [
    {
      key: 'original',
      title: t('group_original_six'),
      items: allCrackers.filter(
        (c) => c.catalogGroup === CATALOG_GROUPS.ORIGINAL || c.id < 6
      ),
    },
    {
      key: 'expansion_r1',
      title: t('group_festival_additions'),
      items: allCrackers.filter(
        (c) =>
          c.catalogGroup === CATALOG_GROUPS.EXPANSION_R1 ||
          (c.id >= 6 && c.id < 10)
      ),
    },
    {
      key: 'expansion_r2',
      title: t('group_sky_collection'),
      items: allCrackers.filter(
        (c) =>
          c.catalogGroup === CATALOG_GROUPS.EXPANSION_R2 || c.id >= 10
      ),
    },
  ]

  const discoveryGoals = [
    {
      id: 'groundAndSky',
      title: t('goal_ground_and_sky'),
      desc: t('goal_ground_and_sky_desc'),
      completed: Boolean(gentleGoals?.groundAndSky),
    },
    {
      id: 'twoPalettes',
      title: t('goal_two_palettes'),
      desc: t('goal_two_palettes_desc'),
      completed: Boolean(gentleGoals?.twoPalettes),
    },
    {
      id: 'decoratedCourtyard',
      title: t('goal_decorated_courtyard'),
      desc: t('goal_decorated_courtyard_desc'),
      completed: Boolean(gentleGoals?.decoratedCourtyard),
    },
  ]

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

        <div className="sticker-book-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'stickers'}
            className={`sticker-tab-btn ${activeTab === 'stickers' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('stickers')}
          >
            {t('tab_stickers')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'goals'}
            className={`sticker-tab-btn ${activeTab === 'goals' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('goals')}
          >
            {t('tab_goals')}
          </button>
        </div>

        <div className="sticker-book__count" aria-live="polite">
          {t('stickers_collected_count', {
            count: stickers.length,
            total: allCrackers.length,
          })}
        </div>

        {activeTab === 'stickers' && (
          <div className="sticker-book-content" role="tabpanel">
            {stickers.length === 0 && (
              <div className="sticker-empty-banner">
                <h3>{t('album_empty_title')}</h3>
                <p>{t('album_empty_desc')}</p>
              </div>
            )}

            {groups.map((group) => {
              const earnedCount = group.items.filter((c) =>
                stickers.includes(c.id)
              ).length
              const totalCount = group.items.length
              const isComplete = earnedCount === totalCount

              return (
                <section
                  key={group.key}
                  className="sticker-group"
                  aria-label={group.title}
                >
                  <div className="sticker-group-header">
                    <h3 className="sticker-group-title">{group.title}</h3>
                    <div className="sticker-group-meta">
                      <span className="sticker-group-count">
                        {`${earnedCount} / ${totalCount}`}
                      </span>
                      {isComplete && (
                        <span className="sticker-group-badge">
                          {t('group_completed_badge')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="sticker-grid">
                    {group.items.map((cracker) => (
                      <StickerTile
                        key={cracker.id}
                        cracker={cracker}
                        unlocked={stickers.includes(cracker.id)}
                        onSelect={onSelectCracker}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="gentle-goals-list" role="tabpanel">
            {discoveryGoals.map((g) => (
              <div
                key={g.id}
                className={`gentle-goal-card ${g.completed ? 'is-completed' : ''}`}
              >
                <div className="gentle-goal-badge" aria-hidden="true">
                  {g.completed ? '⭐' : '✧'}
                </div>
                <div className="gentle-goal-content">
                  <h4 className="gentle-goal-title">{g.title}</h4>
                  <p className="gentle-goal-desc">{g.desc}</p>
                </div>
                <span className="gentle-goal-status">
                  {g.completed ? t('goal_completed') : '—'}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="sticker-book__parent">
          <p className="sticker-book__parent-label">
            {t('parent_unlock_label')}
          </p>
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
              aria-label={
                isUnlockedAll
                  ? t('parent_unlock_done')
                  : t('parent_unlock_aria')
              }
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              {isUnlockedAll
                ? t('parent_unlock_done')
                : holding
                  ? t('parent_unlocking_progress', {
                      pct: Math.round(holdProgress * 100),
                    })
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
