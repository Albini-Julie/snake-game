// Cache simple en mémoire pour les données statiques
const store = {}

export function getCached(key) {
  return store[key] ?? null
}

export function setCached(key, value) {
  store[key] = value
}