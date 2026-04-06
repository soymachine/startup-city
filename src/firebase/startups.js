import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from './config'

const COLLECTION = 'startups'

export const NIVEL_INFO = {
  0: { label: 'Idea embrionaria', emoji: 'I',   color: '#9ca3af' },
  1: { label: 'Definiendo',       emoji: 'II',  color: '#60a5fa' },
  2: { label: 'Prototipo',        emoji: 'III', color: '#f59e0b' },
  3: { label: 'Beta privada',     emoji: 'IV',  color: '#a78bfa' },
  4: { label: 'Beta pública',     emoji: 'V',   color: '#34d399' },
  5: { label: 'Tracción',         emoji: 'VI',  color: '#f97316' },
  6: { label: 'Scale-up',         emoji: 'VII', color: '#e94560' },
}

export const ESTADO_INFO = {
  activo: { label: 'Activo', color: '#4ade80' },
  pausado: { label: 'Pausado', color: '#fbbf24' },
  pivotando: { label: 'Pivotando', color: '#60a5fa' },
  descartado: { label: 'Descartado', color: '#f87171' },
}

// Subscribe to all startups — calls onChange with the full list on every change
export function subscribeToStartups(onChange) {
  const q = query(collection(db, COLLECTION), orderBy('created_at', 'asc'))
  return onSnapshot(q, (snapshot) => {
    const startups = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    onChange(startups)
  })
}

export async function addStartup(data, userId) {
  return addDoc(collection(db, COLLECTION), {
    nombre: data.nombre || 'Nueva Startup',
    descripcion: data.descripcion || '',
    nivel: 0,
    estado: 'activo',
    orbital_radius: data.orbital_radius ?? 220,
    url: data.url || '',
    notas: data.notas || '',
    created_by: userId,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  })
}

export async function updateStartupOrbitalRadius(id, radius) {
  return updateDoc(doc(db, COLLECTION, id), {
    orbital_radius: radius,
    updated_at: serverTimestamp(),
  })
}

export async function updateStartup(id, data) {
  return updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updated_at: serverTimestamp(),
  })
}

export async function subirNivel(id, nivelActual) {
  if (nivelActual >= 6) return
  return updateDoc(doc(db, COLLECTION, id), {
    nivel: nivelActual + 1,
    updated_at: serverTimestamp(),
  })
}

export async function bajarNivel(id, nivelActual) {
  if (nivelActual <= 0) return
  return updateDoc(doc(db, COLLECTION, id), {
    nivel: nivelActual - 1,
    updated_at: serverTimestamp(),
  })
}

export async function deleteStartup(id) {
  return deleteDoc(doc(db, COLLECTION, id))
}

