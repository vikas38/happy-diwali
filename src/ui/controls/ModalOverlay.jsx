import React, { useRef, useId } from 'react'
import { useDialogFocus } from '../../accessibility/useDialogFocus.js'
import { t } from '../../i18n/index.js'

/**
 * ModalOverlay — Unified accessible dialog and sheet container for Little Lights.
 * DIW-015: Single interaction contract for mobile sheets and desktop dialogs with
 * accessible naming, initial focus, focus scope trap, background inertness, Escape
 * dismissal, and guaranteed focus restoration.
 */
export default function ModalOverlay({
  isOpen = true,
  onClose,
  title,
  titleId: propTitleId,
  subtitle,
  descId: propDescId,
  role = 'dialog',
  presentation = 'responsive',
  headerActions,
  showCloseButton = true,
  closeLabel,
  className = '',
  cardClassName = '',
  initialFocusRef,
  returnFocusRef,
  children,
}) {
  const generatedId = useId()
  const titleId = propTitleId || `modal-title-${generatedId}`
  const descId = subtitle ? propDescId || `modal-desc-${generatedId}` : undefined
  const contentRef = useRef(null)

  useDialogFocus(isOpen, {
    onEscape: onClose,
    initialFocusRef,
    returnFocusRef,
  })

  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    // Only close if clicking directly on the backdrop/scrim container, not inside the card
    if (contentRef.current && !contentRef.current.contains(e.target)) {
      onClose?.()
    }
  }

  const effectiveCloseLabel = closeLabel || t('close_dialog') || t('close') || 'Close dialog'

  return (
    <div
      className={`gameplay-overlay ${presentation === 'sheet' ? 'presentation-sheet' : presentation === 'dialog' ? 'presentation-dialog' : 'presentation-responsive'} ${className}`}
      role={role}
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={descId}
      onClick={handleBackdropClick}
    >
      <div
        ref={contentRef}
        className={`gameplay-modal-card ${cardClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle for tactile visual affordance */}
        <div className="sheet-handle" aria-hidden="true">
          <span className="sheet-handle-bar" />
        </div>

        <div className="gameplay-modal-header">
          <div className="gameplay-modal-header__titles">
            {title && (
              <h2 id={titleId} className="gameplay-modal-title">
                {title}
              </h2>
            )}
            {subtitle && (
              <p id={descId} className="gameplay-modal-subtitle">
                {subtitle}
              </p>
            )}
          </div>

          <div className="gameplay-modal-header__actions">
            {headerActions}
            {showCloseButton && onClose && (
              <button
                type="button"
                className="gameplay-modal-close-btn"
                onClick={onClose}
                aria-label={effectiveCloseLabel}
              >
                <span aria-hidden="true">✕</span>
              </button>
            )}
          </div>
        </div>

        <div className="gameplay-modal-body">{children}</div>
      </div>
    </div>
  )
}
