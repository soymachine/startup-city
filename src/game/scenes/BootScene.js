import Phaser from 'phaser'

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    // Loading bar
    const w = this.cameras.main.width
    const h = this.cameras.main.height

    const bar = this.add.graphics()
    const border = this.add.graphics()

    border.lineStyle(2, 0xe94560)
    border.strokeRect(w / 2 - 152, h / 2 - 12, 304, 24)

    this.load.on('progress', (value) => {
      bar.clear()
      bar.fillStyle(0xe94560)
      bar.fillRect(w / 2 - 150, h / 2 - 10, 300 * value, 20)
    })

    this.add
      .text(w / 2, h / 2 - 40, 'STARTUP CITY', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '20px',
        color: '#e94560',
      })
      .setOrigin(0.5)

    this.add
      .text(w / 2, h / 2 + 44, 'Cargando ciudad...', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#9ca3af',
      })
      .setOrigin(0.5)
  }

  create() {
    this.scene.start('MapScene')
  }
}
