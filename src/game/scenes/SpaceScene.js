import Phaser from 'phaser'
import {
  PLANET_RADII, PLANET_COLORS,
  MIN_ORBITAL_RADIUS, MAX_ORBITAL_RADIUS, DEFAULT_ORBITAL_RADIUS,
  orbitalSpeed, idToAngle,
} from '../config'
import Planet from '../objects/Planet'

// Drag state machine
const DS = { IDLE: 0, PRESS_WAIT: 1, DRAGGING: 2 }

const NIVEL_NAMES = ['IDEA', 'DEFINING', 'PROTOTYPE', 'PRIVATE BETA', 'PUBLIC BETA', 'TRACTION', 'SCALE-UP']

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
    this._labelGfx         = null
    this._labelName        = null
    this._labelLevel       = null
    this._selectedPlanet   = null
    this._time             = 0
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  create() {
    this.cameras.main.setBackgroundColor('#000000')
    this.cameras.main.centerOn(0, 0)
    this.cameras.main.setZoom(0.85)

    this._drawStarfield()
    this._drawSun()

    this._ringGfx  = this.add.graphics().setDepth(50)
    this._dragGfx  = this.add.graphics().setDepth(9999)
    this._labelGfx = this.add.graphics().setDepth(500)

    const FONT = 'ui-monospace, "Courier New", monospace'
    this._labelName = this.add.text(0, 0, '', {
      fontSize: '11px', fontFamily: FONT,
      color: '#ffffff', resolution: 2,
    }).setOrigin(0, 1).setDepth(501).setVisible(false)

    this._labelLevel = this.add.text(0, 0, '', {
      fontSize: '9px', fontFamily: FONT,
      color: '#888888', resolution: 2,
    }).setOrigin(0, 0).setDepth(501).setVisible(false)

    this._setupInput()
    this.events.emit('sceneReady')
  }

  update(time) {
    this._time = time
    this._updatePlanetPositions(time)
    this._drawOrbitsAndTrails()
    this._updateHover()
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  syncStartups(startups, onSelect, onOrbitClick) {
    this._onSelectCallback = onSelect
    this._onOrbitClick     = onOrbitClick

    const incoming = new Set(startups.map((s) => s.id))

    for (const [id, planet] of this._planets) {
      if (!incoming.has(id)) {
        if (this._selectedPlanet === planet) this._selectedPlanet = null
        planet.destroy()
        this._planets.delete(id)
      }
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

      g.lineStyle(lineW, body, 0.50)

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
    this.input.on('pointerdown', (ptr) => {
      if (this._drag.state !== DS.IDLE) return
      const planet = this._findPlanetAt(ptr.worldX, ptr.worldY)
      if (planet) {
        this._camEnabled = false
        this._drag = { state: DS.PRESS_WAIT, planet, startX: ptr.worldX, startY: ptr.worldY }
      } else {
        this._panStart = {
          px: ptr.x, py: ptr.y,
          sx: this.cameras.main.scrollX,
          sy: this.cameras.main.scrollY,
        }
      }
    })

    this.input.on('pointermove', (ptr) => {
      if (!ptr.isDown) return
      this._onPointerMove(ptr)
    })

    this.input.on('pointerup', (ptr) => {
      this._onPointerUp(ptr)
    })

    // Zoom anchored to cursor.
    // ptr.worldX/Y are correctly computed by Phaser (proven: hit-testing works).
    // We derive new scrollX so the same world point stays under the cursor:
    //   worldX = (ptr.x - cam._x) / oldZoom + scrollX
    //   scrollX_new = worldX - (worldX - scrollX) * oldZoom / newZoom
    // This eliminates any dependency on cam.x / cam._x.
    this.input.on('wheel', (ptr, _objs, _dx, dy) => {
      const cam     = this.cameras.main
      const oldZoom = cam.zoom
      const newZoom = Phaser.Math.Clamp(oldZoom * (1 - dy * 0.001), 0.15, 3.0)
      if (newZoom === oldZoom) return

      const worldX  = ptr.worldX
      const worldY  = ptr.worldY
      const sx      = cam.scrollX
      const sy      = cam.scrollY
      const ratio   = oldZoom / newZoom

      cam.setZoom(newZoom)
      cam.scrollX = worldX - (worldX - sx) * ratio
      cam.scrollY = worldY - (worldY - sy) * ratio
    })
  }

  _findPlanetAt(worldX, worldY) {
    for (const [, planet] of this._planets) {
      const nivel = planet.startup?.nivel ?? 0
      const hitR  = Math.max(26, PLANET_RADII[nivel] + 18)
      const dx = worldX - planet.x
      const dy = worldY - planet.y
      if (dx * dx + dy * dy <= hitR * hitR) return planet
    }
    return null
  }

  _updateHover() {
    if (this._drag.state !== DS.IDLE) {
      this._updateLabel(null)
      return
    }
    const ptr     = this.input.activePointer
    const hovered = this._findPlanetAt(ptr.worldX, ptr.worldY)
    for (const [, planet] of this._planets) planet.setHovered(planet === hovered)
    this.input.setDefaultCursor(hovered ? 'grab' : 'default')
    this._updateLabel(hovered ?? this._selectedPlanet)
  }

  // ── Callout label (zoom-independent) ────────────────────────────────────────
  // The label is drawn in world-space but all lengths are divided by cam.zoom,
  // so the rendered result is always the same number of screen pixels regardless
  // of zoom level.

  _updateLabel(planet) {
    const gfx  = this._labelGfx
    const name = this._labelName
    const lvl  = this._labelLevel

    gfx.clear()

    if (!planet) {
      name.setVisible(false)
      lvl.setVisible(false)
      return
    }

    const cam   = this.cameras.main
    const zoom  = cam.zoom
    const iz    = 1 / zoom                          // one screen-pixel in world units

    const startup = planet.startup
    const nivel   = startup?.nivel ?? 0
    const r       = PLANET_RADII[nivel]
    const { body } = PLANET_COLORS[nivel] ?? PLANET_COLORS[0]

    // Callout geometry — all in screen pixels, converted to world by × iz
    // Direction: upper-right (45°)
    const C45   = 0.7071
    const DOT   = 2.5   // dot radius (screen px)
    const DIAG  = 16    // diagonal length (screen px)
    const HORIZ = 42    // horizontal length (screen px)
    const GAP   = 5     // gap to text (screen px)

    // Start: planet edge at 45° (world px)
    const ex = planet.x + r * C45
    const ey = planet.y - r * C45

    // End of diagonal (world px)
    const dx = ex + DIAG * C45 * iz
    const dy = ey - DIAG * C45 * iz

    // End of horizontal (world px)
    const hx = dx + HORIZ * iz
    const hy = dy

    // Color as CSS string
    const colorStr = '#' + body.toString(16).padStart(6, '0')

    // Draw callout line
    gfx.lineStyle(iz, body, 0.75)
    gfx.beginPath()
    gfx.moveTo(ex, ey)
    gfx.lineTo(dx, dy)
    gfx.lineTo(hx, hy)
    gfx.strokePath()

    // Small dot at planet edge
    gfx.fillStyle(body, 1)
    gfx.fillCircle(ex, ey, DOT * iz)

    // Name: white, sits above the horizontal line (origin bottom-left)
    const tx = hx + GAP * iz
    const ty = hy
    name.setPosition(tx, ty - iz)          // 1 screen px above line
    name.setScale(iz)
    name.setText(startup?.nombre ?? '')
    name.setVisible(true)

    // Level: planet color, sits below the horizontal line (origin top-left)
    lvl.setPosition(tx, ty + iz)           // 1 screen px below line
    lvl.setScale(iz)
    lvl.setText(`◆ ${NIVEL_NAMES[nivel] ?? ''}`)
    lvl.setStyle({ color: colorStr })
    lvl.setVisible(true)
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
      this._selectedPlanet = this._drag.planet
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
      } else {
        // Tap on empty space → deselect
        this._selectedPlanet = null
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
