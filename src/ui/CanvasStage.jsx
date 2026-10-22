import { drawAdult } from '../render/characters/Adult.js'
import React, { useEffect, useRef, useState } from 'react'
import { characterStart } from '../render/layers/Courtyard.js'
import { Renderer } from '../render/Renderer.js'
import { Background, LAYOUT } from '../render/layers/Background.js'
import { ChhotuChamp } from '../render/characters/ChhotuChamp.js'
import { Pip } from '../render/characters/Pip.js'
import { Particles } from '../render/Particles.js'
import { JellySquash } from '../render/fx/JellySquash.js'
import { ComicBubble } from '../render/fx/ComicBubble.js'
import { getSoundEngine } from '../audio/SoundEngine.js'

/**
 * Mounts the <canvas> and runs the Renderer with all registered layers.
 * Exposes the engine instances via a callback so the parent (GameController)
 * can drive characters, particles, FX, and audio.
 */
export default function CanvasStage({ onReady, onClick, reducedMotion, paused, onFailure }) {
  const canvasRef = useRef(null)
  const engines = useRef(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!engines.current) return
    const { renderer, particles, jellySquash, background } = engines.current
    background.reducedMotion = reducedMotion
    renderer._reducedMotion = reducedMotion
    particles.reducedMotion = reducedMotion
    if (reducedMotion) particles.flashes = []
    jellySquash.reducedMotion = reducedMotion
    jellySquash.reset()
  }, [reducedMotion])
  useEffect(() => {
    const sync = () => { const r = engines.current?.renderer; if (!r) return; if (paused || document.hidden) r.stop(); else r.start() }
    sync(); document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [paused])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let renderer
    try { renderer = new Renderer(canvas) } catch { setFailed(true); onFailure?.(); return }
    const loseContext = e => { e.preventDefault(); renderer.stop(); getSoundEngine().stopMusic(); getSoundEngine().stopCrackerAudio(); setFailed(true); onFailure?.() }
    canvas.addEventListener('contextlost', loseContext)
    renderer.onError = () => { setFailed(true); onFailure?.() }
    const background = new Background()
    renderer.addLayer(background)

    // FX engine
    const particles = new Particles()
    const comicBubble = new ComicBubble()
    const jellySquash = new JellySquash(canvas.parentElement)

    // Characters
    const chhotu = new ChhotuChamp()
    const pip = new Pip()
    pip.getAudioLevel = () => getSoundEngine().getAudioLevel()

    // Layer order: background -> characters -> particles -> comic bubbles -> jelly squash
    renderer.addLayer({ update(dt) {
      if (background.gameState === 'STEPPING_BACK_SAFE_ROUTINE' || background.gameState === 'COUNTDOWN_3_2_1') {
        pip.x += (Math.max(28,chhotu.x-55)-pip.x)*Math.min(1,dt*5)
        pip.y += (chhotu.y+12-pip.y)*Math.min(1,dt*5)
      }
    } })
    renderer.addLayer({ draw(ctx,w,h,t) { if (background.gameState === 'COUNTDOWN_3_2_1') drawAdult(ctx,w,h,background.currentCracker) } })
    renderer.addLayer(chhotu)
    renderer.addLayer(pip)
    renderer.addLayer(particles)
    renderer.addLayer(comicBubble)
    renderer.addLayer(jellySquash)

    // Set initial positions based on layout
    const setInitialPositions = (w, h) => {
      const start = characterStart(w,h)
      chhotu.setPosition(start.x, start.y)
      pip.setPosition(w * LAYOUT.pipStartX, h * LAYOUT.pipStartY)
    }
    setInitialPositions(renderer.width, renderer.height)

    // Re-position on resize (only if not mid-walk)
    const _origResize = renderer._resize.bind(renderer)
    renderer._resize = function () {
      _origResize()
      if (!chhotu.walkActive && !['COUNTDOWN_3_2_1','CRACKER_SHOW_ACTIVE','CALM_CORNER_OVERLAY'].includes(background.gameState)) {
        chhotu.setPosition(this.width * LAYOUT.chhotuStartX, this.height * LAYOUT.chhotuStartY)
        pip.setPosition(this.width * LAYOUT.pipStartX, this.height * LAYOUT.pipStartY)
      }
    }

    renderer._reducedMotion = reducedMotion
    particles.reducedMotion = reducedMotion
    jellySquash.reducedMotion = reducedMotion
    background.reducedMotion = reducedMotion
    engines.current = { renderer, particles, jellySquash, background }
    renderer.start()

    if (onReady) {
      onReady({ renderer, background, chhotu, pip, particles, comicBubble, jellySquash, layout: LAYOUT })
    }

    return () => {
      canvas.removeEventListener('contextlost', loseContext)
      engines.current = null
      renderer.dispose()
      jellySquash.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (failed) return <div className="recovery-card" role="alert"><h2>The courtyard needs a little rest.</h2><p>Your browser could not draw the scene. You can return to the festival or reload to try again.</p><button onClick={()=>window.location.reload()}>Try again</button></div>
  return (
    <div className="game-canvas-wrap" onClick={onClick}>
      <canvas ref={canvasRef} className="game-canvas" aria-label="Animated Diwali courtyard. Use the buttons to choose and start a pretend firework." role="img" />
    </div>
  )
}
