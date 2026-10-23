// Layered, bounded synthesis: dry ignition, granular crackle, rushing exhaust,
// a low impact and a delayed, filtered reflection. All pass through user volume.
export function playFireworkSound(sound, kind, duration = 1, pan = 0) {
  if (!sound?.ctx || !sound.supported) return () => {}
  const c = sound.ctx,
    now = c.currentTime,
    nodes = []
  const bus = c.createGain()
  bus.gain.value = 1
  const position = c.createStereoPanner?.()
  if (position) {
    position.pan.value = Math.max(-0.7, Math.min(0.7, pan))
    bus.connect(position)
    position.connect(sound.intensityGain)
  } else bus.connect(sound.intensityGain)
  function noise(start, length, gain, frequency, type = 'bandpass') {
    const src = sound.createNoiseSource('white')
    if (!src) return
    const filter = c.createBiquadFilter()
    filter.type = type
    filter.frequency.setValueAtTime(frequency, start)
    filter.Q.value = 0.7
    const env = c.createGain()
    env.gain.setValueAtTime(0.0001, start)
    env.gain.linearRampToValueAtTime(gain, start + 0.008)
    env.gain.exponentialRampToValueAtTime(0.0001, start + length)
    src.connect(filter)
    filter.connect(env)
    env.connect(bus)
    src.start(start)
    src.stop(start + length + 0.02)
    nodes.push(src, filter, env)
  }
  function tone(start, length, freq, gain) {
    const o = c.createOscillator(),
      g = c.createGain()
    o.frequency.setValueAtTime(freq, start)
    o.frequency.exponentialRampToValueAtTime(38, start + length)
    g.gain.setValueAtTime(gain, start)
    g.gain.exponentialRampToValueAtTime(0.0001, start + length)
    o.connect(g)
    g.connect(bus)
    o.start(start)
    o.stop(start + length + 0.02)
    nodes.push(o, g)
  }
  if (kind === 'boom') {
    noise(now, 0.12, 0.85, 2400)
    noise(now, 0.85, 0.65, 700, 'lowpass')
    tone(now, 0.65, 110, 0.5)
    noise(now + 0.15, 0.65, 0.25, 550, 'lowpass')
    noise(now + 0.31, 0.8, 0.15, 380, 'lowpass')
  } else if (kind === 'pop') {
    noise(now, 0.11, 0.75, 1800)
    tone(now, 0.13, 170, 0.22)
    noise(now + 0.09, 0.2, 0.18, 650)
  } else {
    const fountain = kind === 'fountain',
      whoosh = kind === 'whoosh',
      fuse = kind === 'fuse',
      spinner = kind === 'spinner'

    const baseGain = whoosh ? 0.72 : fountain ? 0.58 : fuse ? 0.28 : spinner ? 0.35 : 0.38
    const baseFreq = whoosh ? 1600 : fountain ? 2200 : fuse ? 3200 : spinner ? 3000 : 3600
    const filterType = whoosh ? 'lowpass' : 'bandpass'

    noise(now, duration, baseGain, baseFreq, filterType)

    // Irregular small transients sound like burning metal / sizzle crackles, not a sustained note.
    if (!whoosh) {
      for (let t = 0; t < duration; t += 0.045 + Math.random() * 0.08) {
        const tLen = 0.018 + Math.random() * 0.045
        const tGain = fuse
          ? 0.18 + Math.random() * 0.16
          : fountain
            ? 0.22 + Math.random() * 0.22
            : 0.24 + Math.random() * 0.22
        const tFreq = 1600 + Math.random() * 4000
        noise(now + t, tLen, tGain, tFreq)
      }
    }
    if (kind === 'spinner') {
      for (let t = 0; t < duration; t += 0.1) {
        noise(now + t, 0.08, 0.36, 1100 + t * 700)
      }
    }
  }
  sound.trackCrackerNode(bus, bus)
  let stopped = false
  // Connect all generators to one tracked bus. Disconnecting the bus cancels
  // scheduled transients immediately, including those not started yet.
  return () => {
    if (stopped) return
    stopped = true
    for (const n of nodes) {
      try {
        n.stop?.()
      } catch {}
      try {
        n.disconnect()
      } catch {}
    }
    bus.disconnect()
    position?.disconnect()
    sound._activeNodes?.delete(bus)
    if (sound._crackerNodes)
      for (const entry of sound._crackerNodes)
        if (entry.node === bus) sound._crackerNodes.delete(entry)
  }
}
