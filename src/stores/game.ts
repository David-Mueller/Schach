import { defineStore } from 'pinia'
import { Chess, type Square } from 'chess.js'
import { engine } from '../engine/engine'
import { lineToEval, type Analysis } from '../engine/types'
import { explainBestMove, pieceNameDe, sanToGerman } from '../lib/explain'
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

    evalWhite: null as number | null,
    mateWhite: null as number | null,

    blunderPrompt: false,
    pendingPromotion: null as { from: Square; to: Square } | null,

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
      this.clearTip()
      this.tipsLeft = settings.tipBudget
      this.evalWhite = null
      this.mateWhite = null
      this.orientation = settings.mode === 'ai' ? settings.playerColor : 'white'
      analysisCache.clear()
      this.sync()
      void engine.newGame().catch(() => {})
      this.maybeEngineMove()
      void this.refreshEval()
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
      if (this.status !== 'playing' || !this.isPlayersTurn || this.blunderPrompt) {
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
      const prevEvalWhite = this.evalWhite
      let move
      try {
        move = chess.move({ from, to, promotion })
      } catch {
        this.sync()
        return
      }
      this.clearTip()
      this.sync()
      this.feedback(move.captured !== undefined)
      if (this.status !== 'playing') {
        this.onGameEnd()
        return
      }
      if (settings.mode === 'pvp') {
        if (settings.autoFlip) this.orientation = this.turnColor
        void this.checkBlunderThen(prevEvalWhite, move.color, null)
      } else {
        void this.checkBlunderThen(prevEvalWhite, move.color, () => this.engineReply())
      }
    },

    /**
     * Prüft nach einem Zug auf groben Patzer (Eval-Sprung > 2 Bauern).
     * Bei Patzer erscheint die Warnung; `then` (Engine-Antwort) läuft erst danach.
     */
    async checkBlunderThen(
      prevEvalWhite: number | null,
      moverColor: 'w' | 'b',
      then: (() => void) | null,
    ) {
      const settings = useSettings()
      const gen = this.generation
      if (!settings.blunderWarning && !settings.showEval) {
        then?.()
        return
      }
      try {
        const analysis = await engine.analyze(this.fen, { depth: 10, multiPv: 1 })
        if (gen !== this.generation || this.status !== 'playing') return
        this.applyEval(analysis)
        const line = analysis.lines[0]
        if (settings.blunderWarning && line && prevEvalWhite !== null) {
          const now = lineToEval(line, chess.turn()).cpWhite
          const sign = moverColor === 'w' ? 1 : -1
          const drop = (prevEvalWhite - now) * sign
          if (drop >= BLUNDER_THRESHOLD) {
            sounds.warn()
            this.blunderPrompt = true
            pendingAfterBlunder = then
            return
          }
        }
      } catch {
        /* Eval optional – Partie geht weiter */
      }
      then?.()
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
          this.feedback(move.captured !== undefined)
          if (this.status !== 'playing') this.onGameEnd()
          else void this.refreshEval()
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
      this.clearTip()

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
        let analysis = analysisCache.get(fen)
        if (!analysis) {
          analysis = await engine.analyze(fen, { depth: 13, multiPv: 3 })
          analysisCache.set(fen, analysis)
        }
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

    feedback(captured: boolean) {
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
