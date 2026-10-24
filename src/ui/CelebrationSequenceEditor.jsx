import React, { useState } from 'react'
import ModalOverlay from './controls/ModalOverlay.jsx'
import CrackerArt from './CrackerArt.jsx'
import { t } from '../i18n/index.js'
import {
  CRACKERS,
  PALETTE_DEFINITIONS,
  getCrackerById,
} from '../crackers/crackerDefs.js'
import { SHOW_DURATIONS } from '../crackers/crackerControllers.js'

/**
 * CelebrationSequenceEditor — Three-slot festival fireworks show builder.
 * DIW-029: Arrange 1-3 crackers with palette and placement; displays estimated
 * duration; persists draft; keyboard & touch accessible.
 */
export default function CelebrationSequenceEditor({
  isOpen = true,
  onClose,
  sequence = [],
  unlockedIds = [0],
  onAddSlot,
  onRemoveSlot,
  onMoveSlot,
  onClearSequence,
  onPlaySequence,
}) {
  const [pickerOpen, setPickerOpen] = useState(false)

  // Calculate authored duration estimate in seconds
  const totalSeconds = sequence.reduce((sum, slot) => {
    const showMs = SHOW_DURATIONS[slot.crackerId] || 3500
    // Each show includes ~1.2s walk/prep + 3.2s countdown + showMs
    return sum + (showMs + 4400) / 1000
  }, 0)
  const formattedSeconds = Math.round(totalSeconds)

  const handlePickCracker = (crackerId) => {
    onAddSlot?.(crackerId, 'GOLD', 'center')
    setPickerOpen(false)
  }

  const handlePlay = () => {
    if (!sequence || sequence.length === 0) return
    onPlaySequence?.(sequence)
  }

  return (
    <ModalOverlay
      isOpen={isOpen}
      onClose={onClose}
      title={t('sequence_builder_title')}
      subtitle={t('sequence_builder_subtitle')}
      className="sequence-overlay"
      cardClassName="sequence-modal-card"
    >
      <div className="sequence-builder-content">
        {/* Slots Container */}
        <div
          className="sequence-slots-list"
          role="region"
          aria-label={t('sequence_builder_title')}
        >
          {sequence.map((slot, idx) => {
            const cracker = getCrackerById(slot.crackerId)
            const palDef = PALETTE_DEFINITIONS[slot.palette] || PALETTE_DEFINITIONS.GOLD
            const placementLabel =
              slot.placement === 'left'
                ? t('placement_left')
                : slot.placement === 'right'
                  ? t('placement_right')
                  : t('placement_center')

            return (
              <div key={idx} className="sequence-slot-card" role="group" aria-label={`Slot ${idx + 1}`}>
                <div className="slot-badge-number">{idx + 1}</div>
                <div className="slot-art-wrap">
                  <CrackerArt
                    artKey={cracker?.artKey}
                    width={56}
                    height={56}
                    isSelected={false}
                  />
                </div>
                <div className="slot-details">
                  <strong className="slot-cracker-name">{cracker?.name || 'Sparkle'}</strong>
                  <span className="slot-meta-pill">{palDef.name}</span>
                  <span className="slot-meta-pill">{placementLabel}</span>
                </div>
                <div className="slot-actions">
                  {idx > 0 && (
                    <button
                      type="button"
                      className="slot-action-btn"
                      onClick={() => onMoveSlot?.(idx, idx - 1)}
                      aria-label={`${t('sequence_move_left')} ${cracker?.name}`}
                    >
                      ←
                    </button>
                  )}
                  {idx < sequence.length - 1 && (
                    <button
                      type="button"
                      className="slot-action-btn"
                      onClick={() => onMoveSlot?.(idx, idx + 1)}
                      aria-label={`${t('sequence_move_right')} ${cracker?.name}`}
                    >
                      →
                    </button>
                  )}
                  <button
                    type="button"
                    className="slot-action-btn slot-action-btn--remove"
                    onClick={() => onRemoveSlot?.(idx)}
                    aria-label={`${t('sequence_remove_slot')} ${cracker?.name}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}

          {/* Empty slot placeholder (up to 3 slots) */}
          {sequence.length < 3 && (
            <div className="sequence-slot-empty">
              <span className="empty-slot-label">{t('sequence_slot_empty')}</span>
              <button
                type="button"
                className="gp-btn gp-btn--secondary slot-add-btn"
                onClick={() => setPickerOpen(true)}
              >
                + {t('sequence_add_slot')}
              </button>
            </div>
          )}
        </div>

        {/* Modal for picking which cracker to add */}
        {pickerOpen && (
          <div className="sequence-picker-dialog" role="dialog" aria-modal="true">
            <div className="sequence-picker-header">
              <h3>{t('sequence_add_slot')}</h3>
              <button
                type="button"
                className="gp-btn gp-btn--secondary"
                onClick={() => setPickerOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="sequence-picker-grid">
              {CRACKERS.filter((c) => unlockedIds.includes(c.id)).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="sequence-picker-item"
                  onClick={() => handlePickCracker(c.id)}
                >
                  <CrackerArt artKey={c.artKey} width={44} height={44} />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Estimate & Controls Footer */}
        <div className="sequence-footer">
          {sequence.length > 0 && (
            <div className="sequence-estimate" role="status">
              ⏱ {t('sequence_est_time', { time: formattedSeconds })}
            </div>
          )}
          <div className="sequence-action-buttons">
            {sequence.length > 0 && (
              <button
                type="button"
                className="gp-btn gp-btn--secondary"
                onClick={onClearSequence}
              >
                {t('sequence_clear_btn')}
              </button>
            )}
            <button
              type="button"
              className="gp-btn gp-btn--primary sequence-play-btn"
              disabled={sequence.length === 0}
              onClick={handlePlay}
            >
              ▶ {t('sequence_play_btn')}
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  )
}
