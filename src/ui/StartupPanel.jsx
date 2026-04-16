import { useState, useRef, useEffect } from 'react'
import {
  updateStartup, subirNivel, bajarNivel,
  archiveStartup, restoreStartup, deleteStartup,
  addBitacoraEntry,
  NIVEL_INFO, ESTADO_INFO,
} from '../firebase/startups'

function formatRelDate(fecha) {
  if (!fecha) return ''
  const date = fecha.toDate ? fecha.toDate() : new Date(fecha)
  const diff = Date.now() - date.getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'ahora'
  if (mins  < 60) return `hace ${mins}m`
  if (hours < 24) return `hace ${hours}h`
  if (days  < 7)  return `hace ${days}d`
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: days > 365 ? 'numeric' : undefined })
}

export default function StartupPanel({ startup, onClose }) {
  const [editing, setEditing]           = useState(false)
  const [form, setForm]                 = useState({
    nombre: startup.nombre,
    descripcion: startup.descripcion,
    estado: startup.estado,
    url: startup.url,
    notas: startup.notas,
  })
  const [saving, setSaving]             = useState(false)
  const [confirmAction, setConfirmAction] = useState(null) // 'archive' | 'delete'
  const [bitacoraText, setBitacoraText] = useState('')
  const [addingEntry, setAddingEntry]   = useState(false)
  const bitacoraRef                     = useRef(null)

  // Keep form in sync when startup data changes externally
  useEffect(() => {
    if (!editing) {
      setForm({
        nombre: startup.nombre,
        descripcion: startup.descripcion,
        estado: startup.estado,
        url: startup.url,
        notas: startup.notas,
      })
    }
  }, [startup, editing])

  const nivel     = startup.nivel ?? 0
  const nivelInfo = NIVEL_INFO[nivel]
  const estadoInfo = ESTADO_INFO[startup.estado] ?? ESTADO_INFO.activo
  const isArchived = !!startup.archived

  // nivel_history sorted ascending; bitácora sorted descending (newest first)
  const nivelHistory = [...(startup.nivel_history ?? [])].sort(
    (a, b) => (a.fecha?.seconds ?? 0) - (b.fecha?.seconds ?? 0)
  )
  const bitacora = [...(startup.bitacora ?? [])].sort(
    (a, b) => (b.fecha?.seconds ?? 0) - (a.fecha?.seconds ?? 0)
  )

  async function handleSave() {
    setSaving(true)
    try {
      await updateStartup(startup.id, form)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleAddBitacora() {
    if (!bitacoraText.trim()) return
    setAddingEntry(true)
    try {
      await addBitacoraEntry(startup.id, bitacoraText)
      setBitacoraText('')
    } finally {
      setAddingEntry(false)
    }
  }

  async function handleConfirm() {
    if (confirmAction === 'archive') {
      await archiveStartup(startup.id)
      onClose()
    } else if (confirmAction === 'restore') {
      await restoreStartup(startup.id)
      setConfirmAction(null)
    } else if (confirmAction === 'delete') {
      await deleteStartup(startup.id)
      onClose()
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-space-accent">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold tracking-widest" style={{ color: nivelInfo.color }}>{nivelInfo.emoji}</span>
            {editing ? (
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="flex-1 bg-space-bg border border-space-accent rounded px-2 py-1 text-white text-sm"
              />
            ) : (
              <h2 className="text-white font-bold text-lg truncate">{startup.nombre}</h2>
            )}
            {isArchived && (
              <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">archivada</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: nivelInfo.color + '33', color: nivelInfo.color }}
            >
              Nivel {nivel} · {nivelInfo.label}
            </span>
            {editing ? (
              <select
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                className="text-xs bg-space-bg border border-space-accent rounded px-2 py-0.5 text-white"
              >
                {Object.entries(ESTADO_INFO).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            ) : (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: estadoInfo.color + '22', color: estadoInfo.color }}
              >
                {estadoInfo.label}
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white text-xl leading-none">×</button>
      </div>

      {/* Level controls */}
      <div className="p-4 border-b border-space-accent">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Nivel del planeta</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => bajarNivel(startup.id, nivel)}
            disabled={nivel <= 0 || isArchived}
            className="flex-1 py-2 bg-space-accent hover:bg-space-accent/80 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            ↓ Bajar
          </button>
          <div className="flex-shrink-0 text-center">
            <div className="text-xl font-bold tracking-widest" style={{ color: nivelInfo.color }}>{nivelInfo.emoji}</div>
            <div className="text-xs text-gray-400">{nivel}/6</div>
          </div>
          <button
            onClick={() => subirNivel(startup.id, nivel)}
            disabled={nivel >= 6 || isArchived}
            className="flex-1 py-2 bg-space-neon hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors font-bold"
          >
            ↑ Subir
          </button>
        </div>
        <div className="mt-3 bg-space-bg rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${(nivel / 6) * 100}%`, backgroundColor: nivelInfo.color }}
          />
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">

        {/* Trayectoria de nivel */}
        {nivelHistory.length > 0 && (
          <div className="px-4 pt-4 pb-3 border-b border-space-accent/50">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Trayectoria</p>
            <div className="flex items-start gap-0 overflow-x-auto pb-1">
              {nivelHistory.map((entry, i) => {
                const info = NIVEL_INFO[entry.nivel]
                return (
                  <div key={i} className="flex items-start flex-shrink-0">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 flex-shrink-0"
                        style={{ borderColor: info.color, color: info.color, backgroundColor: info.color + '22' }}
                      >
                        {info.emoji}
                      </div>
                      <span className="text-gray-600 text-xs mt-1 whitespace-nowrap">
                        {formatRelDate(entry.fecha)}
                      </span>
                    </div>
                    {i < nivelHistory.length - 1 && (
                      <div className="w-4 h-px mt-3.5 flex-shrink-0" style={{ backgroundColor: NIVEL_INFO[nivelHistory[i + 1].nivel].color + '60' }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Details */}
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Descripción</label>
            {editing ? (
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                className="w-full bg-space-bg border border-space-accent rounded px-3 py-2 text-white text-sm resize-none"
                rows={3}
              />
            ) : (
              <p className="text-gray-300 text-sm">{startup.descripcion || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">URL</label>
            {editing ? (
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="w-full bg-space-bg border border-space-accent rounded px-3 py-2 text-white text-sm"
                placeholder="https://"
              />
            ) : startup.url ? (
              <a href={startup.url} target="_blank" rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm underline break-all">
                {startup.url}
              </a>
            ) : (
              <p className="text-gray-500 text-sm">—</p>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Notas</label>
            {editing ? (
              <textarea
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                className="w-full bg-space-bg border border-space-accent rounded px-3 py-2 text-white text-sm resize-none"
                rows={3}
                placeholder="Ideas, TODOs, links..."
              />
            ) : (
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{startup.notas || '—'}</p>
            )}
          </div>
        </div>

        {/* Bitácora */}
        <div className="px-4 pb-4 border-t border-space-accent/50 pt-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Bitácora</p>

          {/* New entry */}
          {!isArchived && (
            <div className="mb-4" ref={bitacoraRef}>
              <textarea
                value={bitacoraText}
                onChange={(e) => setBitacoraText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddBitacora() }}
                className="w-full bg-space-bg border border-space-accent rounded px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-space-neon transition-colors"
                rows={2}
                placeholder="¿Qué ha pasado hoy?  (⌘↵ para guardar)"
              />
              <button
                onClick={handleAddBitacora}
                disabled={!bitacoraText.trim() || addingEntry}
                className="mt-1.5 w-full py-1.5 bg-space-accent hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 hover:text-white text-xs rounded transition-colors"
              >
                {addingEntry ? 'Guardando...' : '+ Añadir entrada'}
              </button>
            </div>
          )}

          {/* Entry list */}
          {bitacora.length === 0 ? (
            <p className="text-gray-600 text-xs italic">Sin entradas aún.</p>
          ) : (
            <div className="space-y-3">
              {bitacora.map((entry, i) => (
                <div key={i} className="group">
                  <span className="text-xs text-gray-600">{formatRelDate(entry.fecha)}</span>
                  <p className="text-gray-300 text-sm mt-0.5 leading-relaxed whitespace-pre-wrap">{entry.texto}</p>
                  {i < bitacora.length - 1 && <div className="mt-3 border-t border-space-accent/30" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions footer */}
      <div className="p-4 border-t border-space-accent space-y-2">
        {editing ? (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 py-2 border border-space-accent text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 bg-space-green hover:bg-green-400 disabled:opacity-50 text-black font-bold rounded-lg text-sm transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        ) : (
          !isArchived && (
            <button
              onClick={() => setEditing(true)}
              className="w-full py-2 border border-space-accent hover:border-white text-gray-300 hover:text-white rounded-lg text-sm transition-colors"
            >
              Editar datos
            </button>
          )
        )}

        {!editing && (
          confirmAction ? (
            <div className="space-y-2">
              <p className="text-xs text-center text-gray-400">
                {confirmAction === 'archive' && '¿Archivar esta startup?'}
                {confirmAction === 'restore' && '¿Restaurar esta startup?'}
                {confirmAction === 'delete'  && '¿Eliminar permanentemente? No hay vuelta atrás.'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 py-2 border border-space-accent text-gray-400 rounded-lg text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold text-white ${
                    confirmAction === 'delete' ? 'bg-red-700 hover:bg-red-600' : 'bg-space-accent hover:bg-white/20'
                  }`}
                >
                  Confirmar
                </button>
              </div>
            </div>
          ) : isArchived ? (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmAction('restore')}
                className="flex-1 py-2 border border-space-accent text-gray-300 hover:text-white rounded-lg text-sm transition-colors"
              >
                Restaurar
              </button>
              <button
                onClick={() => setConfirmAction('delete')}
                className="flex-1 py-2 text-red-500 hover:text-red-400 border border-red-900 hover:border-red-700 rounded-lg text-sm transition-colors"
              >
                Eliminar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmAction('archive')}
              className="w-full py-2 text-gray-500 hover:text-gray-300 text-xs transition-colors"
            >
              Archivar startup
            </button>
          )
        )}
      </div>
    </div>
  )
}
