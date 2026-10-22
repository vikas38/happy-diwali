import React, { useEffect, useRef } from 'react'
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
export default function CanvasStage({ onReady, onClick }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new Renderer(canvas)
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
      if (!chhotu.walkActive) {
        chhotu.setPosition(this.width * LAYOUT.chhotuStartX, this.height * LAYOUT.chhotuStartY)
        pip.setPosition(this.width * LAYOUT.pipStartX, this.height * LAYOUT.pipStartY)
      }
    }

    renderer.start()

    if (onReady) {
      onReady({ renderer, background, chhotu, pip, particles, comicBubble, jellySquash, layout: LAYOUT })
    }

    return () => {
      renderer.dispose()
      jellySquash.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="game-canvas-wrap" onClick={onClick}>
      <canvas ref={canvasRef} className="game-canvas" />
    </div>
  )
}
