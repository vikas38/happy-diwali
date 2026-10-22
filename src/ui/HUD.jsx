import React from 'react'

export default function HUD({
  onBack,
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
        <div className="game-settings"><button className="motion-control" aria-pressed={reducedMotion} onClick={onToggleMotion}>Gentle visuals {reducedMotion ? 'on' : 'off'}</button>
          <label className="game-volume">
            <span aria-hidden="true">◖))</span>
            <input
              aria-label="Master Volume"
              type="range"
              min="0"
              max="100"
              value={Math.round(masterVolume * 100)}
              onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
            />
          </label>
          <div className="game-sound-modes" role="group" aria-label="Sound Intensity">
            {['SOFT', 'NORMAL', 'LOUD'].map((mode) => (
              <button
                key={mode}
                aria-pressed={intensity === mode}
                onClick={() => onIntensityChange(mode)}
              >
                {mode === 'SOFT' ? 'Gentle' : mode === 'NORMAL' ? 'Natural' : 'Full'}
              </button>
            ))}
          </div>
          <button
            className="game-collection"
            onClick={onOpenStickerBook}
            aria-label="Open Sticker Book"
          >
            ✧ <span>{stars}</span>
          </button>
          <button
            className="game-pause"
            onClick={onCalmCorner}
            aria-label="Calm Corner"
          >
            Ⅱ <span>Take a breath</span>
          </button>
        </div>
      )}
    </header>
  )
}
