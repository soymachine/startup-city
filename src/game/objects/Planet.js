/**
 * Planet — flat-color circle + outer selection halo.
 * No glow, no specular — clean minimalist aesthetic.
 * Emits 'planet:pointerdown' on the scene event emitter.
 */
import Phaser from 'phaser'
import { PLANET_RADII, PLANET_COLORS } from '../config'

export default class Planet extends Phaser.GameObjects.Container {
  constructor(scene, startup) {
    super(scene, 0, 0)
    this.startup = startup
    this._draw()
    scene.add.existing(this)
    this.setDepth(200)
  }

  _draw() {
    this.removeAll(true)

    const nivel  = this.startup?.nivel ?? 0
    const r      = PLANET_RADII[nivel]
    const { body } = PLANET_COLORS[nivel] ?? PLANET_COLORS[0]

    const g = this.scene.add.graphics()

    // Outer halo — used as visual selection/hover affordance
    g.fillStyle(body, 0.20)
    g.fillCircle(0, 0, r + 11)

    // Planet body — flat, no gradients
    g.fillStyle(body, 1.0)
    g.fillCircle(0, 0, r)

    this.add(g)

    // Name label — small, to the right of the planet
    const label = this.scene.add.text(
      r + 8, 0,
      this.startup?.nombre ?? '',
      {
        fontSize: '10px',
        fontFamily: 'ui-monospace, "Courier New", monospace',
        color: '#cbd5e1',
        stroke: '#000000',
        strokeThickness: 3,
        resolution: 2,
      }
    ).setOrigin(0, 0.5)
    this.add(label)

    // Hit zone: planet body + at least 18px padding, minimum 26px total
    const hitR = Math.max(26, r + 18)
    const hz = this.scene.add.zone(0, 0, hitR * 2, hitR * 2)
    hz.setInteractive(
      new Phaser.Geom.Circle(0, 0, hitR),
      Phaser.Geom.Circle.Contains
    )
    this.add(hz)

    hz.on('pointerover', () => {
      g.setAlpha(1.3)  // brightens the halo
      this.scene.input.setDefaultCursor('grab')
    })
    hz.on('pointerout', () => {
      g.setAlpha(1)
      this.scene.input.setDefaultCursor('default')
    })
    hz.on('pointerdown', (ptr) => {
      this.scene.events.emit('planet:pointerdown', this, ptr)
    })
  }

  update(startup) {
    const changed =
      startup.nivel  !== this.startup?.nivel ||
      startup.nombre !== this.startup?.nombre
    this.startup = startup
    if (changed) this._draw()
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
}
