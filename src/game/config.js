// ── Planet / orbital config ───────────────────────────────────────────────────

/** Visual radius (px) of each planet per development nivel */
export const PLANET_RADII = [10, 14, 20, 28, 38, 52, 68]

/** Body + glow colour per nivel */
export const PLANET_COLORS = [
  { body: 0x9ca3af, glow: 0x6b7280 },  // 0 — gray  (idea)
  { body: 0x60a5fa, glow: 0x3b82f6 },  // 1 — blue  (defining)
  { body: 0x34d399, glow: 0x10b981 },  // 2 — green (prototype)
  { body: 0xa78bfa, glow: 0x8b5cf6 },  // 3 — purple (private beta)
  { body: 0xfbbf24, glow: 0xf59e0b },  // 4 — gold  (public beta)
  { body: 0xfb923c, glow: 0xf97316 },  // 5 — orange (traction)
  { body: 0xf87171, glow: 0xef4444 },  // 6 — red   (scale-up)
]

/** Orbital distance limits (world px) */
export const MIN_ORBITAL_RADIUS = 110
export const MAX_ORBITAL_RADIUS = 720
export const DEFAULT_ORBITAL_RADIUS = 220

/**
 * Orbital angular velocity (rad/ms) at a given radius.
 * Kepler's 3rd law: T ∝ r^1.5, so v ∝ 1 / r^1.5
 * Base: 5-minute period at r = 220
 */
const BASE_PERIOD_MS = 300_000
const BASE_RADIUS    = 220
export function orbitalSpeed(radius) {
  const period = BASE_PERIOD_MS * Math.pow(radius / BASE_RADIUS, 1.5)
  return (Math.PI * 2) / period
}

/** Deterministic base angle (0..2π) derived from Firestore document ID */
export function idToAngle(id) {
  let h = 5381
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(h, 31) + id.charCodeAt(i)) >>> 0
  }
  return (h % 1_000_000) / 1_000_000 * Math.PI * 2
}
