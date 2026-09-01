/**
 * Alle localStorage-Schlüssel der App an einer Stelle. Die Profilverwaltung
 * (profiles.ts) tauscht genau diese Schlüssel beim Profilwechsel aus – ein
 * Schlüssel, der hier fehlt, würde stillschweigend von allen Profilen geteilt.
 */
export const SETTINGS_KEY = 'schach.settings.v1'
export const GAME_KEY = 'schach.game.v1'
export const ARCHIVE_KEY = 'schach.archive.v1'
export const LESSON_PROGRESS_KEY = 'schach.lernpfad.v1'
export const PROFILE_REGISTRY_KEY = 'schach.profiles.v1'

/** Profilgebundene Live-Schlüssel (Registry ist geräteweit). */
export const PROFILE_DATA_KEYS: readonly string[] = [
  SETTINGS_KEY,
  GAME_KEY,
  ARCHIVE_KEY,
  LESSON_PROGRESS_KEY,
]
