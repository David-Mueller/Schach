/**
 * Profile: Jeder Spieler (z. B. Papa und Daniel) hat eigene Einstellungen,
 * laufende Partie, Partie-Archiv und Lernpfad-Fortschritt.
 *
 * Umsetzung mit möglichst wenig Eingriff in den Rest der App: Die Stores
 * lesen/schreiben weiterhin ihre gewohnten »Live-Schlüssel« im localStorage.
 * Beim Profilwechsel werden die Live-Schlüssel unter dem bisherigen Profil
 * abgelegt, die Daten des neuen Profils eingespielt und die Seite neu
 * geladen – kein Store braucht dadurch eigene Profil-Logik.
 */

const REG_KEY = 'schach.profiles.v1'

/** Alle profilgebundenen Live-Schlüssel der App. */
const DATA_KEYS = [
  'schach.settings.v1',
  'schach.game.v1',
  'schach.archive.v1',
  'schach.lernpfad.v1',
]

export const DEFAULT_PROFILE = 'Spieler 1'
export const MAX_PROFILES = 8
export const MAX_NAME_LENGTH = 20

interface Registry {
  active: string
  names: string[]
}

function loadRegistry(): Registry {
  try {
    const raw = localStorage.getItem(REG_KEY)
    if (raw) {
      const reg = JSON.parse(raw) as Registry
      if (Array.isArray(reg.names) && reg.names.length > 0 && typeof reg.active === 'string') {
        if (!reg.names.includes(reg.active)) reg.active = reg.names[0]!
        return reg
      }
    }
  } catch {
    /* defektes Register: unten neu anlegen */
  }
  // Erststart bzw. Bestand vor Einführung der Profile: Die vorhandenen
  // Live-Daten gehören automatisch dem Standardprofil.
  return { active: DEFAULT_PROFILE, names: [DEFAULT_PROFILE] }
}

function saveRegistry(reg: Registry) {
  try {
    localStorage.setItem(REG_KEY, JSON.stringify(reg))
  } catch {
    /* Speichern optional */
  }
}

/** Ablage-Schlüssel eines Live-Schlüssels unter einem Profil. */
function storeKey(profile: string, key: string): string {
  return `schach.profile.${encodeURIComponent(profile)}.${key}`
}

export function activeProfile(): string {
  return loadRegistry().active
}

export function listProfiles(): string[] {
  return [...loadRegistry().names]
}

export function normalizeName(raw: string): string {
  return raw.trim().slice(0, MAX_NAME_LENGTH)
}

/** Prüft, ob unter diesem Namen ein Profil angelegt werden kann. */
export function canCreate(raw: string): boolean {
  const name = normalizeName(raw)
  const reg = loadRegistry()
  return (
    name.length > 0 &&
    reg.names.length < MAX_PROFILES &&
    !reg.names.some((n) => n.toLowerCase() === name.toLowerCase())
  )
}

/** Live-Daten als Snapshot unter dem Profil ablegen. */
function stashLive(profile: string) {
  for (const key of DATA_KEYS) {
    const val = localStorage.getItem(key)
    if (val === null) localStorage.removeItem(storeKey(profile, key))
    else localStorage.setItem(storeKey(profile, key), val)
  }
}

/** Abgelegte Daten des Profils in die Live-Schlüssel einspielen. */
function restoreLive(profile: string) {
  for (const key of DATA_KEYS) {
    const val = localStorage.getItem(storeKey(profile, key))
    if (val === null) localStorage.removeItem(key)
    else localStorage.setItem(key, val)
  }
}

/** Neues Profil anlegen und direkt dorthin wechseln (startet frisch). */
export function createProfile(raw: string): boolean {
  const name = normalizeName(raw)
  if (!canCreate(name)) return false
  const reg = loadRegistry()
  stashLive(reg.active)
  reg.names.push(name)
  reg.active = name
  saveRegistry(reg)
  for (const key of DATA_KEYS) localStorage.removeItem(key)
  location.reload()
  return true
}

/** Zu einem bestehenden Profil wechseln (lädt die Seite neu). */
export function switchProfile(name: string) {
  const reg = loadRegistry()
  if (!reg.names.includes(name) || reg.active === name) return
  stashLive(reg.active)
  reg.active = name
  saveRegistry(reg)
  restoreLive(name)
  location.reload()
}

/** Profil samt aller Daten löschen. Das aktive Profil ist nicht löschbar. */
export function deleteProfile(name: string) {
  const reg = loadRegistry()
  if (name === reg.active || !reg.names.includes(name)) return
  reg.names = reg.names.filter((n) => n !== name)
  saveRegistry(reg)
  for (const key of DATA_KEYS) localStorage.removeItem(storeKey(name, key))
}
