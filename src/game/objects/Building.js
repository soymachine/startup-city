/**
 * Startup building — pixel-art-style isometric building.
 * 7 visual levels, cyan/teal palette, draggable.
 * Emits 'building:pointerdown' on the scene event emitter.
 */
import Phaser from 'phaser'
import {
  TILE_W, TILE_H,
  STARTUP_COLORS, STARTUP_HEIGHTS,
  NIVEL_LABELS, isoToScreen,
} from '../config'

const HW = TILE_W / 2   // 32
const HH = TILE_H / 2   // 16

// ─────────────────────────────────────────────────────────────────────────────
// Standalone drawing helper — used both by the Building and the drag ghost.
// Draws the building shape at (offsetX, offsetY) into `gfx`.
// ─────────────────────────────────────────────────────────────────────────────
export function drawStartupShape(gfx, nivel, ox = 0, oy = 0) {
  const colors = STARTUP_COLORS[nivel]
  const h = STARTUP_HEIGHTS[nivel]

  if (nivel === 0) {
    _drawEmptyLot(gfx, ox, oy)
    return
  }

  // ── Three isometric faces ─────────────────────────────────────────────────
  gfx.fillStyle(colors.left)
  gfx.fillPoints([
    { x: ox-HW, y: oy    },
    { x: ox,    y: oy+HH },
    { x: ox,    y: oy+HH-h },
    { x: ox-HW, y: oy-h  },
  ], true)

  gfx.fillStyle(colors.right)
  gfx.fillPoints([
    { x: ox+HW, y: oy    },
    { x: ox,    y: oy+HH },
    { x: ox,    y: oy+HH-h },
    { x: ox+HW, y: oy-h  },
  ], true)

  gfx.fillStyle(colors.top)
  gfx.fillPoints([
    { x: ox,    y: oy-h+HH },
    { x: ox+HW, y: oy-h    },
    { x: ox,    y: oy-h-HH },
    { x: ox-HW, y: oy-h    },
  ], true)

  // ── Outline ───────────────────────────────────────────────────────────────
  gfx.lineStyle(1, 0x001820, 0.45)
  gfx.strokePoints([
    { x: ox-HW, y: oy }, { x: ox, y: oy+HH }, { x: ox+HW, y: oy },
    { x: ox, y: oy-HH }, { x: ox-HW, y: oy },
  ], false)
  gfx.lineBetween(ox,    oy+HH,   ox,    oy+HH-h)
  gfx.lineBetween(ox-HW, oy,      ox-HW, oy-h)
  gfx.lineBetween(ox+HW, oy,      ox+HW, oy-h)

  // ── Windows ───────────────────────────────────────────────────────────────
  const wCfg = WINDOW_CONFIGS[nivel]
  _drawWindows(gfx, 'left',  wCfg, h, ox, oy)
  _drawWindows(gfx, 'right', wCfg, h, ox, oy)

  // ── Roof details ──────────────────────────────────────────────────────────
  _drawRoof(gfx, nivel, h, ox, oy)
}

function _drawEmptyLot(gfx, ox, oy) {
  gfx.fillStyle(0x374151)
  gfx.fillPoints([
    { x: ox-HW, y: oy }, { x: ox, y: oy+HH },
    { x: ox+HW, y: oy }, { x: ox, y: oy-HH },
  ], true)
  gfx.lineStyle(1.5, 0x64748b)
  gfx.strokePoints([
    { x: ox-HW, y: oy }, { x: ox, y: oy+HH },
    { x: ox+HW, y: oy }, { x: ox, y: oy-HH }, { x: ox-HW, y: oy },
  ], false)
  // Sign post
  gfx.fillStyle(0x6b7280)
  gfx.fillRect(ox - 2, oy - 38, 3, 22)
  // Sign board
  gfx.fillStyle(0xfef3c7)
  gfx.fillRect(ox - 14, oy - 52, 28, 16)
  gfx.lineStyle(1.5, 0xf59e0b)
  gfx.strokeRect(ox - 14, oy - 52, 28, 16)
}

const WINDOW_CONFIGS = [
  { rows: 0, cols: 0 },
  { rows: 1, cols: 1 },
  { rows: 1, cols: 2 },
  { rows: 2, cols: 2 },
  { rows: 3, cols: 2 },
  { rows: 4, cols: 2 },
  { rows: 5, cols: 3 },
]

const WIN_COLOR = 0xcffafe

