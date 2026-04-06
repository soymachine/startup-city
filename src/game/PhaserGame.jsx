import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import Phaser from 'phaser'
import BootScene from './scenes/BootScene'
import SpaceScene from './scenes/SpaceScene'

const PhaserGame = forwardRef(function PhaserGame(
  { onPlanetSelect, onOrbitClick, onStartupOrbit, gradientInner, gradientOuter },
  ref
) {
  const containerRef     = useRef(null)
  const gameRef          = useRef(null)
  const spaceSceneRef    = useRef(null)
  const gradientInnerRef = useRef(gradientInner ?? '#1464c8')
  const gradientOuterRef = useRef(gradientOuter ?? '#03050f')

  // Keep colour refs in sync with props (no re-render cost)
  useEffect(() => { gradientInnerRef.current = gradientInner ?? '#1464c8' }, [gradientInner])
  useEffect(() => { gradientOuterRef.current = gradientOuter ?? '#03050f' }, [gradientOuter])

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

    // ── Per-frame: keep gradient centred on the sun (world origin 0,0) ──
    // We write directly to the DOM to avoid triggering React re-renders at 60 fps.
    const onStep = () => {
      const el = containerRef.current
      if (!el) return

      const scene = game.scene.getScene('SpaceScene')
      const cam   = scene?.cameras?.main

      let pctX = 50
      let pctY = 50

      if (cam) {
        // Correct world→screen for Phaser's camera where scrollX = worldAtLeftEdge:
        //   worldX = (screenX - cam.x) / zoom + scrollX   BUT
        //   cam.scrollX is set by centerOn as x - width/2 (no zoom factor),
        //   so midPoint.x = scrollX + width/2 is the world point at screen centre.
        //   screenX_of_world_0 = width/2 - midPoint.x * zoom
        const screenX = cam.width  * 0.5 - cam.midPoint.x * cam.zoom
        const screenY = cam.height * 0.5 - cam.midPoint.y * cam.zoom
        pctX = (screenX / cam.width)  * 100
        pctY = (screenY / cam.height) * 100
      }

      el.style.background =
        `radial-gradient(ellipse at ${pctX.toFixed(2)}% ${pctY.toFixed(2)}%, ` +
        `${gradientInnerRef.current} 0%, ${gradientOuterRef.current} 100%)`
    }

    game.events.on('step', onStep)

    return () => {
      game.events.off('step', onStep)
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

  // No background style here — the step listener owns it
  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
})

export default PhaserGame
