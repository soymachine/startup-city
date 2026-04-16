import { useState, useEffect, useRef, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase/config'
import { subscribeToStartups, updateStartupOrbitalRadius } from './firebase/startups'
import Login from './ui/Login'
import Sidebar from './ui/Sidebar'
import StartupPanel from './ui/StartupPanel'
import StartupForm from './ui/StartupForm'
import SettingsModal from './ui/SettingsModal'
import PhaserGame from './game/PhaserGame'

export default function App() {
  const [user, setUser]               = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [startups, setStartups]       = useState([])
  const [selected, setSelected]       = useState(null)
  const [newOrbit, setNewOrbit]       = useState(null)   // orbital_radius for new startup
  const [notification, setNotification] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [bgColors, setBgColors]         = useState({ inner: '#03152b', outer: '#03050f' })
  const phaserRef    = useRef(null)
  const prevStartups = useRef([])

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!user) return
    const unsub = subscribeToStartups((incoming) => {
      const prev = prevStartups.current
      for (const s of incoming) {
        const old = prev.find((p) => p.id === s.id)
        if (old && s.nivel > old.nivel && s.created_by !== user.uid) {
          showNotification(`🚀 ${s.nombre} subió al nivel ${s.nivel}!`)
        }
      }
      prevStartups.current = incoming
      setStartups(incoming)
      const active = incoming.filter((s) => !s.archived)
      phaserRef.current?.syncStartups(active, handlePlanetSelect, handleOrbitClick)
      setSelected((prev) => {
        if (!prev) return null
        return incoming.find((s) => s.id === prev.id) ?? null
      })
    })
    return unsub
  }, [user]) // eslint-disable-line

  useEffect(() => {
    const active = startups.filter((s) => !s.archived)
    phaserRef.current?.syncStartups(active, handlePlanetSelect, handleOrbitClick)
  }, [startups]) // eslint-disable-line

  function showNotification(msg) {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  const handlePlanetSelect = useCallback((startup) => {
    setNewOrbit(null)
    setSelected(startup)
  }, [])

  const handleOrbitClick = useCallback((radius) => {
    setSelected(null)
    setNewOrbit(radius)
  }, [])

  const handleStartupOrbit = useCallback(async (id, radius) => {
    try {
      await updateStartupOrbitalRadius(id, radius)
    } catch (e) {
      console.error('Orbit update failed', e)
    }
  }, [])

  const handleCenterOn = useCallback((id) => {
    phaserRef.current?.centerOn(id)
  }, [])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-space-bg text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">✦</div>
          <p className="text-gray-400 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <div className="flex h-screen bg-space-bg overflow-hidden">
      <Sidebar
        user={user}
        startups={startups}
        onSelectStartup={(s) => { setNewOrbit(null); setSelected(s) }}
        onCenterOn={handleCenterOn}
      />

      <div className="flex-1 relative">
        <PhaserGame
          ref={phaserRef}
          onPlanetSelect={handlePlanetSelect}
          onOrbitClick={handleOrbitClick}
          onStartupOrbit={handleStartupOrbit}
          gradientInner={bgColors.inner}
          gradientOuter={bgColors.outer}
        />

        {/* Settings button */}
        <button
          onClick={() => setShowSettings(true)}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all backdrop-blur-sm border border-white/10"
          title="Ajustes de fondo"
        >
          ⚙
        </button>

        {startups.length === 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none text-center">
            <div className="bg-space-panel/80 backdrop-blur border border-space-accent rounded-xl px-6 py-4 text-sm text-gray-300">
              <p className="font-bold text-white mb-1">Bienvenido a Startupspace ✦</p>
              <p>Click en el espacio para añadir tu primera startup</p>
            </div>
          </div>
        )}

        {notification && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-space-panel border border-space-gold text-space-gold px-4 py-2 rounded-lg text-sm shadow-xl animate-bounce">
            {notification}
          </div>
        )}

        <div className="absolute bottom-4 left-4 z-10 text-xs text-gray-600 pointer-events-none">
          Rueda: zoom · Drag: navegar · Click planeta: editar · Drag planeta: cambiar órbita
        </div>
      </div>

      {(selected || newOrbit !== null) && (
        <div className="w-80 bg-space-panel border-l border-space-accent overflow-hidden flex flex-col">
          {selected && (
            <StartupPanel startup={selected} onClose={() => setSelected(null)} />
          )}
          {newOrbit !== null && !selected && (
            <StartupForm
              userId={user.uid}
              orbital_radius={newOrbit}
              onClose={() => setNewOrbit(null)}
            />
          )}
        </div>
      )}
      {showSettings && (
        <SettingsModal
          colors={bgColors}
          onChange={setBgColors}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
