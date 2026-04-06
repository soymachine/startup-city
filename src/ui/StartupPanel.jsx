import { useState } from 'react'
import { updateStartup, subirNivel, bajarNivel, deleteStartup, NIVEL_INFO, ESTADO_INFO } from '../firebase/startups'

export default function StartupPanel({ startup, onClose }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    nombre: startup.nombre,
    descripcion: startup.descripcion,
    estado: startup.estado,
    url: startup.url,
    notas: startup.notas,
  })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const nivel = startup.nivel ?? 0
  const nivelInfo = NIVEL_INFO[nivel]
  const estadoInfo = ESTADO_INFO[startup.estado] ?? ESTADO_INFO.activo

  async function handleSave() {
    setSaving(true)
    try {
      await updateStartup(startup.id, form)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleSubir() {
    await subirNivel(startup.id, nivel)
  }

  async function handleBajar() {
    await bajarNivel(startup.id, nivel)
  }

  async function handleDelete() {
    await deleteStartup(startup.id)
    onClose()
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
          </div>
          <div className="flex items-center gap-2">
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
        <button
          onClick={onClose}
          className="ml-2 text-gray-400 hover:text-white text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Level controls */}
      <div className="p-4 border-b border-space-accent">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Nivel del planeta</p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBajar}
            disabled={nivel <= 0}
            className="flex-1 py-2 bg-space-accent hover:bg-space-accent/80 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            ↓ Bajar
          </button>
          <div className="flex-shrink-0 text-center">
            <div className="text-xl font-bold tracking-widest" style={{ color: nivelInfo.color }}>{nivelInfo.emoji}</div>
            <div className="text-xs text-gray-400">{nivel}/6</div>
          </div>
          <button
            onClick={handleSubir}
            disabled={nivel >= 6}
            className="flex-1 py-2 bg-space-neon hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors font-bold"
          >
            ↑ Subir
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3 bg-space-bg rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${(nivel / 6) * 100}%`,
              backgroundColor: nivelInfo.color,
            }}
          />
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
            Descripción
          </label>
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
          <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
            URL
          </label>
          {editing ? (
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full bg-space-bg border border-space-accent rounded px-3 py-2 text-white text-sm"
              placeholder="https://"
            />
          ) : startup.url ? (
            <a
              href={startup.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm underline break-all"
            >
              {startup.url}
            </a>
          ) : (
            <p className="text-gray-500 text-sm">—</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
            Notas
          </label>
          {editing ? (
            <textarea
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              className="w-full bg-space-bg border border-space-accent rounded px-3 py-2 text-white text-sm resize-none"
              rows={4}
              placeholder="Ideas, TODOs, links..."
            />
          ) : (
            <p className="text-gray-300 text-sm whitespace-pre-wrap">{startup.notas || '—'}</p>
          )}
        </div>
      </div>

      {/* Actions */}
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
          <button
            onClick={() => setEditing(true)}
            className="w-full py-2 border border-space-accent hover:border-white text-gray-300 hover:text-white rounded-lg text-sm transition-colors"
          >
            Editar datos
          </button>
        )}

        {!editing && (
          confirmDelete ? (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 border border-space-accent text-gray-400 rounded-lg text-sm"
              >
                No
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm font-bold"
              >
                Sí, eliminar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full py-2 text-red-500 hover:text-red-400 text-xs transition-colors"
            >
              Eliminar startup
            </button>
          )
        )}
      </div>
    </div>
  )
}
