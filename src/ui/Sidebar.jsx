import { useState, useMemo } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { NIVEL_INFO, ESTADO_INFO } from '../firebase/startups'
import { VERSION } from '../version'

const ESTADOS = ['todos', ...Object.keys(ESTADO_INFO)]

export default function Sidebar({ user, startups, onSelectStartup, onCenterOn }) {
  const [filtroEstado, setFiltroEstado]   = useState('todos')
  const [busqueda, setBusqueda]           = useState('')
  const [collapsed, setCollapsed]         = useState(false)
  const [sortDir, setSortDir]             = useState(null) // null | 'asc' | 'desc'
  const [showArchived, setShowArchived]   = useState(false)

  const active   = useMemo(() => startups.filter((s) => !s.archived), [startups])
  const archived = useMemo(() => startups.filter((s) =>  s.archived), [startups])

  const pool = showArchived ? archived : active

  const filtered = useMemo(() => {
    const list = pool.filter((s) => {
      const matchEstado   = filtroEstado === 'todos' || s.estado === filtroEstado
      const matchBusqueda = !busqueda || s.nombre.toLowerCase().includes(busqueda.toLowerCase())
      return matchEstado && matchBusqueda
    })
    if (sortDir === 'asc')  return [...list].sort((a, b) => (a.nivel ?? 0) - (b.nivel ?? 0))
    if (sortDir === 'desc') return [...list].sort((a, b) => (b.nivel ?? 0) - (a.nivel ?? 0))
    return list
  }, [pool, filtroEstado, busqueda, sortDir])

  if (collapsed) {
    return (
      <div className="w-12 bg-space-panel border-r border-space-accent flex flex-col items-center py-4 gap-4">
        <button onClick={() => setCollapsed(false)} className="text-gray-400 hover:text-white text-lg" title="Expandir">→</button>
        <div className="text-space-neon text-xs font-bold" style={{ writingMode: 'vertical-rl' }}>
          {active.length} startups
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
            <span className="text-xl text-yellow-400">✦</span>
            <span className="text-yellow-400 font-bold text-sm tracking-widest">STARTUPSPACE</span>
          </div>
          <button onClick={() => setCollapsed(true)} className="text-gray-500 hover:text-white text-sm">←</button>
        </div>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
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
        <div className="flex items-center justify-between gap-2">
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
          <button
            onClick={() => setSortDir((d) => d === null ? 'asc' : d === 'asc' ? 'desc' : null)}
            className={`flex-shrink-0 text-xs px-2 py-1 rounded-full transition-colors whitespace-nowrap ${
              sortDir ? 'bg-space-neon text-white' : 'bg-space-accent text-gray-400 hover:text-white'
            }`}
            title="Ordenar por nivel"
          >
            Nv {sortDir === 'asc' ? '↑' : sortDir === 'desc' ? '↓' : '↕'}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            {pool.length === 0
              ? showArchived
                ? 'No hay startups archivadas'
                : 'Click en el espacio para añadir tu primera startup'
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

      {/* Archive toggle */}
      {archived.length > 0 && (
        <div className="border-t border-space-accent/50">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <span>{showArchived ? '← Volver a activas' : `Archivadas (${archived.length})`}</span>
            <span>{showArchived ? '' : '📁'}</span>
          </button>
        </div>
      )}

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
  const isArchived = !!startup.archived

  return (
    <div className={`group flex items-center gap-3 px-3 py-2.5 hover:bg-space-accent/50 cursor-pointer border-b border-space-accent/30 transition-colors ${isArchived ? 'opacity-50' : ''}`}>
      <button className="flex-1 flex items-center gap-3 min-w-0 text-left" onClick={onSelect}>
        <span className="text-sm font-bold tracking-widest flex-shrink-0 w-7 text-center" style={{ color: nivelInfo.color }}>{nivelInfo.emoji}</span>
        <div className="min-w-0">
          <p className={`text-sm font-medium truncate ${isArchived ? 'text-gray-500 line-through' : 'text-white'}`}>{startup.nombre}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs" style={{ color: estadoInfo.color }}>{estadoInfo.label}</span>
            <span className="text-gray-600 text-xs">·</span>
            <span className="text-xs" style={{ color: nivelInfo.color }}>Nv.{nivel}</span>
          </div>
        </div>
      </button>
      {!isArchived && (
        <button
          onClick={onCenter}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all text-lg"
          title="Centrar en planeta"
        >⊙</button>
      )}
    </div>
  )
}
