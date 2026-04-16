import Phaser from 'phaser'
import {
  PLANET_RADII, PLANET_COLORS,
  MIN_ORBITAL_RADIUS, MAX_ORBITAL_RADIUS,
  orbitalSpeed, idToAngle,
} from '../config'
import Planet from '../objects/Planet'

const NIVEL_NAMES = ['IDEA', 'DEFINING', 'PROTOTYPE', 'PRIVATE BETA', 'PUBLIC BETA', 'TRACTION', 'SCALE-UP']

// Per-planet orbit state stored in _planets Map:
// { obj: Planet, animRadius: number, targetRadius: number,
//   prevRadius: number, transferStartAngle: number, transitioning: boolean }

export default class SpaceScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SpaceScene' })
    this._planets          = new Map()   // id → entry (see above)
    this._onSelectCallback = null
    this._onOrbitClick     = null        // (radius) → open new-startup form
    this._pendingSelect    = null        // planet clicked but not yet confirmed as tap
    this._panStart         = null
    this._ringGfx          = null
    this._labelGfx         = null
    this._labelName        = null
    this._labelLevel       = null
    this._selectedPlanet   = null
    this._time             = 0
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  create() {
    this.cameras.main.centerOn(0, 0)
    this.cameras.main.setZoom(0.85)

    this._drawStarfield()
    this._drawSun()

    this._ringGfx  = this.add.graphics().setDepth(50)
    this._labelGfx = this.add.graphics().setDepth(500)

    const FONT = '"Titillium Web", ui-sans-serif, sans-serif'
    this._labelName = this.add.text(0, 0, '', {
      fontSize: '19px', fontFamily: FONT,
      color: '#ffffff', stroke: '#000000', strokeThickness: 4,
      resolution: 2,
    }).setOrigin(0, 1).setDepth(501).setVisible(false)

    this._labelLevel = this.add.text(0, 0, '', {
      fontSize: '11px', fontFamily: FONT,
      color: '#888888', stroke: '#000000', strokeThickness: 3,
      resolution: 2,
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

    // Remove planets that no longer exist
    for (const [id, entry] of this._planets) {
      if (!incoming.has(id)) {
        if (this._selectedPlanet === entry.obj) this._selectedPlanet = null
        if (this._pendingSelect  === entry.obj) this._pendingSelect  = null
        this.tweens.killTweensOf(entry)
        entry.obj.destroy()
        this._planets.delete(id)
      }
    }

    for (const startup of startups) {
      if (this._planets.has(startup.id)) {
        const entry = this._planets.get(startup.id)
        const prevNivel = entry.obj.startup?.nivel
        entry.obj.update(startup)
        if (startup.nivel !== prevNivel) entry.obj.pulseAnimation()

        // Trigger Hohmann transfer when assigned radius changes
        const newTarget = startup.orbital_radius
        if (Math.round(newTarget) !== Math.round(entry.targetRadius)) {
          entry.transitioning = false
          this.tweens.killTweensOf(entry)

          entry.prevRadius          = entry.animRadius
          entry.targetRadius        = newTarget
          entry.transitioning       = true
          entry.transferStartAngle  = idToAngle(startup.id) + orbitalSpeed(entry.animRadius) * this._time

          const dist     = Math.abs(newTarget - entry.prevRadius)
          const duration = Math.min(3500, 1500 + dist * 1.5)

          this.tweens.add({
            targets:  entry,
            animRadius: newTarget,
            duration,
            ease: 'Sine.easeInOut',
            onComplete: () => { entry.transitioning = false },
          })
        }
      } else {
        // New planet — spawn at target radius with no animation
        const entry = {
          obj:                new Planet(this, startup),
          animRadius:         startup.orbital_radius,
          targetRadius:       startup.orbital_radius,
          prevRadius:         startup.orbital_radius,
          transferStartAngle: 0,
          transitioning:      false,
        }
        this._planets.set(startup.id, entry)
      }
    }
  }

  centerOn(id) {
    const entry = this._planets.get(id)
    if (!entry) return
    this.cameras.main.pan(entry.obj.x, entry.obj.y, 600, 'Sine.easeInOut')
  }

  // ── Orbital mechanics ───────────────────────────────────────────────────────

  _updatePlanetPositions(time) {
    for (const [, entry] of this._planets) {
      const radius = entry.animRadius
      const base   = idToAngle(entry.obj.startup.id)
      const angle  = base + orbitalSpeed(radius) * time
      entry.obj.setPosition(radius * Math.cos(angle), radius * Math.sin(angle))
    }
  }

  // ── Orbits + trail arcs + Hohmann transfer arcs (redrawn every frame) ───────

  _drawOrbitsAndTrails() {
    const g = this._ringGfx
    g.clear()

    for (const [, entry] of this._planets) {
      const { startup, animRadius, prevRadius, targetRadius, transitioning, transferStartAngle } = entry
      const nivel  = startup.nivel ?? 0
      const { body } = PLANET_COLORS[nivel] ?? PLANET_COLORS[0]

      // ── Thin orbit ring at current animated position ──
      g.lineStyle(1, body, 0.12)
      g.strokeCircle(0, 0, animRadius)

      // ── Trail arc ──
      const MIN_ARC = 0.44
      const arcLen  = MIN_ARC + (nivel / 6) * (Math.PI * 2 - MIN_ARC)
      const lineW   = 2 + nivel * 0.55
      const currentAngle = idToAngle(startup.id) + orbitalSpeed(animRadius) * this._time

      g.lineStyle(lineW, body, 0.50)
      if (nivel >= 6) {
        g.strokeCircle(0, 0, animRadius)
      } else {
        g.beginPath()
        g.arc(0, 0, animRadius, currentAngle - arcLen, currentAngle, false)
        g.strokePath()
      }

      // ── Hohmann transfer visuals ──
      if (transitioning && Math.abs(targetRadius - prevRadius) > 1) {
        // Progress 0→1 as animRadius moves from prevRadius to targetRadius
        const span     = targetRadius - prevRadius
        const progress = (animRadius - prevRadius) / span
        // Bell-curve alpha: peaks at midpoint, fades at start and end
        const arcAlpha = Math.sin(Math.PI * Math.max(0, Math.min(1, progress))) * 0.55

        // Hohmann arc (half-ellipse from prevRadius to targetRadius)
        this._drawHohmannArc(g, prevRadius, targetRadius, transferStartAngle, body, arcAlpha)

        // Destination orbit ring — pulsing
        const pulse = 0.20 + 0.12 * Math.sin(this._time * 0.006)
        g.lineStyle(1, body, pulse)
        g.strokeCircle(0, 0, targetRadius)
      }
    }
  }

  /**
   * Draw the half-ellipse Hohmann transfer arc from r1 to r2.
   * Uses the polar focus equation:  r(φ) = a(1−e²) / (1 + e·cos φ)
   * For ascending  (r2>r1): periapsis toward theta0, arc goes 0→π
   * For descending (r2<r1): apoapsis  toward theta0, arc goes π→2π
   */
  _drawHohmannArc(g, r1, r2, theta0, color, alpha) {
    if (Math.abs(r2 - r1) < 2) return
    const a         = (r1 + r2) / 2
    const e         = Math.abs(r2 - r1) / (r2 + r1)
    const b         = Math.sqrt(r1 * r2)   // semi-minor axis
    const c         = a * e                 // center→focus offset
    const ascending = r2 > r1

    // Direction of periapsis in world space
    const theta_peri = ascending ? theta0 : theta0 + Math.PI
    const cos_p = Math.cos(theta_peri)
    const sin_p = Math.sin(theta_peri)

    // Parametric range: ascend 0→π, descend π→2π
    const t_start = ascending ? 0 : Math.PI
    const t_end   = ascending ? Math.PI : 2 * Math.PI

    g.lineStyle(1.5, color, alpha)
    g.beginPath()
    const STEPS = 80
    for (let i = 0; i <= STEPS; i++) {
      const t  = t_start + (t_end - t_start) * i / STEPS
      const xl = a * Math.cos(t) - c
      const yl = b * Math.sin(t)
      const wx = xl * cos_p - yl * sin_p
      const wy = xl * sin_p + yl * cos_p
      if (i === 0) g.moveTo(wx, wy)
      else         g.lineTo(wx, wy)
    }
    g.strokePath()
  }

  // ── Background ──────────────────────────────────────────────────────────────

  _drawStarfield() {
    const gfx    = this.add.graphics().setDepth(0)
    const rng    = mulberry32(42)
    const SPREAD = 2800

    for (let i = 0; i < 480; i++) {
      const x    = (rng() - 0.5) * SPREAD * 2
      const y    = (rng() - 0.5) * SPREAD * 2
      const kind = rng()
      let size, alpha
      if (kind < 0.65) {
        size = 1; alpha = 0.35 + rng() * 0.35
      } else if (kind < 0.92) {
        size = 2; alpha = 0.55 + rng() * 0.35
      } else {
        size = 3; alpha = 0.75 + rng() * 0.20
      }
      gfx.fillStyle(0xffffff, alpha)
      gfx.fillRect(x - size * 0.5, y - size * 0.5, size, size)
    }
  }

  _drawSun() {
    const sun = this.add.graphics().setDepth(100)
    sun.fillStyle(0xffd60a, 0.08)
    sun.fillCircle(0, 0, 44)
    sun.fillStyle(0xffd60a, 1.0)
    sun.fillCircle(0, 0, 28)
  }

  // ── Input ────────────────────────────────────────────────────────────────────

  _setupInput() {
    this.input.on('pointerdown', (ptr) => {
      const planet = this._findPlanetAt(ptr.worldX, ptr.worldY)
      if (planet) {
        // Might be a tap or the start of a pan — decide on pointerup
        this._pendingSelect = planet
        this._panStart = null
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

      if (this._pendingSelect) {
        // If dragged far enough from press point, cancel select and start pan
        const dx = ptr.worldX - ptr.prevWorldX
        const dy = ptr.worldY - ptr.prevWorldY
        // Accumulate distance check via pan start
        if (!this._panStart) {
          this._panStart = {
            px: ptr.x, py: ptr.y,
            sx: this.cameras.main.scrollX,
            sy: this.cameras.main.scrollY,
            dragging: false,
          }
        }
        const totalDx = ptr.x - this._panStart.px
        const totalDy = ptr.y - this._panStart.py
        if (totalDx * totalDx + totalDy * totalDy > 64) {
          // Threshold exceeded — treat as pan, drop pending select
          this._pendingSelect = null
        }
        return
      }

      if (this._panStart) {
        const dx = ptr.x - this._panStart.px
        const dy = ptr.y - this._panStart.py
        const z  = this.cameras.main.zoom
        this.cameras.main.scrollX = this._panStart.sx - dx / z
        this.cameras.main.scrollY = this._panStart.sy - dy / z
      }
    })

    this.input.on('pointerup', (ptr) => {
      if (this._pendingSelect) {
        // Confirmed tap on planet → select
        this._selectedPlanet = this._pendingSelect
        if (this._onSelectCallback) this._onSelectCallback(this._pendingSelect.startup)
        this._pendingSelect = null
        this._panStart = null
        return
      }

      if (this._panStart) {
        const dist = Math.hypot(ptr.x - this._panStart.px, ptr.y - this._panStart.py)
        if (dist < 6) {
          // Click on empty space → new startup
          const radius = Phaser.Math.Clamp(
            Math.hypot(ptr.worldX, ptr.worldY),
            MIN_ORBITAL_RADIUS,
            MAX_ORBITAL_RADIUS
          )
          if (this._onOrbitClick) this._onOrbitClick(Math.round(radius))
        } else {
          // Pan ended → deselect
          this._selectedPlanet = null
        }
      }

      this._panStart = null
    })

    // Zoom anchored to cursor (Phaser 3.80 camera math)
    this.input.on('wheel', (ptr, _objs, _dx, dy) => {
      const cam     = this.cameras.main
      const oldZoom = cam.zoom
      const newZoom = Phaser.Math.Clamp(oldZoom * (1 - dy * 0.001), 0.15, 3.0)
      if (newZoom === oldZoom) return

      const hw     = cam.width  * 0.5
      const hh     = cam.height * 0.5
      const factor = 1 / oldZoom - 1 / newZoom

      const newMidX = cam.midPoint.x + (ptr.x - hw) * factor
      const newMidY = cam.midPoint.y + (ptr.y - hh) * factor

      cam.setZoom(newZoom)
      cam.scrollX = newMidX - hw
      cam.scrollY = newMidY - hh
    })
  }

  _findPlanetAt(worldX, worldY) {
    for (const [, entry] of this._planets) {
      const nivel = entry.obj.startup?.nivel ?? 0
      const hitR  = Math.max(26, PLANET_RADII[nivel] + 18)
      const dx = worldX - entry.obj.x
      const dy = worldY - entry.obj.y
      if (dx * dx + dy * dy <= hitR * hitR) return entry.obj
    }
    return null
  }

  _updateHover() {
    const ptr     = this.input.activePointer
    const hovered = this._findPlanetAt(ptr.worldX, ptr.worldY)
    for (const [, entry] of this._planets) entry.obj.setHovered(entry.obj === hovered)
    this.input.setDefaultCursor(hovered ? 'grab' : 'default')
    this._updateLabel(hovered ?? this._selectedPlanet)
  }

  // ── Callout label (zoom-independent) ────────────────────────────────────────

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
    const iz    = 1 / zoom

    const startup = planet.startup
    const nivel   = startup?.nivel ?? 0
    const r       = PLANET_RADII[nivel]
    const { body } = PLANET_COLORS[nivel] ?? PLANET_COLORS[0]

    const C45   = 0.7071
    const DOT   = 2.5
    const DIAG  = 16
    const HORIZ = 42
    const GAP   = 5

    const ex = planet.x + r * C45
    const ey = planet.y - r * C45
    const dx = ex + DIAG * C45 * iz
    const dy = ey - DIAG * C45 * iz
    const hx = dx + HORIZ * iz
    const hy = dy

    const colorStr = '#' + body.toString(16).padStart(6, '0')

    gfx.lineStyle(iz, body, 0.75)
    gfx.beginPath()
    gfx.moveTo(ex, ey)
    gfx.lineTo(dx, dy)
    gfx.lineTo(hx, hy)
    gfx.strokePath()

    gfx.fillStyle(body, 1)
    gfx.fillCircle(ex, ey, DOT * iz)

    const tx = hx + GAP * iz
    const ty = hy
    name.setPosition(tx, ty - iz)
    name.setScale(iz)
    name.setText(startup?.nombre ?? '')
    name.setVisible(true)

    lvl.setPosition(tx, ty + iz)
    lvl.setScale(iz)
    lvl.setText(`◆ ${NIVEL_NAMES[nivel] ?? ''}`)
    lvl.setStyle({ color: colorStr })
    lvl.setVisible(true)
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
