import React, { useState, useMemo } from 'react'
import ModalOverlay from './controls/ModalOverlay.jsx'
import { GameplayChip } from './controls/GameplayControls.jsx'
import CrackerArt from './CrackerArt.jsx'
import { CRACKERS } from '../crackers/crackerDefs.js'
import { t } from '../i18n/index.js'

/**
 * CrackerLibrary — Browsable catalog dialog/sheet for ground and sky effects.
 * DIW-010: Filter by All, Ground, Sky, and Favourites with empty states,
 * result count announcements, and direct favorite toggling.
 */
export default function CrackerLibrary({
  isOpen = true,
  onClose,
  selectedCracker = 0,
  unlocked = [0],
  favorites = [],
  onToggleFavorite,
  onSelect,
}) {
  const [activeFilter, setActiveFilter] = useState('ALL') // 'ALL' | 'GROUND' | 'SKY' | 'FAVOURITES'

  const counts = useMemo(() => {
    return {
      ALL: CRACKERS.length,
      GROUND: CRACKERS.filter((c) => c.category === 'ground').length,
      SKY: CRACKERS.filter((c) => c.category === 'sky').length,
      FAVOURITES: CRACKERS.filter((c) => (favorites || []).includes(c.id)).length,
    }
  }, [favorites])

  const filteredItems = useMemo(() => {
    switch (activeFilter) {
      case 'GROUND':
        return CRACKERS.filter((c) => c.category === 'ground')
      case 'SKY':
        return CRACKERS.filter((c) => c.category === 'sky')
      case 'FAVOURITES':
        return CRACKERS.filter((c) => (favorites || []).includes(c.id))
      case 'ALL':
      default:
        return CRACKERS
    }
  }, [activeFilter, favorites])

  const handleCardClick = (id, isUnlocked) => {
    if (!isUnlocked) return
    onSelect?.(id)
    onClose?.()
  }

  const resultsAnnouncement = t('library_results_count', { count: filteredItems.length })

  return (
    <ModalOverlay
      isOpen={isOpen}
      onClose={onClose}
      title={t('library_title')}
      subtitle={t('library_subtitle')}
      className="library-overlay"
      cardClassName="library-modal-card"
    >
      {/* Polite live announcement of filter changes */}
      <div className="sr-only" role="status" aria-live="polite">
        {resultsAnnouncement}
      </div>

      {/* Filter Chips Bar */}
      <div className="library-filters" role="group" aria-label={t('filter_sparkles_aria')}>
        <GameplayChip
          selected={activeFilter === 'ALL'}
          count={counts.ALL}
          onClick={() => setActiveFilter('ALL')}
        >
          {t('filter_all')}
        </GameplayChip>

        <GameplayChip
          selected={activeFilter === 'GROUND'}
          count={counts.GROUND}
          onClick={() => setActiveFilter('GROUND')}
        >
          {t('filter_ground')}
        </GameplayChip>

        <GameplayChip
          selected={activeFilter === 'SKY'}
          count={counts.SKY}
          onClick={() => setActiveFilter('SKY')}
        >
          {t('filter_sky')}
        </GameplayChip>

        <GameplayChip
          selected={activeFilter === 'FAVOURITES'}
          count={counts.FAVOURITES}
          icon={t('fav_heart')}
          onClick={() => setActiveFilter('FAVOURITES')}
        >
          {t('filter_favourites')}
        </GameplayChip>
      </div>

      {/* Content Grid or Empty Favourites State */}
      {activeFilter === 'FAVOURITES' && filteredItems.length === 0 ? (
        <div className="library-empty-favourites" data-testid="empty-favourites-state">
          <div className="library-empty-icon" aria-hidden="true">
            {t('fav_heart')}
          </div>
          <h3 className="library-empty-title">{t('empty_favourites_title')}</h3>
          <p className="library-empty-desc">{t('empty_favourites_desc')}</p>
          <button
            type="button"
            className="gp-btn gp-btn--secondary library-empty-reset-btn"
            onClick={() => setActiveFilter('ALL')}
          >
            {t('empty_favourites_reset')}
          </button>
        </div>
      ) : (
        <div className="library-grid" role="list" aria-label={t('sparkle_cards_aria')}>
          {filteredItems.map((c) => {
            const isUnlocked = (unlocked || []).includes(c.id)
            const isSelected = selectedCracker === c.id
            const isFav = (favorites || []).includes(c.id)

            return (
              <div
                key={c.id}
                role="listitem"
                className={`library-card ${isUnlocked ? 'is-unlocked' : 'is-locked'} ${isSelected ? 'is-selected' : ''}`}
              >
                <button
                  type="button"
                  className="library-card__main"
                  onClick={() => handleCardClick(c.id, isUnlocked)}
                  disabled={!isUnlocked}
                  aria-label={t('card_select_aria', { name: c.name, descriptor: c.descriptor })}
                >
                  <div className="library-card__visual">
                    <CrackerArt
                      artKey={c.artKey}
                      isLocked={!isUnlocked}
                      isSelected={isSelected}
                      width={80}
                      height={80}
                    />
                    {isSelected && (
                      <span className="library-card__selected-pill" aria-hidden="true">
                        <span aria-hidden="true">{t('selected_check')}</span> {t('badge_selected')}
                      </span>
                    )}
                    {!isUnlocked && (
                      <span className="library-card__locked-pill" aria-hidden="true">
                        {t('lock_icon')} {t('badge_locked_label')}
                      </span>
                    )}
                  </div>

                  <div className="library-card__details">
                    <strong className="library-card__name">{c.name}</strong>
                    <span className="library-card__desc">{c.descriptor}</span>
                    <span className="library-card__meta">
                      <span className="library-card__category-tag">{c.category}</span>
                      <span className="library-card__duration">
                        {t('approx_duration', { seconds: Math.round(c.duration) })}
                      </span>
                    </span>
                    {!isUnlocked && (
                      <small className="library-card__lock-hint">{t('card_locked_hint')}</small>
                    )}
                  </div>
                </button>

                {/* Heart Toggle for Favourites */}
                <button
                  type="button"
                  className={`library-card__fav-btn ${isFav ? 'is-fav' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleFavorite?.(c.id)
                  }}
                  aria-pressed={isFav}
                  aria-label={
                    isFav
                      ? t('fav_remove_aria', { name: c.name })
                      : t('fav_add_aria', { name: c.name })
                  }
                  title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                >
                  <span aria-hidden="true">{isFav ? '♥' : '♡'}</span>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </ModalOverlay>
  )
}
