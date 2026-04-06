import { useState } from 'react'
import { addStartup } from '../firebase/startups'

export default function StartupForm({ userId, pos_x, pos_y, onClose }) {
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    url: '',
    notas: '',
    zona: 'centro',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim()) return
    setSaving(true)
    try {
      await addStartup({ ...form, pos_x, pos_y }, userId)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-city-accent">
        <h2 className="text-white font-bold text-lg">💡 Nueva Startup</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xl leading-none"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
        <p className="text-xs text-gray-400">
          Posición en el mapa: ({pos_x}, {pos_y})
        </p>

        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
            Nombre *
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full bg-city-bg border border-city-accent rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-city-neon"
            placeholder="Mi startup"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
            Descripción
          </label>
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            className="w-full bg-city-bg border border-city-accent rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-city-neon resize-none"
            placeholder="¿Qué problema resuelve?"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
            URL
          </label>
          <input
            type="url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            className="w-full bg-city-bg border border-city-accent rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-city-neon"
            placeholder="https://"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
            Zona
          </label>
          <select
            value={form.zona}
            onChange={(e) => setForm({ ...form, zona: e.target.value })}
            className="w-full bg-city-bg border border-city-accent rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-city-neon"
          >
            <option value="centro">Centro</option>
            <option value="norte">Norte</option>
            <option value="sur">Sur</option>
            <option value="este">Este</option>
            <option value="oeste">Oeste</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
            Notas iniciales
          </label>
          <textarea
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
            className="w-full bg-city-bg border border-city-accent rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-city-neon resize-none"
            placeholder="Ideas, hipótesis, TODOs..."
            rows={3}
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving || !form.nombre.trim()}
            className="w-full py-3 bg-city-neon hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
          >
            {saving ? 'Construyendo...' : '🏗️ Colocar en el mapa'}
          </button>
        </div>
      </form>
    </div>
  )
}
