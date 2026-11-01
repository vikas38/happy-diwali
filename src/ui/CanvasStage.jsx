import React, { useEffect, useRef, useState } from 'react'
import { characterStart } from '../render/layers/Courtyard.js'
import { Renderer, DEPTH } from '../render/Renderer.js'
import { Background, InteractivePropLayer, LAYOUT } from '../render/layers/Background.js'
import { ChhotuChamp } from '../render/characters/ChhotuChamp.js'
import { Pip } from '../render/characters/Pip.js'
import { Particles } from '../render/Particles.js'
import { JellySquash } from '../render/fx/JellySquash.js'
import { ComicBubble } from '../render/fx/ComicBubble.js'
import { getSoundEngine } from '../audio/SoundEngine.js'
import { t } from '../i18n/index.js'

/**
 * Mounts the <canvas> and runs the Renderer with all registered layers.
 * Exposes the engine instances via a callback so the parent (GameController)
 * can drive characters, particles, FX, and audio.
 */
export default function CanvasStage({
  onReady,
  onClick,
  reducedMotion,
  calmVisuals,
  quality = 'AUTO',
  launchPlacement = 'center',
  courtyardDecorations,
  paused,
  onFailure,
}) {
  const canvasRef = useRef(null)
  const engines = useRef(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!engines.current) return
    const { renderer, particles, jellySquash, background, pip, chhotu } = engines.current
    const motionPaused = Boolean(reducedMotion || calmVisuals)
    background.reducedMotion = reducedMotion
    background.calmVisuals = calmVisuals
    if (background.setPlacement) background.setPlacement(launchPlacement)
    if (background.setDecorations && courtyardDecorations) {
      background.setDecorations(courtyardDecorations)
    }
    renderer._reducedMotion = reducedMotion
    renderer._calmVisuals = calmVisuals
    if (renderer.setQuality) renderer.setQuality(quality)
    particles.reducedMotion = reducedMotion
    particles.calmVisuals = calmVisuals
    particles.quality = quality
    if (pip) pip.reducedMotion = motionPaused
    if (chhotu) chhotu.reducedMotion = motionPaused
    if (reducedMotion || calmVisuals) particles.flashes = []
    jellySquash.reducedMotion = reducedMotion
    jellySquash.calmVisuals = calmVisuals
    jellySquash.reset()
  }, [reducedMotion, calmVisuals, quality, launchPlacement, courtyardDecorations])
  useEffect(() => {
    const sync = () => {
      const r = engines.current?.renderer
      if (!r) return
      if (paused || document.hidden) r.stop()
      else r.start()
    }
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [paused])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let renderer
    try {
      renderer = new Renderer(canvas)
    } catch {
      setFailed(true)
      onFailure?.()
      return
    }
    const loseContext = (e) => {
      e.preventDefault()
      renderer.stop()
      getSoundEngine().stopMusic()
      getSoundEngine().stopCrackerAudio()
      setFailed(true)
      onFailure?.()
    }
    canvas.addEventListener('contextlost', loseContext)
    renderer.onError = () => {
      setFailed(true)
      onFailure?.()
    }
    const background = new Background()
    background.hasInteractiveLayer = true
    renderer.addLayer(background, DEPTH.BACKDROP)

    // FX engine
    const particles = new Particles()
    const comicBubble = new ComicBubble()
    const jellySquash = new JellySquash(canvas.parentElement)

    // Characters
    const chhotu = new ChhotuChamp()
    const pip = new Pip()
    pip.getAudioLevel = () => getSoundEngine().getAudioLevel()

    // Layer depth tiers: BACKDROP (0) -> MIDGROUND (1) -> INTERACTIVE (2)
    renderer.addLayer(
      {
        update(dt) {
          if (
            background.gameState === 'STEPPING_BACK_SAFE_ROUTINE' ||
            background.gameState === 'COUNTDOWN_3_2_1'
          ) {
            pip.x += (Math.max(28, chhotu.x - 55) - pip.x) * Math.min(1, dt * 5)
            pip.y += (chhotu.y + 12 - pip.y) * Math.min(1, dt * 5)
          }
        },
      },
      DEPTH.MIDGROUND
    )
    renderer.addLayer(chhotu, DEPTH.MIDGROUND)
    renderer.addLayer(pip, DEPTH.MIDGROUND)
    renderer.addLayer(particles, DEPTH.MIDGROUND)
    renderer.addLayer(comicBubble, DEPTH.MIDGROUND)
    renderer.addLayer(jellySquash, DEPTH.MIDGROUND)

    // Interactive prop layer (DEPTH.INTERACTIVE = 2)
    const interactiveProps = new InteractivePropLayer(background)
    renderer.addLayer(interactiveProps, DEPTH.INTERACTIVE)

    // Set initial positions based on layout
    const setInitialPositions = (w, h) => {
      const start = characterStart(w, h)
      chhotu.setPosition(start.x, start.y)
      pip.setPosition(w * LAYOUT.pipStartX, h * LAYOUT.pipStartY)
    }
    setInitialPositions(renderer.width, renderer.height)

    // Re-position on resize (only if not mid-walk)
    const _origResize = renderer._resize.bind(renderer)
    renderer._resize = function () {
      _origResize()
      if (
        !chhotu.walkActive &&
        !['COUNTDOWN_3_2_1', 'CRACKER_SHOW_ACTIVE', 'CALM_CORNER_OVERLAY'].includes(
          background.gameState
        )
      ) {
        chhotu.setPosition(this.width * LAYOUT.chhotuStartX, this.height * LAYOUT.chhotuStartY)
        pip.setPosition(this.width * LAYOUT.pipStartX, this.height * LAYOUT.pipStartY)
      }
    }

    renderer._reducedMotion = reducedMotion
    renderer._calmVisuals = calmVisuals
    particles.reducedMotion = reducedMotion
    particles.calmVisuals = calmVisuals
    jellySquash.reducedMotion = reducedMotion
    jellySquash.calmVisuals = calmVisuals
    background.reducedMotion = reducedMotion
    background.calmVisuals = calmVisuals
    if (background.setPlacement) background.setPlacement(launchPlacement)
    if (background.setDecorations && courtyardDecorations)
      background.setDecorations(courtyardDecorations)
    chhotu.reducedMotion = Boolean(reducedMotion || calmVisuals)
    pip.reducedMotion = Boolean(reducedMotion || calmVisuals)
    engines.current = { renderer, particles, jellySquash, background, pip, chhotu }
    renderer.start()

    if (onReady) {
      onReady({
        renderer,
        background,
        chhotu,
        pip,
        particles,
        comicBubble,
        jellySquash,
        layout: LAYOUT,
      })
    }

    return () => {
      canvas.removeEventListener('contextlost', loseContext)
      engines.current = null
      renderer.dispose()
      jellySquash.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePointerDown = (e) => {
    if (engines.current?.particles && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect?.()
      if (rect && rect.width > 0 && rect.height > 0) {
        const scaleX = (engines.current.renderer?.width || 800) / rect.width
        const scaleY = (engines.current.renderer?.height || 600) / rect.height
        const x = (e.clientX - rect.left) * scaleX
        const y = (e.clientY - rect.top) * scaleY

        // Gentle golden touch sparkles wherever the child taps!
        try {
          engines.current.particles.burst(x, y, 10, {
            speedMin: 30,
            speedMax: 90,
            hueMin: 38,
            hueMax: 50,
            lifeMin: 0.2,
            lifeMax: 0.5,
            sizeMin: 2,
            sizeMax: 4,
          })
        } catch {}

        // Interactive character reactions on direct tap
        const chhotu = engines.current.chhotu
        if (chhotu && Math.abs(x - chhotu.x) < 80 && Math.abs(y - chhotu.y) < 120) {
          chhotu.jump?.()
        }
        const pip = engines.current.pip
        if (pip && Math.abs(x - pip.x) < 60 && Math.abs(y - pip.y) < 60) {
          pip.jump?.()
        }
      }
    }
  }

  if (failed)
    return (
      <div className="recovery-card" role="alert">
        <h2>{t('canvas_fail_title')}</h2>
        <p>{t('canvas_fail_desc')}</p>
        <button onClick={() => window.location.reload()}>{t('try_again')}</button>
      </div>
    )
  return (
    <div className="game-canvas-wrap" onClick={onClick} onPointerDown={handlePointerDown}>
      <canvas
        ref={canvasRef}
        className="game-canvas"
        aria-label={t('canvas_stage_aria')}
        role="img"
      />
    </div>
  )
}
