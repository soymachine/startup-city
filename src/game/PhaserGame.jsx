import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import Phaser from 'phaser'
import BootScene from './scenes/BootScene'
import MapScene from './scenes/MapScene'

const PhaserGame = forwardRef(function PhaserGame(
  { onBuildingSelect, onEmptyTileClick, onStartupMove },
  ref
) {
  const containerRef = useRef(null)
  const gameRef      = useRef(null)
  const mapSceneRef  = useRef(null)

  useImperativeHandle(ref, () => ({
    syncStartups(startups) {
      mapSceneRef.current?.syncStartups(startups, onBuildingSelect, onEmptyTileClick)
    },
    centerOn(col, row) {
      mapSceneRef.current?.centerOn(col, row)
    },
    getMapData() {
      return mapSceneRef.current?.getMapData() ?? null
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
      render: { antialias: false, pixelArt: true },
    }

    const game = new Phaser.Game(config)
    gameRef.current = game

    // When MapScene is ready, wire the startup:move event
    const wireScene = () => {
      const scene = game.scene.getScene('MapScene')
      if (!scene) return
      mapSceneRef.current = scene
      scene.events.on('startup:move', (id, col, row) => {
        if (onStartupMove) onStartupMove(id, col, row)
      })
    }

    game.events.on('ready', wireScene)
    // Also try immediately (scene might already be running)
    setTimeout(wireScene, 100)

    return () => {
      game.destroy(true)
      gameRef.current  = null
      mapSceneRef.current = null
    }
  }, []) // eslint-disable-line

  // Keep callbacks current without recreating the game
  useEffect(() => {
    if (!mapSceneRef.current) return
    mapSceneRef.current._onSelectCallback     = onBuildingSelect
    mapSceneRef.current._onEmptyTileCallback  = onEmptyTileClick
  }, [onBuildingSelect, onEmptyTileClick])

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
  )
})

export default PhaserGame
