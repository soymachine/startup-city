import { useEffect, useRef } from 'react'
import { BUILDING_COLORS } from '../game/config'

const MINI_SCALE = 4

export default function Minimap({ startups }) {
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

    // Road lines
    ctx.strokeStyle = '#4b5563'
    ctx.lineWidth = 2
    // Horizontal roads at row 5 and 14
    const roadY5 = (5 * MINI_SCALE) + (5 * MINI_SCALE) / 2
    const roadY14 = (14 * MINI_SCALE) + (14 * MINI_SCALE) / 2
    ctx.beginPath()
    ctx.moveTo(0, roadY5)
    ctx.lineTo(W, roadY5)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, roadY14)
    ctx.lineTo(W, roadY14)
    ctx.stroke()

    // Buildings as dots
    for (const startup of startups) {
      const x = (startup.pos_x ?? 0) * MINI_SCALE
      const y = (startup.pos_y ?? 0) * MINI_SCALE
      const nivel = startup.nivel ?? 0
      const color = '#' + BUILDING_COLORS[nivel].toString(16).padStart(6, '0')

      ctx.fillStyle = color
      const size = Math.max(3, MINI_SCALE - 1 + nivel)
      ctx.fillRect(x, y, size, size)
    }

    // Border
    ctx.strokeStyle = '#0f3460'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, W, H)
  }, [startups])

  return (
    <div className="bg-city-panel border border-city-accent rounded-lg overflow-hidden shadow-xl">
      <div className="px-2 py-1 text-xs text-gray-400 border-b border-city-accent flex items-center gap-1">
        <span>⌗</span> Minimapa
      </div>
      <canvas
        ref={canvasRef}
        width={20 * MINI_SCALE}
        height={20 * MINI_SCALE}
        className="block"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  )
}
