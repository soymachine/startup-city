import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import Phaser from 'phaser'
import BootScene from './scenes/BootScene'
import SpaceScene from './scenes/SpaceScene'

const PhaserGame = forwardRef(function PhaserGame(
  { onPlanetSelect, onOrbitClick, onStartupOrbit, gradientInner, gradientOuter },
  ref
) {
  const containerRef  = useRef(null)
  const gameRef       = useRef(null)
  const spaceSceneRef = useRef(null)

  useImperativeHandle(ref, () => ({
    syncStartups(startups) {
      spaceSceneRef.current?.syncStartups(startups, onPlanetSelect, onOrbitClick)
    },
    centerOn(id) {
      spaceSceneRef.current?.centerOn(id)
    },
  }))

  useEffect(() => {
    if (gameRef.current) return

    const config = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      transparent: true,
      scene: [BootScene, SpaceScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: '100%',
        height: '100%',
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: { antialias: true, roundPixels: false },
    }

    const game = new Phaser.Game(config)
    gameRef.current = game

    const wire = () => {
      const scene = game.scene.getScene('SpaceScene')
      if (!scene) return
      spaceSceneRef.current = scene
      scene.events.on('startup:orbit', (id, radius) => {
        if (onStartupOrbit) onStartupOrbit(id, radius)
      })
    }

    game.events.on('ready', wire)
    setTimeout(wire, 100)

    return () => {
      game.destroy(true)
      gameRef.current       = null
      spaceSceneRef.current = null
    }
  }, []) // eslint-disable-line

  // Keep callbacks fresh without recreating the game
  useEffect(() => {
    if (!spaceSceneRef.current) return
    spaceSceneRef.current._onSelectCallback = onPlanetSelect
    spaceSceneRef.current._onOrbitClick     = onOrbitClick
  }, [onPlanetSelect, onOrbitClick])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 50%, ${gradientInner ?? '#1464c8'} 0%, ${gradientOuter ?? '#03050f'} 100%)`,
      }}
    />
  )
})

export default PhaserGame
