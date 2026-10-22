// Keep focus within the topmost game dialog and restore it on dismissal.
import { useEffect } from 'react'
export function useDialogFocus(key) {
  useEffect(() => {
    const dialogs = document.querySelectorAll('[role="dialog"]')
    const dialog = dialogs[dialogs.length - 1]
    if (!dialog) return
    const previous = document.activeElement
    const controls = () => [...dialog.querySelectorAll('button:not(:disabled),input,a[href],[tabindex="0"]')].filter(el => el.getClientRects().length)
    controls()[0]?.focus()
    const trap = e => {
      if (e.key !== 'Tab') return
      const items = controls(), first = items[0], last = items[items.length - 1]
      if (!first) { e.preventDefault(); return }
      if (!dialog.contains(document.activeElement) || (e.shiftKey && document.activeElement === first)) { e.preventDefault(); (e.shiftKey ? last : first).focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', trap)
    return () => { document.removeEventListener('keydown', trap); if (previous?.isConnected) previous.focus() }
  }, [key])
}
