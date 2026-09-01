import { defineStore } from 'pinia'
import { Chess, type Square } from 'chess.js'
import { engine } from '../engine/engine'
import { lineToEval, type Analysis } from '../engine/types'
import { explainBestMove, pieceNameDe, sanToGerman } from '../lib/explain'
import { judgeMove, type MoveJudgement } from '../lib/judge'
import { sounds, vibrate } from '../lib/sound'
import { useSettings } from './settings'

// Die Chess-Instanz bleibt bewusst außerhalb des reaktiven Stores.
const chess = new Chess()

const GAME_KEY = 'schach.game.v1'
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

interface PersistedGame {
  pgn: string
  tipsLeft: number
  status: GameStatus
  winner: 'white' | 'black' | null
}

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
    isPlayersTurn(): boolean {
      const settings = useSettings()
      if (settings.mode === 'pvp') return true
      return this.turnColor === settings.playerColor && !this.thinking
    },
  },

  actions: {
    // ---------- Initialisierung & Persistenz ----------

    async initApp() {
      const settings = useSettings()
      settings.persistOnChange()
      this.restore()
      this.orientation = settings.mode === 'ai' ? settings.playerColor : 'white'
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
      try {
        const data: PersistedGame = {
          pgn: chess.pgn(),
          tipsLeft: this.tipsLeft,
          status: this.status,
          winner: this.winner,
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
          const data = JSON.parse(raw) as PersistedGame
          chess.loadPgn(data.pgn)
          this.tipsLeft = data.tipsLeft
          this.status = data.status
          this.winner = data.winner
          this.sync()
          return
        }
      } catch {
        /* Defekter Spielstand: neu anfangen */
      }
      chess.reset()
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
      this.persist()
    },

    // ---------- Partieverwaltung ----------

    newGame() {
      const settings = useSettings()
      this.generation++
      engine.stop()
      chess.reset()
      this.status = 'playing'
      this.winner = null
      this.thinking = false
      this.analyzing = false
      this.blunderPrompt = false
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
      if (this.status !== 'playing') return
      const settings = useSettings()
      this.status = 'resigned'
      this.winner =
        settings.mode === 'ai'
          ? settings.playerColor === 'white'
            ? 'black'
            : 'white'
          : this.turnColor === 'white'
            ? 'black'
            : 'white'
      this.generation++
      engine.stop()
      this.thinking = false
      this.persist()
    },

    flipBoard() {
      this.orientation = this.orientation === 'white' ? 'black' : 'white'
    },

    exportPgn(): string {
      const settings = useSettings()
      const white =
        settings.mode === 'ai' && settings.playerColor === 'black'
          ? `Computer (Stufe ${settings.aiLevel})`
          : 'Spieler Weiß'
      const black =
        settings.mode === 'ai' && settings.playerColor === 'white'
          ? `Computer (Stufe ${settings.aiLevel})`
          : 'Spieler Schwarz'
      chess.setHeader('Event', 'SchachTrainer Partie')
      chess.setHeader('Date', new Date().toISOString().slice(0, 10).replaceAll('-', '.'))
      chess.setHeader('White', white)
      chess.setHeader('Black', black)
      if (this.status === 'checkmate' || this.status === 'resigned') {
        chess.setHeader('Result', this.winner === 'white' ? '1-0' : '0-1')
      } else if (this.status === 'stalemate' || this.status === 'draw') {
        chess.setHeader('Result', '1/2-1/2')
      }
      return chess.pgn()
    },

    // ---------- Züge ----------

    /** Vom Brett gemeldeter Zug des Menschen. */
    userMove(from: Square, to: Square) {
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

      // Patt-Schutz: Würde der Zug den Gegner sofort patt setzen, obwohl man
      // klar auf Gewinn steht, erst nachfragen (klassische Anfänger-Falle:
      // Dame erstickt den nackten König – Partie plötzlich unentschieden).
      if (settings.blunderWarning && !pattApproved) {
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
      if (settings.mode === 'pvp') {
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
      if (!settings.blunderWarning && !settings.showEval && !settings.moveFeedback) {
        then?.()
        return
      }
      try {
        // Etwas tiefer analysieren, wenn der Kommentar die Linien mitnutzt.
        const depth = settings.moveFeedback ? 12 : 10
        const analysis = await engine.analyze(this.fen, { depth, multiPv: 1 })
        if (gen !== this.generation || this.status !== 'playing') return
        this.applyEval(analysis)
        if (settings.moveFeedback) {
          void this.computeFeedback(fenBefore, playedUci, analysis.lines, gen)
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
      then?.()
      if (settings.mode === 'pvp') this.maybePrefetch()
    },

    /** Analyse mit Tipp-Tiefe, gecacht pro Stellung (Tipps, Zug-Kommentare, Prefetch). */
    async ensureAnalysis(fen: string): Promise<Analysis> {
      const cached = analysisCache.get(fen)
      if (cached) return cached
      const analysis = await engine.analyze(fen, { depth: 13, multiPv: 3 })
      analysisCache.set(fen, analysis)
      return analysis
    },

    /**
     * Analysiert die aktuelle Stellung im Hintergrund vor, solange der Spieler
     * nachdenkt – der Zug-Kommentar (und der erste Tipp) kommt dann sofort.
     */
    maybePrefetch() {
      const settings = useSettings()
      if (!settings.moveFeedback || this.status !== 'playing') return
      if (settings.mode === 'ai' && this.turnColor !== settings.playerColor) return
      void this.ensureAnalysis(this.fen).catch(() => {})
    },

    async computeFeedback(
      fenBefore: string,
      playedUci: string,
      linesAfter: Analysis['lines'],
      gen: number,
    ) {
      try {
        const before = await this.ensureAnalysis(fenBefore)
        if (gen !== this.generation) return
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
      if (this.status !== 'playing' || settings.mode !== 'ai') return
      const gen = this.generation
      this.thinking = true
      try {
        const uci = await engine.bestMoveForLevel(this.fen, settings.aiLevel)
        if (gen !== this.generation || this.status !== 'playing') return
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
      const settings = useSettings()
      if (
        settings.mode === 'ai' &&
        this.status === 'playing' &&
        this.turnColor !== settings.playerColor &&
        !this.thinking
      ) {
        void this.engineReply()
      }
    },

    undo() {
      const settings = useSettings()
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

      if (settings.mode === 'ai') {
        // Engine-Antwort mit zurücknehmen, damit der Mensch wieder am Zug ist.
        chess.undo()
        if (chess.turn() !== (settings.playerColor === 'white' ? 'w' : 'b')) {
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
      if (this.status !== 'playing') return
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
      if (this.status !== 'playing' || !this.isPlayersTurn || this.analyzing) return
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
        this.tip = {
          stage: this.tipStage || 1,
          orig: 'a1',
          dest: 'a1',
          san: '',
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
        if (ended && this.status === 'checkmate') sounds.win()
        else if (this.inCheck) sounds.check()
        else if (captured) sounds.capture()
        else sounds.move()
      }
      if (settings.haptics) {
        if (this.inCheck) vibrate([40, 60, 40])
        else if (captured) vibrate(35)
      }
    },

    onGameEnd() {
      const settings = useSettings()
      if (settings.sound && this.status === 'checkmate') {
        // Siegsound kam schon über feedback(); hier nichts weiter.
      }
      this.persist()
    },
  },
})

// Nicht-reaktive Modulzustände
const analysisCache = new Map<string, Analysis>()
let pendingAfterBlunder: (() => void) | null = null
/** true, während ein per Patt-Warnung bestätigter Zug ausgeführt wird. */
let pattApproved = false

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
