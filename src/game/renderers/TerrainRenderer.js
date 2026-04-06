/**
 * TerrainRenderer — draws terrain + background city buildings into
 * three batched Graphics objects (terrain, water shimmer, city buildings).
 * All city buildings are redrawn on swap (full clear+redraw, ~2ms for 40×40).
 */
import {
  TILE_W, TILE_H, MAP_COLS, MAP_ROWS,
  T_GRASS, T_ROAD, T_WATER, T_PARK,
  CITY_BUILDING_COLORS, CB_COTTAGE, CB_HOUSE,
  isoToScreen,
} from '../config'

const HW = TILE_W / 2
const HH = TILE_H / 2

const TERRAIN_TOP = {
  [T_GRASS]: 0x4ade80,
  [T_ROAD]:  0x6b7280,
  [T_WATER]: 0x38bdf8,
  [T_PARK]:  0x34d399,
}
const TERRAIN_GRID = {
  [T_GRASS]: 0x16a34a,
  [T_ROAD]:  0x4b5563,
  [T_WATER]: 0x0ea5e9,
  [T_PARK]:  0x059669,
}

export default class TerrainRenderer {
  constructor(scene, tiles) {
    this._scene = scene
    this._tiles = tiles

    this._terrainGfx = scene.add.graphics().setDepth(0)
    this._waterGfx   = scene.add.graphics().setDepth(1)
    this._cityGfx    = scene.add.graphics().setDepth(2)

    this._waterTick  = 0
    this._waterPhase = 0
  }

  fullRedraw() {
    this._drawTerrain()
    this._drawCityBuildings()
    this._updateWater(0, true)
  }

  // ── Terrain ───────────────────────────────────────────────────────────────
  _drawTerrain() {
    const gfx = this._terrainGfx
    gfx.clear()

    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const type = this._tiles[row][col].type
        const { x, y } = isoToScreen(col, row)
        const top  = TERRAIN_TOP[type]  ?? TERRAIN_TOP[T_GRASS]
        const grid = TERRAIN_GRID[type] ?? TERRAIN_GRID[T_GRASS]

        // Top-face diamond
        gfx.fillStyle(top)
        gfx.fillPoints([
          { x,       y },
          { x: x+HW, y: y+HH },
          { x,       y: y+TILE_H },
          { x: x-HW, y: y+HH },
        ], true)

        // Grid lines
        gfx.lineStyle(0.5, grid, 0.35)
        gfx.strokePoints([
          { x, y }, { x: x+HW, y: y+HH },
          { x, y: y+TILE_H }, { x: x-HW, y: y+HH },
          { x, y },
        ], false)

        // Road dashes
        if (type === T_ROAD) {
          gfx.lineStyle(1, 0xfde68a, 0.3)
          gfx.lineBetween(x - 5, y + HH, x + 5, y + HH)
        }

        // Park: two tiny tree dots
        if (type === T_PARK) {
          gfx.fillStyle(0x15803d, 0.8)
          gfx.fillCircle(x - 9, y + HH - 3, 3)
          gfx.fillCircle(x + 7, y + HH - 2, 2)
        }
      }
    }
  }

  // ── City buildings ────────────────────────────────────────────────────────
  _drawCityBuildings() {
    const gfx = this._cityGfx
    gfx.clear()

    // Collect & sort in painter's order (back → front)
    const list = []
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        if (this._tiles[row][col].city) list.push({ row, col })
      }
    }
    list.sort((a, b) => (a.row + a.col) - (b.row + b.col))

    for (const { row, col } of list) {
      this._drawOneBuilding(gfx, col, row)
    }
  }

  _drawOneBuilding(gfx, col, row) {
    const city = this._tiles[row][col].city
    if (!city) return

    const colors = CITY_BUILDING_COLORS[city.type]
    if (!colors) return

    const { x: bx, y: by } = isoToScreen(col, row)
    const h = city.height

    // Left face
    gfx.fillStyle(colors.left)
    gfx.fillPoints([
      { x: bx-HW, y: by   },
      { x: bx,    y: by+HH },
      { x: bx,    y: by+HH-h },
      { x: bx-HW, y: by-h },
    ], true)

    // Right face
    gfx.fillStyle(colors.right)
    gfx.fillPoints([
      { x: bx+HW, y: by   },
      { x: bx,    y: by+HH },
      { x: bx,    y: by+HH-h },
      { x: bx+HW, y: by-h },
    ], true)

    // Top face
    gfx.fillStyle(colors.top)
    gfx.fillPoints([
      { x: bx,    y: by-h+HH },
      { x: bx+HW, y: by-h    },
      { x: bx,    y: by-h-HH },
      { x: bx-HW, y: by-h    },
    ], true)

    // Outline (thin)
    gfx.lineStyle(0.5, 0x000000, 0.15)
    gfx.strokePoints([
      { x: bx-HW, y: by }, { x: bx, y: by+HH }, { x: bx+HW, y: by },
      { x: bx, y: by-HH }, { x: bx-HW, y: by },
    ], false)

    // Windows (dark rectangles on faces)
    if (h > 14) {
      const nFloors = Math.max(1, Math.floor(h / 9))
      gfx.fillStyle(0x0f1e2a, 0.55)
      for (let f = 0; f < nFloors; f++) {
        const v = (f + 0.65) / (nFloors + 0.4)
        for (const u of [0.28, 0.68]) {
          // Left face window
          const lx = bx - HW + u * HW,  ly = by + u * HH - v * h
          gfx.fillRect(lx - 2, ly - 2, 4, 3)
          // Right face window
          const rx = bx + HW - u * HW, ry = by + u * HH - v * h
          gfx.fillRect(rx - 2, ry - 2, 4, 3)
        }
      }
    }

    // Peaked roof for cottages & houses
    if (city.type === CB_COTTAGE || city.type === CB_HOUSE) {
      gfx.fillStyle(city.type === CB_COTTAGE ? 0xb91c1c : 0x92400e, 0.85)
      gfx.fillTriangle(
        bx - HW * 0.55, by - h,
        bx + HW * 0.55, by - h,
        bx, by - h - HH * 0.9
      )
    }
  }

  // ── Water shimmer (animated) ──────────────────────────────────────────────
  _updateWater(time, force = false) {
    if (!force && time - this._waterTick < 700) return
    this._waterTick = time
    this._waterPhase = (this._waterPhase + 1) % 4

    const gfx = this._waterGfx
    gfx.clear()
    const off = this._waterPhase

    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        if (this._tiles[row][col].type !== T_WATER) continue
        const { x, y } = isoToScreen(col, row)
        const cy = y + HH

        gfx.lineStyle(1, 0x7dd3fc, 0.45)
        gfx.lineBetween(x - 10 + off, cy - 1, x + 10 - off, cy - 1)
        gfx.lineStyle(1, 0xbae6fd, 0.3)
        gfx.lineBetween(x - 7,      cy + 4 - off * 0.5,
                        x + 7,      cy + 4 - off * 0.5)
      }
    }
  }

  // Swap city building data at two positions, then redraw
  swapCityBuildings(col1, row1, col2, row2) {
    const tmp = this._tiles[row1][col1].city
    this._tiles[row1][col1].city = this._tiles[row2][col2].city
    this._tiles[row2][col2].city = tmp
    this._drawCityBuildings()
  }

  getTile(col, row) {
    if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return null
    return this._tiles[row][col]
  }

  update(time) {
    this._updateWater(time)
  }
}
