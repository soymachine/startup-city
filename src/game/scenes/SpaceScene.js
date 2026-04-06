import Phaser from 'phaser'
import {
  PLANET_RADII, PLANET_COLORS,
  MIN_ORBITAL_RADIUS, MAX_ORBITAL_RADIUS, DEFAULT_ORBITAL_RADIUS,
  orbitalSpeed, idToAngle,
} from '../config'
import Planet from '../objects/Planet'

// Drag state machine
const DS = { IDLE: 0, PRESS_WAIT: 1, DRAGGING: 2 }

// Palette used for orbital ring tints
const RING_COLOR = 0x4a4a8f

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
    this.cameras.main.setBackgroundColor('#05050f')
    this.cameras.main.centerOn(0, 0)
    this.cameras.main.setZoom(0.85)

    this._drawStarfield()
    this._drawNebula()
    this._drawSun()

    this._ringGfx = this.add.graphics().setDepth(50)
    this._dragGfx = this.add.graphics().setDepth(9999)

    this._setupInput()
    this.events.emit('sceneReady')
  }

  update(time) {
    this._time = time
    this._updatePlanetPositions(time)
    this._drawOrbitalRings()
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

  // ── Orbital ring drawing ─────────────────────────────────────────────────────

  _drawOrbitalRings() {
    const g = this._ringGfx
    g.clear()

    for (const [, planet] of this._planets) {
      const radius = planet.startup.orbital_radius ?? DEFAULT_ORBITAL_RADIUS
      const nivel  = planet.startup.nivel ?? 0
      const { glow } = PLANET_COLORS[nivel] ?? PLANET_COLORS[0]
      g.lineStyle(1, glow, 0.18)
      g.strokeCircle(0, 0, radius)
    }
  }

  // ── Background ──────────────────────────────────────────────────────────────

  _drawStarfield() {
    const starGfx = this.add.graphics().setDepth(0)
    const rng     = mulberry32(42)
    const SPREAD  = 2200

    // Background star layer
    for (let i = 0; i < 600; i++) {
      const x    = (rng() - 0.5) * SPREAD * 2
      const y    = (rng() - 0.5) * SPREAD * 2
      const size = rng() < 0.15 ? 1.5 : rng() < 0.5 ? 1 : 0.5
      const alph = 0.3 + rng() * 0.7
      starGfx.fillStyle(0xffffff, alph)
      if (size >= 1.5) starGfx.fillCircle(x, y, size)
      else starGfx.fillRect(x, y, size, size)
    }

    // A few bright twinkling stars (individual objects for tween)
    for (let i = 0; i < 25; i++) {
      const x = (rng() - 0.5) * SPREAD * 2
      const y = (rng() - 0.5) * SPREAD * 2
      const s = this.add.graphics().setDepth(1)
      s.fillStyle(0xffffff, 1); s.fillCircle(x, y, 1.5)
      this.tweens.add({
        targets: s,
        alpha: { from: 0.15, to: 1 },
        duration: 1000 + rng() * 3000,
        yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut',
        delay: rng() * 4000,
      })
    }
  }

  _drawNebula() {
    const rng = mulberry32(99)
    const blobs = [
      { x: -600, y: -300, r: 350, color: 0x1a1060, a: 0.55 },
      { x:  500, y:  400, r: 280, color: 0x400060, a: 0.40 },
      { x: -200, y:  500, r: 200, color: 0x003050, a: 0.35 },
      { x:  700, y: -200, r: 240, color: 0x200060, a: 0.30 },
    ]
    for (const b of blobs) {
      const g = this.add.graphics().setDepth(2)
      for (let i = 5; i >= 0; i--) {
        g.fillStyle(b.color, b.a * (i / 6) * 0.6)
        g.fillCircle(b.x, b.y, b.r * (1 - i * 0.1))
      }
    }
  }

  _drawSun() {
    const sun  = this.add.graphics().setDepth(100)
    const glow = this.add.graphics().setDepth(99)

    // Glow layers
    const glowData = [
      { r: 180, a: 0.04 }, { r: 130, a: 0.07 },
      { r: 90,  a: 0.12 }, { r: 65,  a: 0.20 },
    ]
    for (const d of glowData) {
      glow.fillStyle(0xfffbe6, d.a)
      glow.fillCircle(0, 0, d.r)
    }

    // Pulse the glow
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.6, to: 1.0 },
      scale: { from: 0.95, to: 1.05 },
      duration: 3000, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // Sun body
    sun.fillStyle(0xfffde8, 1.0); sun.fillCircle(0, 0, 32)
    sun.fillStyle(0xffd700, 0.8); sun.fillCircle(0, 0, 24)
    sun.fillStyle(0xffffff, 0.9); sun.fillCircle(0, 0, 14)

    // Corona spikes (8 rays)
    sun.lineStyle(2, 0xffd700, 0.5)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      sun.lineBetween(
        Math.cos(a) * 34, Math.sin(a) * 34,
        Math.cos(a) * 52, Math.sin(a) * 52
      )
    }

    // "STARTUPSPACE" label under sun
    this.add.text(0, 46, '✦ STARTUPSPACE ✦', {
      fontSize: '9px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#ffd700',
      stroke: '#05050f',
      strokeThickness: 3,
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
    const nivel     = planet.startup.nivel ?? 0
    const { glow }  = PLANET_COLORS[nivel] ?? PLANET_COLORS[0]
    const g         = this._dragGfx
    g.clear()
    g.lineStyle(1.5, glow, 0.5)
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
