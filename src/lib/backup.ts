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
export async function importBackupFile(file: File): Promise<void> {
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
  const stale: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('schach.')) stale.push(key)
  }
  for (const key of stale) localStorage.removeItem(key)
  for (const [key, val] of Object.entries(obj.data as Record<string, unknown>)) {
    if (key.startsWith('schach.') && typeof val === 'string') localStorage.setItem(key, val)
  }
  location.reload()
}
