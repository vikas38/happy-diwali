import React, { useEffect, useRef } from 'react'
import { CRACKERS } from '../crackers/crackerDefs.js'
import CrackerArt from './CrackerArt.jsx'
import { t } from '../i18n/index.js'

/**
 * CrackerCarousel — Generous art-led quick-access tray for crackers.
 * Displays current subset with visible selected checkmark, descriptors,
 * and a direct "Browse all" action for library expansion.
 */
export default function CrackerCarousel({
  unlocked = [0],
  selectedCracker = 0,
  onSelect,
  onOpenLibrary,
  favorites = [],
  newItems = [],
}) {
  const selectedRef = useRef(null)

  const labels = [
    t('tagline_phuljhari'),
    t('tagline_anar'),
    t('tagline_chakri'),
    t('tagline_rocket'),
    t('tagline_ladi'),
    t('tagline_sutli'),
  ]

  useEffect(() => {
    if (selectedRef.current && typeof selectedRef.current.scrollIntoView === 'function') {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [selectedCracker])

  const handleKeyDown = (e, i) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      const next = (i + 1) % CRACKERS.length
      const btn = document.querySelectorAll('.firework-choice')[next]
      btn?.focus()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = (i - 1 + CRACKERS.length) % CRACKERS.length
      const btn = document.querySelectorAll('.firework-choice')[prev]
      btn?.focus()
    }
  }

  const selectedItem =
    selectedCracker !== null && selectedCracker !== undefined ? CRACKERS[selectedCracker] : null

  return (
    <nav className="firework-dock" aria-label={t('dock_aria')}>
      <div className="dock-heading">
        <div className="dock-heading__left">
          <span className="dock-title">{t('dock_heading')}</span>
          <small className="dock-descriptor">
            {selectedItem
              ? `${selectedItem.name} · ${selectedItem.descriptor} — ${labels[selectedCracker] || selectedItem.descriptor}`
              : t('dock_subheading')}
          </small>
        </div>
        {onOpenLibrary && (
          <button
            type="button"
            className="dock-browse-all-btn"
            onClick={onOpenLibrary}
            aria-label={t('browse_all_aria')}
          >
            <span aria-hidden="true">{t('search_icon')}</span>
            <span>{t('browse_all')}</span>
          </button>
        )}
      </div>

      <div className="firework-tray" role="listbox" aria-label={t('dock_tray_aria')}>
        {CRACKERS.map((c, i) => {
          const isUnlocked = unlocked.includes(c.id)
          const isSelected = selectedCracker === c.id
          const isFav = favorites.includes(c.id)
          const isNew = newItems.includes(c.id)

          const tagline = labels[i] || c.descriptor || ''

          return (
            <button
              key={c.id}
              ref={isSelected ? selectedRef : null}
              type="button"
              role="option"
              data-id={c.id}
              className={`firework-choice ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'is-locked' : ''} ${isFav ? 'is-favorite' : ''}`}
              disabled={!isUnlocked}
              aria-disabled={!isUnlocked}
              aria-label={
                isUnlocked
                  ? `${c.name}, ${tagline}${isSelected ? ' (Selected)' : ''}`
                  : `${c.name}${t('dock_locked_suffix')}`
              }
              aria-selected={isSelected}
              onClick={() => onSelect(c.id)}
              onKeyDown={(e) => handleKeyDown(e, i)}
            >
              <span className="choice-number" aria-hidden="true">
                0{i + 1}
              </span>

              {/* Badges */}
              {isFav && (
                <span className="choice-badge-fav" aria-label={t('badge_favourite')}>
                  {t('fav_heart')}
                </span>
              )}
              {isNew && isUnlocked && (
                <span className="choice-badge-new" aria-label={t('badge_new')}>
                  {t('badge_new')}
                </span>
              )}
              {/* Visible selected checkmark for color-independence */}
              {isSelected && (
                <span className="choice-selected-indicator" aria-hidden="true">
                  {t('selected_check')}
                </span>
              )}

              <div className="choice-art-wrap">
                <CrackerArt
                  id={c.id}
                  variant={!isUnlocked ? 'locked' : isSelected ? 'selected' : 'default'}
                />
                {!isUnlocked && (
                  <span className="choice-lock-badge" aria-hidden="true">
                    🔒
                  </span>
                )}
              </div>

              <strong>{c.name}</strong>
              <small className="choice-tagline">{isUnlocked ? tagline : t('dock_locked')}</small>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
