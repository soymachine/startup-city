export const TILE_W = 128
export const TILE_H = 64
export const MAP_COLS = 40
export const MAP_ROWS = 40
export const MAP_SEED = 42   // change to regenerate the city

// Asset base path (handles GitHub Pages subdirectory)
export const ASSET_BASE = import.meta.env.BASE_URL

// Terrain types
export const T_GRASS = 0
export const T_ROAD  = 1
export const T_WATER = 2
export const T_PARK  = 3

// City building types (background)
export const CB_COTTAGE  = 1
export const CB_HOUSE    = 2
export const CB_SHOP     = 3
export const CB_OFFICE   = 4
export const CB_APART    = 5

// How many sprite variants per city building type
export const CB_VARIANTS = {
  [CB_COTTAGE]: 4,
  [CB_HOUSE]:   4,
  [CB_SHOP]:    4,
  [CB_OFFICE]:  3,
  [CB_APART]:   3,
}

// Startup building sprite key by nivel (0–6)
export const STARTUP_SPRITE_KEY = [
  'startup_0',  // 0: construction site
  'startup_1',  // 1: mobile (caseta)
  'startup_2',  // 2: office gray (prototipo)
  'startup_3',  // 3: office brown (beta priv)
  'startup_4',  // 4: office2 green (beta pub)
  'startup_5',  // 5: office3 yellow (tracción)
  'startup_6',  // 6: office3 blue (scale-up)
]

// Startup building colors used by the minimap (nivel → top face hex)
export const STARTUP_COLORS = {
  0: { top: 0x475569, left: 0x1e293b, right: 0x334155 },
  1: { top: 0x67e8f9, left: 0x0e7490, right: 0x06b6d4 },
  2: { top: 0x34d3e8, left: 0x0c5f72, right: 0x0891b2 },
  3: { top: 0x22c5d8, left: 0x085562, right: 0x0e7490 },
  4: { top: 0x06b6d4, left: 0x075060, right: 0x0891b2 },
  5: { top: 0x22d3ee, left: 0x042838, right: 0x0ea5e9 },
  6: { top: 0xe0f7fa, left: 0x012a38, right: 0x0284c7 },
}

export const NIVEL_LABELS = ['💡', '📝', '🔧', '🔒', '🌍', '📈', '🚀']

// Approximate pixel heights of startup sprites (measured from asset files).
// Used to position name labels above the building.
export const STARTUP_SPRITE_H = [87, 106, 126, 126, 159, 193, 193]

// Iso coordinate transforms (world space)
export function isoToScreen(col, row) {
  return {
    x: (col - row) * (TILE_W / 2),
    y: (col + row) * (TILE_H / 2),
  }
}

export function screenToIso(worldX, worldY) {
  const hw = TILE_W / 2
  const hh = TILE_H / 2
  const col = Math.round((worldX / hw + worldY / hh) / 2)
  const row = Math.round((worldY / hh - worldX / hw) / 2)
  return { col, row }
}
