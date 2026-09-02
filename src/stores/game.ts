import { defineStore } from 'pinia'
import { watch } from 'vue'
import { Chess, type Square } from 'chess.js'
import { engine } from '../engine/engine'
import { lineToEval, type Analysis } from '../engine/types'
import { explainBestMove, pieceNameDe, sanToGerman } from '../lib/explain'
import { newGameId, upsertGame } from '../lib/archive'
import { LESSONS } from '../lessons/curriculum'
import { compileLesson } from '../lessons/parse'
import type { LessonStep } from '../lessons/types'
import { recordResult, starsForMistakes } from '../lib/lessonProgress'
import { judgeMove, type MoveJudgement } from '../lib/judge'
import { sounds, vibrate } from '../lib/sound'
import { useSettings } from './settings'
import { GAME_KEY } from '../lib/storageKeys'

// Die Chess-Instanz bleibt bewusst außerhalb des reaktiven Stores.
const chess = new Chess()

/** Eval-Verlust in Centipawns, ab dem die Fehlerwarnung anspringt. */
const BLUNDER_THRESHOLD = 200

export type GameStatus = 'playing' | 'checkmate' | 'stalemate' | 'draw' | 'resigned'

export interface Tip {
  stage: number
  orig: Square
  dest: Square
  san: string
  text: string
}

/** Laufende Lektion des Lernpfads. */
export interface LessonRuntime {
  id: string
  title: string
  outro: string
  mode: 'demo' | 'play'
  steps: LessonStep[]
  stepIndex: number
  playerColor: 'white' | 'black'
  mistakes: number
  attemptsOnStep: number
  finished: boolean
  earnedStars: number | null
}

/** Ein Halbzug im Partie-Rückblick. */
interface ReviewMove {
  san: string
  uci: string
  color: 'w' | 'b'
  captured?: string
}

/** Laufender Partie-Rückblick (Blättern durch eine fertige Partie). */
export interface ReviewState {
  moves: ReviewMove[]
  /** fens[0] = Startstellung, fens[i] = Stellung nach Halbzug i. */
  fens: string[]
  /** Aktuelle Position: 0 (Start) … moves.length. */
  index: number
  /** Bewertung je Halbzug (lazy berechnet beim Blättern). */
  judgements: (MoveJudgement | null)[]
  /** Bester Engine-Zug (UCI) in der Stellung vor Halbzug i. */
  best: (string | null)[]
  busy: boolean
  /** Anzahl laufender Bewertungen (busy = pending > 0). */
  pending: number
}

interface PersistedGame {
  pgn: string
  tipsLeft: number
  status: GameStatus
  winner: 'white' | 'black' | null
  gameId?: string
  /** »Ab hier weiterspielen« nach einer Lektion: Computer spielt die Gegenseite. */
  postLessonAi?: boolean
  postLessonColor?: 'white' | 'black'
}

const GAME_STATUSES: readonly GameStatus[] = ['playing', 'checkmate', 'stalemate', 'draw', 'resigned']

/** Obergrenze für gecachte Analysen (ältere Einträge fliegen zuerst raus). */
const ANALYSIS_CACHE_MAX = 400

