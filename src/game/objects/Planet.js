/**
 * Planet — pure visual. No interactive zones.
 * All input is handled by SpaceScene using manual world-space hit testing,
 * which avoids Phaser's zone/camera coordinate mismatch.
 */
import Phaser from 'phaser'
import { PLANET_RADII, PLANET_COLORS } from '../config'

export default class Planet extends Phaser.GameObjects.Container {
  constructor(scene, startup) {
    super(scene, 0, 0)
    this.startup = startup
    this._gfx = null
    this._draw()
    scene.add.existing(this)
    this.setDepth(200)
  }

  _draw() {
    this.removeAll(true)

    const nivel   = this.startup?.nivel ?? 0
    const r       = PLANET_RADII[nivel]
    const { body } = PLANET_COLORS[nivel] ?? PLANET_COLORS[0]

    const g = this.scene.add.graphics()
    g.fillStyle(body, 0.20); g.fillCircle(0, 0, r + 11)  // halo
    g.fillStyle(body, 1.00); g.fillCircle(0, 0, r)        // body

    this._gfx = g
    this.add(g)

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

  /** Called by SpaceScene each frame to highlight on hover */
  setHovered(on) {
    this._gfx?.setAlpha(on ? 1.4 : 1)
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
      duration: 220, yoyo: true, repeat: 2,
      ease: 'Sine.easeInOut',
    })
  }
}
