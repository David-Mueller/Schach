/** Bietet die Partie als .pgn-Datei zum Teilen/Speichern an. */
export async function downloadPgn(pgn: string, when?: Date) {
  // Datum UND Uhrzeit im Namen: Mehrere Exporte am selben Tag dürfen sich
  // nicht überschreiben/verwechseln lassen.
  const now = when ?? new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`
  const filename = `schachpartie-${stamp}.pgn`

  // Auf Mobilgeräten ist Teilen (z. B. per Messenger) praktischer als Download.
  if (typeof navigator.share === 'function' && typeof File === 'function') {
    try {
      const file = new File([pgn], filename, { type: 'application/x-chess-pgn' })
      if (!navigator.canShare || navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Schachpartie' })
        return
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      // sonst: auf Download zurückfallen
    }
  }

  const blob = new Blob([pgn], { type: 'application/x-chess-pgn' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
