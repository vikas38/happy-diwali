export function fireRewardConfetti(particles, w, h) {
  if (particles.reducedMotion) return
  const colors = [45, 0, 120, 320, 180, 60, 280]
  for (let side = 0; side < 2; side++) {
    const cx = side === 0 ? w * 0.1 : w * 0.9
    const cy = h * 0.4
    for (let i = 0; i < 60; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8
      const speed = 100 + Math.random() * 200
      particles.spawn(cx, cy, {
        vx: Math.cos(angle) * speed * (side === 0 ? 1 : -1),
        vy: Math.sin(angle) * speed,
        gravity: 120,
        drag: 0.97,
        size: 3 + Math.random() * 4,
        alpha: 1,
        decay: 0.25 + Math.random() * 0.2,
        hue: colors[Math.floor(Math.random() * colors.length)],
        sat: 100,
        light: 65,
        shape: Math.random() > 0.5 ? 'confetti' : 'star',
        glow: false,
        rotSpeed: (Math.random() - 0.5) * 6,
      })
    }
  }
}

