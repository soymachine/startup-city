import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/config'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      setError('Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-city-bg">
      {/* Animated background tiles */}
      <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-16 h-8 border border-city-neon"
            style={{
              left: `${(i % 5) * 20}%`,
              top: `${Math.floor(i / 5) * 25}%`,
              transform: `rotate(${i % 2 === 0 ? '0' : '45'}deg)`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏙️</div>
          <h1
            className="text-2xl font-bold text-city-neon"
            style={{ fontFamily: '"Press Start 2P", monospace', lineHeight: 1.5 }}
          >
            STARTUP
            <br />
            CITY
          </h1>
          <p className="mt-3 text-sm text-gray-400">Tu portfolio como ciudad</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-city-panel border border-city-accent rounded-xl p-6 shadow-2xl space-y-4"
        >
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-city-bg border border-city-accent rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-city-neon transition-colors"
              placeholder="tu@email.com"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-city-bg border border-city-accent rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-city-neon transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-city-neon text-xs text-center py-2 bg-red-900/20 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-city-neon hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors text-sm"
          >
            {loading ? 'Entrando...' : 'Entrar a la ciudad →'}
          </button>
        </form>
      </div>
    </div>
  )
}
