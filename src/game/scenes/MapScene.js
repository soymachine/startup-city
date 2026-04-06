import Phaser from 'phaser'
import { TILE_W, TILE_H, MAP_COLS, MAP_ROWS, isoToScreen, screenToIso } from '../config'
import Building from '../objects/Building'

// Terrain types
const T_GRASS = 0
const T_ROAD_H = 1
const T_ROAD_V = 2
const T_WATER = 3

function buildBaseMap() {
  const map = Array.from({ length: MAP_ROWS }, () => Array(MAP_COLS).fill(T_GRASS))
  // Main roads
  for (let c = 0; c < MAP_COLS; c++) {
    map[5][c] = T_ROAD_H
    map[14][c] = T_ROAD_H
  }
  for (let r = 0; r < MAP_ROWS; r++) {
    map[r][5] = T_ROAD_V
    map[r][14] = T_ROAD_V
  }
  // Water patch
  for (let r = 16; r < 20; r++) {
    for (let c = 16; c < 20; c++) {
      map[r][c] = T_WATER
    }
  }
  return map
}

const TERRAIN_COLORS = {
  [T_GRASS]: { fill: 0x4ade80, dark: 0x22c55e, light: 0x86efac },
  [T_ROAD_H]: { fill: 0x6b7280, dark: 0x4b5563, light: 0x9ca3af },
  [T_ROAD_V]: { fill: 0x6b7280, dark: 0x4b5563, light: 0x9ca3af },
  [T_WATER]: { fill: 0x3b82f6, dark: 0x1d4ed8, light: 0x93c5fd },
}

