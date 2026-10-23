import React from 'react'
import { CRACKERS } from '../crackers/crackerDefs.js'
import CrackerArt from './CrackerArt.jsx'

const labels = [
  'A gentle shimmer',
  'A golden fountain',
  'A whirling glow',
  'A skyward burst',
  'A rhythm of sparks',
  'A glowing finale',
]

export default function CrackerCarousel({ unlocked, selectedCracker, onSelect }) {
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

  return (
    <nav className="firework-dock" aria-label="Cracker selection">
      <div className="dock-heading">
        <span>YOUR BOX OF WONDER</span>
        <small>Discover one. Unlock the next.</small>
      </div>
      <div className="firework-tray" role="listbox" aria-label="Available fireworks">
        {CRACKERS.map((c, i) => {
          const isUnlocked = unlocked.includes(c.id)
          const isSelected = selectedCracker === c.id
          return (
            <button
              key={c.id}
              type="button"
              role="option"
              className={`firework-choice ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'is-locked' : ''}`}
              disabled={!isUnlocked}
              aria-label={`${c.name}${!isUnlocked ? ' — locked' : ''}`}
              aria-selected={isSelected}
              onClick={() => onSelect(c.id)}
              onKeyDown={(e) => handleKeyDown(e, i)}
            >
              <span className="choice-number">0{i + 1}</span>
              <div className="choice-art-wrap">
                <CrackerArt index={c.id} />
                {!isUnlocked && (
                  <span className="choice-lock-badge" aria-hidden="true">
                    🔒
                  </span>
                )}
              </div>
              <strong>{c.name}</strong>
              <small>{isUnlocked ? labels[i] : 'Locked'}</small>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
