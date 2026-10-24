import React, { useEffect, useRef } from 'react'
import { CRACKERS } from '../crackers/crackerDefs.js'
import CrackerArt from './CrackerArt.jsx'
import { t } from '../i18n/index.js'

export default function CrackerCarousel({ unlocked, selectedCracker, onSelect }) {
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
        <span className="dock-title">{t('dock_heading')}</span>
        <small className="dock-descriptor">
          {selectedItem
            ? `${selectedItem.name} · ${labels[selectedCracker]}`
            : t('dock_subheading')}
        </small>
      </div>
      <div className="firework-tray" role="listbox" aria-label={t('dock_tray_aria')}>
        {CRACKERS.map((c, i) => {
          const isUnlocked = unlocked.includes(c.id)
          const isSelected = selectedCracker === c.id
          return (
            <button
              key={c.id}
              ref={isSelected ? selectedRef : null}
              type="button"
              role="option"
              className={`firework-choice ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'is-locked' : ''}`}
              disabled={!isUnlocked}
              aria-label={
                isUnlocked ? `${c.name}, ${labels[i]}` : `${c.name}${t('dock_locked_suffix')}`
              }
              aria-selected={isSelected}
              onClick={() => onSelect(c.id)}
              onKeyDown={(e) => handleKeyDown(e, i)}
            >
              <span className="choice-number" aria-hidden="true">
                0{i + 1}
              </span>
              <div className="choice-art-wrap">
                <CrackerArt index={c.id} />
                {!isUnlocked && (
                  <span className="choice-lock-badge" aria-hidden="true">
                    🔒
                  </span>
                )}
              </div>
              <strong>{c.name}</strong>
              <small className="choice-tagline">{isUnlocked ? labels[i] : t('dock_locked')}</small>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
