import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/config'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch {
      setError('Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-space-bg">
      {/* Starfield background */}
      <div className="absolute inset-0 overflow-hidden opacity-60 pointer-events-none">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width:   `${1 + (i % 3) * 0.5}px`,
              height:  `${1 + (i % 3) * 0.5}px`,
              left:    `${(i * 37 + 13) % 100}%`,
              top:     `${(i * 53 + 7) % 100}%`,
              opacity: 0.2 + (i % 7) * 0.1,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">✦</div>
          <h1
            className="text-2xl font-bold text-space-neon"
            style={{ fontFamily: '"Press Start 2P", monospace', lineHeight: 1.5 }}
          >
            STARTUP
            <br />
            SPACE
          </h1>
          <p className="mt-3 text-sm text-gray-400">Tu portfolio como sistema estelar</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-space-panel border border-space-accent rounded-xl p-6 shadow-2xl space-y-4"
        >
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-space-bg border border-space-accent rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-space-neon transition-colors"
              placeholder="tu@email.com"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-space-bg border border-space-accent rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-space-neon transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-space-neon text-xs text-center py-2 bg-red-900/20 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-space-neon hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors text-sm"
          >
            {loading ? 'Conectando...' : 'Entrar al sistema →'}
          </button>
        </form>
      </div>
    </div>
  )
}
