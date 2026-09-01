import type { Analysis, EngineLine } from './types'

/** Spielstärke-Stufen für den Computergegner. */
export interface LevelConfig {
  label: string
  approxElo: number
  /** UCI-Optionen, die vor dem Zug gesetzt werden. */
  options: Record<string, string | number | boolean>
  /** Argumente für den go-Befehl. */
  go: string
  /** Künstliche Bedenkzeit (ms), damit schwache Stufen nicht "sofort" antworten. */
  minDelayMs: number
}

export const LEVELS: Record<number, LevelConfig> = {
  0: {
    label: 'Stufe 0 – Ganz leicht',
    approxElo: 400,
    // Sonderfall in bestMoveForLevel: zieht meist zufällig (siehe unten).
    options: { 'Skill Level': 0, UCI_LimitStrength: false },
    go: 'go depth 1',
    minDelayMs: 700,
  },
  1: {
    label: 'Stufe 1 – Anfänger',
    approxElo: 800,
    options: { 'Skill Level': 0, UCI_LimitStrength: false },
    go: 'go depth 2',
    minDelayMs: 600,
  },
  2: {
    label: 'Stufe 2 – Gelegenheitsspieler',
    approxElo: 1100,
    options: { 'Skill Level': 3, UCI_LimitStrength: false },
    go: 'go depth 4',
    minDelayMs: 500,
  },
  3: {
    label: 'Stufe 3 – Vereinsanfänger',
    approxElo: 1400,
    options: { 'Skill Level': 8, UCI_LimitStrength: false },
    go: 'go depth 8 movetime 700',
    minDelayMs: 400,
  },
  4: {
    label: 'Stufe 4 – Fortgeschritten',
    approxElo: 1800,
    options: { 'Skill Level': 20, UCI_LimitStrength: true, UCI_Elo: 1800 },
    go: 'go movetime 900',
    minDelayMs: 300,
  },
  5: {
    label: 'Stufe 5 – Stark',
    approxElo: 2300,
    options: { 'Skill Level': 20, UCI_LimitStrength: true, UCI_Elo: 2300 },
    go: 'go movetime 1400',
    minDelayMs: 200,
  },
}

interface Job {
  commands: string[]
  /** Wartet auf "bestmove"; sonst nur ein Befehls-Batch mit isready-Sync. */
  waitsForBestmove: boolean
  resolve: (result: JobResult) => void
  reject: (err: Error) => void
  lines: Map<number, EngineLine>
  depth: number
  bestmove?: string
}

interface JobResult {
  bestmove: string
  lines: EngineLine[]
  depth: number
}

/** Ein Job wurde per stop()/dispose() verworfen, bevor die Engine antwortete. */
export class EngineCancelled extends Error {
  constructor() {
    super('Engine-Anfrage abgebrochen')
    this.name = 'EngineCancelled'
  }
}

/**
 * Serialisierter UCI-Zugriff auf Stockfish (Single-Thread-WASM im Web Worker).
 * Es läuft immer nur ein Job gleichzeitig; weitere Aufrufe werden eingereiht.
 */
export class Engine {
  private worker: Worker | null = null
  private queue: Job[] = []
  private current: Job | null = null
  private initPromise: Promise<void> | null = null

