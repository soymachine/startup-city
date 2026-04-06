/**
 * Planet — flat-color orbiting circle.
 *
 * Hit detection issue in Phaser 3: interactive zones inside a Container
 * don't inherit the Container's world transform, so clicks are offset.
 * Fix: keep _hitZone as a standalone scene object and sync its position
 * via setPosition() override.
 */
import Phaser from 'phaser'
import { PLANET_RADII, PLANET_COLORS } from '../config'

export default class Planet extends Phaser.GameObjects.Container {
  constructor(scene, startup) {
    super(scene, 0, 0)
    this.startup = startup
    this._gfx     = null   // graphics child, kept as ref for hover tint
    this._hitZone = null   // standalone scene zone (NOT a container child)

    this._draw()
    this._buildHitZone()

    scene.add.existing(this)
    this.setDepth(200)
  }

  // ── Visual ─────────────────────────────────────────────────────────────────

  _draw() {
    this.removeAll(true)

    const nivel       = this.startup?.nivel ?? 0
    const r           = PLANET_RADII[nivel]
    const { body }    = PLANET_COLORS[nivel] ?? PLANET_COLORS[0]

    const g = this.scene.add.graphics()

    // Outer halo — selection affordance
    g.fillStyle(body, 0.20)
    g.fillCircle(0, 0, r + 11)

    // Planet body — flat colour
    g.fillStyle(body, 1.0)
    g.fillCircle(0, 0, r)

    this._gfx = g
    this.add(g)

    // Label to the right
    this.add(
      this.scene.add.text(r + 10, 0, this.startup?.nombre ?? '', {
        fontSize: '10px',
        fontFamily: 'ui-monospace, "Courier New", monospace',
        color: '#cbd5e1',
        stroke: '#000000',
        strokeThickness: 3,
        resolution: 2,
      }).setOrigin(0, 0.5)
    )
  }

  // ── Hit zone (standalone, NOT a container child) ──────────────────────────

  _buildHitZone() {
    this._hitZone?.destroy()

    const nivel = this.startup?.nivel ?? 0
    const r     = PLANET_RADII[nivel]
    const hitR  = Math.max(26, r + 18)

    const hz = this.scene.add.zone(this.x, this.y, hitR * 2, hitR * 2)
    hz.setInteractive(
      new Phaser.Geom.Circle(0, 0, hitR),
      Phaser.Geom.Circle.Contains
    )
    hz.setDepth(201)
    this._hitZone = hz

    hz.on('pointerover', () => {
      this._gfx?.setAlpha(1.4)
      this.scene.input.setDefaultCursor('grab')
    })
    hz.on('pointerout', () => {
      this._gfx?.setAlpha(1)
      this.scene.input.setDefaultCursor('default')
    })
    hz.on('pointerdown', (ptr) => {
      this.scene.events.emit('planet:pointerdown', this, ptr)
    })
  }

  // ── Override setPosition so hit zone always follows the visual ─────────────

  setPosition(x, y) {
    super.setPosition(x, y)
    if (this._hitZone) this._hitZone.setPosition(x, y)
    return this
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  update(startup) {
    const nivelChanged  = startup.nivel  !== this.startup?.nivel
    const nombreChanged = startup.nombre !== this.startup?.nombre
    this.startup = startup

    if (nivelChanged || nombreChanged) {
      this._draw()
      if (nivelChanged) this._buildHitZone()
    }
  }

  pulseAnimation() {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.3, scaleY: 1.3,
      duration: 220,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
    })
  }

  destroy(fromScene) {
    this._hitZone?.destroy()
    this._hitZone = null
    super.destroy(fromScene)
  }
}
