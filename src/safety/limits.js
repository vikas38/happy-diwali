export const MAX_OUTPUT_PEAK = 0.25
export const FLASH_INTERVAL_MS = 400
export function limiterCurve(size = 4097) {
  return Float32Array.from({ length: size }, (_, i) => MAX_OUTPUT_PEAK * Math.tanh((i / (size - 1) * 2 - 1) / MAX_OUTPUT_PEAK))
}
export function meaningfulResize(before, after) {
  return Math.abs(before.width - after.width) > 50 || Math.abs(before.height - after.height) > 150
}
