// Partie-Archiv: Die letzten Partien bleiben in localStorage erhalten,
// damit nichts verloren geht, sobald »Neue Partie« gedrückt wird.

export interface ArchivedGame {
  id: string
  /** ISO-Zeitpunkt des Partieendes bzw. der Archivierung. */
  date: string
  pgn: string
  white: string
  black: string
  /** "1-0" | "0-1" | "1/2-1/2" | "*" (abgebrochen/offen) */
  result: string
  moveCount: number
}

const KEY = 'schach.archive.v1'
const MAX_GAMES = 12

export function listGames(): ArchivedGame[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as ArchivedGame[]
  } catch {
    /* defektes Archiv ignorieren */
  }
  return []
}

/** Fügt eine Partie hinzu oder aktualisiert sie (gleiche id), neueste zuerst. */
export function upsertGame(game: ArchivedGame) {
  try {
    const games = listGames().filter((g) => g.id !== game.id)
    games.unshift(game)
    localStorage.setItem(KEY, JSON.stringify(games.slice(0, MAX_GAMES)))
  } catch {
    /* Speicher voll o. ä. – Archiv ist Komfort, kein Muss */
  }
}

export function newGameId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }
}