  /** Startet Worker und wartet auf uciok. */
  init(): Promise<void> {
    if (this.initPromise) return this.initPromise
    this.initPromise = new Promise((resolve, reject) => {
      let settled = false
      try {
        this.worker = new Worker(`${import.meta.env.BASE_URL}engine/stockfish-18-lite-single.js`)
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)))
        return
      }
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true
          reject(new Error('Engine-Start dauert zu lange (uciok fehlt).'))
        }
      }, 30000)
      this.worker.onerror = (e) => {
        const err = new Error(`Engine-Worker-Fehler: ${e.message}`)
        if (!settled) {
          settled = true
          clearTimeout(timeout)
          reject(err)
          return
        }
        // Absturz mitten im Spiel (z. B. Speichermangel): Wartende Aufrufer
        // dürfen nicht ewig hängen – sie melden den Fehler dann in der UI.
        this.failAll(err)
      }
      this.worker.onmessage = (e: MessageEvent) => {
        const line = String(e.data)
        if (!settled && line === 'uciok') {
          settled = true
          clearTimeout(timeout)
          this.worker!.onmessage = (ev: MessageEvent) => this.handleLine(String(ev.data))
          this.send('setoption name Use NNUE value true')
          resolve()
        }
      }
      this.send('uci')
    })
    return this.initPromise
  }

  private send(cmd: string) {
    this.worker?.postMessage(cmd)
  }

  private handleLine(line: string) {
    const job = this.current
    if (!job) return
    if (line.startsWith('info ') && line.includes(' pv ')) {
      const parsed = parseInfoLine(line)
      if (parsed) {
        // Zwischenstände mit Schranken (lowerbound/upperbound) sind ungenau;
        // sie zählen nur, solange noch keine exakte Linie vorliegt.
        if (!parsed.bound || !job.lines.has(parsed.multipv)) {
          job.lines.set(parsed.multipv, parsed.line)
        }
        job.depth = Math.max(job.depth, parsed.depth)
      }
    } else if (line.startsWith('bestmove')) {
      job.bestmove = line.split(/\s+/)[1] ?? '(none)'
      this.finishCurrent()
    } else if (line === 'readyok' && !job.waitsForBestmove) {
      this.finishCurrent()
    }
  }

  private finishCurrent() {
    const job = this.current
    if (!job) return
    this.current = null
    const lines = [...job.lines.entries()].sort((a, b) => a[0] - b[0]).map(([, l]) => l)
    job.resolve({ bestmove: job.bestmove ?? '(none)', lines, depth: job.depth })
    this.pump()
  }

  private pump() {
    if (this.current || this.queue.length === 0) return
    this.current = this.queue.shift()!
    for (const cmd of this.current.commands) this.send(cmd)
    if (!this.current.waitsForBestmove) this.send('isready')
  }

  private enqueue(commands: string[], waitsForBestmove: boolean): Promise<JobResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({ commands, waitsForBestmove, resolve, reject, lines: new Map(), depth: 0 })
      this.pump()
    })
  }

  /**
   * Bricht die laufende Suche ab (der Job löst dann über bestmove auf) und
   * verwirft alle noch wartenden Jobs – deren Aufrufer haben die Antwort
   * (per Generationszähler) ohnehin nicht mehr gebraucht. So kommt z. B. der
   * Computerzug nach »Neue Partie« nicht hinter veralteten Analysen dran.
   */
  stop() {
    const dropped = this.queue
    this.queue = []
    for (const job of dropped) job.reject(new EngineCancelled())
    if (this.current?.waitsForBestmove) this.send('stop')
  }

  /** Lässt alle offenen Jobs fehlschlagen (Worker-Absturz, dispose). */
  private failAll(err: Error) {
    const jobs = [...(this.current ? [this.current] : []), ...this.queue]
    this.current = null
    this.queue = []
    for (const job of jobs) job.reject(err)
  }

  async newGame(): Promise<void> {
    await this.init()
    await this.enqueue(['ucinewgame'], false)
  }

  /** Stellungsanalyse mit MultiPV, für Tipps und Bewertung. */
  async analyze(fen: string, opts: { depth: number; multiPv: number }): Promise<Analysis> {
    await this.init()
    const result = await this.enqueue(
      [
        'setoption name UCI_LimitStrength value false',
        'setoption name Skill Level value 20',
        `setoption name MultiPV value ${opts.multiPv}`,
        `position fen ${fen}`,
        `go depth ${opts.depth}`,
      ],
      true,
    )
    return { fen, depth: result.depth, lines: result.lines }
  }

  /**
   * Stufe 0: Die Engine listet per MultiPV alle legalen Züge bei Tiefe 1 auf;
   * zu 75 % fällt die Wahl auf einen Zufallszug, zu 25 % auf den besten davon –
   * so reagiert sie manchmal (schlägt z. B. eine hängende Figur), bleibt aber
   * für absolute Anfänger gut schlagbar.
   */
  private async randomishMove(fen: string): Promise<string> {
    const result = await this.enqueue(
      [
        'setoption name UCI_LimitStrength value false',
        'setoption name Skill Level value 0',
        'setoption name MultiPV value 250',
        `position fen ${fen}`,
        'go depth 1',
      ],
      true,
    )
    const lines = result.lines
    const first = lines[0]
    if (!first) return result.bestmove
    if (Math.random() < 0.25) return first.move
    const pick = lines[Math.floor(Math.random() * lines.length)]
    return pick?.move ?? first.move
  }

  /** Zug des Computergegners in der eingestellten Spielstärke. */
  async bestMoveForLevel(fen: string, level: number): Promise<string> {
    await this.init()
    const cfg = LEVELS[level] ?? LEVELS[3]!
    if (level === 0) {
      const started = performance.now()
      const move = await this.randomishMove(fen)
      const elapsed = performance.now() - started
      if (elapsed < cfg.minDelayMs) {
        await new Promise((r) => setTimeout(r, cfg.minDelayMs - elapsed))
      }
      return move
    }
    const optionCmds = Object.entries(cfg.options).map(
      ([name, value]) => `setoption name ${name} value ${value}`,
    )
    const started = performance.now()
    const result = await this.enqueue(
      ['setoption name MultiPV value 1', ...optionCmds, `position fen ${fen}`, cfg.go],
      true,
    )
    // Schwache Stufen antworten sonst unnatürlich schnell.
    const elapsed = performance.now() - started
    if (elapsed < cfg.minDelayMs) {
      await new Promise((r) => setTimeout(r, cfg.minDelayMs - elapsed))
    }
    return result.bestmove
  }

  dispose() {
    this.failAll(new EngineCancelled())
    this.worker?.terminate()
    this.worker = null
    this.initPromise = null
  }
}

function parseInfoLine(
  line: string,
): { multipv: number; depth: number; bound: boolean; line: EngineLine } | null {
  const tokens = line.split(/\s+/)
  let multipv = 1
  let depth = 0
  let cp: number | undefined
  let mate: number | undefined
  let bound = false
  let pv: string[] = []
  for (let i = 0; i < tokens.length; i++) {
    switch (tokens[i]) {
      case 'depth':
        depth = Number(tokens[++i])
        break
      case 'multipv':
        multipv = Number(tokens[++i])
        break
      case 'score': {
        const kind = tokens[++i]
        const value = Number(tokens[++i])
        if (kind === 'cp') cp = value
        else if (kind === 'mate') mate = value
        const next = tokens[i + 1]
        if (next === 'lowerbound' || next === 'upperbound') {
          bound = true
          i++
        }
        break
      }
      case 'pv':
        pv = tokens.slice(i + 1)
        i = tokens.length
        break
    }
  }
  const move = pv[0]
  if (!move || (cp === undefined && mate === undefined)) return null
  return { multipv, depth, bound, line: { move, cp, mate, pv } }
}

/** Eine gemeinsame Engine-Instanz für die ganze App (Single-Thread, wenig RAM). */
export const engine = new Engine()
