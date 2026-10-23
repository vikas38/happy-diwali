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
    noise(now, 0.12, 0.7, 2400)
    noise(now, 0.85, 0.5, 700, 'lowpass')
    tone(now, 0.65, 110, 0.55)
    noise(now + 0.15, 0.65, 0.17, 550, 'lowpass')
    noise(now + 0.31, 0.8, 0.09, 380, 'lowpass')
  } else if (kind === 'pop') {
    noise(now, 0.11, 0.55, 1800)
    tone(now, 0.13, 170, 0.18)
    noise(now + 0.09, 0.2, 0.08, 650)
  } else {
    const fountain = kind === 'fountain',
      whoosh = kind === 'whoosh'
    noise(
      now,
      duration,
      whoosh ? 0.55 : fountain ? 0.4 : 0.14,
      whoosh ? 1500 : fountain ? 2200 : 3800,
      whoosh ? 'lowpass' : 'bandpass'
    )
    // Irregular small transients sound like burning metal, not a sustained note.
    if (!whoosh)
      for (let t = 0; t < duration; t += 0.045 + Math.random() * 0.08)
        noise(
          now + t,
          0.018 + Math.random() * 0.045,
          kind === 'fuse' ? 0.09 : 0.11 + Math.random() * 0.13,
          1500 + Math.random() * 4200
        )
    if (kind === 'spinner')
      for (let t = 0; t < duration; t += 0.1) noise(now + t, 0.08, 0.2, 1100 + t * 700)
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
