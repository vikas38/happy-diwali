import React, { useEffect, useRef, useState } from 'react'

export default function HUD({
  onBack,
  calmVisuals,
  onToggleCalmVisuals,
  reducedMotion,
  onToggleMotion,
  showSettings = true,
  masterVolume,
  intensity,
  stars,
  onVolumeChange,
  onIntensityChange,
  onOpenStickerBook,
  onCalmCorner,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!settingsOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSettingsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [settingsOpen])

  return (
    <header className="game-navbar game-hud" role="banner">
      <div className="game-nav-left">
        {onBack && (
          <button className="back-home" onClick={onBack} aria-label="Back to festival">
            ← Back to festival
          </button>
        )}
        <div className="game-nav-divider" aria-hidden="true" />
        <div className="game-wordmark">
          <span>✳</span>
          <div>
            LITTLE LIGHTS
            <small>THE DIWALI COURTYARD</small>
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="game-settings">
          <button
            className="game-collection"
            onClick={onOpenStickerBook}
            aria-label="Open Sticker Book"
          >
            ✧ <span>{stars}</span>
          </button>

          <button
            className="game-settings-btn"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            aria-expanded={settingsOpen}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Settings</span>
          </button>

          <button
            className="game-pause"
            onClick={onCalmCorner}
            aria-label="Take a breath"
          >
            Ⅱ <span>Take a breath</span>
          </button>
        </div>
      )}

      {settingsOpen && (
        <>
          <div
            className="hud-settings-backdrop"
            onClick={() => setSettingsOpen(false)}
            aria-hidden="true"
          />
          <dialog
            ref={dialogRef}
            open
            className="hud-settings-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Courtyard Settings"
          >
            <div className="sheet-header">
              <h3>Courtyard Settings</h3>
              <button
                className="sheet-close-btn"
                onClick={() => setSettingsOpen(false)}
                aria-label="Close settings"
              >
                ×
              </button>
            </div>

            <div className="sheet-body">
              <label className="sheet-row">
                <span className="sheet-label">
                  Master Volume <span className="sheet-val">{Math.round(masterVolume * 100)}%</span>
                </span>
                <input
                  aria-label="Master Volume"
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(masterVolume * 100)}
                  onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
                />
              </label>

              <div className="sheet-row">
                <span className="sheet-label">Sound Level</span>
                <div className="game-sound-modes" role="group" aria-label="Sound Level">
                  {[
                    { id: 'SOFT', label: 'Gentle', hint: 'Soft & gentle' },
                    { id: 'NORMAL', label: 'Natural', hint: 'Standard' },
                    { id: 'LOUD', label: 'Full', hint: 'Festive' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      aria-pressed={intensity === mode.id}
                      className={intensity === mode.id ? 'active' : ''}
                      onClick={() => onIntensityChange(mode.id)}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sheet-row">
                <span className="sheet-label">Visual Comfort</span>
                <button
                  type="button"
                  className="motion-control sheet-motion-btn"
                  aria-pressed={Boolean(calmVisuals ?? reducedMotion)}
                  onClick={onToggleCalmVisuals || onToggleMotion}
                  aria-label={`Calm visuals ${Boolean(calmVisuals ?? reducedMotion) ? 'on' : 'off'}`}
                >
                  <span aria-hidden="true">🍃</span> Calm visuals {Boolean(calmVisuals ?? reducedMotion) ? 'ON' : 'OFF'}
                </button>
                <small className="sheet-row-hint">Halves particle bursts, softens motion, and suppresses all flashing.</small>
              </div>
            </div>

            <div className="sheet-footer">
              <button
                type="button"
                className="btn btn--primary sheet-done-btn"
                onClick={() => setSettingsOpen(false)}
              >
                Done
              </button>
            </div>
          </dialog>
        </>
      )}
    </header>
  )
}