function _drawWindows(gfx, face, cfg, h, ox, oy) {
  if (cfg.rows === 0) return
  const WIN_W = 5, WIN_H = 3
  const uPad = 0.18, vPad = 0.12

  gfx.fillStyle(WIN_COLOR, 0.8)

  for (let r = 0; r < cfg.rows; r++) {
    for (let c = 0; c < cfg.cols; c++) {
      const u = uPad + (c + 0.5) * (1 - 2 * uPad) / cfg.cols
      const v = vPad + (r + 0.5) * (1 - 2 * vPad) / cfg.rows
      const wx = face === 'left' ? ox - HW + u * HW : ox + HW - u * HW
      const wy = oy + u * HH - v * h
      gfx.fillRect(wx - WIN_W / 2, wy - WIN_H / 2, WIN_W, WIN_H)
    }
  }
}

function _drawRoof(gfx, nivel, h, ox, oy) {
  if (nivel === 1 || nivel === 2) {
    // Peaked roof
    gfx.fillStyle(0xf97316)
    gfx.fillTriangle(ox - HW * 0.5, oy - h, ox + HW * 0.5, oy - h, ox, oy - h - HH * 1.1)
  }
  if (nivel === 2 || nivel === 3) {
    // Antenna mast
    gfx.fillStyle(0x9ca3af)
    gfx.fillRect(ox - 1, oy - h - HH - 12, 2, 14)
    gfx.fillStyle(0xf87171)
    gfx.fillCircle(ox, oy - h - HH - 13, 2.5)
  }
  if (nivel === 4) {
    // Tech strips on roof
    gfx.fillStyle(0x06b6d4, 0.9)
    gfx.fillRect(ox - 14, oy - h - HH - 1, 28, 3)
    gfx.fillRect(ox - 9,  oy - h - HH - 5, 18, 2)
  }
  if (nivel === 5) {
    // Neon strip on upper facade
    gfx.fillStyle(0xf0abfc, 0.9)
    gfx.fillRect(ox - HW + 4, oy - h * 0.84, HW - 5, 4)
    gfx.fillStyle(0xf0abfc, 0.25)
    gfx.fillRect(ox - HW + 2, oy - h * 0.84 - 3, HW - 3, 10)
    // Billboard
    gfx.fillStyle(0x1e3a5f)
    gfx.fillRect(ox - 11, oy - h - HH - 9, 22, 9)
    gfx.fillStyle(0x00e5ff)
    gfx.fillRect(ox - 9,  oy - h - HH - 7, 18, 5)
  }
  if (nivel === 6) {
    // Spire
    gfx.fillStyle(0xe0f7fa)
    gfx.fillTriangle(ox - 3, oy - h - HH, ox + 3, oy - h - HH, ox, oy - h - HH - 28)
    gfx.lineStyle(1, 0x67e8f9)
    gfx.lineBetween(ox, oy - h - HH, ox, oy - h - HH - 28)
    // Helipad
    gfx.lineStyle(2, 0xfbbf24, 0.85)
    gfx.strokeCircle(ox, oy - h - HH / 2, 7)
    gfx.lineStyle(1, 0xfbbf24, 0.6)
    gfx.lineBetween(ox - 6, oy - h - HH / 2, ox + 6, oy - h - HH / 2)
    gfx.lineBetween(ox, oy - h - HH / 2 - 6, ox, oy - h - HH / 2 + 6)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Building container — interactive, emits drag events upward
// ─────────────────────────────────────────────────────────────────────────────
export default class Building extends Phaser.GameObjects.Container {
  constructor(scene, col, row, startup) {
    const { x, y } = isoToScreen(col, row)
    super(scene, x, y)

    this.startup = startup
    this.col = col
    this.row = row

    this._draw()
    scene.add.existing(this)
    this.setDepth((col + row) * 2 + 1)
  }

  _draw() {
    this.removeAll(true)

    const gfx = this.scene.add.graphics()
    drawStartupShape(gfx, this.startup?.nivel ?? 0)
    this.add(gfx)

    // Name label
    const nivel = this.startup?.nivel ?? 0
    const h = STARTUP_HEIGHTS[nivel]
    const label = this.scene.add.text(0, -(h + 19), this.startup?.nombre?.substring(0, 14) ?? '', {
      fontSize: '6px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#67e8f9',
      stroke: '#00111a',
      strokeThickness: 3,
    }).setOrigin(0.5)
    this.add(label)

    // Hit zone (diamond)
    const hz = this.scene.add.zone(0, 0, TILE_W, TILE_H + 10)
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
    const prevNivel = this.startup?.nivel
    const prevNombre = this.startup?.nombre
    this.startup = startup
    if (startup.nivel !== prevNivel || startup.nombre !== prevNombre) {
      this._draw()
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
