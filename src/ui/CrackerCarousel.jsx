import React, { useEffect, useRef } from 'react'
import { CRACKERS } from '../crackers/crackerDefs.js'
import CrackerArt from './CrackerArt.jsx'
import { t } from '../i18n/index.js'

/**
 * CrackerCarousel — macOS-Style Floating Cracker Dock (Taskbar).
 * Renders all crackers side-by-side in a sleek, frosted-glass floating dock
 * along the bottom with icons and names (no descriptions), supporting smooth
 * hover magnification, active indicator dot, and instant selection.
 */
export default function CrackerCarousel({
  unlocked = [0],
  selectedCracker = 0,
  onSelect,
  onOpenLibrary,
  favorites = [],
  newItems = [],
  isDrawerOpen,
  onToggleDrawer,
  onCloseDrawer,
}) {
  const selectedRef = useRef(null)

  const getTagline = (cracker) => {
    const key = `tagline_${cracker.stableKey}`
    const localized = t(key)
    return localized && localized !== key ? localized : cracker.descriptor || ''
  }

  useEffect(() => {
    if (selectedRef.current && typeof selectedRef.current.scrollIntoView === 'function') {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [selectedCracker])

  const handleKeyDown = (e, i, list) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      const next = (i + 1) % list.length
      const btn = document.querySelectorAll('.firework-choice')[next]
      btn?.focus()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = (i - 1 + list.length) % list.length
      const btn = document.querySelectorAll('.firework-choice')[prev]
      btn?.focus()
    } else if (e.key === 'Escape' && onCloseDrawer) {
      onCloseDrawer()
    }
  }

  const selectedItem =
    selectedCracker !== null && selectedCracker !== undefined ? CRACKERS[selectedCracker] : null

  const handleSelectCard = (id) => {
    onSelect(id)
    if (onCloseDrawer) {
      onCloseDrawer()
    }
  }

  return (
    <nav
      className="macos-dock firework-dock"
      aria-label={t('dock_aria')}
    >
      {/* Accessible Dock Heading for Screen Readers and Test Metadata */}
      <div className="dock-heading sr-only" aria-live="polite">
        <div className="dock-heading__left">
          <span className="dock-title">{t('dock_heading')}</span>
          <small className="dock-descriptor">
            {selectedItem
              ? `${selectedItem.name} · ${selectedItem.descriptor} — ${getTagline(selectedItem)}`
              : t('dock_subheading')}
          </small>
        </div>
      </div>

      {/* Floating Taskbar Items Container */}
      <div className="macos-dock__items firework-tray" role="listbox" aria-label={t('dock_tray_aria')}>
        {CRACKERS.map((c, i) => {
          const isUnlocked = unlocked.includes(c.id)
          const isSelected = selectedCracker === c.id
          const isFav = favorites.includes(c.id)
          const isNew = newItems.includes(c.id)
          const tagline = getTagline(c)

          return (
            <button
              key={c.id}
              ref={isSelected ? selectedRef : null}
              type="button"
              role="option"
              data-id={c.id}
              className={`macos-dock__item firework-choice ${isSelected ? 'selected is-selected' : ''} ${!isUnlocked ? 'is-locked' : ''} ${isFav ? 'is-favorite' : ''}`}
              disabled={!isUnlocked}
              aria-disabled={!isUnlocked}
              aria-label={
                isUnlocked
                  ? `${c.name}, ${tagline}${isSelected ? ' (Selected)' : ''}`
                  : `${c.name}${t('dock_locked_suffix')}`
              }
              aria-selected={isSelected}
              onClick={() => handleSelectCard(c.id)}
              onKeyDown={(e) => handleKeyDown(e, i, CRACKERS)}
            >
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

              {/* Accessible selected checkmark */}
              {isSelected && (
                <span className="choice-selected-indicator" aria-hidden="true">
                  {t('selected_check')}
                </span>
              )}

              {/* Cracker Art Icon */}
              <div className="choice-art-wrap macos-dock__icon-wrap">
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

              {/* Name only (no description) */}
              <strong className="macos-dock__name">{c.name}</strong>

              {/* Screen-reader only tagline for accessibility and tests */}
              <small className="choice-tagline sr-only">
                {isUnlocked ? tagline : t('dock_locked')}
              </small>

              {/* macOS Active Dot Indicator */}
              {isSelected && <span className="macos-dock__active-dot" aria-hidden="true" />}
            </button>
          )
        })}

        {/* macOS Dock Divider & Browse All Button */}
        {onOpenLibrary && (
          <div className="macos-dock__end-group">
            <div className="macos-dock__divider" aria-hidden="true" />
            <button
              type="button"
              className="dock-browse-all-btn macos-dock__browse-btn"
              onClick={onOpenLibrary}
              aria-label={t('browse_all_aria')}
              title={t('browse_all')}
            >
              <span className="macos-dock__browse-icon" aria-hidden="true">
                {t('search_icon')}
              </span>
              <span className="macos-dock__name">{t('browse_all')}</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
