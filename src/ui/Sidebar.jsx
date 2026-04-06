import { useState, useMemo } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { NIVEL_INFO, ESTADO_INFO } from '../firebase/startups'
import { VERSION } from '../version'

const ESTADOS = ['todos', ...Object.keys(ESTADO_INFO)]

export default function Sidebar({ user, startups, onSelectStartup, onCenterOn }) {
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [busqueda, setBusqueda]         = useState('')
  const [collapsed, setCollapsed]       = useState(false)

  const filtered = useMemo(() => {
    return startups.filter((s) => {
      const matchEstado   = filtroEstado === 'todos' || s.estado === filtroEstado
      const matchBusqueda = !busqueda || s.nombre.toLowerCase().includes(busqueda.toLowerCase())
      return matchEstado && matchBusqueda
    })
  }, [startups, filtroEstado, busqueda])

  const stats = useMemo(() => ({
    total:    startups.length,
    activos:  startups.filter((s) => s.estado === 'activo').length,
    maxNivel: startups.reduce((max, s) => Math.max(max, s.nivel ?? 0), 0),
  }), [startups])

  if (collapsed) {
    return (
      <div className="w-12 bg-space-panel border-r border-space-accent flex flex-col items-center py-4 gap-4">
        <button onClick={() => setCollapsed(false)} className="text-gray-400 hover:text-white text-lg" title="Expandir">→</button>
        <div className="text-space-neon text-xs font-bold" style={{ writingMode: 'vertical-rl' }}>
          {stats.total} startups
        </div>
      </div>
    )
  }

  return (
    <div className="w-72 bg-space-panel border-r border-space-accent flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-space-accent">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">✦</span>
            <span className="text-white font-bold text-sm">STARTUPSPACE</span>
          </div>
          <button onClick={() => setCollapsed(true)} className="text-gray-500 hover:text-white text-sm">←</button>
        </div>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-space-accent">
        <div className="bg-space-panel p-3 text-center">
          <div className="text-xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-400">Total</div>
        </div>
        <div className="bg-space-panel p-3 text-center">
          <div className="text-xl font-bold text-space-green">{stats.activos}</div>
          <div className="text-xs text-gray-400">Activas</div>
        </div>
        <div className="bg-space-panel p-3 text-center">
          <div className="text-xl font-bold text-space-gold">
            {NIVEL_INFO[stats.maxNivel]?.emoji ?? 'I'}
          </div>
          <div className="text-xs text-gray-400">Max nivel</div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-3 space-y-2 border-b border-space-accent">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar..."
          className="w-full bg-space-bg border border-space-accent rounded px-3 py-1.5 text-white text-xs focus:outline-none focus:border-space-neon"
        />
        <div className="flex gap-1 flex-wrap">
          {ESTADOS.map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`text-xs px-2 py-1 rounded-full transition-colors ${
                filtroEstado === estado
                  ? 'bg-space-neon text-white'
                  : 'bg-space-accent text-gray-400 hover:text-white'
              }`}
            >
              {estado === 'todos' ? 'Todos' : ESTADO_INFO[estado].label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            {startups.length === 0
              ? 'Click en el espacio para añadir tu primera startup'
              : 'No hay startups con estos filtros'}
          </div>
        ) : (
          filtered.map((startup) => (
            <StartupRow
              key={startup.id}
              startup={startup}
              onSelect={() => onSelectStartup(startup)}
              onCenter={() => onCenterOn(startup.id)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-space-accent space-y-2">
        <button onClick={() => signOut(auth)} className="w-full text-xs text-gray-500 hover:text-gray-300 transition-colors">
          Cerrar sesión
        </button>
        <p className="text-center text-xs text-gray-700 select-none">{VERSION}</p>
      </div>
    </div>
  )
}

function StartupRow({ startup, onSelect, onCenter }) {
  const nivel      = startup.nivel ?? 0
  const nivelInfo  = NIVEL_INFO[nivel]
  const estadoInfo = ESTADO_INFO[startup.estado] ?? ESTADO_INFO.activo

  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 hover:bg-space-accent/50 cursor-pointer border-b border-space-accent/30 transition-colors">
      <button className="flex-1 flex items-center gap-3 min-w-0 text-left" onClick={onSelect}>
        <span className="text-sm font-bold tracking-widest flex-shrink-0 w-7 text-center" style={{ color: nivelInfo.color }}>{nivelInfo.emoji}</span>
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{startup.nombre}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs" style={{ color: estadoInfo.color }}>{estadoInfo.label}</span>
            <span className="text-gray-600 text-xs">·</span>
            <span className="text-xs" style={{ color: nivelInfo.color }}>Nv.{nivel}</span>
          </div>
        </div>
      </button>
      <button
        onClick={onCenter}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all text-lg"
        title="Centrar en planeta"
      >⊙</button>
    </div>
  )
}
