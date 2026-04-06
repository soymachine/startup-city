import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import Phaser from 'phaser'
import BootScene from './scenes/BootScene'
import MapScene from './scenes/MapScene'

const PhaserGame = forwardRef(function PhaserGame({ onBuildingSelect, onEmptyTileClick }, ref) {
  const containerRef = useRef(null)
  const gameRef = useRef(null)
  const mapSceneRef = useRef(null)

  useImperativeHandle(ref, () => ({
    syncStartups(startups) {
      if (mapSceneRef.current) {
        mapSceneRef.current.syncStartups(startups, onBuildingSelect, onEmptyTileClick)
      }
    },
    centerOn(col, row) {
      if (mapSceneRef.current) {
        mapSceneRef.current.centerOn(col, row)
      }
    },
  }))

  useEffect(() => {
    if (gameRef.current) return

    const config = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: '100%',
      height: '100%',
      backgroundColor: '#1a1a2e',
      scene: [BootScene, MapScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        antialias: false,
        pixelArt: true,
      },
    }

    const game = new Phaser.Game(config)
    gameRef.current = game

    game.events.on('ready', () => {
      const mapScene = game.scene.getScene('MapScene')
      if (mapScene) {
        mapSceneRef.current = mapScene
      } else {
        game.scene.keys['MapScene']?.events.on('create', () => {
          mapSceneRef.current = game.scene.getScene('MapScene')
        })
      }
    })

    return () => {
      game.destroy(true)
      gameRef.current = null
      mapSceneRef.current = null
    }
  }, [])

  // Update callbacks when props change
  useEffect(() => {
    if (mapSceneRef.current) {
      mapSceneRef.current._onSelectCallback = onBuildingSelect
      mapSceneRef.current._onEmptyTileCallback = onEmptyTileClick
    }
  }, [onBuildingSelect, onEmptyTileClick])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ position: 'absolute', inset: 0 }}
    />
  )
})

export default PhaserGame
