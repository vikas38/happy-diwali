import React, { useState, useEffect, useRef } from 'react'
import ModalOverlay from './controls/ModalOverlay.jsx'
import { drawCourtyard, STAGE, effectOrigin } from '../render/layers/Courtyard.js'
import { CRACKERS, PALETTE_DEFINITIONS } from '../crackers/crackerDefs.js'
import { t } from '../i18n/index.js'

export default function PhotoModeModal({
  isOpen = true,
  onClose,
  decorations = {},
  selectedCracker = 0,
  placement = 'center',
  palette = 'GOLD',
}) {
  const [aspectRatio, setAspectRatio] = useState('landscape') // 'landscape' | 'portrait'
  const [frameStyle, setFrameStyle] = useState('framed') // 'framed' | 'clean'
  const [previewUrl, setPreviewUrl] = useState('')
  const [exportStatus, setExportStatus] = useState('')
  const canvasRef = useRef(null)

  useEffect(() => {
    // Generate postcard on offscreen canvas
    const isPortrait = aspectRatio === 'portrait'
    const w = isPortrait ? 720 : 1200
    const h = isPortrait ? 1280 : 675

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 1. Draw festive courtyard with active decorations
    drawCourtyard(ctx, w, h, 2.5, 'READY_ON_STREET', false, decorations)

    // 2. Draw sparkling celebration sparks around cracker anchor
    const origin = effectOrigin(selectedCracker, w, h, placement)
    const activePalette = PALETTE_DEFINITIONS[palette] || PALETTE_DEFINITIONS.GOLD
    const colors = activePalette.swatches

    ctx.save()
    for (let i = 0; i < 35; i++) {
      const angle = (i / 35) * Math.PI * 2
      const dist = 12 + ((i * 17) % 65)
      const px = origin.x + Math.cos(angle) * dist
      const py = origin.y + Math.sin(angle) * dist * 0.75
      const color = colors[i % colors.length]

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(px, py, 2.5 + (i % 3), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()

    // 3. Optional decorative festival frame
    if (frameStyle === 'framed') {
      ctx.save()
      const pad = isPortrait ? 28 : 24

      // Outer gold border
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 4
      ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2)

      // Inner delicate border
      ctx.strokeStyle = '#ffd87c'
      ctx.lineWidth = 1.5
      ctx.strokeRect(pad + 8, pad + 8, w - (pad + 8) * 2, h - (pad + 8) * 2)

      // Corner rosettes
      const corners = [
        [pad + 8, pad + 8],
        [w - pad - 8, pad + 8],
        [pad + 8, h - pad - 8],
        [w - pad - 8, h - pad - 8],
      ]
      for (const [cx, cy] of corners) {
        ctx.fillStyle = '#f59e0b'
        ctx.beginPath()
        ctx.arc(cx, cy, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#ffd87c'
        ctx.beginPath()
        ctx.arc(cx, cy, 3, 0, Math.PI * 2)
        ctx.fill()
      }

      // Greetings typography
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const titleY = isPortrait ? pad + 54 : pad + 40
      ctx.font = `bold ${isPortrait ? 32 : 28}px "Outfit", system-ui, sans-serif`
      ctx.fillStyle = '#ffd87c'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)'
      ctx.shadowBlur = 12
      ctx.fillText('✨ HAPPY DIWALI ✨', w / 2, titleY)

      const subY = isPortrait ? h - pad - 45 : h - pad - 35
      ctx.font = `${isPortrait ? 20 : 16}px "Outfit", system-ui, sans-serif`
      ctx.fillStyle = '#fef3c7'
      ctx.shadowBlur = 8
      ctx.fillText('Chhotu Champ · Festival of Lights', w / 2, subY)

      ctx.restore()
    }

    try {
      const dataUrl = canvas.toDataURL('image/png')
      setPreviewUrl(dataUrl)
    } catch {
      setExportStatus('failed')
    }
  }, [aspectRatio, frameStyle, decorations, selectedCracker, placement, palette])

  const handleDownload = () => {
    if (!previewUrl) return
    try {
      const a = document.createElement('a')
      a.href = previewUrl
      a.download = `happy-diwali-postcard-${aspectRatio}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setExportStatus('success')
    } catch {
      setExportStatus('failed')
    }
  }

  return (
    <ModalOverlay
      isOpen={isOpen}
      onClose={onClose}
      title={t('photo_mode_title')}
      subtitle={t('photo_mode_subtitle')}
      className="photo-mode-modal"
      size="default"
    >
      <div className="photo-mode-container">
        {/* Controls */}
        <div className="photo-mode-controls">
          <div className="photo-control-group" role="radiogroup" aria-label={t('photo_mode_title')}>
            <button
              type="button"
              role="radio"
              aria-checked={aspectRatio === 'landscape'}
              className={`photo-option-btn ${aspectRatio === 'landscape' ? 'is-selected' : ''}`}
              onClick={() => setAspectRatio('landscape')}
            >
              {t('photo_aspect_landscape')}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={aspectRatio === 'portrait'}
              className={`photo-option-btn ${aspectRatio === 'portrait' ? 'is-selected' : ''}`}
              onClick={() => setAspectRatio('portrait')}
            >
              {t('photo_aspect_portrait')}
            </button>
          </div>

          <div className="photo-control-group" role="radiogroup" aria-label={t('photo_mode_title')}>
            <button
              type="button"
              role="radio"
              aria-checked={frameStyle === 'framed'}
              className={`photo-option-btn ${frameStyle === 'framed' ? 'is-selected' : ''}`}
              onClick={() => setFrameStyle('framed')}
            >
              {t('photo_frame_framed')}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={frameStyle === 'clean'}
              className={`photo-option-btn ${frameStyle === 'clean' ? 'is-selected' : ''}`}
              onClick={() => setFrameStyle('clean')}
            >
              {t('photo_frame_clean')}
            </button>
          </div>
        </div>

        {/* Postcard Preview */}
        <div className="photo-preview-wrap">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={t('photo_preview_alt')}
              className={`photo-preview-img ${aspectRatio === 'portrait' ? 'is-portrait' : 'is-landscape'}`}
            />
          ) : (
            <div className="photo-preview-placeholder">...</div>
          )}
        </div>

        {/* Status Feedback */}
        {exportStatus === 'success' && (
          <div className="photo-status-msg is-success" role="status">
            ✓ {t('photo_download_success')}
          </div>
        )}
        {exportStatus === 'failed' && (
          <div className="photo-status-msg is-error" role="status">
            ✕ {t('photo_download_failed')}
          </div>
        )}

        {/* Actions */}
        <div className="photo-actions">
          <button type="button" className="photo-cancel-btn" onClick={onClose}>
            {t('photo_close')}
          </button>
          <button
            type="button"
            className="photo-download-btn"
            onClick={handleDownload}
            disabled={!previewUrl}
          >
            {t('photo_download_png')}
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}
