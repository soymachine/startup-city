import Phaser from 'phaser'
import { TILE_W, TILE_H, BUILDING_COLORS, BUILDING_HEIGHTS } from '../config'

const NIVEL_EMOJIS = ['💡', '📝', '🔧', '🔒', '🌍', '📈', '🚀']

export default class Building extends Phaser.GameObjects.Container {
  constructor(scene, col, row, startup, onSelect) {
    const { x, y } = Building.isoPos(col, row)
    super(scene, x, y)

    this.startup = startup
    this.col = col
    this.row = row
    this.onSelect = onSelect
    this._hovered = false

    this._draw()
    this._addInteractivity()

    scene.add.existing(this)
  }

  static isoPos(col, row) {
    return {
      x: (col - row) * (TILE_W / 2),
      y: (col + row) * (TILE_H / 2),
    }
  }

  _draw() {
    this.removeAll(true)

    const nivel = this.startup.nivel ?? 0
    const color = BUILDING_COLORS[nivel]
    const h = BUILDING_HEIGHTS[nivel]
    const gfx = this.scene.add.graphics()

    if (nivel === 0) {
      // Solar: just a flat diamond outline with a sign
      this._drawDiamond(gfx, 0x4b5563, 0x6b7280, 4)
      this._drawSign(gfx)
    } else {
      // Building: left face, right face, top face
      const darken = Phaser.Display.Color.IntegerToColor(color)
      darken.darken(30)
      const darkColor = darken.color

      const lighten = Phaser.Display.Color.IntegerToColor(color)
      lighten.lighten(15)
      const lightColor = lighten.color

      // Left face
      gfx.fillStyle(darkColor)
      gfx.fillPoints([
        { x: -TILE_W / 2, y: 0 },
        { x: 0, y: TILE_H / 2 },
        { x: 0, y: TILE_H / 2 - h },
        { x: -TILE_W / 2, y: -h },
      ], true)

      // Right face
      gfx.fillStyle(color)
      gfx.fillPoints([
        { x: TILE_W / 2, y: 0 },
        { x: 0, y: TILE_H / 2 },
        { x: 0, y: TILE_H / 2 - h },
        { x: TILE_W / 2, y: -h },
      ], true)

      // Top face
      gfx.fillStyle(lightColor)
      gfx.fillPoints([
        { x: 0, y: -h + TILE_H / 2 },
        { x: TILE_W / 2, y: -h },
        { x: 0, y: -h - TILE_H / 2 },
        { x: -TILE_W / 2, y: -h },
      ], true)

      // Outline
      gfx.lineStyle(1, 0x000000, 0.3)
      gfx.strokePoints([
        { x: -TILE_W / 2, y: 0 },
        { x: 0, y: TILE_H / 2 },
        { x: TILE_W / 2, y: 0 },
        { x: 0, y: -TILE_H / 2 },
        { x: -TILE_W / 2, y: 0 },
      ], false)
    }

    this.add(gfx)
    this._gfx = gfx

    // Emoji label on top
    const emoji = this.scene.add.text(0, -(BUILDING_HEIGHTS[nivel] + 16), NIVEL_EMOJIS[nivel], {
      fontSize: nivel === 0 ? '14px' : '18px',
    }).setOrigin(0.5)
    this.add(emoji)

    // Hit area (invisible diamond for pointer events)
    const hitZone = this.scene.add.zone(0, 0, TILE_W, TILE_H)
    hitZone.setInteractive(
      new Phaser.Geom.Polygon([
        -TILE_W / 2, 0,
        0, TILE_H / 2,
        TILE_W / 2, 0,
        0, -TILE_H / 2,
      ]),
      Phaser.Geom.Polygon.Contains
    )
    this.add(hitZone)
    this._hitZone = hitZone
  }

  _drawDiamond(gfx, fillColor, lineColor, lineWidth) {
    gfx.fillStyle(fillColor)
    gfx.fillPoints([
      { x: -TILE_W / 2, y: 0 },
      { x: 0, y: TILE_H / 2 },
      { x: TILE_W / 2, y: 0 },
      { x: 0, y: -TILE_H / 2 },
    ], true)
    gfx.lineStyle(lineWidth, lineColor)
    gfx.strokePoints([
      { x: -TILE_W / 2, y: 0 },
      { x: 0, y: TILE_H / 2 },
      { x: TILE_W / 2, y: 0 },
      { x: 0, y: -TILE_H / 2 },
      { x: -TILE_W / 2, y: 0 },
    ], false)
  }

  _drawSign(gfx) {
    // Post
    gfx.fillStyle(0x78716c)
    gfx.fillRect(-2, -28, 4, 16)
    // Sign board
    gfx.fillStyle(0xfef3c7)
    gfx.fillRect(-14, -42, 28, 16)
    gfx.lineStyle(1, 0x92400e)
    gfx.strokeRect(-14, -42, 28, 16)
  }

  _addInteractivity() {
    if (!this._hitZone) return
    this._hitZone.on('pointerover', () => {
      this._hovered = true
      this.setScale(1.05)
      this.scene.input.setDefaultCursor('pointer')
    })
    this._hitZone.on('pointerout', () => {
      this._hovered = false
      this.setScale(1)
      this.scene.input.setDefaultCursor('default')
    })
    this._hitZone.on('pointerdown', () => {
      if (this.onSelect) this.onSelect(this.startup)
    })
  }

  update(startup) {
    this.startup = startup
    this._draw()
    this._addInteractivity()
  }

  pulseAnimation() {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 200,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
    })
  }
}
