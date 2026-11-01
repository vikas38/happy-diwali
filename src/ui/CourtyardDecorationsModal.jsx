import React from 'react'
import ModalOverlay from './controls/ModalOverlay.jsx'
import { t } from '../i18n/index.js'

export default function CourtyardDecorationsModal({
  isOpen = true,
  onClose,
  decorations = {},
  onSelectDecoration,
  onReset,
}) {
  const currentRangoli = decorations?.rangoliMotif || 'lotus'
  const currentToran = decorations?.toranStyle || 'marigold'
  const currentDiya = decorations?.diyaStyle || 'arch'

  const rangoliOptions = [
    { id: 'lotus', label: t('motif_lotus'), desc: t('motif_lotus_desc') },
    { id: 'geometric', label: t('motif_geometric'), desc: t('motif_geometric_desc') },
    { id: 'diyas', label: t('motif_diyas'), desc: t('motif_diyas_desc') },
  ]

  const toranOptions = [
    { id: 'marigold', label: t('toran_marigold'), desc: t('toran_marigold_desc') },
    { id: 'mango_leaves', label: t('toran_mango_leaves'), desc: t('toran_mango_leaves_desc') },
  ]

  const diyaOptions = [
    { id: 'arch', label: t('diyas_arch'), desc: t('diyas_arch_desc') },
    { id: 'courtyard_row', label: t('diyas_courtyard_row'), desc: t('diyas_courtyard_row_desc') },
    { id: 'haveli_steps', label: t('diyas_haveli_steps'), desc: t('diyas_haveli_steps_desc') },
  ]

  return (
    <ModalOverlay
      isOpen={isOpen}
      onClose={onClose}
      title={t('decorations_title')}
      subtitle={t('decorations_subtitle')}
      className="decorations-modal"
      size="default"
    >
      <div className="decorations-container">
        {/* Rangoli Section */}
        <section className="decorations-section" aria-labelledby="heading-rangoli">
          <h3 id="heading-rangoli" className="decorations-section-title">
            {t('decorations_section_rangoli')}
          </h3>
          <div className="decorations-grid" role="radiogroup" aria-labelledby="heading-rangoli">
            {rangoliOptions.map((opt) => {
              const selected = currentRangoli === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`decoration-card ${selected ? 'is-selected' : ''}`}
                  onClick={() => onSelectDecoration?.('rangoliMotif', opt.id)}
                >
                  <span className="decoration-card-title">{opt.label}</span>
                  <span className="decoration-card-desc">{opt.desc}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Toran Section */}
        <section className="decorations-section" aria-labelledby="heading-toran">
          <h3 id="heading-toran" className="decorations-section-title">
            {t('decorations_section_toran')}
          </h3>
          <div className="decorations-grid" role="radiogroup" aria-labelledby="heading-toran">
            {toranOptions.map((opt) => {
              const selected = currentToran === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`decoration-card ${selected ? 'is-selected' : ''}`}
                  onClick={() => onSelectDecoration?.('toranStyle', opt.id)}
                >
                  <span className="decoration-card-title">{opt.label}</span>
                  <span className="decoration-card-desc">{opt.desc}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Diya Arrangement Section */}
        <section className="decorations-section" aria-labelledby="heading-diyas">
          <h3 id="heading-diyas" className="decorations-section-title">
            {t('decorations_section_diyas')}
          </h3>
          <div className="decorations-grid" role="radiogroup" aria-labelledby="heading-diyas">
            {diyaOptions.map((opt) => {
              const selected = currentDiya === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`decoration-card ${selected ? 'is-selected' : ''}`}
                  onClick={() => onSelectDecoration?.('diyaStyle', opt.id)}
                >
                  <span className="decoration-card-title">{opt.label}</span>
                  <span className="decoration-card-desc">{opt.desc}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Footer Actions */}
        <div className="decorations-actions">
          <button type="button" className="decorations-reset-btn" onClick={onReset}>
            {t('decorations_reset_btn')}
          </button>
          <button type="button" className="decorations-done-btn" onClick={onClose}>
            {t('decorations_done_btn')}
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}
