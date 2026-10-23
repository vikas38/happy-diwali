import React, { useEffect, useRef, useState } from 'react'
import { t } from '../i18n/index.js'

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
  onToggleMute,
  onTestSound,
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

  const soundModes = [
    { id: 'SOFT', icon: '🔈', label: t('sound_gentle'), hint: t('sound_gentle_hint') },
    { id: 'NORMAL', icon: '🔉', label: t('sound_natural'), hint: t('sound_natural_hint') },
    { id: 'LOUD', icon: '🔊', label: t('sound_full'), hint: t('sound_full_hint') },
  ]

  return (
    <header className="game-navbar game-hud" role="banner">
      <div className="game-nav-left">
        {onBack && (
          <button className="back-home" onClick={onBack} aria-label={t('back_to_festival')}>
            {t('back_to_festival_btn')}
          </button>
        )}
        <div className="game-nav-divider" aria-hidden="true" />
        <div className="game-wordmark">
          <span>✳</span>
          <div>
            {t('brand_name')}
            <small>{t('brand_tagline')}</small>
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="game-settings">
          <button
            className="game-collection"
            onClick={onOpenStickerBook}
            aria-label={t('open_sticker_book')}
          >
            ✧ <span>{stars}</span>
          </button>

          <button
            type="button"
            className="game-mute-btn"
            onClick={onToggleMute}
            aria-label={masterVolume === 0 ? t('unmute_audio') : t('mute_audio')}
            aria-pressed={masterVolume === 0}
            title={masterVolume === 0 ? t('unmute_audio') : t('mute_audio')}
          >
            <span aria-hidden="true">{masterVolume === 0 ? '🔇' : '🔊'}</span>
            <span>{masterVolume === 0 ? t('unmute') : t('mute')}</span>
          </button>

          <button
            className="game-settings-btn"
            onClick={() => setSettingsOpen(true)}
            aria-label={t('settings')}
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
            <span>{t('settings')}</span>
          </button>

          <button className="game-pause" onClick={onCalmCorner} aria-label={t('take_a_breath')}>
            Ⅱ <span>{t('take_a_breath_btn')}</span>
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
            aria-label={t('courtyard_settings')}
          >
            <div className="sheet-header">
              <h3>{t('courtyard_settings')}</h3>
              <button
                className="sheet-close-btn"
                onClick={() => setSettingsOpen(false)}
                aria-label={t('close_settings')}
              >
                ×
              </button>
            </div>

            <div className="sheet-body">
              <label className="sheet-row">
                <span className="sheet-label">
                  {t('master_volume')}{' '}
                  <span className="sheet-val">{Math.round(masterVolume * 100)}%</span>
                </span>
                <input
                  aria-label={t('master_volume')}
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(masterVolume * 100)}
                  onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
                />
              </label>

              <div className="sheet-row">
                <span className="sheet-label">{t('sound_level')}</span>
                <div className="game-sound-modes" role="group" aria-label={t('sound_level')}>
                  {soundModes.map((mode) => (
                    <button
                      key={mode.id}
                      aria-pressed={intensity === mode.id}
                      className={intensity === mode.id ? 'active' : ''}
                      onClick={() => onIntensityChange(mode.id)}
                      aria-label={t('sound_mode_label', { mode: mode.label })}
                    >
                      <span aria-hidden="true">{mode.icon}</span> {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sheet-row sheet-test-row">
                <span className="sheet-label">{t('test_volume')}</span>
                <button
                  type="button"
                  className="btn btn--secondary sheet-test-btn"
                  onClick={onTestSound}
                  aria-label={t('test_sound_aria')}
                >
                  <span aria-hidden="true">🔔</span> {t('test_sound')}
                </button>
                <small className="sheet-row-hint">{t('test_sound_hint')}</small>
              </div>

              <div className="sheet-row">
                <span className="sheet-label">{t('visual_comfort')}</span>
                <button
                  type="button"
                  className="motion-control sheet-motion-btn"
                  aria-pressed={Boolean(calmVisuals ?? reducedMotion)}
                  onClick={onToggleCalmVisuals || onToggleMotion}
                  aria-label={t('calm_visuals_toggle', {
                    state: Boolean(calmVisuals ?? reducedMotion) ? 'on' : 'off',
                  })}
                >
                  <span aria-hidden="true">🍃</span> {t('calm_visuals')}{' '}
                  {Boolean(calmVisuals ?? reducedMotion) ? 'ON' : 'OFF'}
                </button>
                <small className="sheet-row-hint">{t('calm_visuals_hint')}</small>
              </div>
            </div>

            <div className="sheet-footer">
              <button
                type="button"
                className="btn btn--primary sheet-done-btn"
                onClick={() => setSettingsOpen(false)}
              >
                {t('done')}
              </button>
            </div>
          </dialog>
        </>
      )}
    </header>
  )
}
