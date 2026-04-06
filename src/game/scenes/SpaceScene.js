import Phaser from 'phaser'
import {
  PLANET_RADII, PLANET_COLORS,
  MIN_ORBITAL_RADIUS, MAX_ORBITAL_RADIUS, DEFAULT_ORBITAL_RADIUS,
  orbitalSpeed, idToAngle,
} from '../config'
import Planet from '../objects/Planet'

// Drag state machine
const DS = { IDLE: 0, PRESS_WAIT: 1, DRAGGING: 2 }

export default class SpaceScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SpaceScene' })
    this._planets          = new Map()   // id → Planet
    this._onSelectCallback = null
    this._onOrbitClick     = null        // (radius) → open new-startup form
    this._drag             = { state: DS.IDLE }
    this._camEnabled       = true
    this._panStart         = null
    this._ringGfx          = null
    this._dragGfx          = null
    this._time             = 0
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  create() {
    this.cameras.main.setBackgroundColor('#000000')
    this.cameras.main.centerOn(0, 0)
    this.cameras.main.setZoom(0.85)

    this._drawStarfield()
    this._drawSun()

    this._ringGfx = this.add.graphics().setDepth(50)
    this._dragGfx = this.add.graphics().setDepth(9999)

    this._setupInput()
    this.events.emit('sceneReady')
  }

  update(time) {
    this._time = time
    this._updatePlanetPositions(time)
    this._drawOrbitsAndTrails()
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  syncStartups(startups, onSelect, onOrbitClick) {
    this._onSelectCallback = onSelect
    this._onOrbitClick     = onOrbitClick

    const incoming = new Set(startups.map((s) => s.id))

    for (const [id, planet] of this._planets) {
      if (!incoming.has(id)) { planet.destroy(); this._planets.delete(id) }
    }

    for (const startup of startups) {
      if (this._planets.has(startup.id)) {
        const p = this._planets.get(startup.id)
        const prevNivel = p.startup?.nivel
        p.update(startup)
        if (startup.nivel !== prevNivel) p.pulseAnimation()
      } else {
        const p = new Planet(this, startup)
        this._planets.set(startup.id, p)
      }
    }
  }

  centerOn(id) {
    const p = this._planets.get(id)
    if (!p) return
    this.cameras.main.pan(p.x, p.y, 600, 'Sine.easeInOut')
  }

  // ── Orbital mechanics ───────────────────────────────────────────────────────

  _updatePlanetPositions(time) {
    for (const [, planet] of this._planets) {
      if (this._drag.state !== DS.IDLE && this._drag.planet === planet) continue
      const radius = planet.startup.orbital_radius ?? DEFAULT_ORBITAL_RADIUS
      const base   = idToAngle(planet.startup.id)
      const angle  = base + orbitalSpeed(radius) * time
      planet.setPosition(radius * Math.cos(angle), radius * Math.sin(angle))
    }
  }

  // ── Orbits + trail arcs (redrawn every frame) ───────────────────────────────

  _drawOrbitsAndTrails() {
    const g = this._ringGfx
    g.clear()

    for (const [, planet] of this._planets) {
      const { startup } = planet
      const radius = startup.orbital_radius ?? DEFAULT_ORBITAL_RADIUS
      const nivel  = startup.nivel ?? 0
      const { body } = PLANET_COLORS[nivel] ?? PLANET_COLORS[0]

      // ── Thin orbit ring — planet color, very faint ──
      g.lineStyle(1, body, 0.12)
      g.strokeCircle(0, 0, radius)

      // ── Trail arc behind the planet ──
      // At nivel 0 → ~25°, at nivel 6 → full 360°
      const MIN_ARC = 0.44   // ≈ 25 degrees in radians
      const arcLen  = MIN_ARC + (nivel / 6) * (Math.PI * 2 - MIN_ARC)
      const lineW   = 2 + nivel * 0.55   // 2px at nivel 0 → 5.3px at nivel 6

      const currentAngle = idToAngle(startup.id) + orbitalSpeed(radius) * this._time

      g.lineStyle(lineW, body, 0.65)

      if (nivel >= 6) {
        // Full circle trail
        g.strokeCircle(0, 0, radius)
      } else {
        g.beginPath()
        // Clockwise arc from (currentAngle - arcLen) to currentAngle
        g.arc(0, 0, radius, currentAngle - arcLen, currentAngle, false)
        g.strokePath()
      }
    }
  }

  // ── Background ──────────────────────────────────────────────────────────────

  _drawStarfield() {
    // Very sparse stars — we want near-black like the reference image
    const gfx = this.add.graphics().setDepth(0)
    const rng  = mulberry32(42)
    const SPREAD = 2400

    for (let i = 0; i < 200; i++) {
      const x    = (rng() - 0.5) * SPREAD * 2
      const y    = (rng() - 0.5) * SPREAD * 2
      const size = rng() < 0.12 ? 1.2 : 0.6
      const alph = 0.15 + rng() * 0.35
      gfx.fillStyle(0xffffff, alph)
      gfx.fillRect(x, y, size, size)
    }
  }

  _drawSun() {
    // Minimal flat yellow circle — like the reference image
    const sun = this.add.graphics().setDepth(100)

    // Very subtle outer warmth (just one faint ring)
    sun.fillStyle(0xffd60a, 0.08)
    sun.fillCircle(0, 0, 44)

    // Main body — solid flat yellow
    sun.fillStyle(0xffd60a, 1.0)
    sun.fillCircle(0, 0, 28)

    // Label below
    this.add.text(0, 36, 'STARTUPSPACE', {
      fontSize: '7px',
      fontFamily: 'ui-monospace, "Courier New", monospace',
      color: '#ffd60a',
      stroke: '#000000',
      strokeThickness: 2,
      alpha: 0.7,
    }).setOrigin(0.5, 0).setDepth(101)
  }

  // ── Input ────────────────────────────────────────────────────────────────────

  _setupInput() {
    this.events.on('planet:pointerdown', this._onPlanetDown, this)

    this.input.on('pointerdown', (ptr) => {
      if (!this._camEnabled || this._drag.state !== DS.IDLE) return
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

    // Zoom centred on cursor
    this.input.on('wheel', (ptr, _objs, _dx, dy) => {
      const cam     = this.cameras.main
      const oldZoom = cam.zoom
      const newZoom = Phaser.Math.Clamp(oldZoom * (1 - dy * 0.001), 0.15, 3.0)

      // World position under cursor — keep fixed
      const wx = cam.scrollX + ptr.x / oldZoom
      const wy = cam.scrollY + ptr.y / oldZoom

      cam.setZoom(newZoom)
      cam.scrollX = wx - ptr.x / newZoom
      cam.scrollY = wy - ptr.y / newZoom
    })
  }

  _onPlanetDown(planet, ptr) {
    this._panStart    = null
    this._camEnabled  = false
    this._drag = {
      state: DS.PRESS_WAIT,
      planet,
      startX: ptr.worldX,
      startY: ptr.worldY,
    }
  }

  _onPointerMove(ptr) {
    if (this._drag.state === DS.PRESS_WAIT) {
      const dx = ptr.worldX - this._drag.startX
      const dy = ptr.worldY - this._drag.startY
      if (dx * dx + dy * dy > 100) this._startDrag()
      return
    }

    if (this._drag.state === DS.DRAGGING) {
      this._updateDrag(ptr)
      return
    }

    if (this._panStart && this._camEnabled) {
      const dx = ptr.x - this._panStart.px
      const dy = ptr.y - this._panStart.py
      const z  = this.cameras.main.zoom
      this.cameras.main.scrollX = this._panStart.sx - dx / z
      this.cameras.main.scrollY = this._panStart.sy - dy / z
    }
  }

  _onPointerUp(ptr) {
    if (this._drag.state === DS.PRESS_WAIT) {
      // Tap on planet → select
      if (this._onSelectCallback) this._onSelectCallback(this._drag.planet.startup)
      this._resetDrag()
      return
    }

    if (this._drag.state === DS.DRAGGING) {
      this._endDrag(ptr)
      return
    }

    // Tap on empty space → new startup at this orbit distance
    if (this._panStart) {
      const dist = Math.hypot(
        ptr.x - this._panStart.px,
        ptr.y - this._panStart.py
      )
      if (dist < 6) {
        // It was a click (not a pan)
        const radius = Phaser.Math.Clamp(
          Math.hypot(ptr.worldX, ptr.worldY),
          MIN_ORBITAL_RADIUS,
          MAX_ORBITAL_RADIUS
        )
        if (this._onOrbitClick) this._onOrbitClick(Math.round(radius))
      }
    }
    this._panStart    = null
    this._camEnabled  = true
  }

  // ── Drag orbital radius ──────────────────────────────────────────────────────

  _startDrag() {
    const { planet } = this._drag
    planet.setAlpha(0.4)
    this.input.setDefaultCursor('grabbing')
    Object.assign(this._drag, { state: DS.DRAGGING })
  }

  _updateDrag(ptr) {
    const newRadius = Phaser.Math.Clamp(
      Math.hypot(ptr.worldX, ptr.worldY),
      MIN_ORBITAL_RADIUS,
      MAX_ORBITAL_RADIUS
    )
    this._drag.newRadius = newRadius

    // Move planet ghost to the current angle at new radius
    const planet = this._drag.planet
    const base   = idToAngle(planet.startup.id)
    const angle  = base + orbitalSpeed(newRadius) * this._time
    planet.setPosition(newRadius * Math.cos(angle), newRadius * Math.sin(angle))

    // Draw ghost ring at new radius
    const nivel    = planet.startup.nivel ?? 0
    const { body } = PLANET_COLORS[nivel] ?? PLANET_COLORS[0]
    const g        = this._dragGfx
    g.clear()
    g.lineStyle(1, body, 0.35)
    g.strokeCircle(0, 0, newRadius)

    // Radius label
    // (reuse existing or just show via HUD — skip for now, handle in UI)
  }

  _endDrag(ptr) {
    const { planet, newRadius } = this._drag
    if (newRadius) {
      this.events.emit('startup:orbit', planet.startup.id, Math.round(newRadius))
    }
    planet.setAlpha(1)
    this._dragGfx.clear()
    this.input.setDefaultCursor('default')
    this._resetDrag()
  }

  _resetDrag() {
    this._drag       = { state: DS.IDLE }
    this._panStart   = null
    this._camEnabled = true
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
