import { useEffect, useRef } from 'react'
import { STARTUP_COLORS, T_ROAD, T_WATER, T_PARK } from '../game/config'

const SCALE = 3  // 40×3 = 120px canvas

const TERRAIN_COLORS = {
  grass: '#2d6a3f',
  road:  '#4b5563',
  water: '#1d6fa8',
  park:  '#166534',
}

export default function Minimap({ startups, mapData }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height

    ctx.clearRect(0, 0, W, H)

    // Background
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, W, H)

    // Draw terrain types from map data
    if (mapData) {
      for (let row = 0; row < mapData.length; row++) {
        for (let col = 0; col < mapData[row].length; col++) {
          const tile = mapData[row][col]
          let color = TERRAIN_COLORS.grass
          if (tile.type === T_ROAD)  color = TERRAIN_COLORS.road
          if (tile.type === T_WATER) color = TERRAIN_COLORS.water
          if (tile.type === T_PARK)  color = TERRAIN_COLORS.park

          ctx.fillStyle = color
          ctx.fillRect(col * SCALE, row * SCALE, SCALE, SCALE)
        }
      }
    }

    // Startup building dots
    for (const startup of startups) {
      const col = startup.pos_x ?? 0
      const row = startup.pos_y ?? 0
      const nivel = startup.nivel ?? 0
      const colorHex = STARTUP_COLORS[nivel].top
      const r = (colorHex >> 16) & 0xff
      const g = (colorHex >> 8) & 0xff
      const b = colorHex & 0xff

      ctx.fillStyle = `rgb(${r},${g},${b})`
      const dotSize = Math.max(SCALE, SCALE + Math.floor(nivel / 2))
      ctx.fillRect(col * SCALE - 1, row * SCALE - 1, dotSize, dotSize)

      // White border for visibility
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.lineWidth = 0.5
      ctx.strokeRect(col * SCALE - 1, row * SCALE - 1, dotSize, dotSize)
    }

    // Border
    ctx.strokeStyle = '#0f3460'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, W, H)
  }, [startups, mapData])

  return (
    <div className="bg-city-panel border border-city-accent rounded-lg overflow-hidden shadow-xl">
      <div className="px-2 py-1 text-xs text-gray-400 border-b border-city-accent flex items-center gap-1">
        <span>⌗</span> Minimapa
      </div>
      <canvas
        ref={canvasRef}
        width={40 * SCALE}
        height={40 * SCALE}
        className="block"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  )
}
