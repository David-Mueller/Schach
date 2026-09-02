// Kleine, per WebAudio synthetisierte Sounds – keine Asset-Dateien nötig,
// funktioniert damit garantiert offline und ohne Lizenzfragen.

let ctx: AudioContext | null = null

function audioCtx(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext()
    if (ctx.state !== 'running') {
      // 'suspended' (noch keine Nutzergeste) oder 'interrupted' (iOS nach Anruf/
      // Hintergrund): wecken, aber jetzt nichts einplanen – sonst feuern alle
      // aufgestauten Töne beim ersten Tipp auf einmal los.
      void ctx.resume()
      return null
    }
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, durationMs: number, opts: { type?: OscillatorType; gain?: number; delayMs?: number } = {}) {
  const ac = audioCtx()
  if (!ac) return
  const t0 = ac.currentTime + (opts.delayMs ?? 0) / 1000
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = opts.type ?? 'sine'
  osc.frequency.value = freq
  const g = opts.gain ?? 0.15
  gain.gain.setValueAtTime(g, t0)
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + durationMs / 1000)
  osc.connect(gain).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + durationMs / 1000)
}

export const sounds = {
  /** Normaler Zug: kurzes Klacken. */
  move() {
    tone(520, 70, { type: 'triangle', gain: 0.12 })
  },
  /** Schlagzug: dumpferer Doppelton. */
  capture() {
    tone(300, 90, { type: 'square', gain: 0.1 })
    tone(180, 110, { type: 'triangle', gain: 0.12, delayMs: 40 })
  },
  /** Schach: auffälliger Zweiklang. */
  check() {
    tone(660, 120, { type: 'sine', gain: 0.14 })
    tone(880, 160, { type: 'sine', gain: 0.14, delayMs: 110 })
  },
  /** Partieende / Sieg: kleine aufsteigende Fanfare. */
  win() {
    tone(523, 140, { gain: 0.14 })
    tone(659, 140, { gain: 0.14, delayMs: 130 })
    tone(784, 220, { gain: 0.16, delayMs: 260 })
    tone(1047, 350, { gain: 0.16, delayMs: 400 })
  },
  /** Partie verloren: kurze absteigende Folge (kein Triumph-Ton fürs Mattgesetztwerden). */
  lose() {
    tone(392, 160, { gain: 0.12 })
    tone(311, 200, { gain: 0.12, delayMs: 150 })
    tone(233, 320, { gain: 0.12, delayMs: 330 })
  },
  /** Ungültiger Zug / Warnung. */
  warn() {
    tone(220, 180, { type: 'sawtooth', gain: 0.08 })
  },
}

export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* nicht unterstützt */
  }
}
