import { useState } from 'react'
import { addStartup } from '../firebase/startups'

export default function StartupForm({ userId, onClose }) {
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    url: '',
    notas: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim()) return
    setSaving(true)
    try {
      await addStartup({ ...form }, userId)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-space-accent">
        <div>
          <h2 className="text-white font-bold text-lg">✦ Nueva Startup</h2>
          <p className="text-xs text-gray-500 mt-0.5">Empezará en órbita interior · Nivel I</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">

        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Nombre *</label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full bg-space-bg border border-space-accent rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-space-neon"
            placeholder="Mi startup"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Descripción</label>
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            className="w-full bg-space-bg border border-space-accent rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-space-neon resize-none"
            placeholder="¿Qué problema resuelve?"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">URL</label>
          <input
            type="url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            className="w-full bg-space-bg border border-space-accent rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-space-neon"
            placeholder="https://"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Notas iniciales</label>
          <textarea
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
            className="w-full bg-space-bg border border-space-accent rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-space-neon resize-none"
            placeholder="Ideas, hipótesis, TODOs..."
            rows={3}
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving || !form.nombre.trim()}
            className="w-full py-3 bg-space-neon hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
          >
            {saving ? 'Lanzando...' : '🚀 Lanzar al espacio'}
          </button>
        </div>
      </form>
    </div>
  )
}
