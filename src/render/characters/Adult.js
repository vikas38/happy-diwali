import { effectOrigin, PLACEMENT_X, STAGE } from '../layers/Courtyard.js'
// A clearly labelled adult handles the pretend ignition; children stay back.
export function drawAdult(ctx, w, h, index, placement = 'center') {
  const px = PLACEMENT_X[placement] ?? STAGE.launchX
  const x = w * px + 38,
    y = h * 0.73 - 4,
    s = Math.max(0.75, Math.min(1.2, h / 650))
  const tip = effectOrigin(index, w, h, placement),
    tx = (tip.x - x) / s,
    ty = (tip.y - y) / s
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  // Ground contact shadow to ground adult visually to street pavement
  ctx.fillStyle = 'rgba(5, 2, 18, 0.45)'
  ctx.beginPath()
  ctx.ellipse(0, 1.5, 20, 5.5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#172637'
  ctx.fillRect(-12, -38, 10, 38)
  ctx.fillRect(4, -38, 10, 38)
  ctx.fillStyle = '#477b80'
  ctx.beginPath()
  ctx.moveTo(-20, -91)
  ctx.lineTo(17, -91)
  ctx.lineTo(22, -35)
  ctx.lineTo(-19, -35)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#c88b63'
  ctx.beginPath()
  ctx.arc(0, -108, 15, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#39313a'
  ctx.beginPath()
  ctx.arc(0, -113, 15, Math.PI, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#c88b63'
  ctx.lineWidth = 8
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-15, -83)
  ctx.lineTo(-28, -58)
  ctx.lineTo(-40, -45)
  ctx.stroke()
  ctx.strokeStyle = '#d9b16c'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(-40, -45)
  ctx.lineTo(tx, ty)
  ctx.stroke()
  ctx.fillStyle = '#fff1be'
  ctx.beginPath()
  ctx.arc(tx, ty, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#f6ead4'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('GROWN-UP', 0, -134)
  ctx.restore()
}