export const useGame = defineStore('game', {
  state: () => ({
    fen: chess.fen(),
    turnColor: 'white' as 'white' | 'black',
    lastMove: null as [Square, Square] | null,
    inCheck: false,
    status: 'playing' as GameStatus,
    winner: null as 'white' | 'black' | null,
    movesSan: [] as string[],
    capturedByWhite: [] as string[], // Figurentypen, die Weiß geschlagen hat
    capturedByBlack: [] as string[],
    dests: new Map<Square, Square[]>(),

    thinking: false, // Computergegner rechnet
    analyzing: false, // Tipp-Analyse läuft
    engineError: null as string | null,

    tipsLeft: 5,
    tipStage: 0,
    tip: null as Tip | null,

    /** Zug-Kommentar zum zuletzt gespielten eigenen Zug (Lernmodus). */
    feedback: null as MoveJudgement | null,

    evalWhite: null as number | null,
    mateWhite: null as number | null,

    blunderPrompt: false,
    pendingPromotion: null as { from: Square; to: Square } | null,
    /** Warnung: Der gewählte Zug würde sofort Patt setzen, obwohl man klar führt. */
    pattPrompt: null as { from: Square; to: Square; promotion?: 'q' | 'r' | 'b' | 'n' } | null,

    orientation: 'white' as 'white' | 'black',
    /** Stabile Kennung der laufenden Partie (für das Archiv). */
    gameId: newGameId(),

    /** Laufender Partie-Rückblick (überlagert die Brettanzeige, nicht die Partie). */
    review: null as ReviewState | null,

    /** Laufende Lernpfad-Lektion (überlagert den eingestellten Spielmodus). */
    lesson: null as LessonRuntime | null,
    /** Aktueller Kommentar-/Coach-Text der Lektion. */
    lessonComment: null as string | null,
    /** Aufgabe beim Mitspielen: Was soll der Spieler jetzt ziehen (und warum)? */
    lessonTask: null as string | null,
    /** »Ab hier weiterspielen«: Computer übernimmt nach einer Lektion. */
    postLessonAi: false,
    postLessonColor: 'white' as 'white' | 'black',
    /** Steigt bei Undo/Neustart, damit veraltete Engine-Antworten verworfen werden. */
    generation: 0,
  }),

  getters: {
    tipsUnlimited: (s) => s.tipsLeft < 0,
    /** Materialbilanz aus Weiß-Sicht (positiv: Weiß hat mehr geschlagen). */
    materialBalance: (s) => {
      const value = (t: string) => ({ p: 1, n: 3, b: 3, r: 5, q: 9 })[t] ?? 0
      return (
        s.capturedByWhite.reduce((a, t) => a + value(t), 0) -
        s.capturedByBlack.reduce((a, t) => a + value(t), 0)
      )
    },
    /** Tatsächlich wirksamer Modus: Lektion und »Weiterspielen« überlagern die Einstellung. */
    effectiveMode(): 'lesson' | 'ai' | 'pvp' {
      if (this.lesson) return 'lesson'
      if (this.postLessonAi) return 'ai'
      return useSettings().mode
    },
    effectivePlayerColor(): 'white' | 'black' {
      return this.postLessonAi ? this.postLessonColor : useSettings().playerColor
    },
    /** Film-Modus wartet auf den »Weiter«-Knopf statt automatisch abzulaufen. */
    lessonAwaitsNext(): boolean {
      return !!this.lesson && !this.lesson.finished && this.lesson.mode === 'demo'
    },
    isPlayersTurn(): boolean {
      if (this.review) return false
      if (this.effectiveMode === 'pvp') return true
      if (this.effectiveMode === 'lesson') {
        const L = this.lesson!
        return L.mode === 'play' && !L.finished && this.turnColor === L.playerColor
      }
      return this.turnColor === this.effectivePlayerColor && !this.thinking
    },
  },

  actions: {
    // ---------- Initialisierung & Persistenz ----------

    async initApp() {
      const settings = useSettings()
      settings.persistOnChange()
      this.restore()
      this.orientation = settings.mode === 'ai' ? settings.playerColor : 'white'
      // Spielmodus/Farbe wirken sofort auf die laufende Partie: Wechselt man
      // mitten in der Partie zu »Gegen Computer« und der Computer ist am Zug,
      // muss er angestoßen werden – sonst wartet das gesperrte Brett ewig.
      watch(
        () => [settings.mode, settings.playerColor] as const,
        () => {
          if (this.lesson || this.review) return
          if (this.effectiveMode !== 'ai' && this.thinking) {
            this.generation++
            engine.stop()
            this.thinking = false
          }
          this.orientation = settings.mode === 'ai' ? settings.playerColor : 'white'
          this.maybeEngineMove()
          void this.refreshEval()
          this.maybePrefetch()
        },
      )
      try {
        await engine.init()
        this.engineError = null
      } catch (e) {
        this.engineError = e instanceof Error ? e.message : String(e)
        return
      }
      this.maybeEngineMove()
      void this.refreshEval()
      this.maybePrefetch()
    },

    persist() {
      // Lektionen überschreiben den echten Spielstand nicht.
      if (this.lesson) return
      try {
        const data: PersistedGame = {
          pgn: chess.pgn(),
          tipsLeft: this.tipsLeft,
          status: this.status,
          winner: this.winner,
          gameId: this.gameId,
          postLessonAi: this.postLessonAi || undefined,
          postLessonColor: this.postLessonAi ? this.postLessonColor : undefined,
        }
        localStorage.setItem(GAME_KEY, JSON.stringify(data))
      } catch {
        /* Speichern optional */
      }
    },

    restore() {
      const settings = useSettings()
      try {
        const raw = localStorage.getItem(GAME_KEY)
        if (raw) {
          const data = JSON.parse(raw) as Partial<PersistedGame>
          if (typeof data.pgn !== 'string') throw new Error('Spielstand ohne PGN')
          chess.loadPgn(data.pgn)
          this.tipsLeft = typeof data.tipsLeft === 'number' ? data.tipsLeft : settings.tipBudget
          this.status = GAME_STATUSES.includes(data.status as GameStatus)
            ? (data.status as GameStatus)
            : 'playing'
          this.winner = data.winner === 'white' || data.winner === 'black' ? data.winner : null
          this.gameId = data.gameId ?? newGameId()
          this.postLessonAi = data.postLessonAi === true
          this.postLessonColor = data.postLessonColor === 'black' ? 'black' : 'white'
          this.sync()
          return
        }
      } catch {
        /* Defekter Spielstand: neu anfangen */
      }
      // Kein (brauchbarer) Spielstand: sauber bei null anfangen – auch dann,
      // wenn zuvor z. B. eine Lektion mit Matt endete (Status nicht mitschleppen).
      chess.reset()
      this.status = 'playing'
      this.winner = null
      this.gameId = newGameId()
      this.postLessonAi = false
      this.tipsLeft = settings.tipBudget
      this.sync()
    },

    /** Überträgt den chess.js-Zustand in den reaktiven Store. */
    sync() {
      this.fen = chess.fen()
      this.turnColor = chess.turn() === 'w' ? 'white' : 'black'
      this.inCheck = chess.inCheck()
      const history = chess.history({ verbose: true })
      this.movesSan = history.map((m) => m.san)
      const last = history[history.length - 1]
      this.lastMove = last ? [last.from, last.to] : null
      this.capturedByWhite = history.filter((m) => m.color === 'w' && m.captured).map((m) => m.captured!)
      this.capturedByBlack = history.filter((m) => m.color === 'b' && m.captured).map((m) => m.captured!)

      const dests = new Map<Square, Square[]>()
      for (const m of chess.moves({ verbose: true })) {
        const arr = dests.get(m.from) ?? []
        arr.push(m.to)
        dests.set(m.from, arr)
      }
      this.dests = dests

      const wasPlaying = this.status === 'playing'
      if (this.status === 'playing' || this.status === 'resigned') {
        if (chess.isCheckmate()) {
          this.status = 'checkmate'
          this.winner = this.turnColor === 'white' ? 'black' : 'white'
        } else if (chess.isStalemate()) {
          this.status = 'stalemate'
          this.winner = null
        } else if (chess.isDraw()) {
          this.status = 'draw'
          this.winner = null
        }
      }
      if (wasPlaying && this.status !== 'playing') this.archiveCurrent()
      this.persist()
    },

    // ---------- Partieverwaltung ----------

    newGame() {
      const settings = useSettings()
      this.review = null
      // Angefangene Partie nicht verlieren: vor dem Reset ins Archiv.
      if (this.status === 'playing' && this.movesSan.length >= 2) this.archiveCurrent()
      this.clearLessonState()
      this.gameId = newGameId()
      this.generation++
      engine.stop()
      chess.reset()
      this.status = 'playing'
      this.winner = null
      this.thinking = false
      this.analyzing = false
      this.blunderPrompt = false
      pendingAfterBlunder = null
      this.pendingPromotion = null
      this.pattPrompt = null
      this.clearTip()
      this.feedback = null
      this.tipsLeft = settings.tipBudget
      this.evalWhite = null
      this.mateWhite = null
      this.orientation = settings.mode === 'ai' ? settings.playerColor : 'white'
      analysisCache.clear()
      this.sync()
      void engine.newGame().catch(() => {})
      this.maybeEngineMove()
      void this.refreshEval()
      this.maybePrefetch()
    },

    resign() {
      if (this.status !== 'playing' || this.lesson || this.review) return
      this.status = 'resigned'
      this.winner =
        this.effectiveMode === 'ai'
          ? this.effectivePlayerColor === 'white'
            ? 'black'
            : 'white'
          : this.turnColor === 'white'
            ? 'black'
            : 'white'
      this.generation++
      engine.stop()
      this.thinking = false
      // Offene Rückfragen schließen – ein »Zurücknehmen« nach dem Aufgeben
      // würde die Aufgabe sonst stillschweigend wieder aufheben.
      this.blunderPrompt = false
      pendingAfterBlunder = null
      this.pattPrompt = null
      this.pendingPromotion = null
      this.clearTip()
      this.archiveCurrent()
      this.persist()
    },

    flipBoard() {
      this.orientation = this.orientation === 'white' ? 'black' : 'white'
    },

    exportPgn(): string {
      const settings = useSettings()
      const white =
        this.effectiveMode === 'ai' && this.effectivePlayerColor === 'black'
          ? `Computer (Stufe ${settings.aiLevel})`
          : 'Spieler Weiß'
      const black =
        this.effectiveMode === 'ai' && this.effectivePlayerColor === 'white'
          ? `Computer (Stufe ${settings.aiLevel})`
          : 'Spieler Schwarz'
      chess.setHeader('Event', 'SchachTrainer Partie')
      chess.setHeader('Date', localDateStamp())
      // Diagnose: eindeutiger Zeitstempel des Exports, um Dateien sicher
      // auseinanderhalten zu können (z. B. bei Teilen-Cache-Problemen).
      chess.setHeader('ExportedAt', new Date().toISOString().slice(0, 16).replace('T', ' '))
      chess.setHeader('White', white)
      chess.setHeader('Black', black)
      if (this.status === 'checkmate' || this.status === 'resigned') {
        chess.setHeader('Result', this.winner === 'white' ? '1-0' : '0-1')
      } else if (this.status === 'stalemate' || this.status === 'draw') {
        chess.setHeader('Result', '1/2-1/2')
      } else {
        // Nach einem Undo aus einer beendeten Partie bliebe sonst das alte Ergebnis stehen.
        chess.setHeader('Result', '*')
      }
      return chess.pgn()
    },

    /** Legt die aktuelle Partie im Archiv ab (bzw. aktualisiert sie dort). */
    archiveCurrent() {
      if (this.lesson || this.movesSan.length < 2) return
      const pgn = this.exportPgn()
      const headers = chess.getHeaders()
      const result =
        this.status === 'checkmate' || this.status === 'resigned'
          ? this.winner === 'white'
            ? '1-0'
            : '0-1'
          : this.status === 'stalemate' || this.status === 'draw'
            ? '1/2-1/2'
            : '*'
      upsertGame({
        id: this.gameId,
        date: new Date().toISOString(),
        pgn,
        white: headers['White'] ?? '?',
        black: headers['Black'] ?? '?',
        result,
        moveCount: Math.ceil(this.movesSan.length / 2),
      })
    },

    // ---------- Züge ----------

    /** Vom Brett gemeldeter Zug des Menschen. */
    userMove(from: Square, to: Square) {
      if (this.review) return // Rückblick: Brett ist nur Anzeige
      if (this.status !== 'playing' || !this.isPlayersTurn || this.blunderPrompt || this.pattPrompt) {
        this.sync() // Brett zurücksetzen
        return
      }
      const needsPromotion = chess
        .moves({ square: from, verbose: true })
        .some((m) => m.to === to && m.promotion)
      if (needsPromotion) {
        this.pendingPromotion = { from, to }
        return
      }
      this.applyUserMove(from, to)
    },

    choosePromotion(piece: 'q' | 'r' | 'b' | 'n') {
      const p = this.pendingPromotion
      this.pendingPromotion = null
      if (p) this.applyUserMove(p.from, p.to, piece)
    },

    cancelPromotion() {
      this.pendingPromotion = null
      this.sync()
    },

    applyUserMove(from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n') {
      const settings = useSettings()

      // In der Lektion prüft der Coach den Zug gegen die Hauptvariante.
      if (this.lesson) {
        this.lessonTryMove(from, to, promotion)
        return
      }

      // Patt-Schutz: Würde der Zug den Gegner sofort patt setzen, obwohl man
      // klar auf Gewinn steht, erst nachfragen (klassische Anfänger-Falle:
      // Dame erstickt den nackten König – Partie plötzlich unentschieden).
      if (settings.pattWarning && !pattApproved) {
        try {
          const probe = new Chess(this.fen)
          probe.move({ from, to, promotion })
          if (probe.isStalemate()) {
            const sign = this.turnColor === 'white' ? 1 : -1
            const advantage = (this.evalWhite ?? this.materialBalance * 100) * sign
            if (advantage > 300) {
              this.pattPrompt = { from, to, promotion }
              this.sync() // Brett zurücksetzen, Zug noch nicht ausführen
              return
            }
          }
        } catch {
          /* illegaler Zug: der normale Pfad unten meldet das */
        }
      }

      const prevEvalWhite = this.evalWhite
      const fenBefore = this.fen
      let move
      try {
        move = chess.move({ from, to, promotion })
      } catch {
        this.sync()
        return
      }
      const playedUci = `${move.from}${move.to}${move.promotion ?? ''}`
      this.clearTip()
      this.feedback = null
      this.sync()
      this.moveEffects(move.captured !== undefined)
      if (this.status !== 'playing') {
        this.onGameEnd()
        return
      }
      if (this.effectiveMode === 'pvp') {
        if (settings.autoFlip) this.orientation = this.turnColor
        void this.afterPlayerMove(prevEvalWhite, move.color, fenBefore, playedUci, null)
      } else {
        void this.afterPlayerMove(prevEvalWhite, move.color, fenBefore, playedUci, () =>
          this.engineReply(),
        )
      }
    },

    /**
     * Läuft nach jedem eigenen Zug: Bewertung aktualisieren, auf groben Patzer
     * prüfen (Eval-Sprung > 2 Bauern; Warnung blockiert `then` bis zur
     * Entscheidung) und – falls eingeschaltet – den Zug-Kommentar berechnen.
     */
    async afterPlayerMove(
      prevEvalWhite: number | null,
      moverColor: 'w' | 'b',
      fenBefore: string,
      playedUci: string,
      then: (() => void) | null,
    ) {
      const settings = useSettings()
      const gen = this.generation
      const fenAfter = this.fen
      if (!settings.blunderWarning && !settings.showEval && !settings.moveFeedback) {
        then?.()
        return
      }
      try {
        // Etwas tiefer analysieren, wenn der Kommentar die Linien mitnutzt.
        const depth = settings.moveFeedback ? 12 : 10
        const analysis = await engine.analyze(fenAfter, { depth, multiPv: 1 })
        if (gen !== this.generation || this.status !== 'playing') return
        // Hotseat: Der nächste Spieler kann längst gezogen haben – dann gehört
        // die Warnung (und der Eval) nicht mehr zur aktuellen Stellung.
        if (this.fen !== fenAfter) return
        this.applyEval(analysis)
        if (settings.moveFeedback) {
          void this.computeFeedback(fenBefore, playedUci, analysis.lines, gen, fenAfter)
        }
        const line = analysis.lines[0]
        if (settings.blunderWarning && line && prevEvalWhite !== null) {
          const now = lineToEval(line, chess.turn()).cpWhite
          const sign = moverColor === 'w' ? 1 : -1
          const drop = (prevEvalWhite - now) * sign
          if (drop >= BLUNDER_THRESHOLD) {
            sounds.warn()
            this.blunderPrompt = true
            pendingAfterBlunder = then // Weitergabe übernimmt resolveBlunder()
            return
          }
        }
      } catch {
        /* Eval optional – Partie geht weiter */
      }
      // Nach einem abgebrochenen Aufruf (Undo, neue Partie …) darf kein
      // Gegnerzug mehr für eine fremde Stellung angestoßen werden.
      if (gen !== this.generation || this.status !== 'playing' || this.fen !== fenAfter) return
      then?.()
      if (this.effectiveMode === 'pvp') this.maybePrefetch()
    },

    /** Analyse mit Tipp-Tiefe, gecacht pro Stellung (Tipps, Zug-Kommentare, Prefetch). */
    async ensureAnalysis(fen: string): Promise<Analysis> {
      const cached = analysisCache.get(fen)
      if (cached) return cached
      // Läuft dieselbe Analyse schon (z. B. Prefetch), nicht doppelt rechnen –
      // sonst wartet der Tipp hinter einer identischen zweiten Analyse.
      const inflight = analysisInflight.get(fen)
      if (inflight) return inflight
      const promise = engine
        .analyze(fen, { depth: 13, multiPv: 3 })
        .then((analysis) => {
          if (analysisCache.size >= ANALYSIS_CACHE_MAX) {
            const oldest = analysisCache.keys().next().value
            if (oldest !== undefined) analysisCache.delete(oldest)
          }
          analysisCache.set(fen, analysis)
          return analysis
        })
        .finally(() => {
          analysisInflight.delete(fen)
        })
      analysisInflight.set(fen, promise)
      return promise
    },

    /**
     * Analysiert die aktuelle Stellung im Hintergrund vor, solange der Spieler
     * nachdenkt – der Zug-Kommentar (und der erste Tipp) kommt dann sofort.
     */
    maybePrefetch() {
      const settings = useSettings()
      if (!settings.moveFeedback || this.status !== 'playing' || this.lesson || this.review) return
      if (this.effectiveMode === 'ai' && this.turnColor !== this.effectivePlayerColor) return
      void this.ensureAnalysis(this.fen).catch(() => {})
    },

    async computeFeedback(
      fenBefore: string,
      playedUci: string,
      linesAfter: Analysis['lines'],
      gen: number,
      fenAfter: string,
    ) {
      try {
        const before = await this.ensureAnalysis(fenBefore)
        if (gen !== this.generation || this.fen !== fenAfter) return
        this.feedback = judgeMove(fenBefore, playedUci, before.lines, linesAfter)
      } catch {
        /* Kommentar optional */
      }
    },

    /** Antwort auf die Patt-Warnung. */
    resolvePatt(playAnyway: boolean) {
      const p = this.pattPrompt
      this.pattPrompt = null
      if (playAnyway && p) {
        pattApproved = true
        try {
          this.applyUserMove(p.from, p.to, p.promotion)
        } finally {
          pattApproved = false
        }
      }
    },

    /** Antwort auf die Fehlerwarnung. */
    resolveBlunder(takeBack: boolean) {
      this.blunderPrompt = false
      const then = pendingAfterBlunder
      pendingAfterBlunder = null
      if (takeBack) {
        this.undo()
      } else {
        then?.()
        this.maybePrefetch()
      }
    },

    async engineReply() {
      const settings = useSettings()
      if (this.status !== 'playing' || this.effectiveMode !== 'ai') return
      if (this.turnColor === this.effectivePlayerColor || this.thinking) return
      const gen = this.generation
      this.thinking = true
      try {
        const uci = await engine.bestMoveForLevel(this.fen, settings.aiLevel)
        if (gen !== this.generation || this.status !== 'playing') return
        if (this.effectiveMode !== 'ai' || this.turnColor === this.effectivePlayerColor) return
        if (uci && uci !== '(none)') {
          const move = chess.move({
            from: uci.slice(0, 2) as Square,
            to: uci.slice(2, 4) as Square,
            promotion: (uci[4] as 'q' | 'r' | 'b' | 'n' | undefined) ?? undefined,
          })
          this.sync()
          this.moveEffects(move.captured !== undefined)
          if (this.status !== 'playing') this.onGameEnd()
          else {
            void this.refreshEval()
            this.maybePrefetch()
          }
        }
        this.engineError = null
      } catch (e) {
        if (gen === this.generation) {
          this.engineError = 'Der Computergegner reagiert nicht. Bitte Seite neu laden.'
        }
      } finally {
        if (gen === this.generation) this.thinking = false
      }
    },

    /** Falls der Computer am Zug ist (z. B. Mensch spielt Schwarz), Zug anstoßen. */
    maybeEngineMove() {
      if (
        this.effectiveMode === 'ai' &&
        this.status === 'playing' &&
        this.turnColor !== this.effectivePlayerColor &&
        !this.thinking
      ) {
        void this.engineReply()
      }
    },

    undo() {
      if (this.lesson || this.review) return // Lektion/Rückblick haben eigene Flows
      if (this.movesSan.length === 0) return
      this.generation++
      engine.stop()
      this.thinking = false
      this.blunderPrompt = false
      pendingAfterBlunder = null
      this.pendingPromotion = null
      this.pattPrompt = null
      this.clearTip()
      this.feedback = null

      if (this.effectiveMode === 'ai') {
        // Engine-Antwort mit zurücknehmen, damit der Mensch wieder am Zug ist.
        chess.undo()
        if (chess.turn() !== (this.effectivePlayerColor === 'white' ? 'w' : 'b')) {
          chess.undo()
        }
      } else {
        chess.undo()
      }
      if (this.status !== 'playing') {
        this.status = 'playing'
        this.winner = null
      }
      this.sync()
      // Falls nach dem Zurücknehmen wieder der Computer dran ist (z. B. Undo
      // seines allerersten Zugs), muss er erneut angestoßen werden.
      this.maybeEngineMove()
      void this.refreshEval()
      this.maybePrefetch()
    },

    // ---------- Lernpfad (Lektionen) ----------

    clearLessonState() {
      if (lessonTimer) clearTimeout(lessonTimer)
      lessonTimer = null
      this.lesson = null
      this.lessonComment = null
      this.lessonTask = null
      this.postLessonAi = false
    },

    /** Startet eine Lektion – als »Film« (demo) oder zum Mitspielen (play). */
    startLesson(id: string, mode: 'demo' | 'play') {
      const lesson = LESSONS.get(id)
      if (!lesson) return
      let compiled
      try {
        compiled = compileLesson(lesson)
      } catch {
        this.engineError = 'Diese Lektion konnte nicht geladen werden.'
        return
      }
      this.review = null
      // Laufende echte Partie sichern, bevor das Brett übernommen wird.
      if (!this.lesson && this.status === 'playing' && this.movesSan.length >= 2) {
        this.archiveCurrent()
      }
      this.clearLessonState()
      this.generation++
      engine.stop()
      chess.load(compiled.startFen)
      this.lesson = {
        id,
        title: lesson.title,
        outro: lesson.outro,
        mode,
        steps: compiled.steps,
        stepIndex: 0,
        playerColor: lesson.playerColor,
        mistakes: 0,
        attemptsOnStep: 0,
        finished: false,
        earnedStars: null,
      }
      this.status = 'playing'
      this.winner = null
      this.thinking = false
      this.analyzing = false
      this.blunderPrompt = false
      pendingAfterBlunder = null
      this.pattPrompt = null
      this.pendingPromotion = null
      this.clearTip()
      this.feedback = null
      this.lessonComment = lesson.intro
      this.orientation = lesson.playerColor
      this.sync()
      this.scheduleLessonAuto()
    },

    /** Plant den nächsten automatischen Zug (Gegnerzüge beim Mitspielen). */
    scheduleLessonAuto() {
      const L = this.lesson
      if (!L || L.finished) return
      const step = L.steps[L.stepIndex]
      if (!step) {
        this.finishLesson()
        return
      }
      const playerChar = L.playerColor === 'white' ? 'w' : 'b'
      if (L.mode === 'play' && step.color === playerChar) {
        this.lessonGuide() // Spieler ist dran: Aufgabe zeigen
        return
      }
      // Film-Modus läuft nicht mehr automatisch – der »Weiter«-Knopf spielt
      // jeden Zug einzeln ab, damit man in Ruhe lesen kann.
      if (L.mode === 'demo') return
      const delay = L.stepIndex === 0 ? 2200 : 1000
      if (lessonTimer) clearTimeout(lessonTimer)
      lessonTimer = setTimeout(() => this.lessonPlayStep(), delay)
    },

    /** »Weiter«-Knopf des Film-Modus: spielt genau einen Lektionszug ab. */
    lessonNext() {
      const L = this.lesson
      if (!L || L.finished || L.mode !== 'demo') return
      this.lessonPlayStep()
    },

    /**
     * Zeigt beim Mitspielen die Aufgabe für den anstehenden Lektionszug:
     * Die Figur wird auf dem Brett grün markiert, und die Erklärung des Zugs
     * erscheint schon vorher – wie in der Fahrschule sagt der Coach an, was
     * zu tun ist, gezogen wird trotzdem selbst.
     */
    lessonGuide() {
      const L = this.lesson
      if (!L || L.finished || L.mode !== 'play') return
      const step = L.steps[L.stepIndex]
      if (!step) return
      this.tip = { stage: 1, orig: step.from, dest: step.to, san: step.san, text: '' }
      this.tipStage = 1
      if (step.comment) {
        this.lessonTask = step.comment
      } else {
        const piece = chess.get(step.from)
        this.lessonTask = piece
          ? `Jetzt zieht ${withArticleNom(piece.type)} (grün markiert) – such das richtige Feld!`
          : 'Du bist dran!'
      }
    },

    /** Führt den aktuellen Lektionszug automatisch aus. */
    lessonPlayStep() {
      const L = this.lesson
      if (!L || L.finished) return
      const step = L.steps[L.stepIndex]
      if (!step) {
        this.finishLesson()
        return
      }
      let move
      try {
        move = chess.move({ from: step.from, to: step.to, promotion: step.promotion })
      } catch {
        this.finishLesson()
        return
      }
      L.stepIndex++
      L.attemptsOnStep = 0
      this.clearTip()
      this.lessonTask = null
      if (step.comment) this.lessonComment = step.comment
      this.sync()
      this.moveEffects(move.captured !== undefined)
      if (L.stepIndex >= L.steps.length || this.status !== 'playing') this.finishLesson()
      else this.scheduleLessonAuto()
    },

    /** Prüft den Spielerzug gegen die Hauptvariante der Lektion. */
    lessonTryMove(from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n') {
      const settings = useSettings()
      const L = this.lesson
      if (!L || L.finished || L.mode !== 'play') {
        this.sync()
        return
      }
      const step = L.steps[L.stepIndex]
      if (!step) {
        this.finishLesson()
        return
      }
      const matches =
        step.from === from && step.to === to && (step.promotion ?? 'x') === (promotion ?? 'x')
      if (matches) {
        const move = chess.move({ from, to, promotion })
        L.stepIndex++
        L.attemptsOnStep = 0
        this.clearTip()
        this.lessonTask = null
        this.lessonComment = step.comment ?? 'Richtig!'
        this.sync()
        this.moveEffects(move.captured !== undefined)
        if (L.stepIndex >= L.steps.length || this.status !== 'playing') this.finishLesson()
        else this.scheduleLessonAuto()
        return
      }
      // Falscher Zug: Brett zurücksetzen und sofort den Pfeil zeigen – die
      // Figur war ja schon markiert, also braucht es jetzt konkrete Hilfe.
      L.mistakes++
      L.attemptsOnStep++
      if (settings.sound) sounds.warn()
      this.sync()
      this.tip = { stage: 2, orig: step.from, dest: step.to, san: step.san, text: '' }
      this.tipStage = 2
      this.lessonTask = `Fast! Schau auf den Pfeil – ${sanToGerman(step.san)} ist der Lektionszug.`
    },

    finishLesson() {
      const L = this.lesson
      if (!L || L.finished) return
      if (lessonTimer) clearTimeout(lessonTimer)
      L.finished = true
      if (L.mode === 'play') {
        recordResult(L.id, L.mistakes)
        L.earnedStars = starsForMistakes(L.mistakes)
        // Fehlerfrei = 3 Sterne: kleine Fanfare (Konfetti macht die UI dazu).
        if (L.earnedStars === 3 && useSettings().sound) sounds.win()
      }
      this.lessonComment = null
      this.lessonTask = null
      this.clearTip()
    },

    /** »Ab hier weiterspielen«: Der Computer übernimmt die Gegnerseite. */
    continueFromLesson() {
      const L = this.lesson
      if (!L) return
      this.postLessonColor = L.playerColor
      this.lesson = null
      this.lessonComment = null
      this.lessonTask = null
      this.postLessonAi = true
      this.clearTip()
      this.gameId = newGameId()
      if (this.status !== 'playing') return // Lektion endete bereits mit Matt o. ä.
      this.sync() // persistiert jetzt (Lektion beendet)
      this.maybeEngineMove()
      void this.refreshEval()
      this.maybePrefetch()
    },

    /** Lektion verlassen und zum vorherigen Spielstand zurückkehren. */
    exitLesson() {
      const settings = useSettings()
      this.clearLessonState()
      this.generation++
      engine.stop()
      this.thinking = false
      this.restore()
      this.orientation = settings.mode === 'ai' ? settings.playerColor : 'white'
      this.maybeEngineMove()
      void this.refreshEval()
      this.maybePrefetch()
    },

    // ---------- Partie-Rückblick ----------

    /**
     * Startet den Rückblick: durch eine fertige Partie blättern, jeder Zug
     * wird beim Anschauen von der Engine bewertet (lazy, gecacht). Ohne
     * Argument wird die aktuelle Partie angeschaut, sonst die übergebene PGN
     * (z. B. aus dem Archiv). Die laufende Partie bleibt unangetastet – der
     * Rückblick überlagert nur die Anzeige.
     */
    startReview(pgn?: string) {
      const c = new Chess()
      try {
        c.loadPgn(pgn ?? chess.pgn())
      } catch {
        return
      }
      const hist = c.history({ verbose: true })
      if (hist.length === 0) return
      // Eine laufende Lektion erst sauber beenden (stellt die echte Partie
      // wieder her); der Engine-Anstoß daraus wird gleich wieder entwertet.
      if (this.lesson) this.exitLesson()
      this.generation++
      engine.stop()
      this.thinking = false
      this.analyzing = false
      this.blunderPrompt = false
      pendingAfterBlunder = null
      this.pattPrompt = null
      this.pendingPromotion = null
      this.review = {
        moves: hist.map((h) => ({
          san: h.san,
          uci: `${h.from}${h.to}${h.promotion ?? ''}`,
          color: h.color,
          captured: h.captured,
        })),
        fens: [hist[0]!.before, ...hist.map((h) => h.after)],
        index: 0,
        judgements: hist.map(() => null),
        best: hist.map(() => null),
        busy: false,
        pending: 0,
      }
      this.showReviewPosition()
    },

    reviewGoto(index: number) {
      const R = this.review
      if (!R) return
      R.index = Math.max(0, Math.min(R.moves.length, index))
      this.showReviewPosition()
    },
    reviewNext() {
      if (this.review) this.reviewGoto(this.review.index + 1)
    },
    reviewPrev() {
      if (this.review) this.reviewGoto(this.review.index - 1)
    },
    reviewFirst() {
      this.reviewGoto(0)
    },
    reviewLast() {
      if (this.review) this.reviewGoto(this.review.moves.length)
    },

    /** Überträgt die aktuelle Rückblick-Position in die Brettanzeige. */
    showReviewPosition() {
      const R = this.review
      if (!R) return
      const fen = R.fens[R.index]!
      this.fen = fen
      this.turnColor = fen.split(' ')[1] === 'b' ? 'black' : 'white'
      this.dests = new Map() // Brett ist reine Anzeige
      this.movesSan = R.moves.slice(0, R.index).map((m) => m.san)
      const played = R.moves.slice(0, R.index)
      this.capturedByWhite = played.filter((m) => m.color === 'w' && m.captured).map((m) => m.captured!)
      this.capturedByBlack = played.filter((m) => m.color === 'b' && m.captured).map((m) => m.captured!)
      try {
        this.inCheck = new Chess(fen).inCheck()
      } catch {
        this.inCheck = false
      }
      if (R.index > 0) {
        const uci = R.moves[R.index - 1]!.uci
        this.lastMove = [uci.slice(0, 2) as Square, uci.slice(2, 4) as Square]
      } else {
        this.lastMove = null
      }
      this.clearTip()
      this.feedback = null
      this.applyReviewFeedback()
      void this.judgeReviewMove(R.index)
    },

    /** Zeigt die (fertige) Bewertung des aktuellen Halbzugs samt Besser-Pfeil. */
    applyReviewFeedback() {
      const R = this.review
      if (!R || R.index === 0) return
      const j = R.judgements[R.index - 1]
      if (!j) return
      this.feedback = j
      const best = R.best[R.index - 1]
      const showBetter =
        j.verdict === 'okay' ||
        j.verdict === 'inaccuracy' ||
        j.verdict === 'mistake' ||
        j.verdict === 'blunder'
      if (best && showBetter) {
        this.tip = {
          stage: 2,
          orig: best.slice(0, 2) as Square,
          dest: best.slice(2, 4) as Square,
          san: '',
          text: '',
        }
        this.tipStage = 2
      }
    },

    /** Bewertet den Halbzug an Position `index` (lazy, Analysen gecacht). */
    async judgeReviewMove(index: number) {
      const R = this.review
      if (!R || index < 1) return
      if (R.judgements[index - 1]) return // schon bewertet (applyReviewFeedback lief)
      const gen = this.generation
      R.pending++
      R.busy = true
      try {
        const fenBefore = R.fens[index - 1]!
        const fenAfter = R.fens[index]!
        const before = await this.ensureAnalysis(fenBefore)
        if (gen !== this.generation || this.review !== R) return
        // Endstellungen (Matt/Patt) haben keine Analyse-Linien mehr.
        const terminal = new Chess(fenAfter).isGameOver()
        const after = terminal ? null : await this.ensureAnalysis(fenAfter)
        if (gen !== this.generation || this.review !== R) return
        R.judgements[index - 1] = judgeMove(
          fenBefore,
          R.moves[index - 1]!.uci,
          before.lines,
          after?.lines ?? [],
        )
        R.best[index - 1] = before.lines[0]?.move ?? null
        if (R.index === index) this.applyReviewFeedback()
        // Nächste Stellung vorab analysieren, damit das Blättern flüssig bleibt.
        const nextFen = R.fens[index + 1]
        if (nextFen && !new Chess(nextFen).isGameOver()) {
          void this.ensureAnalysis(nextFen).catch(() => {})
        }
      } catch {
        /* Bewertung optional – Blättern geht trotzdem */
      } finally {
        R.pending = Math.max(0, R.pending - 1)
        if (this.review === R) R.busy = R.pending > 0
      }
    },

    /** Rückblick schließen und zur echten Partie-Anzeige zurückkehren. */
    exitReview() {
      if (!this.review) return
      this.review = null
      this.feedback = null
      this.clearTip()
      this.sync()
      this.maybeEngineMove()
      void this.refreshEval()
      this.maybePrefetch()
    },

    /**
     * Vor Profilwechsel/Backup-Import: Engine anhalten und laufende Antworten
     * entwerten, damit zwischen dem Datentausch im localStorage und dem
     * Neuladen der Seite nichts mehr in den Spielstand schreibt.
     */
    prepareProfileChange() {
      this.generation++
      engine.stop()
      this.thinking = false
    },

    // ---------- Bewertung & Tipps ----------

    applyEval(analysis: Analysis) {
      const line = analysis.lines[0]
      if (!line) return
      const sideToMove = analysis.fen.split(' ')[1] === 'b' ? 'b' : 'w'
      const ev = lineToEval(line, sideToMove)
      this.evalWhite = ev.cpWhite
      this.mateWhite = ev.mateWhite ?? null
    },

    async refreshEval() {
      const settings = useSettings()
      if (!settings.showEval && !settings.blunderWarning) return
      if (this.status !== 'playing' || this.lesson || this.review) return
      const gen = this.generation
      const fen = this.fen
      try {
        const analysis = await engine.analyze(fen, { depth: 10, multiPv: 1 })
        if (gen === this.generation && fen === this.fen) this.applyEval(analysis)
      } catch {
        /* Eval optional */
      }
    },

    clearTip() {
      this.tip = null
      this.tipStage = 0
    },

    /** Eskalierende Tipp-Stufen; jede Stufe kostet einen Tipp. */
    async requestTip() {
      if (this.lesson) return // der Coach der Lektion übernimmt die Hinweise
      if (this.status !== 'playing' || !this.isPlayersTurn || this.analyzing) return
      if (this.blunderPrompt || this.pattPrompt || this.pendingPromotion) return
      if (this.tipStage >= 3) return
      if (this.tipsLeft === 0) return

      const gen = this.generation
      const fen = this.fen
      this.analyzing = true
      try {
        const analysis = await this.ensureAnalysis(fen)
        if (gen !== this.generation || fen !== this.fen) return
        const line = analysis.lines[0]
        if (!line) return

        const orig = line.move.slice(0, 2) as Square
        const dest = line.move.slice(2, 4) as Square
        const san = uciToSan(fen, line.move)
        const stage = this.tipStage + 1
        let text: string
        if (stage === 1) {
          const piece = chess.get(orig)
          text = piece
            ? `Schau dir ${withArticleAkk(piece.type)} auf ${orig} genauer an!`
            : `Schau dir das Feld ${orig} genauer an!`
        } else if (stage === 2) {
          text = `Bester Zug: ${sanToGerman(san)}`
        } else {
          text = explainBestMove(fen, analysis.lines)
        }
        this.tipStage = stage
        this.tip = { stage, orig, dest, san, text }
        if (this.tipsLeft > 0) this.tipsLeft--
        this.applyEval(analysis)
        this.persist()
      } catch {
        if (gen !== this.generation || fen !== this.fen) return
        // Vorhandene Markierung behalten, nur den Text austauschen – ein
        // Platzhalter-Feld würde sonst als grüner Kreis auf dem Brett landen.
        this.tip = {
          stage: this.tip?.stage ?? 0,
          orig: this.tip?.orig ?? 'a1',
          dest: this.tip?.dest ?? 'a1',
          san: this.tip?.san ?? '',
          text: 'Der Tipp konnte gerade nicht berechnet werden – versuch es gleich noch einmal.',
        }
      } finally {
        if (gen === this.generation) this.analyzing = false
      }
    },

    // ---------- Feedback ----------

    moveEffects(captured: boolean) {
      const settings = useSettings()
      const ended = this.status !== 'playing'
      if (settings.sound) {
        if (ended && this.status === 'checkmate') {
          // Gegen den Computer nur jubeln, wenn der Mensch gewonnen hat.
          const lost = this.effectiveMode === 'ai' && this.winner !== this.effectivePlayerColor
          if (lost) sounds.lose()
          else sounds.win()
        } else if (this.inCheck) sounds.check()
        else if (captured) sounds.capture()
        else sounds.move()
      }
      if (settings.haptics) {
        if (this.inCheck) vibrate([40, 60, 40])
        else if (captured) vibrate(35)
      }
    },

    onGameEnd() {
      // Sounds laufen bereits über moveEffects(); hier nur sichern.
      this.persist()
    },
  },
})

