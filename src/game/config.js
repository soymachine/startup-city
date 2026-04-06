export const TILE_W = 64
export const TILE_H = 32
export const MAP_COLS = 40
export const MAP_ROWS = 40
export const MAP_SEED = 42   // change to regenerate the city

// Terrain types
export const T_GRASS = 0
export const T_ROAD  = 1
export const T_WATER = 2
export const T_PARK  = 3

// City building types (background, earth tones)
export const CB_COTTAGE  = 1
export const CB_HOUSE    = 2
export const CB_SHOP     = 3
export const CB_OFFICE   = 4
export const CB_APART    = 5

export const CITY_BUILDING_HEIGHTS = {
  [CB_COTTAGE]: 14,
  [CB_HOUSE]:   22,
  [CB_SHOP]:    16,
  [CB_OFFICE]:  34,
  [CB_APART]:   42,
}

export const CITY_BUILDING_COLORS = {
  [CB_COTTAGE]: { top: 0xd4a574, left: 0x7a5230, right: 0xa07550 },
  [CB_HOUSE]:   { top: 0xc8956c, left: 0x6e4428, right: 0x945a3c },
  [CB_SHOP]:    { top: 0xe8c99a, left: 0x9c7a50, right: 0xb89060 },
  [CB_OFFICE]:  { top: 0xb8bcc8, left: 0x6a6e78, right: 0x8a8e98 },
  [CB_APART]:   { top: 0xa8b4c0, left: 0x5e6a74, right: 0x7a8890 },
}

// Startup building colors (cyan/teal — distinct from earth-tone city)
export const STARTUP_COLORS = {
  0: { top: 0x475569, left: 0x1e293b, right: 0x334155 },  // empty lot
  1: { top: 0x67e8f9, left: 0x0e7490, right: 0x06b6d4 },  // caseta
  2: { top: 0x34d3e8, left: 0x0c5f72, right: 0x0891b2 },  // prototipo
  3: { top: 0x22c5d8, left: 0x085562, right: 0x0e7490 },  // beta priv
  4: { top: 0x06b6d4, left: 0x075060, right: 0x0891b2 },  // beta pub
  5: { top: 0x22d3ee, left: 0x042838, right: 0x0ea5e9 },  // tracción
  6: { top: 0xe0f7fa, left: 0x012a38, right: 0x0284c7 },  // scale-up
}

export const STARTUP_HEIGHTS = { 0:8, 1:20, 2:30, 3:44, 4:58, 5:76, 6:100 }

export const NIVEL_LABELS = ['💡','📝','🔧','🔒','🌍','📈','🚀']

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
