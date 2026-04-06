import { useState, useEffect, useRef, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase/config'
import { subscribeToStartups } from './firebase/startups'
import Login from './ui/Login'
import Sidebar from './ui/Sidebar'
import StartupPanel from './ui/StartupPanel'
import StartupForm from './ui/StartupForm'
import Minimap from './ui/Minimap'
import PhaserGame from './game/PhaserGame'

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [startups, setStartups] = useState([])
  const [selectedStartup, setSelectedStartup] = useState(null)
  const [newPos, setNewPos] = useState(null) // {col, row} for new startup form
  const [notification, setNotification] = useState(null)
  const phaserRef = useRef(null)
  const prevStartupsRef = useRef([])

  // Auth listener
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthLoading(false)
    })
  }, [])

  // Firestore listener
  useEffect(() => {
    if (!user) return
    const unsub = subscribeToStartups((incoming) => {
      // Detect level-ups and notify
      const prev = prevStartupsRef.current
      for (const s of incoming) {
        const old = prev.find((p) => p.id === s.id)
        if (old && s.nivel > old.nivel && s.created_by !== user.uid) {
          showNotification(`🚀 ${s.nombre} subió al nivel ${s.nivel}!`)
        }
      }
      prevStartupsRef.current = incoming
      setStartups(incoming)

      // Sync with Phaser
      if (phaserRef.current) {
        phaserRef.current.syncStartups(incoming, handleBuildingSelect, handleEmptyTile)
      }

      // Update selected startup if open
      setSelectedStartup((prev) => {
        if (!prev) return null
        return incoming.find((s) => s.id === prev.id) ?? null
      })
    })
    return unsub
  }, [user])

  // Sync Phaser whenever startups change (also handles scene ready after initial load)
  useEffect(() => {
    if (phaserRef.current && startups.length > 0) {
      phaserRef.current.syncStartups(startups, handleBuildingSelect, handleEmptyTile)
    }
  }, [startups])

  function showNotification(msg) {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  const handleBuildingSelect = useCallback((startup) => {
    setNewPos(null)
    setSelectedStartup(startup)
  }, [])

  const handleEmptyTile = useCallback((col, row) => {
    // Check if there's already a building at this position
    const occupied = startups.some((s) => s.pos_x === col && s.pos_y === row)
    if (occupied) return
    setSelectedStartup(null)
    setNewPos({ col, row })
  }, [startups])

  const handleCenterOn = useCallback((col, row) => {
    phaserRef.current?.centerOn(col, row)
  }, [])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-city-bg text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">🏙️</div>
          <p className="text-gray-400 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <div className="flex h-screen bg-city-bg overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        user={user}
        startups={startups}
        onSelectStartup={(s) => {
          setNewPos(null)
          setSelectedStartup(s)
        }}
        onCenterOn={handleCenterOn}
        otherOnline={false}
      />

      {/* Main canvas area */}
      <div className="flex-1 relative">
        <PhaserGame
          ref={phaserRef}
          onBuildingSelect={handleBuildingSelect}
          onEmptyTileClick={handleEmptyTile}
        />

        {/* Minimap */}
        <div className="absolute bottom-4 right-4 z-10">
          <Minimap startups={startups} />
        </div>

        {/* Help hint */}
        {startups.length === 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none text-center">
            <div className="bg-city-panel/80 backdrop-blur border border-city-accent rounded-xl px-6 py-4 text-sm text-gray-300">
              <p className="font-bold text-white mb-1">Bienvenido a Startup City 🏙️</p>
              <p>Haz click en cualquier solar del mapa para añadir tu primera startup</p>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-city-panel border border-city-gold text-city-gold px-4 py-2 rounded-lg text-sm shadow-xl animate-bounce">
            {notification}
          </div>
        )}

        {/* Zoom hint */}
        <div className="absolute bottom-4 left-4 z-10 text-xs text-gray-600 pointer-events-none">
          Rueda: zoom · Drag: mover · Click edificio: editar
        </div>
      </div>

      {/* Right panel — startup detail or new startup form */}
      {(selectedStartup || newPos) && (
        <div className="w-80 bg-city-panel border-l border-city-accent overflow-hidden flex flex-col">
          {selectedStartup && (
            <StartupPanel
              startup={selectedStartup}
              onClose={() => setSelectedStartup(null)}
            />
          )}
          {newPos && !selectedStartup && (
            <StartupForm
              userId={user.uid}
              pos_x={newPos.col}
              pos_y={newPos.row}
              onClose={() => setNewPos(null)}
            />
          )}
        </div>
      )}
    </div>
  )
}
