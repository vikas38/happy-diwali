import React, { useCallback, useEffect, useRef, useState } from 'react'
import { t } from '../i18n/index.js'

export default function HUD({
  onBack,
  calmVisuals,
  onToggleCalmVisuals,
  reducedMotion,
  onToggleMotion,
  motionPolicy = 'SYSTEM',
  onMotionPolicyChange,
  showSettings = true,
  settingsOpen: controlledSettingsOpen,
  onOpenSettings,
  onCloseSettings,
  masterVolume,
  intensity,
  stars,
  selectedPalette = 'GOLD',
  onPaletteChange,
  onVolumeChange,
  onIntensityChange,
  onToggleMute,
  onTestSound,
  onOpenStickerBook,
  onCalmCorner,
  onReplayHints,
}) {
  const [internalSettingsOpen, setInternalSettingsOpen] = useState(false)
  const isSettingsOpen =
    typeof controlledSettingsOpen !== 'undefined' ? controlledSettingsOpen : internalSettingsOpen
  const handleOpenSettings = useCallback(() => {
    if (onOpenSettings) onOpenSettings()
    else setInternalSettingsOpen(true)
  }, [onOpenSettings])
  const handleCloseSettings = useCallback(() => {
    if (onCloseSettings) onCloseSettings()
    else setInternalSettingsOpen(false)
  }, [onCloseSettings])
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!isSettingsOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleCloseSettings()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSettingsOpen, handleCloseSettings])

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
            type="button"
            className="motion-control"
            aria-pressed={reducedMotion}
            onClick={onToggleMotion || onToggleCalmVisuals}
          >
            {reducedMotion ? t('gentle_visuals_on') : t('gentle_visuals_off')}
          </button>

          <button
            className="game-settings-btn"
            onClick={handleOpenSettings}
            aria-label={t('settings')}
            aria-expanded={isSettingsOpen}
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

          <button
            className="game-pause"
            onClick={onCalmCorner}
            aria-label={`${t('take_a_breath')} · Calm Corner`}
          >
            Ⅱ <span>{t('take_a_breath_btn')}</span>
          </button>
        </div>
      )}

      {isSettingsOpen && (
        <>
          <div className="hud-settings-backdrop" onClick={handleCloseSettings} aria-hidden="true" />
          <dialog
            ref={dialogRef}
            open
            className="hud-settings-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hud-settings-title"
          >
            <div className="sheet-header">
              <h3 id="hud-settings-title">{t('courtyard_settings')}</h3>
              <button
                className="sheet-close-btn"
                onClick={handleCloseSettings}
                aria-label={t('close_settings')}
              >
                ×
              </button>
            </div>

            <div className="sheet-body">
              <div className="sheet-row sheet-volume-row">
                <div className="sheet-volume-header">
                  <span className="sheet-label">
                    {t('master_volume')}{' '}
                    <span className="sheet-val">{Math.round(masterVolume * 100)}%</span>
                  </span>
                  {onToggleMute && (
                    <button
                      type="button"
                      className="sheet-mute-btn"
                      onClick={onToggleMute}
                      aria-pressed={masterVolume === 0}
                      aria-label={masterVolume === 0 ? t('unmute_audio') : t('mute_audio')}
                    >
                      <span aria-hidden="true">{masterVolume === 0 ? '🔇' : '🔊'}</span>
                      <span>{masterVolume === 0 ? t('unmute') : t('mute')}</span>
                    </button>
                  )}
                </div>
                <input
                  aria-label={t('master_volume')}
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(masterVolume * 100)}
                  onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
                />
              </div>

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
                <span className="sheet-label">{t('motion_policy')}</span>
                <div className="game-sound-modes" role="group" aria-label={t('motion_policy')}>
                  <button
                    type="button"
                    className={motionPolicy === 'SYSTEM' ? 'active' : ''}
                    aria-pressed={motionPolicy === 'SYSTEM'}
                    onClick={() => {
                      if (onMotionPolicyChange) onMotionPolicyChange('SYSTEM')
                      else if (onToggleCalmVisuals) onToggleCalmVisuals()
                    }}
                  >
                    <span aria-hidden="true">✦</span> {t('motion_system')}
                  </button>
                  <button
                    type="button"
                    className={motionPolicy === 'REDUCED' ? 'active' : ''}
                    aria-pressed={motionPolicy === 'REDUCED'}
                    onClick={() => {
                      if (onMotionPolicyChange) onMotionPolicyChange('REDUCED')
                      else if (onToggleCalmVisuals) onToggleCalmVisuals()
                    }}
                  >
                    <span aria-hidden="true">🍃</span> {t('motion_reduced')}
                  </button>
                  <button
                    type="button"
                    className={motionPolicy === 'FULL' ? 'active' : ''}
                    aria-pressed={motionPolicy === 'FULL'}
                    onClick={() => {
                      if (onMotionPolicyChange) onMotionPolicyChange('FULL')
                      else if (onToggleCalmVisuals) onToggleCalmVisuals()
                    }}
                  >
                    <span aria-hidden="true">✨</span> {t('motion_full')}
                  </button>
                </div>
                <small className="sheet-row-hint">{t('motion_policy_hint')}</small>
              </div>

              <div className="sheet-row">
                <span className="sheet-label">{t('sparkle_palette')}</span>
                <div className="game-sound-modes" role="group" aria-label={t('sparkle_palette')}>
                  <button
                    type="button"
                    className={selectedPalette === 'GOLD' ? 'active' : ''}
                    aria-pressed={selectedPalette === 'GOLD'}
                    onClick={() => onPaletteChange?.('GOLD')}
                    aria-label={t('palette_gold')}
                  >
                    <span aria-hidden="true">✨</span> {t('palette_gold')}
                  </button>
                  <button
                    type="button"
                    className={selectedPalette === 'RAINBOW' ? 'active' : ''}
                    aria-pressed={selectedPalette === 'RAINBOW'}
                    onClick={() => onPaletteChange?.('RAINBOW')}
                    aria-label={t('palette_rainbow')}
                  >
                    <span aria-hidden="true">✦</span> {t('palette_rainbow')}
                  </button>
                  <button
                    type="button"
                    className={selectedPalette === 'ROSE' ? 'active' : ''}
                    aria-pressed={selectedPalette === 'ROSE'}
                    onClick={() => onPaletteChange?.('ROSE')}
                    aria-label={t('palette_rose')}
                  >
                    <span aria-hidden="true">🌸</span> {t('palette_rose')}
                  </button>
                  <button
                    type="button"
                    className={selectedPalette === 'EMERALD' ? 'active' : ''}
                    aria-pressed={selectedPalette === 'EMERALD'}
                    onClick={() => onPaletteChange?.('EMERALD')}
                    aria-label={t('palette_emerald')}
                  >
                    <span aria-hidden="true">🍃</span> {t('palette_emerald')}
                  </button>
                </div>
                <small className="sheet-row-hint">{t('sparkle_palette_hint')}</small>
              </div>

              {onReplayHints && (
                <div className="sheet-row sheet-test-row">
                  <span className="sheet-label">{t('help_and_hints')}</span>
                  <button
                    type="button"
                    className="btn btn--secondary sheet-test-btn"
                    onClick={() => {
                      onReplayHints()
                      handleCloseSettings()
                    }}
                    aria-label={t('replay_hints_aria')}
                  >
                    <span aria-hidden="true">✦</span> {t('replay_hints')}
                  </button>
                  <small className="sheet-row-hint">{t('replay_hints_hint')}</small>
                </div>
              )}
            </div>

            <div className="sheet-footer">
              <button
                type="button"
                className="btn btn--primary sheet-done-btn"
                onClick={handleCloseSettings}
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