export default class MapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MapScene' })
    this._buildings = new Map()    // startup.id → Building
    this._startups = []
    this._onSelectCallback = null
    this._onEmptyTileCallback = null
    this._isDragging = false
    this._dragStart = { x: 0, y: 0 }
    this._camStart = { x: 0, y: 0 }
    this._map = buildBaseMap()
  }

  create() {
    this._worldContainer = this.add.container(0, 0)
    this._terrainContainer = this.add.container(0, 0)
    this._buildingContainer = this.add.container(0, 0)

    this._worldContainer.add(this._terrainContainer)
    this._worldContainer.add(this._buildingContainer)

    this._drawTerrain()
    this._setupCamera()
    this._setupInput()

    // Clouds
    this._clouds = []
    this._spawnClouds()

    // Notify React the scene is ready
    this.events.emit('sceneReady')
  }

  _drawTerrain() {
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const type = this._map[row][col]
        const colors = TERRAIN_COLORS[type]
        const { x, y } = isoToScreen(col, row)
        const g = this.add.graphics()

        // Top face
        g.fillStyle(colors.light)
        g.fillPoints([
          { x, y },
          { x: x + TILE_W / 2, y: y + TILE_H / 2 },
          { x, y: y + TILE_H },
          { x: x - TILE_W / 2, y: y + TILE_H / 2 },
        ], true)

        // Subtle grid lines
        g.lineStyle(0.5, 0x000000, 0.1)
        g.strokePoints([
          { x, y },
          { x: x + TILE_W / 2, y: y + TILE_H / 2 },
          { x, y: y + TILE_H },
          { x: x - TILE_W / 2, y: y + TILE_H / 2 },
          { x, y },
        ], false)

        // Water shimmer lines
        if (type === T_WATER) {
          g.lineStyle(1, 0x93c5fd, 0.5)
          g.lineBetween(x - 10, y + TILE_H / 2 - 2, x + 10, y + TILE_H / 2 - 2)
        }

        // Road markings
        if (type === T_ROAD_H || type === T_ROAD_V) {
          g.lineStyle(1, 0xfbbf24, 0.4)
          g.lineBetween(x - 4, y + TILE_H / 2, x + 4, y + TILE_H / 2)
        }

        this._terrainContainer.add(g)

        // Empty tile click zone
        const zone = this.add.zone(x, y + TILE_H / 2, TILE_W, TILE_H)
        zone.setInteractive(
          new Phaser.Geom.Polygon([
            0, -TILE_H / 2,
            TILE_W / 2, 0,
            0, TILE_H / 2,
            -TILE_W / 2, 0,
          ]),
          Phaser.Geom.Polygon.Contains
        )
        zone.col = col
        zone.row = row
        zone.on('pointerdown', () => {
          if (!this._isDragging && this._onEmptyTileCallback) {
            this._onEmptyTileCallback(col, row)
          }
        })
        this._terrainContainer.add(zone)
      }
    }
  }

  _setupCamera() {
    const mapCenterX = (MAP_COLS / 2) * (TILE_W / 2)
    const mapCenterY = (MAP_ROWS / 2) * (TILE_H / 2)

    this.cameras.main.setBackgroundColor('#1a1a2e')
    this.cameras.main.centerOn(mapCenterX, mapCenterY + 100)
    this.cameras.main.setZoom(1)
  }

  _setupInput() {
    // Pan with drag
    this.input.on('pointerdown', (ptr) => {
      this._isDragging = false
      this._dragStart = { x: ptr.x, y: ptr.y }
      this._camStart = {
        x: this.cameras.main.scrollX,
        y: this.cameras.main.scrollY,
      }
    })

    this.input.on('pointermove', (ptr) => {
      if (!ptr.isDown) return
      const dx = ptr.x - this._dragStart.x
      const dy = ptr.y - this._dragStart.y
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        this._isDragging = true
        this.cameras.main.scrollX = this._camStart.x - dx / this.cameras.main.zoom
        this.cameras.main.scrollY = this._camStart.y - dy / this.cameras.main.zoom
      }
    })

    this.input.on('pointerup', () => {
      setTimeout(() => { this._isDragging = false }, 50)
    })

    // Zoom with wheel
    this.input.on('wheel', (ptr, objs, dx, dy) => {
      const zoom = this.cameras.main.zoom
      const newZoom = Phaser.Math.Clamp(zoom - dy * 0.001, 0.4, 2.5)
      this.cameras.main.setZoom(newZoom)
    })
  }

  _spawnClouds() {
    for (let i = 0; i < 5; i++) {
      this._addCloud()
    }
  }

  _addCloud() {
    const x = Phaser.Math.Between(-200, 1400)
    const y = Phaser.Math.Between(-100, 200)
    const scale = Phaser.Math.FloatBetween(0.5, 1.2)
    const alpha = Phaser.Math.FloatBetween(0.3, 0.6)
    const speed = Phaser.Math.FloatBetween(0.2, 0.6)

    const g = this.add.graphics()
    g.fillStyle(0xffffff, alpha)
    g.fillEllipse(0, 0, 80 * scale, 30 * scale)
    g.fillEllipse(-20 * scale, 5 * scale, 50 * scale, 25 * scale)
    g.fillEllipse(20 * scale, 5 * scale, 50 * scale, 25 * scale)
    g.setDepth(1000)
    g.x = x
    g.y = y
    this._clouds.push({ gfx: g, speed })
  }

  update(time, delta) {
    // Animate clouds
    for (const cloud of this._clouds) {
      cloud.gfx.x += cloud.speed * (delta / 1000) * 20
      if (cloud.gfx.x > 1400) {
        cloud.gfx.x = -200
        cloud.gfx.y = Phaser.Math.Between(-100, 200)
      }
    }
  }

  // Called from React to sync Firestore data
  syncStartups(startups, onSelect, onEmptyTile) {
    this._onSelectCallback = onSelect
    this._onEmptyTileCallback = onEmptyTile

    const incoming = new Set(startups.map((s) => s.id))

    // Remove deleted buildings
    for (const [id, building] of this._buildings) {
      if (!incoming.has(id)) {
        building.destroy()
        this._buildings.delete(id)
      }
    }

    // Add or update buildings
    for (const startup of startups) {
      const col = startup.pos_x ?? 0
      const row = startup.pos_y ?? 0

      if (this._buildings.has(startup.id)) {
        const existing = this._buildings.get(startup.id)
        const prevNivel = existing.startup.nivel
        existing.update(startup)
        if (startup.nivel !== prevNivel) {
          existing.pulseAnimation()
        }
      } else {
        const building = new Building(
          this,
          col,
          row,
          startup,
          (s) => { if (!this._isDragging && this._onSelectCallback) this._onSelectCallback(s) }
        )
        building.setDepth(col + row)
        this._buildingContainer.add(building)
        this._buildings.set(startup.id, building)
      }
    }
  }

  centerOn(col, row) {
    const { x, y } = isoToScreen(col, row)
    this.cameras.main.pan(x, y + 100, 600, 'Sine.easeInOut')
  }
}
