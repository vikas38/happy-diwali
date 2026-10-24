// Keep focus within the topmost game dialog and restore it on dismissal.
// DIW-015: Support single overlay owner, escape handling, initial/return focus refs,
// background inertness, and visible fallbacks when triggers disappear.
import { useEffect, useRef } from 'react'

export function useDialogFocus(key, options = {}) {
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    const opts = optionsRef.current
    const dialogs = document.querySelectorAll('[role="dialog"], [role="alertdialog"]')
    const dialog = dialogs[dialogs.length - 1]
    if (!dialog) return

    const previous = opts.returnFocusRef?.current || document.activeElement
    const controls = () =>
      [...dialog.querySelectorAll('button:not(:disabled),input,a[href],[tabindex="0"]')].filter(
        (el) => !el.disabled && el.getAttribute('aria-hidden') !== 'true'
      )

    // Initial focus: prefer initialFocusRef, then autofocus element, otherwise first control
    const autoFocusEl =
      opts.initialFocusRef?.current || dialog.querySelector('[autofocus], [autoFocus]')
    if (autoFocusEl && typeof autoFocusEl.focus === 'function') {
      autoFocusEl.focus()
    } else {
      controls()[0]?.focus()
    }

    // Mark background siblings inert / aria-hidden
    const backgroundElements = []
    const rootChildren = document.querySelectorAll(
      '#root > *:not([role="dialog"]):not([role="alertdialog"]), .game-stage > *:not([role="dialog"]):not([role="alertdialog"]):not(.overlay)'
    )
    rootChildren.forEach((el) => {
      if (!el.contains(dialog)) {
        const wasAriaHidden = el.getAttribute('aria-hidden')
        backgroundElements.push({ el, wasAriaHidden })
        el.setAttribute('aria-hidden', 'true')
      }
    })

    const trap = (e) => {
      if (e.key === 'Escape' && typeof opts.onEscape === 'function') {
        e.preventDefault()
        e.stopPropagation()
        opts.onEscape()
        return
      }

      if (opts.disableTrap || e.key !== 'Tab') return
      const items = controls()
      const first = items[0]
      const last = items[items.length - 1]
      if (!first) {
        e.preventDefault()
        return
      }
      if (
        !dialog.contains(document.activeElement) ||
        (e.shiftKey && document.activeElement === first)
      ) {
        e.preventDefault()
        ;(e.shiftKey ? last : first).focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', trap)
    return () => {
      window.removeEventListener('keydown', trap)

      // Restore background accessibility
      backgroundElements.forEach(({ el, wasAriaHidden }) => {
        if (wasAriaHidden !== null) {
          el.setAttribute('aria-hidden', wasAriaHidden)
        } else {
          el.removeAttribute('aria-hidden')
        }
      })

      // Focus restoration: return to previous trigger if connected and not body, or meaningful visible fallback
      if (
        previous &&
        previous !== document.body &&
        previous?.isConnected &&
        typeof previous.focus === 'function'
      ) {
        previous.focus()
      } else {
        const fallback = document.querySelector(
          '.contextual-primary-btn, .firework-choice.selected, .firework-dock, .dock-browse-all-btn, .back-home, [role="main"]'
        )
        fallback?.focus?.()
      }
    }
  }, [key])
}
