import { fileStamp, shareOrDownload } from './download'

/** Bietet die Partie als .pgn-Datei zum Teilen/Speichern an. */
export async function downloadPgn(pgn: string, when?: Date) {
  await shareOrDownload(
    pgn,
    `schachpartie-${fileStamp(when)}.pgn`,
    'application/x-chess-pgn',
    'Schachpartie',
  )
}