// Nicht-reaktive Modulzustände
const analysisCache = new Map<string, Analysis>()
const analysisInflight = new Map<string, Promise<Analysis>>()
let pendingAfterBlunder: (() => void) | null = null
/** true, während ein per Patt-Warnung bestätigter Zug ausgeführt wird. */
let pattApproved = false
/** Timer für automatische Lektionszüge (Demo/Gegner). */
let lessonTimer: ReturnType<typeof setTimeout> | null = null

/** PGN-Datum in Ortszeit (toISOString wäre UTC – nach Mitternacht der Vortag). */
function localDateStamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}

function uciToSan(fen: string, uci: string): string {
  try {
    const c = new Chess(fen)
    const move = c.move({
      from: uci.slice(0, 2) as Square,
      to: uci.slice(2, 4) as Square,
      promotion: (uci[4] as 'q' | 'r' | 'b' | 'n' | undefined) ?? undefined,
    })
    return move.san
  } catch {
    return uci
  }
}

function withArticleAkk(type: string): string {
  const name = pieceNameDe(type)
  if (name === 'Dame') return 'deine Dame'
  if (name === 'Bauer') return 'deinen Bauern' // schwache Deklination
  return `deinen ${name}`
}

function withArticleNom(type: string): string {
  const name = pieceNameDe(type)
  return name === 'Dame' ? 'deine Dame' : `dein ${name}`
}
