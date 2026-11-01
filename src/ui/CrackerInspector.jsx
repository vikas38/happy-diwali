import React, { useState, useEffect, useRef } from 'react'
import ModalOverlay from './controls/ModalOverlay.jsx'
import CrackerArt from './CrackerArt.jsx'
import { t } from '../i18n/index.js'
import { PALETTE_DEFINITIONS } from '../crackers/crackerDefs.js'

/**
 * CrackerInspector — Rich metadata inspection panel for selected crackers.
 * DIW-011: Authored duration, plain-language description, category, palettes,
 * separated natural sound vs playback intensity, explicit silent preview, and
 * clear primary Ask grown-up to light action.
 * DIW-027 / DIW-028: Curated palette picker and controlled launch placement.
 */
export default function CrackerInspector({
  cracker,
  title: propTitle,
  isOpen = true,
  onClose,
  onCancel,
  onPutOnStreet,
  onLight,
  isUnlocked = true,
  isFavorite = false,
  onToggleFavorite,
  onCustomize,
  selectedPalette = 'GOLD',
  onSelectPalette,
  selectedPlacement = 'center',
  onSelectPlacement,
  playbackIntensity = 'SOFT',
  titleId = 'intro-card-title',
}) {
  const [previewing, setPreviewing] = useState(false)
  const timerRef = useRef(null)

  const handleClose = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setPreviewing(false)
    if (onClose) onClose()
    else if (onCancel) onCancel()
  }

  const handlePrimaryAction = () => {
    if (!isUnlocked) return
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setPreviewing(false)
    if (onPutOnStreet) onPutOnStreet()
    else if (onLight) onLight()
  }

  // Explicit, silent short visual preview
  const handleTogglePreview = () => {
    if (previewing) {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = null
      setPreviewing(false)
      return
    }

    setPreviewing(true)
    timerRef.current = setTimeout(() => {
      setPreviewing(false)
      timerRef.current = null
    }, 1800)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  if (!cracker) return null

  const displayDuration = Math.round(cracker.duration || 3)
  const palettesList = Array.isArray(cracker.palettes) ? cracker.palettes.join(', ') : 'Gold'
  const naturalSound = cracker.soundCharacter || cracker.audioProfile || 'Soft crackle'

  return (
    <ModalOverlay
      isOpen={isOpen}
      onClose={handleClose}
      title={propTitle || cracker.name}
      titleId={titleId}
      subtitle={cracker.descriptor}
      className="inspector-overlay"
      cardClassName="inspector-modal-card"
    >
      <div className="inspector-content">
        {/* Visual Stage with optional silent preview shimmer */}
        <div className={`inspector-visual ${previewing ? 'is-previewing' : ''}`}>
          <CrackerArt
            artKey={cracker.artKey}
            width={100}
            height={100}
            isLocked={!isUnlocked}
            isSelected={true}
          />
          {previewing && (
            <div className="inspector-preview-shimmer" aria-hidden="true">
              <span className="shimmer-particle shimmer-p1">✨</span>
              <span className="shimmer-particle shimmer-p2">✦</span>
              <span className="shimmer-particle shimmer-p3">✨</span>
            </div>
          )}
        </div>

        {/* Plain Language Description */}
        <p className="inspector-description">{cracker.description}</p>

        {/* Metadata Details Grid */}
        <div className="inspector-specs-grid" role="region" aria-label={t('specs_region_aria')}>
          <div className="inspector-spec-item">
            <span className="inspector-spec-label">{t('inspector_duration_label')}</span>
            <strong className="inspector-spec-value">
              {t('inspector_duration_value', { seconds: displayDuration })}
            </strong>
          </div>

          <div className="inspector-spec-item">
            <span className="inspector-spec-label">{t('inspector_category_label')}</span>
            <strong className="inspector-spec-value inspector-spec-tag">
              {cracker.category || 'Ground'}
            </strong>
          </div>

          <div className="inspector-spec-item">
            <span className="inspector-spec-label">{t('inspector_sound_label')}</span>
            <strong className="inspector-spec-value">{naturalSound}</strong>
          </div>

          <div className="inspector-spec-item">
            <span className="inspector-spec-label">{t('inspector_playback_label')}</span>
            <strong className="inspector-spec-value">
              {t('inspector_playback_value', {
                mode: playbackIntensity,
                style: playbackIntensity === 'SOFT' ? 'Gentle' : 'Festive',
              })}
            </strong>
          </div>

          {cracker.palettes && (
            <div className="inspector-spec-item inspector-spec-item--full">
              <span className="inspector-spec-label">{t('inspector_palettes_label')}</span>
              <strong className="inspector-spec-value">{palettesList}</strong>
            </div>
          )}
        </div>

        {/* Curated Palette Selector (DIW-027) */}
        {Array.isArray(cracker.palettes) && cracker.palettes.length > 0 && (
          <div
            className="inspector-palette-section"
            role="region"
            aria-label={t('inspector_palettes_label')}
          >
            <span className="inspector-spec-label">{t('inspector_palettes_label')}</span>
            <div
              className="inspector-palette-chips"
              role="radiogroup"
              aria-label={t('inspector_palettes_label')}
            >
              {cracker.palettes.map((palKey) => {
                const palDef = PALETTE_DEFINITIONS[palKey] || {
                  key: palKey,
                  name: palKey,
                  swatches: ['#F59E0B'],
                }
                const isSelected = selectedPalette === palKey
                return (
                  <button
                    key={palKey}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`inspector-palette-chip ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => onSelectPalette && onSelectPalette(cracker.id, palKey)}
                    aria-label={`${palDef.name}${isSelected ? ' (Selected)' : ''}`}
                  >
                    <span className="palette-chip-swatches" aria-hidden="true">
                      {palDef.swatches.map((color, sIdx) => (
                        <span
                          key={sIdx}
                          className="palette-chip-dot"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </span>
                    <span className="palette-chip-name">{palDef.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Controlled Launch Placement Selector (DIW-028) */}
        <div
          className="inspector-placement-section"
          role="region"
          aria-label={t('inspector_placement_label')}
        >
          <span className="inspector-spec-label">{t('inspector_placement_label')}</span>
          <div
            className="inspector-placement-chips"
            role="radiogroup"
            aria-label={t('inspector_placement_label')}
          >
            {[
              { key: 'left', labelKey: 'placement_left' },
              { key: 'center', labelKey: 'placement_center' },
              { key: 'right', labelKey: 'placement_right' },
            ].map((p) => {
              const label = t(p.labelKey)
              const isSelected = selectedPlacement === p.key
              return (
                <button
                  key={p.key}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`inspector-placement-chip ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => onSelectPlacement && onSelectPlacement(p.key)}
                  aria-label={`${label}${isSelected ? ' (Selected)' : ''}`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Locked reason banner if locked */}
        {!isUnlocked && (
          <div className="inspector-locked-banner" role="status">
            <span aria-hidden="true">🔒</span>
            <p>{t('inspector_locked_reason')}</p>
          </div>
        )}

        {/* Primary Action Button */}
        <button
          type="button"
          className="gp-btn gp-btn--primary inspector-primary-btn"
          onClick={handlePrimaryAction}
          disabled={!isUnlocked}
          autoFocus={isUnlocked}
          aria-label={
            isUnlocked
              ? t('inspector_ask_grownup_aria', { name: cracker.name })
              : t('badge_locked_label')
          }
        >
          {isUnlocked ? t('inspector_ask_grownup_btn') : t('badge_locked_label')}
        </button>

        {/* Secondary Actions Bar */}
        <div className="inspector-secondary-actions">
          <button
            type="button"
            className={`gp-btn gp-btn--secondary inspector-preview-btn ${previewing ? 'is-active' : ''}`}
            onClick={handleTogglePreview}
            aria-label={
              previewing
                ? t('inspector_preview_active')
                : t('inspector_preview_aria', { name: cracker.name })
            }
          >
            {previewing ? t('inspector_preview_active') : t('inspector_preview_btn')}
          </button>

          {onToggleFavorite && (
            <button
              type="button"
              className={`gp-btn gp-btn--secondary inspector-fav-btn ${isFavorite ? 'is-fav' : ''}`}
              onClick={() => onToggleFavorite(cracker.id)}
              aria-pressed={isFavorite}
              aria-label={
                isFavorite
                  ? t('fav_remove_aria', { name: cracker.name })
                  : t('fav_add_aria', { name: cracker.name })
              }
            >
              <span aria-hidden="true">{isFavorite ? '♥' : '♡'}</span> {t('inspector_fav_btn')}
            </button>
          )}

          {onCustomize && (
            <button
              type="button"
              className="gp-btn gp-btn--secondary inspector-customize-btn"
              onClick={onCustomize}
            >
              {t('inspector_customize_btn')}
            </button>
          )}
        </div>
      </div>
    </ModalOverlay>
  )
}
