export const TILE_W = 64   // isometric tile width
export const TILE_H = 32   // isometric tile height
export const MAP_COLS = 20
export const MAP_ROWS = 20

// Convert grid (col, row) → screen (x, y) for isometric projection
export function isoToScreen(col, row) {
  return {
    x: (col - row) * (TILE_W / 2),
    y: (col + row) * (TILE_H / 2),
  }
}

// Convert screen (x, y) → grid (col, row)
export function screenToIso(x, y) {
  const col = Math.floor((x / (TILE_W / 2) + y / (TILE_H / 2)) / 2)
  const row = Math.floor((y / (TILE_H / 2) - x / (TILE_W / 2)) / 2)
  return { col, row }
}

export const BUILDING_COLORS = {
  0: 0x9ca3af, // solar — grey
  1: 0xd97706, // caseta — amber
  2: 0xf59e0b, // prototipo — yellow
  3: 0xa78bfa, // beta privada — purple
  4: 0x34d399, // beta pública — green
  5: 0xf97316, // tracción — orange
  6: 0xe94560, // scale-up — neon red
}

export const BUILDING_HEIGHTS = {
  0: 8,
  1: 18,
  2: 28,
  3: 38,
  4: 50,
  5: 65,
  6: 90,
}
