/**
 * Startup building — sprite-based isometric building.
 * Uses preloaded textures startup_0 … startup_6.
 * Emits 'building:pointerdown' on the scene event emitter.
 */
import Phaser from 'phaser'
import {
  TILE_W, TILE_H,
  STARTUP_SPRITE_KEY, STARTUP_SPRITE_H,
  isoToScreen,
} from '../config'

const HW = TILE_W / 2  // 64
const HH = TILE_H / 2  // 32

export default class Building extends Phaser.GameObjects.Container {
  constructor(scene, col, row, startup) {
    const { x, y } = isoToScreen(col, row)
    super(scene, x, y)

    this.startup = startup
    this.col = col
    this.row = row

    this._draw()
    scene.add.existing(this)
    this.setDepth((col + row) * 3 + 2.5)
  }

  _draw() {
    this.removeAll(true)

    const nivel  = this.startup?.nivel ?? 0
    const key    = STARTUP_SPRITE_KEY[nivel] ?? STARTUP_SPRITE_KEY[0]
    const sprH   = STARTUP_SPRITE_H[nivel]   ?? STARTUP_SPRITE_H[0]

    // Building sprite — anchored at its bottom-centre, sitting on the S vertex
    const img = this.scene.add.image(0, TILE_H, key)
    img.setOrigin(0.5, 1.0)
    this.add(img)

    // Name label — floats just above the building top
    const labelY = TILE_H - sprH - 6
    const label = this.scene.add.text(
      0, labelY,
      this.startup?.nombre?.substring(0, 14) ?? '',
      {
        fontSize: '6px',
        fontFamily: '"Press Start 2P", monospace',
        color: '#67e8f9',
        stroke: '#00111a',
        strokeThickness: 3,
      }
    ).setOrigin(0.5, 1.0)
    this.add(label)

    // Hit zone — diamond matching the tile face
    const hz = this.scene.add.zone(0, HH, TILE_W, TILE_H + 10)
    hz.setInteractive(
      new Phaser.Geom.Polygon([-HW, 0, 0, HH, HW, 0, 0, -HH]),
      Phaser.Geom.Polygon.Contains
    )
    this.add(hz)

    hz.on('pointerover', () => {
      this.setScale(1.05)
      this.scene.input.setDefaultCursor('grab')
    })
    hz.on('pointerout', () => {
      this.setScale(1)
      this.scene.input.setDefaultCursor('default')
    })
    hz.on('pointerdown', (ptr) => {
      this.scene.events.emit('building:pointerdown', this, ptr)
    })
  }

  update(startup) {
    const prevNivel  = this.startup?.nivel
    const prevNombre = this.startup?.nombre
    this.startup = startup
    if (startup.nivel !== prevNivel || startup.nombre !== prevNombre) {
      this._draw()
      this.setDepth((this.col + this.row) * 3 + 2.5)
    }
  }

  pulseAnimation() {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.12, scaleY: 1.12,
      duration: 200,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
    })
  }
}
