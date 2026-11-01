import React from 'react'

/**
 * GameplayButton — Reusable button with standard 44px+ touch target,
 * semantic primary (marigold), secondary (plum raised), and icon variants.
 */
export function GameplayButton({
  variant = 'primary', // 'primary' | 'secondary' | 'icon'
  type = 'button',
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  ariaLabel,
  onClick,
  className = '',
  children,
  ...rest
}) {
  const baseClass = `gp-btn gp-btn--${variant}`
  const stateClass =
    `${disabled ? 'is-disabled' : ''} ${loading ? 'is-loading' : ''} ${className}`.trim()

  return (
    <button
      type={type}
      className={`${baseClass} ${stateClass}`}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      aria-label={ariaLabel}
      onClick={disabled || loading ? undefined : onClick}
      {...rest}
    >
      {loading && (
        <span className="gp-btn__spinner" aria-hidden="true">
          ⏳
        </span>
      )}
      {!loading && icon && iconPosition === 'left' && (
        <span className="gp-btn__icon gp-btn__icon--left" aria-hidden="true">
          {icon}
        </span>
      )}
      {children && <span className="gp-btn__label">{children}</span>}
      {!loading && icon && iconPosition === 'right' && (
        <span className="gp-btn__icon gp-btn__icon--right" aria-hidden="true">
          {icon}
        </span>
      )}
    </button>
  )
}

/**
 * GameplayChip — Filter and status chip for categories, favourites, etc.
 * Conveys selection via aria-pressed / aria-selected and visible checkmark/label.
 */
export function GameplayChip({
  selected = false,
  disabled = false,
  icon = null,
  count = null,
  onClick,
  children,
  className = '',
  ariaLabel,
  ...rest
}) {
  return (
    <button
      type="button"
      className={`gp-chip ${selected ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''} ${className}`.trim()}
      aria-pressed={selected}
      aria-disabled={disabled}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      {...rest}
    >
      {selected ? (
        <span className="gp-chip__check" aria-hidden="true">
          ✓
        </span>
      ) : icon ? (
        <span className="gp-chip__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="gp-chip__label">{children}</span>
      {count !== null && count !== undefined && (
        <span className="gp-chip__count" aria-hidden="true">
          {count}
        </span>
      )}
      {selected && <span className="sr-only"> (Selected)</span>}
    </button>
  )
}

/**
 * SelectableCard — Interactive tile for cracker cards and options.
 * Complies with requirement that selection is never conveyed only by color:
 * includes a visible 'Selected' badge and border.
 * Locked cards display a lock glyph and readable explanation.
 */
export function SelectableCard({
  id,
  selected = false,
  locked = false,
  lockReason = '',
  badge = null,
  title,
  subtitle,
  icon = null,
  onClick,
  className = '',
  children,
  ...rest
}) {
  const handleClick = (e) => {
    if (locked) return
    if (onClick) onClick(e)
  }

  const handleKeyDown = (e) => {
    if (locked) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (onClick) onClick(e)
    }
  }

  return (
    <div
      role="button"
      tabIndex={locked ? -1 : 0}
      aria-pressed={selected}
      aria-disabled={locked}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`gp-card ${selected ? 'is-selected' : ''} ${locked ? 'is-locked' : ''} ${className}`.trim()}
      {...rest}
    >
      {/* Badges / Status Headers */}
      <div className="gp-card__status-row">
        {selected && (
          <span className="gp-card__selected-badge">
            <span aria-hidden="true">✓</span> Selected
          </span>
        )}
        {locked && (
          <span className="gp-card__locked-badge" title={lockReason || 'Locked'}>
            <span aria-hidden="true">🔒</span> {lockReason || 'Locked'}
          </span>
        )}
        {!selected && !locked && badge && <span className="gp-card__custom-badge">{badge}</span>}
      </div>

      {/* Visual / Icon Area */}
      {icon && <div className="gp-card__media">{icon}</div>}

      {/* Text Hierarchy */}
      <div className="gp-card__body">
        {title && <h3 className="gp-card__title">{title}</h3>}
        {subtitle && <p className="gp-card__subtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}

/**
 * InlineNotice — Accessible status, warning, info, and error callouts.
 * Legible on both dark sky and lighter courtyard scenes.
 */
export function InlineNotice({
  variant = 'info', // 'info' | 'warning' | 'error' | 'success'
  title,
  children,
  className = '',
}) {
  const role = variant === 'error' ? 'alert' : 'status'
  const icon =
    {
      info: 'ℹ️',
      warning: '⚠️',
      error: '🚫',
      success: '✨',
    }[variant] || 'ℹ️'

  return (
    <div
      className={`gp-notice gp-notice--${variant} ${className}`.trim()}
      role={role}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
    >
      <span className="gp-notice__icon" aria-hidden="true">
        {icon}
      </span>
      <div className="gp-notice__content">
        {title && <strong className="gp-notice__title">{title}</strong>}
        <div className="gp-notice__body">{children}</div>
      </div>
    </div>
  )
}

/**
 * ProgressLabel — High contrast, readable label for step and collection progress.
 */
export function ProgressLabel({ current, total, label = '', className = '' }) {
  const text = label || `${current} of ${total}`
  return (
    <div className={`gp-progress-label ${className}`.trim()}>
      <span className="gp-progress-label__text">{text}</span>
    </div>
  )
}

export { default as ModalOverlay } from './ModalOverlay.jsx'
