export default function SettingsModal({ colors, onChange, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-space-panel border border-space-accent rounded-2xl p-6 w-80 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold tracking-widest text-sm uppercase">Ajustes de fondo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="space-y-5">
          <ColorRow
            label="Color central"
            value={colors.inner}
            onChange={(v) => onChange({ ...colors, inner: v })}
          />
          <ColorRow
            label="Color exterior"
            value={colors.outer}
            onChange={(v) => onChange({ ...colors, outer: v })}
          />
        </div>

        {/* Live preview */}
        <div
          className="mt-6 h-16 rounded-xl border border-white/10"
          style={{
            background: `radial-gradient(ellipse at 50% 50%, ${colors.inner} 0%, ${colors.outer} 100%)`,
          }}
        />

        <button
          onClick={() => onChange({ inner: '#1464c8', outer: '#03050f' })}
          className="mt-4 w-full text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Restaurar valores por defecto
        </button>
      </div>
    </div>
  )
}

function ColorRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm text-gray-300 flex-1">{label}</label>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 font-mono uppercase">{value}</span>
        <label className="cursor-pointer">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
            style={{ appearance: 'none', WebkitAppearance: 'none' }}
          />
        </label>
      </div>
    </div>
  )
}
