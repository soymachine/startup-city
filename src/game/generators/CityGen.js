/**
 * Procedural city generator — pure function, no Phaser dependency.
 * Returns a 2D array of tile descriptors for a cols×rows map.
 */
import {
  T_GRASS, T_ROAD, T_WATER, T_PARK,
  CB_COTTAGE, CB_HOUSE, CB_SHOP, CB_OFFICE, CB_APART,
  CITY_BUILDING_HEIGHTS,
} from '../config'

// Deterministic PRNG (mulberry32)
function mkRng(seed) {
  let s = seed >>> 0
  return () => {
    s += 0x6d2b79f5
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function generateCity(cols, rows, seed = 42) {
  const rng = mkRng(seed)

  // Initialise all tiles as grass, no city building
  const tiles = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: T_GRASS, city: null }))
  )

  const set = (r, c, type) => {
    if (r >= 0 && r < rows && c >= 0 && c < cols) tiles[r][c].type = type
  }
  const get = (r, c) => (r >= 0 && r < rows && c >= 0 && c < cols ? tiles[r][c] : null)

  // ── 1. River (right third, meanders top→bottom, width 3) ──────────────────
  let rx = Math.floor(cols * 0.72)
  for (let r = 0; r < rows; r++) {
    if (rng() < 0.35) rx += rng() < 0.5 ? 1 : -1
    rx = Math.max(Math.floor(cols * 0.67), Math.min(Math.floor(cols * 0.8), rx))
    for (let w = 0; w < 3; w++) set(r, rx + w, T_WATER)
    if (get(r, rx - 1)?.type === T_GRASS) set(r, rx - 1, T_PARK) // riverbank
    if (get(r, rx + 3)?.type === T_GRASS) set(r, rx + 3, T_PARK)
  }

  // ── 2. Lake (NW quadrant, irregular ellipse via noise) ────────────────────
  const lc = 7 + Math.floor(rng() * 4)
  const lr = 7 + Math.floor(rng() * 4)
  const lrad = 4.5 + rng() * 1.5
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const d = Math.hypot(c - lc, r - lr) + (rng() - 0.5) * 1.4
      if (d < lrad) set(r, c, T_WATER)
      else if (d < lrad + 1.8 && tiles[r][c].type === T_GRASS) set(r, c, T_PARK)
    }
  }

  // ── 3. Road grid (every 7 tiles) ──────────────────────────────────────────
  for (let r = 6; r < rows; r += 7) {
    for (let c = 0; c < cols; c++) {
      const t = get(r, c)
      if (t && (t.type === T_GRASS || t.type === T_PARK)) t.type = T_ROAD
    }
  }
  for (let c = 6; c < cols; c += 7) {
    for (let r = 0; r < rows; r++) {
      const t = get(r, c)
      if (t && (t.type === T_GRASS || t.type === T_PARK)) t.type = T_ROAD
    }
  }

  // ── 4. Parks adjacent to water ─────────────────────────────────────────────
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (tiles[r][c].type !== T_GRASS) continue
      const adj = [[-1,0],[1,0],[0,-1],[0,1]].some(
        ([dr, dc]) => get(r + dr, c + dc)?.type === T_WATER
      )
      if (adj && rng() < 0.6) tiles[r][c].type = T_PARK
    }
  }

  // ── 5. City buildings on remaining grass tiles ────────────────────────────
  const cx = cols / 2, cy = rows / 2
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (tiles[r][c].type !== T_GRASS) continue
      const dist = Math.hypot(c - cx, r - cy)
      tiles[r][c].city = pickBuilding(dist, cols, rng)
    }
  }

  return tiles
}

function pickBuilding(distFromCenter, cols, rng) {
  const r = rng()
  const heightVariance = 0.7 + rng() * 0.6
  const variant = Math.floor(rng() * 3)

  if (distFromCenter < cols * 0.18) {
    // Downtown: offices & apartments
    const type = r < 0.35 ? CB_APART : r < 0.65 ? CB_OFFICE : CB_SHOP
    return { type, height: Math.floor(CITY_BUILDING_HEIGHTS[type] * heightVariance), variant }
  }
  if (distFromCenter < cols * 0.36) {
    // Midtown: mixed
    const type = r < 0.3 ? CB_APART : r < 0.55 ? CB_HOUSE : r < 0.75 ? CB_SHOP : CB_OFFICE
    return { type, height: Math.floor(CITY_BUILDING_HEIGHTS[type] * heightVariance), variant }
  }
  // Suburbs: residential
  const type = r < 0.55 ? CB_COTTAGE : r < 0.82 ? CB_HOUSE : CB_SHOP
  return { type, height: Math.floor(CITY_BUILDING_HEIGHTS[type] * heightVariance), variant }
}
