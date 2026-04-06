/**
 * TerrainRenderer — places sprite-based terrain tiles and background city
 * buildings using painter's-algorithm depth sorting.
 *
 * Depth scheme per tile (col, row):
 *   tile base  = (col + row) * 3
 *   prop       = (col + row) * 3 + 1
 *   city bldg  = (col + row) * 3 + 2
 */
import {
  TILE_W, TILE_H, MAP_COLS, MAP_ROWS,
  T_GRASS, T_ROAD, T_WATER, T_PARK,
  CB_COTTAGE, CB_HOUSE, CB_SHOP, CB_OFFICE, CB_APART,
  isoToScreen,
} from '../config'

const HH = TILE_H / 2  // 32

// Prefix for city building sprite key lookup
const CB_PREFIX = {
  [CB_COTTAGE]: 'city_cottage',
  [CB_HOUSE]:   'city_house',
  [CB_SHOP]:    'city_shop',
  [CB_OFFICE]:  'city_office',
  [CB_APART]:   'city_apart',
}

export default class TerrainRenderer {
  constructor(scene, tiles) {
    this._scene = scene
    this._tiles = tiles

    // All tile + prop sprites (never change after creation)
    this._tileSprites    = []   // flat list
    this._propSprites    = []   // flat list

    // City building sprites — may be swapped
    this._citySprites    = new Map()  // `${col},${row}` → Phaser.Image

    this._waterTick  = 0
    this._waterPhase = 0
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  fullRedraw() {
    this._createTileSprites()
    this._createCitySprites()
  }

  /** Swap the city building sprites at two grid positions then re-key. */
  swapCityBuildings(col1, row1, col2, row2) {
    // Swap tile data (already done by caller in _tiles)
    const key1 = `${col1},${row1}`
    const key2 = `${col2},${row2}`

    const sp1 = this._citySprites.get(key1)
    const sp2 = this._citySprites.get(key2)

    const city1 = this._tiles[row1][col1].city
    const city2 = this._tiles[row2][col2].city

    // Destroy old, recreate at new positions
    sp1?.destroy()
    sp2?.destroy()
    this._citySprites.delete(key1)
    this._citySprites.delete(key2)

    if (city1) {
      const sp = this._placeCityBuilding(col1, row1)
      if (sp) this._citySprites.set(key1, sp)
    }
    if (city2) {
      const sp = this._placeCityBuilding(col2, row2)
      if (sp) this._citySprites.set(key2, sp)
    }
  }

  getTile(col, row) {
    if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return null
    return this._tiles[row][col]
  }

  update(time) {
    this._animateWater(time)
  }

  // ── Terrain tiles ──────────────────────────────────────────────────────────

  _createTileSprites() {
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const tile   = this._tiles[row][col]
        const { x, y } = isoToScreen(col, row)
        const depth  = (col + row) * 3

        const key = this._tileKey(tile.type, col, row)
        const sp  = this._scene.add.image(x, y, key)
        sp.setOrigin(0.5, 0)
        sp.setDepth(depth)
        this._tileSprites.push(sp)

        // Water — tag for wave animation
        if (tile.type === T_WATER) sp._isWater = true

        // Park — add a tree prop
        if (tile.type === T_PARK) {
          this._addTreeProp(col, row, x, y, depth + 1)
        }
      }
    }
  }

  /** Choose the right road tile key based on neighbour connectivity. */
  _tileKey(type, col, row) {
    if (type === T_GRASS) return 'tile_grass'
    if (type === T_WATER) return 'tile_water'
    if (type === T_PARK)  return 'tile_grass'
    // T_ROAD — pick variant by neighbour connections
    return this._roadKey(col, row)
  }

  _isRoad(c, r) {
    return this._tiles[r]?.[c]?.type === T_ROAD
  }

  /**
   * Directions in iso grid (what the tile suffix letters mean):
   *   NE = col+1 / SW = col-1  →  road runs NE–SW (straight_sw tile)
   *   SE = row+1 / NW = row-1  →  road runs NW–SE (straight_se tile)
   */
  _roadKey(col, row) {
    const ne = this._isRoad(col + 1, row)
    const sw = this._isRoad(col - 1, row)
    const se = this._isRoad(col, row + 1)
    const nw = this._isRoad(col, row - 1)

    if (ne && sw && se && nw) return 'tile_road_xing'

    if (ne && sw && se)       return 'tile_road_intersect_nw'
    if (ne && sw && nw)       return 'tile_road_intersect_se'
    if (ne && se && nw)       return 'tile_road_intersect_sw'
    if (sw && se && nw)       return 'tile_road_intersect_ne'

    if (ne && sw)             return 'tile_road_straight_sw'
    if (se && nw)             return 'tile_road_straight_se'

    if (ne && nw)             return 'tile_road_corner_n'
    if (ne && se)             return 'tile_road_corner_e'
    if (se && sw)             return 'tile_road_corner_s'
    if (sw && nw)             return 'tile_road_corner_w'

    if (ne || sw)             return 'tile_road_straight_sw'
    if (se || nw)             return 'tile_road_straight_se'
    return 'tile_road_xing'
  }

  _addTreeProp(col, row, x, y, depth) {
    // Deterministic tree variant and offset from tile coords
    const variant = (col * 7 + row * 13) % 3
    const key  = ['prop_tree_a', 'prop_tree_b', 'prop_tree_c'][variant]
    const offX = ((col * 17 + row * 11) % 20) - 10
    const offY = ((col * 11 + row * 17) % 12) - 6

    const sp = this._scene.add.image(x + offX, y + HH + offY, key)
    sp.setOrigin(0.5, 1.0)
    sp.setDepth(depth)
    this._propSprites.push(sp)
  }

  // ── City buildings ─────────────────────────────────────────────────────────

  _createCitySprites() {
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        if (!this._tiles[row][col].city) continue
        const sp = this._placeCityBuilding(col, row)
        if (sp) this._citySprites.set(`${col},${row}`, sp)
      }
    }
  }

  _placeCityBuilding(col, row) {
    const city = this._tiles[row][col].city
    if (!city) return null

    const prefix = CB_PREFIX[city.type]
    if (!prefix) return null

    const key    = `${prefix}_${city.variant ?? 0}`
    const { x, y } = isoToScreen(col, row)
    const depth  = (col + row) * 3 + 2

    const sp = this._scene.add.image(x, y + TILE_H, key)
    sp.setOrigin(0.5, 1.0)
    sp.setDepth(depth)
    return sp
  }

  // ── Water wave animation ───────────────────────────────────────────────────
  _animateWater(time) {
    if (time - this._waterTick < 600) return
    this._waterTick  = time
    this._waterPhase = (this._waterPhase + 1) % 4

    // Subtle alpha pulse on water tiles
    const alpha = 0.85 + this._waterPhase * 0.05
    for (const sp of this._tileSprites) {
      if (sp._isWater) sp.setAlpha(alpha)
    }
  }
}
