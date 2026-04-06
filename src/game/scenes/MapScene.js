import Phaser from 'phaser'
import {
  TILE_W, TILE_H, MAP_COLS, MAP_ROWS,
  T_WATER, T_ROAD,
  STARTUP_SPRITE_KEY,
  isoToScreen, screenToIso,
} from '../config'
import { generateCity } from '../generators/CityGen'
import TerrainRenderer from '../renderers/TerrainRenderer'
import Building from '../objects/Building'

const HW = TILE_W / 2  // 64
const HH = TILE_H / 2  // 32

// Drag state machine states
const DS = { IDLE: 0, PRESS_WAIT: 1, DRAGGING: 2 }

export default class MapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MapScene' })
    this._buildings = new Map()          // startup.id → Building
    this._terrainRenderer = null
    this._tiles = null
    this._onSelectCallback = null
    this._onEmptyTileCallback = null

    // Camera pan
    this._camEnabled = true
    this._panStart = null

    // Drag state
    this._drag = { state: DS.IDLE }

    // Clouds
    this._clouds = []
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Scene lifecycle
  // ─────────────────────────────────────────────────────────────────────────
  create() {
    this._tiles = generateCity(MAP_COLS, MAP_ROWS)

    this._terrainRenderer = new TerrainRenderer(this, this._tiles)
    this._terrainRenderer.fullRedraw()

    this._buildEmptyZones()
    this._setupCamera()
    this._setupInput()
    this._spawnClouds()

    this.events.emit('sceneReady')
  }

  update(time) {
    this._terrainRenderer.update(time)
    this._updateClouds(time)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public API — called from PhaserGame.jsx / React
  // ─────────────────────────────────────────────────────────────────────────
  syncStartups(startups, onSelect, onEmptyTile) {
    this._onSelectCallback   = onSelect
    this._onEmptyTileCallback = onEmptyTile

    const incoming = new Set(startups.map((s) => s.id))

    for (const [id, building] of this._buildings) {
      if (!incoming.has(id)) {
        building.destroy()
        this._buildings.delete(id)
      }
    }

    for (const startup of startups) {
      const col = startup.pos_x ?? 0
      const row = startup.pos_y ?? 0

      if (this._buildings.has(startup.id)) {
        const b = this._buildings.get(startup.id)
        const prevNivel = b.startup?.nivel
        b.update(startup)
        if (startup.nivel !== prevNivel) b.pulseAnimation()
      } else {
        const b = new Building(this, col, row, startup)
        this._buildings.set(startup.id, b)
      }
    }
  }

  centerOn(col, row) {
    const { x, y } = isoToScreen(col, row)
    this.cameras.main.pan(x, y + 80, 600, 'Sine.easeInOut')
  }

  getMapData() {
    return this._tiles
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Empty tile zones
  // ─────────────────────────────────────────────────────────────────────────
  _buildEmptyZones() {
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const { x, y } = isoToScreen(col, row)
        const zone = this.add.zone(x, y + HH, TILE_W, TILE_H)
        zone.setInteractive(
          new Phaser.Geom.Polygon([0, -HH, HW, 0, 0, HH, -HW, 0]),
          Phaser.Geom.Polygon.Contains
        )
        zone.setDepth(-1)
        zone._col = col
        zone._row = row
        zone.on('pointerdown', () => {
          if (this._drag.state !== DS.IDLE) return
          if (this._onEmptyTileCallback) this._onEmptyTileCallback(col, row)
        })
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Camera
  // ─────────────────────────────────────────────────────────────────────────
  _setupCamera() {
    const cx = (MAP_COLS / 2 - MAP_ROWS / 2) * HW
    const cy = (MAP_COLS / 2 + MAP_ROWS / 2) * HH
    this.cameras.main.setBackgroundColor('#1a1a2e')
    this.cameras.main.centerOn(cx, cy + 80)
    this.cameras.main.setZoom(0.45)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Input — camera pan + drag state machine
  // ─────────────────────────────────────────────────────────────────────────
  _setupInput() {
    this.events.on('building:pointerdown', this._onBuildingDown, this)

    this.input.on('pointerdown', (ptr) => {
      if (this._drag.state !== DS.IDLE) return
      this._panStart = {
        px: ptr.x, py: ptr.y,
        sx: this.cameras.main.scrollX,
        sy: this.cameras.main.scrollY,
      }
    })

    this.input.on('pointermove', (ptr) => {
      if (!ptr.isDown) return
      this._onPointerMove(ptr)
    })

    this.input.on('pointerup', (ptr) => {
      this._onPointerUp(ptr)
    })

    this.input.on('wheel', (_ptr, _objs, _dx, dy) => {
      const z = this.cameras.main.zoom
      this.cameras.main.setZoom(Phaser.Math.Clamp(z - dy * 0.001, 0.2, 2.0))
    })
  }

  _onBuildingDown(building, ptr) {
    this._panStart = null
    this._camEnabled = false

    this._drag = {
      state: DS.PRESS_WAIT,
      building,
      originCol: building.col,
      originRow: building.row,
      startX: ptr.worldX,
      startY: ptr.worldY,
      ghost: null,
      highlight: null,
      targetCol: building.col,
      targetRow: building.row,
    }
  }

  _onPointerMove(ptr) {
    if (this._drag.state === DS.PRESS_WAIT) {
      const dx = ptr.worldX - this._drag.startX
      const dy = ptr.worldY - this._drag.startY
      if (dx * dx + dy * dy > 64) {
        this._startDrag()
      }
      return
    }

    if (this._drag.state === DS.DRAGGING) {
      this._updateDrag(ptr)
      return
    }

    if (this._panStart && this._camEnabled) {
      const dx = ptr.x - this._panStart.px
      const dy = ptr.y - this._panStart.py
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        const z = this.cameras.main.zoom
        this.cameras.main.scrollX = this._panStart.sx - dx / z
        this.cameras.main.scrollY = this._panStart.sy - dy / z
      }
    }
  }

  _onPointerUp(ptr) {
    if (this._drag.state === DS.PRESS_WAIT) {
      this._restoreBuilding()
      if (this._onSelectCallback) this._onSelectCallback(this._drag.building.startup)
      this._resetDrag()
      return
    }

    if (this._drag.state === DS.DRAGGING) {
      this._endDrag()
      return
    }

    this._panStart = null
    this._camEnabled = true
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Drag state machine
  // ─────────────────────────────────────────────────────────────────────────
  _startDrag() {
    const { building, originCol, originRow } = this._drag

    // Ghost sprite — semi-transparent copy of the building
    const nivel = building.startup?.nivel ?? 0
    const key   = STARTUP_SPRITE_KEY[nivel] ?? STARTUP_SPRITE_KEY[0]
    const { x, y } = isoToScreen(originCol, originRow)

    const ghost = this.add.image(x, y + TILE_H, key)
    ghost.setOrigin(0.5, 1.0)
    ghost.setAlpha(0.55)
    ghost.setDepth(9999)

    // Highlight tile outline
    const highlight = this.add.graphics()
    highlight.setDepth(9998)
    this._drawHighlight(highlight, originCol, originRow, 'move')

    building.setAlpha(0.15)
    this.input.setDefaultCursor('grabbing')

    Object.assign(this._drag, { state: DS.DRAGGING, ghost, highlight })
  }

  _updateDrag(ptr) {
    const { ghost, highlight } = this._drag

    ghost.setPosition(ptr.worldX, ptr.worldY)

    const { col, row } = screenToIso(ptr.worldX, ptr.worldY - HH)
    if (col !== this._drag.targetCol || row !== this._drag.targetRow) {
      this._drag.targetCol = col
      this._drag.targetRow = row
      const { x, y } = isoToScreen(col, row)
      highlight.setPosition(x, y)

      const valid = this._isValidDrop(col, row)
      const other = valid ? this._getBuildingAt(col, row) : null
      const mode  = !valid ? 'invalid' : other ? 'swap' : 'move'
      this._drawHighlight(highlight, col, row, mode)
    }
  }

  _endDrag() {
    const { building, originCol, originRow, targetCol, targetRow } = this._drag

    const valid   = this._isValidDrop(targetCol, targetRow)
    const samePos = targetCol === originCol && targetRow === originRow

    if (!valid || samePos) {
      this._restoreBuilding()
      this._cleanupDragVisuals()
      this._resetDrag()
      return
    }

    const otherBuilding = this._getBuildingAt(targetCol, targetRow)

    if (otherBuilding) {
      this._emitPositionUpdate(building.startup.id, targetCol, targetRow)
      this._emitPositionUpdate(otherBuilding.startup.id, originCol, originRow)
    } else {
      const tile = this._tiles[targetRow]?.[targetCol]
      if (tile?.city) {
        this._terrainRenderer.swapCityBuildings(originCol, originRow, targetCol, targetRow)
      }
      this._emitPositionUpdate(building.startup.id, targetCol, targetRow)
    }

    this._restoreBuilding()
    this._cleanupDragVisuals()
    this._resetDrag()
  }

  _emitPositionUpdate(id, col, row) {
    this.events.emit('startup:move', id, col, row)
  }

  _drawHighlight(gfx, col, row, mode) {
    gfx.clear()
    const color = mode === 'invalid' ? 0xf87171 : mode === 'swap' ? 0xfbbf24 : 0x4ade80
    gfx.lineStyle(3, color, 0.9)
    gfx.strokePoints([
      { x: -HW, y: 0 }, { x: 0, y: HH }, { x: HW, y: 0 }, { x: 0, y: -HH }, { x: -HW, y: 0 }
    ], false)
    gfx.fillStyle(color, 0.18)
    gfx.fillPoints([
      { x: -HW, y: 0 }, { x: 0, y: HH }, { x: HW, y: 0 }, { x: 0, y: -HH }
    ], true)
  }

  _isValidDrop(col, row) {
    if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return false
    const tile = this._tiles[row]?.[col]
    if (!tile) return false
    return tile.type !== T_WATER && tile.type !== T_ROAD
  }

  _getBuildingAt(col, row) {
    for (const [, b] of this._buildings) {
      if (b.col === col && b.row === row) return b
    }
    return null
  }

  _restoreBuilding() {
    this._drag.building?.setAlpha(1)
    this.input.setDefaultCursor('default')
  }

  _cleanupDragVisuals() {
    this._drag.ghost?.destroy()
    this._drag.highlight?.destroy()
  }

  _resetDrag() {
    this._drag = { state: DS.IDLE }
    this._panStart = null
    this._camEnabled = true
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Clouds
  // ─────────────────────────────────────────────────────────────────────────
  _spawnClouds() {
    for (let i = 0; i < 7; i++) this._addCloud(true)
  }

  _addCloud(randomX = false) {
    const scale = 0.5 + Math.random() * 1.0
    const alpha = 0.18 + Math.random() * 0.22
    const speed = 15 + Math.random() * 25

    const gfx = this.add.graphics()
    gfx.fillStyle(0xffffff, alpha)
    gfx.fillEllipse(0, 0, 80 * scale, 28 * scale)
    gfx.fillEllipse(-22 * scale,  4 * scale, 50 * scale, 22 * scale)
    gfx.fillEllipse( 22 * scale,  4 * scale, 50 * scale, 22 * scale)
    gfx.setDepth(10000)

    const mapW = MAP_COLS * HW
    gfx.x = randomX ? Math.random() * mapW * 2 - mapW : -300
    gfx.y = -100 + Math.random() * 300
    this._clouds.push({ gfx, speed })
  }

  _updateClouds() {
    const mapW = MAP_COLS * HW
    for (let i = this._clouds.length - 1; i >= 0; i--) {
      const c = this._clouds[i]
      c.gfx.x += c.speed * 0.016
      if (c.gfx.x > mapW + 300) {
        c.gfx.destroy()
        this._clouds.splice(i, 1)
        this._addCloud(false)
      }
    }
  }
}
