import { useState, useMemo } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { NIVEL_INFO, ESTADO_INFO } from '../firebase/startups'

const ESTADOS = ['todos', ...Object.keys(ESTADO_INFO)]

export default function Sidebar({ user, startups, onSelectStartup, onCenterOn, otherOnline }) {
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [collapsed, setCollapsed] = useState(false)

  const filtered = useMemo(() => {
    return startups.filter((s) => {
      const matchEstado = filtroEstado === 'todos' || s.estado === filtroEstado
      const matchBusqueda = !busqueda || s.nombre.toLowerCase().includes(busqueda.toLowerCase())
      return matchEstado && matchBusqueda
    })
  }, [startups, filtroEstado, busqueda])

  const stats = useMemo(() => {
    return {
      total: startups.length,
      activos: startups.filter((s) => s.estado === 'activo').length,
      maxNivel: startups.reduce((max, s) => Math.max(max, s.nivel ?? 0), 0),
    }
  }, [startups])

  if (collapsed) {
    return (
      <div className="w-12 bg-city-panel border-r border-city-accent flex flex-col items-center py-4 gap-4">
        <button
          onClick={() => setCollapsed(false)}
          className="text-gray-400 hover:text-white text-lg"
          title="Expandir sidebar"
        >
          →
        </button>
        <div className="text-city-neon text-xs font-bold" style={{ writingMode: 'vertical-rl' }}>
          {stats.total} startups
        </div>
      </div>
    )
  }

  return (
    <div className="w-72 bg-city-panel border-r border-city-accent flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-city-accent">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏙️</span>
            <span className="text-white font-bold text-sm">Startup City</span>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="text-gray-500 hover:text-white text-sm"
          >
            ←
          </button>
        </div>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>

        {/* Online indicator */}
        {otherOnline && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-city-green">
            <span className="w-2 h-2 rounded-full bg-city-green animate-pulse" />
            Tu hermano está online
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-city-accent">
        <div className="bg-city-panel p-3 text-center">
          <div className="text-xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-400">Total</div>
        </div>
        <div className="bg-city-panel p-3 text-center">
          <div className="text-xl font-bold text-city-green">{stats.activos}</div>
          <div className="text-xs text-gray-400">Activas</div>
        </div>
        <div className="bg-city-panel p-3 text-center">
          <div className="text-xl font-bold text-city-gold">
            {NIVEL_INFO[stats.maxNivel]?.emoji ?? '💡'}
          </div>
          <div className="text-xs text-gray-400">Max nivel</div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-3 space-y-2 border-b border-city-accent">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar..."
          className="w-full bg-city-bg border border-city-accent rounded px-3 py-1.5 text-white text-xs focus:outline-none focus:border-city-neon"
        />
        <div className="flex gap-1 flex-wrap">
          {ESTADOS.map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`text-xs px-2 py-1 rounded-full transition-colors ${
                filtroEstado === estado
                  ? 'bg-city-neon text-white'
                  : 'bg-city-accent text-gray-400 hover:text-white'
              }`}
            >
              {estado === 'todos' ? 'Todos' : ESTADO_INFO[estado].label}
            </button>
          ))}
        </div>
      </div>

      {/* Startup list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            {startups.length === 0
              ? 'Haz click en un solar del mapa para añadir tu primera startup'
              : 'No hay startups con estos filtros'}
          </div>
        ) : (
          filtered.map((startup) => (
            <StartupRow
              key={startup.id}
              startup={startup}
              onSelect={() => onSelectStartup(startup)}
              onCenter={() => onCenterOn(startup.pos_x, startup.pos_y)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-city-accent">
        <button
          onClick={() => signOut(auth)}
          className="w-full text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

function StartupRow({ startup, onSelect, onCenter }) {
  const nivel = startup.nivel ?? 0
  const nivelInfo = NIVEL_INFO[nivel]
  const estadoInfo = ESTADO_INFO[startup.estado] ?? ESTADO_INFO.activo

  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 hover:bg-city-accent/50 cursor-pointer border-b border-city-accent/30 transition-colors">
      <button
        className="flex-1 flex items-center gap-3 min-w-0 text-left"
        onClick={onSelect}
      >
        <span className="text-xl flex-shrink-0">{nivelInfo.emoji}</span>
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{startup.nombre}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="text-xs"
              style={{ color: estadoInfo.color }}
            >
              {estadoInfo.label}
            </span>
            <span className="text-gray-600 text-xs">·</span>
            <span
              className="text-xs"
              style={{ color: nivelInfo.color }}
            >
              Nv.{nivel}
            </span>
          </div>
        </div>
      </button>
      <button
        onClick={onCenter}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all text-lg"
        title="Ir al edificio"
      >
        ⌖
      </button>
    </div>
  )
}
