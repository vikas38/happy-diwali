// Shared stage geometry: props, ignition targets and emitters use the same anchors.
export const STAGE = {
  launchX: 0.57,
  launchY: 0.73,
  safeX: 0.19,
  safeY: 0.75,
  chhotuStartX: 0.4,
  chhotuStartY: 0.75,
  pipStartX: 0.29,
  pipStartY: 0.77,
  streetTop: 0.59,
}
export const propScale = (w, h) => Math.max(1, Math.min(1.8, w / 700, h / 460))
export function effectOrigin(index, w, h) {
  const s = propScale(w, h)
  const tips = [
    [-6, -36],
    [0, -28],
    [0, -4],
    [0, -38],
    [-22, -2],
    [0, -16],
  ]
  const [dx, dy] = tips[index] || [0, 0]
  return { x: w * STAGE.launchX + dx * s, y: h * STAGE.launchY - 6 + dy * s }
}
const TAU = Math.PI * 2
function ellipse(c, x, y, rx, ry, color) {
  c.fillStyle = color
  c.beginPath()
  c.ellipse(x, y, rx, ry, 0, 0, TAU)
  c.fill()
}
function halo(c, x, y, r, color) {
  const g = c.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, color)
  g.addColorStop(1, 'transparent')
  c.fillStyle = g
  c.fillRect(x - r, y - r, r * 2, r * 2)
}
function arch(c, x, y, w, h, color) {
  w = Math.max(2, w)
  c.fillStyle = color
  c.beginPath()
  c.moveTo(x, y + h)
  c.lineTo(x, y + w / 2)
  c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0)
  c.lineTo(x + w, y + h)
  c.closePath()
  c.fill()
}
function lamp(c, x, y, s, t) {
  c.save()
  c.translate(x, y)
  c.scale(s, s)
  halo(c, 0, -5, 40, '#ffb74925')
  ellipse(c, 0, 0, 9, 3, '#d28a54')
  c.fillStyle = '#8f4b36'
  c.beginPath()
  c.arc(0, 0, 9, 0, Math.PI)
  c.fill()
  c.fillStyle = '#ffd87c'
  c.beginPath()
  c.moveTo(-3, -2)
  c.bezierCurveTo(-8, -10, Math.sin(t * 3) * 3, -12, 0, -19)
  c.bezierCurveTo(6, -11, 6, -6, 3, -2)
  c.fill()
  ellipse(c, 0, -5, 2, 4, '#fff3c8')
  c.restore()
}
export function drawCourtyard(c, w, h, t, state, reducedMotion = false) {
  const effectiveT = reducedMotion ? t * 0.15 : t
  const ground = h * 0.6
  const sky = c.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#080f20')
  sky.addColorStop(0.55, '#20283a')
  sky.addColorStop(1, '#655044')
  c.fillStyle = sky
  c.fillRect(0, 0, w, h)
  halo(c, w * 0.55, ground, w * 0.65, '#b2734030')
  for (let i = 0; i < 70; i++) {
    const x = (((i * 7919) % 997) / 997) * w,
      y = (((i * 3571) % 991) / 991) * h * 0.5
    ellipse(
      c,
      x,
      y,
      i % 7 === 0 ? 1.3 : 0.65,
      i % 7 === 0 ? 1.3 : 0.65,
      `rgba(239,229,204,${0.22 + Math.sin(effectiveT * 0.4 + i) * 0.12})`
    )
  }
  halo(c, w * 0.78, h * 0.18, 75, '#c9d7eb18')
  ellipse(c, w * 0.78, h * 0.18, 18, 18, '#e8e6d4')
  ellipse(c, w * 0.78 + 6, h * 0.18 - 5, 17, 17, '#151f30')
  // Distant terraces give depth without competing with the fireworks.
  for (let i = 0; i < 17; i++) {
    const x = (i * w) / 16,
      bh = h * (0.065 + ((i * 37) % 11) / 95)
    c.fillStyle = i % 2 ? '#242a35' : '#202834'
    c.fillRect(x, ground - bh, w / 15, bh)
    if (i % 3 === 0) {
      ellipse(c, x + w / 34, ground - bh, w / 36, 18, '#242a35')
    }
    for (let j = 0; j < 3; j++)
      (c.fillStyle = '#d39d5533'), c.fillRect(x + 12 + j * 16, ground - bh + 22, 3, 7)
  }
  // Two framing sandstone havelis; the central sky stays open.
  for (const side of [0, 1]) {
    const bw = Math.min(w * 0.21, 270),
      x = side ? w - bw : 0,
      top = ground - h * 0.31
    const wall = c.createLinearGradient(x, 0, x + bw, 0)
    wall.addColorStop(0, side ? '#544039' : '#342f32')
    wall.addColorStop(1, side ? '#302c30' : '#58423b')
    c.fillStyle = wall
    c.fillRect(x, top, bw, ground - top)
    c.fillStyle = '#76604a'
    c.fillRect(x, top, bw, 7)
    c.fillRect(x, top + 12, bw, 3)
    c.fillRect(x, ground - 9, bw, 9)
    for (let j = 0; j < 3; j++) {
      const ax = x + bw * (0.12 + j * 0.29),
        aw = bw * 0.17
      arch(c, ax, top + 33, aw, h * 0.11, '#9d79524d')
      arch(c, ax + 4, top + 38, aw - 8, h * 0.1, '#d9a45d')
      arch(c, ax + 8, top + 42, aw - 16, h * 0.095, '#463a32')
      c.strokeStyle = '#bb915b'
      c.lineWidth = 1
      c.beginPath()
      c.moveTo(ax + aw / 2, top + 45)
      c.lineTo(ax + aw / 2, top + h * 0.15)
      c.stroke()
      halo(c, ax + aw / 2, top + h * 0.1, aw * 1.8, '#f0af4820')
    }
    for (let i = 0; i < 16; i++) {
      const lx = x + (i * bw) / 15,
        ly = top + 17 + Math.sin((i / 15) * Math.PI) * 16
      halo(c, lx, ly, 9, '#ffb34745')
      ellipse(c, lx, ly, 1.8, 2.4, '#fbd493')
    }
    for (let i = 0; i < 5; i++)
      lamp(c, x + 20 + (i * (bw - 40)) / 4, ground - 13, 0.7, effectiveT + i)
  }
  const floor = c.createLinearGradient(0, ground, 0, h)
  floor.addColorStop(0, '#49423e')
  floor.addColorStop(0.55, '#302e30')
  floor.addColorStop(1, '#171d28')
  c.fillStyle = floor
  c.fillRect(0, ground, w, h - ground)
  c.strokeStyle = '#bba7830d'
  c.lineWidth = 1
  for (let i = 0; i < 13; i++) {
    c.beginPath()
    c.moveTo(w * 0.5 + (i - 6) * 25, ground)
    c.lineTo(((i - 2) * w) / 8, h)
    c.stroke()
  }
  for (let i = 1; i < 7; i++) {
    const y = ground + (h - ground) * Math.pow(i / 7, 1.7)
    c.beginPath()
    c.moveTo(0, y)
    c.lineTo(w, y)
    c.stroke()
  }
  halo(c, w * 0.15, ground + 20, 160, '#e7a34216')
  halo(c, w * 0.9, ground + 20, 160, '#e7a34212')
  for (let i = 0; i < 9; i++) {
    const x = w * 0.07 + i * w * 0.108
    lamp(c, x, ground + 8, 0.6 + (i % 3) * 0.15, effectiveT + i)
  }
  // Foreground lanterns and their warm reflections.
  for (const x of [w * 0.045, w * 0.94]) {
    const y = h * 0.85
    halo(c, x, y, 95, '#ffac4520')
    lamp(c, x, y, 1.8, effectiveT)
    ellipse(c, x, y + 20, 17, 3, '#c68a4030')
  }
  c.save()
  c.strokeStyle = '#d8b57c44'
  c.setLineDash([3, 7])
  c.beginPath()
  c.ellipse(w * STAGE.launchX, h * STAGE.launchY + 5, Math.min(65, w * 0.12), 18, 0, 0, TAU)
  c.stroke()
  c.restore()
  if (state === 'READY_ON_STREET') {
    const a = 0.2 + Math.sin(effectiveT * 2) * 0.08
    c.strokeStyle = `rgba(255,209,133,${a})`
    c.beginPath()
    c.ellipse(w * STAGE.launchX, h * STAGE.launchY + 5, Math.min(78, w * 0.15), 24, 0, 0, TAU)
    c.stroke()
  }
  const vignette = c.createRadialGradient(
    w * 0.5,
    h * 0.45,
    h * 0.2,
    w * 0.5,
    h * 0.45,
    Math.max(w, h) * 0.75
  )
  vignette.addColorStop(0, 'transparent')
  vignette.addColorStop(1, '#040b17a0')
  c.fillStyle = vignette
  c.fillRect(0, 0, w, h)
}
export const characterScale = (w, h) => Math.max(1.55, Math.min(2.8, h / 285, w / 240))
export function characterStart(w, h) {
  return { x: w * STAGE.launchX - 43 * characterScale(w, h), y: h * STAGE.chhotuStartY }
}
