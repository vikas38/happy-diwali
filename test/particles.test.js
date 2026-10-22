import { describe, it, expect } from 'vitest'
import { Particles, POOL_SIZE } from '../src/render/Particles.js'
import { JellySquash } from '../src/render/fx/JellySquash.js'
import { ComicBubble } from '../src/render/fx/ComicBubble.js'

describe('Particles — pool management', () => {
  it('pre-allocates exactly POOL_SIZE particles', () => {
    const p = new Particles()
    expect(p.pool.length).toBe(POOL_SIZE)
    expect(p.capacity).toBe(POOL_SIZE)
  })

  it('starts with zero active particles', () => {
    const p = new Particles()
    expect(p.activeCount).toBe(0)
  })

  it('does not grow the pool when spawning beyond capacity', () => {
    const p = new Particles()
    // Spawn way more than capacity — pool should not grow
    for (let i = 0; i < POOL_SIZE * 3; i++) {
      p.spawn(0, 0, { decay: 100 }) // very slow decay so they stay active
    }
    expect(p.pool.length).toBe(POOL_SIZE)
    p.update(0.016, 0)
    expect(p.activeCount).toBeLessThanOrEqual(POOL_SIZE)
  })

  it('reuses dead particles (pool reuse after warmup)', () => {
    const p = new Particles()
    // Spawn 100 particles with fast decay
    for (let i = 0; i < 100; i++) {
      p.spawn(0, 0, { decay: 5 })
    }
    p.update(0.016, 0)
    expect(p.activeCount).toBe(100)
    // Let them all die
    for (let i = 0; i < 50; i++) p.update(0.5, i * 0.5)
    expect(p.activeCount).toBe(0)
    // Spawn again — should reuse same pool slots
    for (let i = 0; i < 100; i++) {
      p.spawn(0, 0, { decay: 5 })
    }
    p.update(0.016, 0)
    expect(p.activeCount).toBe(100)
    expect(p.pool.length).toBe(POOL_SIZE) // still same size
  })

  it('clear() deactivates all particles', () => {
    const p = new Particles()
    for (let i = 0; i < 50; i++) p.spawn(0, 0, { decay: 100 })
    p.update(0.016, 0)
    expect(p.activeCount).toBe(50)
    p.clear()
    expect(p.activeCount).toBe(0)
  })
})

describe('Particles — physics step', () => {
  it('particles move according to velocity', () => {
    const p = new Particles()
    p.spawn(100, 100, { vx: 50, vy: 0, drag: 1, gravity: 0, decay: 0.01 })
    p.update(0.5, 0)
    // x should be ~100 + 50*0.5 = 125
    const particle = p.pool.find((q) => q.active)
    expect(particle).toBeTruthy()
    expect(particle.x).toBeCloseTo(125, 0)
  })

  it('gravity pulls particles down', () => {
    const p = new Particles()
    p.spawn(100, 100, { vx: 0, vy: 0, gravity: 200, drag: 1, decay: 0.01 })
    p.update(0.5, 0)
    const particle = p.pool.find((q) => q.active)
    // vy should be ~200*0.5 = 100, y should be ~100 + 0.5*100*0.5 = 125
    expect(particle.vy).toBeCloseTo(100, 0)
  })

  it('alpha decays over time', () => {
    const p = new Particles()
    p.spawn(0, 0, { decay: 1, drag: 1 })
    p.update(0.5, 0)
    const particle = p.pool.find((q) => q.active)
    expect(particle).toBeTruthy()
    expect(particle.alpha).toBeCloseTo(0.5, 1) // 1 - 1*0.5 = 0.5
  })

  it('particles deactivate when alpha reaches 0', () => {
    const p = new Particles()
    p.spawn(0, 0, { decay: 10, drag: 1 })
    p.update(0.2, 0) // alpha = 1 - 10*0.2 = -1 -> deactivated
    const particle = p.pool.find((q) => q.active)
    expect(particle).toBeUndefined()
  })
})

describe('JellySquash — spring convergence', () => {
  it('starts at rest (scale 1,1)', () => {
    const js = new JellySquash(null)
    expect(js.scaleX).toBe(1)
    expect(js.scaleY).toBe(1)
    expect(js.isAtRest).toBe(true)
  })

  it('displaces from rest when triggered', () => {
    const js = new JellySquash(null)
    js.trigger(0.2)
    expect(Math.abs(js.scaleX - 1)).toBeGreaterThan(0.1)
    expect(Math.abs(js.scaleY - 1)).toBeGreaterThan(0.1)
    expect(js.isAtRest).toBe(false)
  })

  it('converges back to rest after spring oscillation', () => {
    const js = new JellySquash(null)
    js.trigger(0.2)
    // Simulate ~1 second of updates
    for (let i = 0; i < 120; i++) js.update(1 / 60, i / 60)
    expect(js.isAtRest).toBe(true)
    expect(js.scaleX).toBeCloseTo(1, 1)
    expect(js.scaleY).toBeCloseTo(1, 1)
  })

  it('does not move when reduced motion is set', () => {
    const js = new JellySquash(null)
    js.reducedMotion = true
    js.trigger(0.3)
    expect(js.scaleX).toBe(1)
    expect(js.scaleY).toBe(1)
  })
})

describe('ComicBubble — spring scale-in', () => {
  it('spawns at near-zero scale and grows', () => {
    const cb = new ComicBubble()
    cb.spawn(100, 100, 'POP!')
    expect(cb.bubbles.length).toBe(1)
    expect(cb.bubbles[0].scale).toBeLessThan(0.1)
    // Update to let spring grow
    for (let i = 0; i < 30; i++) cb.update(0.016, i * 0.016)
    expect(cb.bubbles[0].scale).toBeGreaterThan(0.5)
  })

  it('bubbles float upward over time', () => {
    const cb = new ComicBubble()
    cb.spawn(100, 200, 'POP!')
    const startY = cb.bubbles[0].y
    for (let i = 0; i < 30; i++) cb.update(0.016, i * 0.016)
    expect(cb.bubbles[0].y).toBeLessThan(startY)
  })

  it('bubbles fade and are removed after their lifetime', () => {
    const cb = new ComicBubble()
    cb.spawn(100, 100, 'POP!', { duration: 0.5 })
    for (let i = 0; i < 40; i++) cb.update(0.016, i * 0.016)
    expect(cb.bubbles.length).toBe(0)
  })

  it('hasActive reflects bubble state', () => {
    const cb = new ComicBubble()
    expect(cb.hasActive).toBe(false)
    cb.spawn(100, 100, 'POP!')
    expect(cb.hasActive).toBe(true)
  })
})
