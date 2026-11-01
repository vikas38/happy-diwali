// Layered, bounded firework synthesis with identity-specific envelopes,
// angular acceleration cadence for spinners, and cancellable handles.
// All sounds route strictly through effectsBus -> intensity shaping -> master limiter.

export function playFireworkSound(sound, kind, duration = 1, pan = 0) {
  if (!sound?.ctx || !sound.supported) {
    const noop = () => {}
    noop.stop = noop
    return noop
  }

  const c = sound.ctx,
    now = c.currentTime,
    nodes = [],
    timers = []

  const targetBus = sound.effectsBus || sound.intensityGain
  const bus = c.createGain()
  bus.gain.value = 1

  const position = c.createStereoPanner?.()
  if (position) {
    position.pan.value = Math.max(-0.7, Math.min(0.7, pan))
    bus.connect(position)
    position.connect(targetBus)
  } else {
    bus.connect(targetBus)
  }

  function noise(start, length, gain, frequency, type = 'bandpass', q = 0.7) {
    const src = sound.createNoiseSource('white')
    if (!src) return
    const filter = c.createBiquadFilter()
    filter.type = type
    filter.frequency.setValueAtTime(frequency, start)
    filter.Q.value = q

    const env = c.createGain()
    env.gain.setValueAtTime(0.0001, start)
    env.gain.linearRampToValueAtTime(gain, start + Math.min(0.012, length * 0.1))
    env.gain.exponentialRampToValueAtTime(0.0001, start + length)

    src.connect(filter)
    filter.connect(env)
    env.connect(bus)

    src.start(start)
    src.stop(start + length + 0.02)
    nodes.push(src, filter, env)
  }

  function tone(start, length, freqStart, freqEnd, gain, type = 'sine') {
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = type
    o.frequency.setValueAtTime(freqStart, start)
    if (typeof o.frequency.exponentialRampToValueAtTime === 'function') {
      o.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), start + length)
    } else {
      o.frequency.setValueAtTime(freqEnd, start + length)
    }

    g.gain.setValueAtTime(0.0001, start)
    g.gain.linearRampToValueAtTime(gain, start + Math.min(0.01, length * 0.1))
    g.gain.exponentialRampToValueAtTime(0.0001, start + length)

    o.connect(g)
    g.connect(bus)

    o.start(start)
    o.stop(start + length + 0.02)
    nodes.push(o, g)
  }

  // --- Synthesis by firework identity ---
  if (kind === 'boom') {
    // Sutli Bomb & Rocket burst: rounded low impact thump + crisp initial crack + restrained reflection
    // Initial crack transient
    noise(now, 0.09, 0.7, 2400, 'bandpass')
    // Low rounded thump (sine 105Hz -> 36Hz)
    tone(now, 0.65, 105, 36, 0.45, 'sine')
    // Low-mid warm body
    noise(now, 0.55, 0.45, 650, 'lowpass')
    // Delayed restrained reflections
    noise(now + 0.12, 0.5, 0.18, 450, 'lowpass')
    noise(now + 0.28, 0.6, 0.1, 320, 'lowpass')
  } else if (kind === 'pop') {
    // Ladi: controlled discrete pop with slight varied pitch and bounded gain
    const pitchOffset = (Math.random() - 0.5) * 300
    noise(now, 0.08, 0.5, 1800 + pitchOffset, 'bandpass')
    tone(now, 0.1, 160 + (Math.random() - 0.5) * 40, 45, 0.22, 'sine')
    noise(now + 0.05, 0.12, 0.15, 600, 'lowpass')
  } else if (kind === 'sparkler') {
    // Phuljhari: fine irregular crackle with a tapering tail
    // Continuous gentle base sizzle
    noise(now, duration, 0.32, 3400, 'bandpass', 1.0)

    // Micro-crackles that naturally taper in density and gain over the final 0.6s
    for (let t = 0; t < duration; t += 0.035 + Math.random() * 0.065) {
      const prog = t / duration
      // Taper micro-crackle gain towards the tail
      const taper = prog > 0.7 ? Math.max(0.1, (1 - prog) / 0.3) : 1.0
      const tLen = 0.015 + Math.random() * 0.035
      const tGain = (0.16 + Math.random() * 0.2) * taper
      const tFreq = 2600 + Math.random() * 3400
      noise(now + t, tLen, tGain, tFreq, 'bandpass', 1.2)
    }
  } else if (kind === 'fountain') {
    // Anar: rise and decay matching fountain strength (peaks at ~1.3s)
    // Continuous rushing exhaust with volume curve: rise to peak at ~1.3s then decay
    const peakTime = Math.min(1.3, duration * 0.5)
    // Onset rising noise
    noise(now, peakTime + 0.2, 0.52, 2000, 'bandpass', 0.8)
    // Sustained & decaying tail noise
    noise(now + peakTime * 0.6, duration - peakTime * 0.6, 0.45, 1700, 'lowpass', 0.8)

    // Sizzle crackles with higher cadence and intensity during peak fountain height
    for (let t = 0; t < duration; t += 0.04 + Math.random() * 0.07) {
      const relTime = t / duration
      // Fountain height envelope: sin wave peak in middle
      const height = Math.sin(Math.min(1, relTime * 1.1) * Math.PI)
      const tLen = 0.02 + Math.random() * 0.04
      const tGain = (0.15 + Math.random() * 0.25) * (0.3 + 0.7 * height)
      const tFreq = 1800 + Math.random() * 3200
      noise(now + t, tLen, tGain, tFreq)
    }
  } else if (kind === 'spinner') {
    // Chakri: pulse cadence follows angular acceleration!
    // Visible rotation: a = 20t + 8t^2 => omega(t) = 20 + 16t
    // As wheel spins faster, pulse interval dt = 2*PI / omega decreases from ~0.31s to ~0.10s
    let t = 0
    while (t < duration) {
      const omega = 20 + 16 * t
      const dt = Math.max(0.08, (Math.PI * 2) / omega)
      const whirFreq = Math.min(3400, 1000 + omega * 38)
      const pLen = Math.max(0.05, Math.min(0.12, dt * 0.8))
      noise(now + t, pLen, 0.35, whirFreq, 'bandpass', 1.2)
      t += dt
    }
    // Background spinning drone that sweeps up with acceleration
    noise(now, duration, 0.28, 1400, 'lowpass', 0.9)
  } else if (kind === 'whoosh') {
    // Rocket ascent: readable rising exhaust whoosh
    noise(now, duration, 0.65, 1200, 'lowpass')
    tone(now, duration, 240, 720, 0.18, 'sine')
  } else if (kind === 'fuse') {
    // Fuse / warning: steady sizzle with fine sparks
    noise(now, duration, 0.28, 3200, 'bandpass', 1.5)
    for (let t = 0; t < duration; t += 0.06 + Math.random() * 0.08) {
      noise(now + t, 0.02, 0.16 + Math.random() * 0.14, 4000 + Math.random() * 2000)
    }
  } else if (kind === 'cascade') {
    // Golden Waterfall (ID 6): soft descending harmonic rushing curtain with fine sparkling hiss
    noise(now, duration, 0.38, 2200, 'bandpass', 0.9)
    noise(now + 0.2, duration - 0.2, 0.25, 950, 'lowpass', 0.8)
    for (let t = 0.1; t < duration; t += 0.05 + Math.random() * 0.08) {
      const prog = t / duration
      const taper = prog > 0.7 ? Math.max(0.1, (1 - prog) / 0.3) : 1.0
      noise(
        now + t,
        0.025,
        (0.12 + Math.random() * 0.15) * taper,
        3000 + Math.random() * 2500,
        'bandpass',
        1.1
      )
    }
  } else if (kind === 'fan') {
    // Comet Fan (ID 7): five-tone celestial arcing whooshes
    for (let i = 0; i < 5; i++) {
      const offset = i * 0.14
      tone(now + offset, 0.65, 260 + i * 85, 580 + i * 110, 0.16, 'sine')
      noise(now + offset, 0.5, 0.22, 1400 + i * 200, 'bandpass', 1.0)
    }
  } else if (kind === 'ring') {
    // Ring Burst (ID 8): resonant crystal chime with gentle outer burst
    noise(now, 0.1, 0.55, 2100, 'bandpass')
    tone(now, 1.8, 659.25, 659.25, 0.25, 'sine') // E5
    tone(now + 0.05, 1.6, 987.77, 987.77, 0.18, 'sine') // B5
    noise(now + 0.1, 0.8, 0.2, 1200, 'lowpass')
  } else if (kind === 'peacock') {
    // Peacock Fan (ID 9): lush fluttering chords rising in harmony
    const freqs = [330, 440, 554, 660]
    freqs.forEach((f, idx) => {
      tone(now + idx * 0.08, 1.4, f, f * 1.05, 0.18, 'triangle')
      noise(now + idx * 0.08, 0.8, 0.18, 2200, 'bandpass', 1.2)
    })
  } else if (kind === 'spiral') {
    // Spiral Sky (ID 10): ascending curling whistle and sparkle
    tone(now, 1.4, 280, 780, 0.16, 'sine')
    noise(now + 0.3, 1.0, 0.14, 2800, 'bandpass')
    for (let t = 0.5; t < duration; t += 0.1) {
      noise(now + t, 0.03, 0.08, 3600, 'bandpass')
    }
  } else if (kind === 'chrysanthemum') {
    // Chrysanthemum Bloom (ID 11): soft rounded bloom followed by fine crackle
    noise(now, 0.15, 0.42, 1400, 'bandpass')
    tone(now, 0.6, 220, 110, 0.22, 'sine')
    for (let t = 0.15; t < duration; t += 0.08) {
      noise(now + t, 0.03, 0.11, 4200 + Math.random() * 1500, 'bandpass')
    }
  } else if (kind === 'blossom') {
    // Double Blossom (ID 12): two controlled harmonic blooms separated by the visual beat
    noise(now, 0.12, 0.38, 1800, 'bandpass')
    tone(now, 0.7, 392, 330, 0.2, 'sine')
    noise(now + 1.1, 0.14, 0.42, 2400, 'bandpass')
    tone(now + 1.1, 0.9, 587.33, 523.25, 0.22, 'sine')
  } else if (kind === 'constellation') {
    // Constellation Sparkles (ID 13): glassy starlight chime sequence
    const notes = [783.99, 987.77, 1174.66, 1318.51]
    notes.forEach((freq, idx) => {
      tone(now + idx * 0.35, 1.4, freq, freq, 0.16, 'sine')
      noise(now + idx * 0.35, 0.25, 0.08, 3200 + idx * 400, 'bandpass')
    })
  }

  sound.trackCrackerNode(bus, bus)

  let stopped = false
  const handle = () => {
    if (stopped) return
    stopped = true
    timers.forEach((id) => clearTimeout(id))
    for (const n of nodes) {
      try {
        n.stop?.()
      } catch {}
      try {
        n.disconnect?.()
      } catch {}
    }
    try {
      bus.disconnect()
    } catch {}
    try {
      position?.disconnect()
    } catch {}
    sound._activeNodes?.delete(bus)
    sound._crackerHandles?.delete(handle)
    if (sound._crackerNodes) {
      for (const entry of Array.from(sound._crackerNodes)) {
        if (entry.node === bus) sound._crackerNodes.delete(entry)
      }
    }
  }
  handle.stop = handle
  sound.trackCrackerHandle?.(handle)

  return handle
}
