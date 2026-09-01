/** Gemeinsamer Datei-Export: mobil per Teilen-Dialog, sonst als Download. */

/** Zeitstempel für Dateinamen: Exporte am selben Tag bleiben unterscheidbar. */
export function fileStamp(when?: Date): string {
  const now = when ?? new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`
}

export async function shareOrDownload(
  content: string,
  filename: string,
  mime: string,
  title: string,
): Promise<void> {
  // Auf Mobilgeräten ist Teilen (z. B. per Messenger) praktischer als Download.
  if (typeof navigator.share === 'function' && typeof File === 'function') {
    try {
      const file = new File([content], filename, { type: mime })
      if (!navigator.canShare || navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title })
        return
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      // sonst: auf Download zurückfallen
    }
  }

  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
