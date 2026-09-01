/**
 * Komplett-Backup aller SchachTrainer-Daten (alle Profile, Einstellungen,
 * Partien, Archiv, Lernpfad-Sterne) als JSON-Datei – zum Sichern oder zum
 * Umzug auf ein anderes Gerät.
 */
import { fileStamp, shareOrDownload } from './download'

const MARKER = 'SchachTrainer-Backup'

export function buildBackup(): string {
  const data: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('schach.')) data[key] = localStorage.getItem(key)!
  }
  return JSON.stringify(
    { app: MARKER, version: 1, exportedAt: new Date().toISOString(), data },
    null,
    2,
  )
}

export async function downloadBackup(): Promise<void> {
  await shareOrDownload(
    buildBackup(),
    `schachtrainer-backup-${fileStamp()}.json`,
    'application/json',
    'SchachTrainer-Backup',
  )
}

/**
 * Spielt ein Backup ein: Alle schach.*-Schlüssel auf dem Gerät werden durch
 * den Dateiinhalt ersetzt, danach lädt die App neu. Wirft bei ungültigen
 * Dateien einen Fehler mit verständlicher Meldung.
 */
export type BackupEntries = readonly (readonly [string, string])[]

/** Liest und prüft eine Backup-Datei, ohne etwas zu verändern. */
export async function readBackupFile(file: File): Promise<BackupEntries> {
  const text = await file.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Das ist keine gültige Backup-Datei (kein JSON).')
  }
  const obj = parsed as { app?: unknown; data?: unknown }
  if (obj?.app !== MARKER || typeof obj.data !== 'object' || obj.data === null) {
    throw new Error('Das ist keine SchachTrainer-Backup-Datei.')
  }
  const entries = Object.entries(obj.data as Record<string, unknown>).filter(
    (e): e is [string, string] => e[0].startsWith('schach.') && typeof e[1] === 'string',
  )
  if (entries.length === 0) {
    throw new Error('Die Backup-Datei enthält keine SchachTrainer-Daten.')
  }
  return entries
}

export async function importBackupFile(file: File): Promise<void> {
  applyBackup(await readBackupFile(file))
}

/** Ersetzt alle schach.*-Schlüssel durch die geprüften Einträge und lädt neu. */
export function applyBackup(entries: BackupEntries): void {
  // Bisherigen Stand merken, damit ein Fehler beim Schreiben (z. B. voller
  // Speicher) nicht mit halb gelöschten, halb importierten Daten endet.
  const previous = new Map<string, string>()
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('schach.')) previous.set(key, localStorage.getItem(key)!)
  }
  try {
    for (const key of previous.keys()) localStorage.removeItem(key)
    for (const [key, val] of entries) localStorage.setItem(key, val)
  } catch {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key?.startsWith('schach.')) localStorage.removeItem(key)
    }
    for (const [key, val] of previous) {
      try {
        localStorage.setItem(key, val)
      } catch {
        /* Wiederherstellung so weit wie möglich */
      }
    }
    throw new Error('Das Backup passt nicht in den Speicher des Browsers – nichts wurde verändert.')
  }
  location.reload()
}
