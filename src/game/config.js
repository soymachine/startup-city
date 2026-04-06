// ── Planet / orbital config ───────────────────────────────────────────────────

/** Visual radius (px) of each planet per development nivel */
export const PLANET_RADII = [10, 14, 20, 28, 38, 52, 68]

/** Body colour per nivel — yellow (#ffd60a) is reserved for the sun */
export const PLANET_COLORS = [
  { body: 0x94a3b8 },  // 0 — slate   (idea)
  { body: 0x60a5fa },  // 1 — blue    (defining)
  { body: 0x34d399 },  // 2 — emerald (prototype)
  { body: 0xa78bfa },  // 3 — violet  (private beta)
  { body: 0x22d3ee },  // 4 — cyan    (public beta)
  { body: 0xfb923c },  // 5 — orange  (traction)
  { body: 0xf87171 },  // 6 — rose    (scale-up)
]

/** Orbital distance limits (world px) */
export const MIN_ORBITAL_RADIUS = 110
export const MAX_ORBITAL_RADIUS = 1440
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
