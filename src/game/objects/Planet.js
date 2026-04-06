/**
 * Planet — a startup rendered as an orbiting planet.
 * Position is set externally each frame by SpaceScene.
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
    const { body, glow } = PLANET_COLORS[nivel] ?? PLANET_COLORS[0]

    const g = this.scene.add.graphics()

    // Outer glow rings (furthest → nearest)
    g.fillStyle(glow, 0.06); g.fillCircle(0, 0, r + 28)
    g.fillStyle(glow, 0.10); g.fillCircle(0, 0, r + 18)
    g.fillStyle(glow, 0.18); g.fillCircle(0, 0, r + 10)
    g.fillStyle(glow, 0.30); g.fillCircle(0, 0, r + 5)

    // Planet body
    g.fillStyle(body, 1.0)
    g.fillCircle(0, 0, r)

    // Specular highlight
    g.fillStyle(0xffffff, 0.30)
    g.fillCircle(-r * 0.28, -r * 0.32, r * 0.38)

    this.add(g)

    // Name label
    const label = this.scene.add.text(
      0, r + 10,
      this.startup?.nombre ?? '',
      {
        fontSize: '11px',
        fontFamily: 'ui-monospace, monospace',
        color: '#e2e8f0',
        stroke: '#05050f',
        strokeThickness: 4,
        resolution: 2,
      }
    ).setOrigin(0.5, 0)
    this.add(label)

    // Hit zone
    const hz = this.scene.add.zone(0, 0, (r + 12) * 2, (r + 12) * 2)
    hz.setInteractive(new Phaser.Geom.Circle(0, 0, r + 12), Phaser.Geom.Circle.Contains)
    this.add(hz)

    hz.on('pointerover', () => {
      this.setScale(1.08)
      this.scene.input.setDefaultCursor('grab')
    })
    hz.on('pointerout', () => {
      this.setScale(1)
      this.scene.input.setDefaultCursor('default')
    })
    hz.on('pointerdown', (ptr) => {
      this.scene.events.emit('planet:pointerdown', this, ptr)
    })
  }

  update(startup) {
    const changed =
      startup.nivel !== this.startup?.nivel ||
      startup.nombre !== this.startup?.nombre
    this.startup = startup
    if (changed) this._draw()
  }

  pulseAnimation() {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.25, scaleY: 1.25,
      duration: 250,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
    })
  }
}
