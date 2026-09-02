import { describe, it, expect } from 'vitest'
import { Chess } from 'chess.js'
import type { EngineLine } from '../engine/types'
import { judgeMove } from './judge'

/** Führt einen UCI-Zug aus und wirft bei Illegalität → verifiziert die Stellung. */
function applyUci(chess: Chess, uci: string) {
  return chess.move({
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci[4] : undefined,
  })
}

/** Baut die Stellung, prüft dass alle Züge legal sind, gibt die Endstellung zurück. */
function verifyMoves(fen: string, moves: string[]) {
  const chess = new Chess(fen)
  for (const uci of moves) applyUci(chess, uci)
  return chess
}

const START = new Chess().fen()
const BEST_START: EngineLine[] = [{ move: 'g1f3', cp: 30, pv: ['g1f3'] }]

/** Antwortlinie des Gegners (Schwarz) nach 1.e4 mit gegebener Bewertung (Sicht Schwarz). */
function afterE4(cp: number): EngineLine[] {
  return [{ move: 'e7e5', cp, pv: ['e7e5'] }]
}

describe('judgeMove – Sonderfälle', () => {
  it('lobt den besten Zug mit Erklärung aus explainBestMove', () => {
    // Ungedeckter Läufer c5 wird geschlagen – bester Zug gespielt.
    const fen = '4k3/8/8/2b5/8/3N4/8/4K3 w - - 0 1'
    verifyMoves(fen, ['d3c5'])
    const linesBefore: EngineLine[] = [{ move: 'd3c5', cp: 300, pv: ['d3c5'] }]
    const linesAfter: EngineLine[] = [{ move: 'e8e7', cp: -300, pv: ['e8e7'] }]

    const j = judgeMove(fen, 'd3c5', linesBefore, linesAfter)
    expect(j.verdict).toBe('best')
    expect(j.title).toBe('Sehr gut!')
    expect(j.text).toMatch(/Läufer/)
    expect(j.text).toMatch(/ungedeckt/)
  })

  it('feiert ein gesetztes Schachmatt (linesAfter leer)', () => {
    const fen = '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1'
    const chess = verifyMoves(fen, ['a1a8'])
    expect(chess.isCheckmate()).toBe(true)

    const j = judgeMove(fen, 'a1a8', [{ move: 'a1a8', mate: 1, pv: ['a1a8'] }], [])
    expect(j.verdict).toBe('best')
    expect(j.title).toBe('Schachmatt!')
    expect(j.text).toMatch(/mattgesetzt/)
    expect(j.text.length).toBeGreaterThan(0)
  })

  it('wertet Patt als Rettung, wenn der Zieher klar schlechter stand', () => {
    // Weiß (nur König) pattgesetzt Schwarz (Ka1 + Ba2) mit Kc1.
    const fen = '8/8/8/8/8/8/p1K5/k7 w - - 0 1'
    const chess = verifyMoves(fen, ['c2c1'])
    expect(chess.isStalemate()).toBe(true)

    const j = judgeMove(fen, 'c2c1', [{ move: 'c2c1', cp: -500, pv: ['c2c1'] }], [])
    expect(j.verdict).toBe('good')
    expect(j.text).toMatch(/Patt/)
    expect(j.text).toMatch(/rettest/)
    expect(j.text).toMatch(/Unentschieden/)
  })

  it('wertet Patt als groben Fehler, wenn der Zieher besser stand', () => {
    // Dg6?? pattsetzt den schwarzen König in der Ecke – statt Dg7#.
    const fen = '7k/8/5K2/8/8/6Q1/8/8 w - - 0 1'
    const chess = verifyMoves(fen, ['g3g6'])
    expect(chess.isStalemate()).toBe(true)
    // Verifiziere: Dg7 wäre Matt gewesen.
    expect(verifyMoves(fen, ['g3g7']).isCheckmate()).toBe(true)

    const j = judgeMove(fen, 'g3g6', [{ move: 'g3g7', mate: 1, pv: ['g3g7'] }], [])
    expect(j.verdict).toBe('blunder')
    expect(j.title).toBe('Grober Fehler')
    expect(j.text).toMatch(/Patt!/)
    expect(j.text).toMatch(/obwohl du besser standest/)
  })

  it('erkennt ein verpasstes Matt als Fehler, wenn der Zieher noch klar gewinnt', () => {
    // Matt in 2 mit 1.Kb6 war möglich; Th2 verpasst es, Weiß gewinnt trotzdem noch.
    const fen = 'k7/8/2K5/8/8/8/8/7R w - - 0 1'
    expect(verifyMoves(fen, ['c6b6', 'a8b8', 'h1h8']).isCheckmate()).toBe(true)
    verifyMoves(fen, ['h1h2'])

    const linesBefore: EngineLine[] = [{ move: 'c6b6', mate: 2, pv: ['c6b6', 'a8b8', 'h1h8'] }]
    const linesAfter: EngineLine[] = [{ move: 'a8b8', cp: -600, pv: ['a8b8'] }]
    const j = judgeMove(fen, 'h1h2', linesBefore, linesAfter)
    expect(j.verdict).toBe('mistake')
    expect(j.title).toBe('Fehler')
    expect(j.text).toMatch(/Du hattest Matt in 2 Zügen!/)
    expect(j.text).toMatch(/Besser war Kb6\./)
  })

  it('erkennt ein verpasstes Matt als Patzer, wenn der Vorteil dabei verloren geht', () => {
    const fen = 'k7/8/2K5/8/8/8/8/7R w - - 0 1'
    verifyMoves(fen, ['h1h2'])
    const linesBefore: EngineLine[] = [{ move: 'c6b6', mate: 2, pv: ['c6b6', 'a8b8', 'h1h8'] }]
    // Nach dem Zug ist die Stellung nur noch ausgeglichen (Sicht Schwarz: 0).
    const linesAfter: EngineLine[] = [{ move: 'a8b8', cp: 0, pv: ['a8b8'] }]
    const j = judgeMove(fen, 'h1h2', linesBefore, linesAfter)
    expect(j.verdict).toBe('blunder')
    expect(j.title).toBe('Grober Fehler')
    expect(j.text).toMatch(/Du hattest Matt in 2 Zügen!/)
  })

  it('erkennt ein eingestelltes Matt (Gegner mattiert danach)', () => {
    // Nur h3 (Luft) rettet; Kh1?? erlaubt Ta1#.
    const fen = '6k1/8/8/8/8/8/r4PPP/6K1 w - - 0 1'
    const chess = verifyMoves(fen, ['g1h1', 'a2a1'])
    expect(chess.isCheckmate()).toBe(true)

    const linesBefore: EngineLine[] = [
      { move: 'h2h3', cp: -300, pv: ['h2h3'] },
      { move: 'g1h1', mate: -1, pv: ['g1h1', 'a2a1'] },
    ]
    const linesAfter: EngineLine[] = [{ move: 'a2a1', mate: 1, pv: ['a2a1'] }]
    const j = judgeMove(fen, 'g1h1', linesBefore, linesAfter)
    expect(j.verdict).toBe('blunder')
    expect(j.title).toBe('Grober Fehler')
    expect(j.text).toMatch(/Besser war h3\./)
    expect(j.text).toMatch(/Dein Gegner kann dich jetzt im nächsten Zug mattsetzen/)
  })

  it('beschreibt die Material-Drohung des Gegners konkret (pv-Simulation)', () => {
    // Kf2?? lässt den Turm d1 hängen: Schwarz droht Txd1.
    const fen = '3rk3/8/8/8/8/8/8/3R2K1 w - - 0 1'
    const after = verifyMoves(fen, ['g1f2'])
    const captured = applyUci(after, 'd8d1')
    expect(captured.captured).toBe('r')

    const linesBefore: EngineLine[] = [{ move: 'd1d8', cp: 0, pv: ['d1d8', 'e8d8'] }]
    const linesAfter: EngineLine[] = [{ move: 'd8d1', cp: 500, pv: ['d8d1'] }]
    const j = judgeMove(fen, 'g1f2', linesBefore, linesAfter)
    expect(j.verdict).toBe('mistake')
    expect(j.text).toMatch(/Besser war Txd8\+\./)
    expect(j.text).toMatch(/Dein Gegner kann jetzt deinen Turm gewinnen\./)
  })

  it('liefert bei illegalem Zug einen neutralen Fallback', () => {
    const j = judgeMove(START, 'e2e5', BEST_START, afterE4(0))
    expect(j.verdict).toBe('okay')
    expect(j.text).toBe('Der Zug konnte nicht bewertet werden.')
    // Auch bei kaputtem FEN.
    const j2 = judgeMove('kein-fen', 'e2e4', BEST_START, [])
    expect(j2.verdict).toBe('okay')
    expect(j2.text).toBe('Der Zug konnte nicht bewertet werden.')
  })
})

describe('judgeMove – Verlust-Schwellen (Weiß am Zug, 1.e4 statt bestem 1.Sf3 mit +30)', () => {
  it('Verlust ≤ 30 → good, kurz und ermutigend ohne Drohung', () => {
    // Sicht Schwarz -10 → Sicht Weiß +10 → Verlust 20.
    verifyMoves(START, ['e2e4', 'e7e5'])
    const j = judgeMove(START, 'e2e4', BEST_START, afterE4(-10))
    expect(j.verdict).toBe('good')
    expect(j.title).toBe('Guter Zug')
    expect(j.text.length).toBeGreaterThan(0)
    expect(j.text).not.toMatch(/Gegner/)
    expect(j.text).not.toMatch(/Besser war/)
  })

  it('Verlust ≤ 90 → okay, nennt den besseren Zug mit Begründung', () => {
    // Sicht Schwarz +30 → Sicht Weiß -30 → Verlust 60.
    const j = judgeMove(START, 'e2e4', BEST_START, afterE4(30))
    expect(j.verdict).toBe('okay')
    expect(j.title).toBe('Okay')
    expect(j.text).toMatch(/Besser war Sf3\./)
    expect(j.text).toMatch(/entwickelst/)
    expect(j.text).not.toMatch(/Gegner/)
  })

  it('Verlust ≤ 200 → inaccuracy mit Titel "Ungenau"', () => {
    // Verlust 150.
    const j = judgeMove(START, 'e2e4', BEST_START, afterE4(120))
    expect(j.verdict).toBe('inaccuracy')
    expect(j.title).toBe('Ungenau')
    expect(j.text).toMatch(/Besser war Sf3\./)
  })

  it('Verlust ≤ 500 → mistake mit Drohungs-Satz', () => {
    // Verlust 400; keine konkrete Drohung in der pv → allgemeiner Satz.
    const j = judgeMove(START, 'e2e4', BEST_START, afterE4(370))
    expect(j.verdict).toBe('mistake')
    expect(j.title).toBe('Fehler')
    expect(j.text).toMatch(/Besser war Sf3\./)
    expect(j.text).toMatch(/Dein Gegner steht danach deutlich besser\./)
  })

  it('Verlust > 500 → blunder mit Titel "Grober Fehler"', () => {
    // Verlust 930.
    const j = judgeMove(START, 'e2e4', BEST_START, afterE4(900))
    expect(j.verdict).toBe('blunder')
    expect(j.title).toBe('Grober Fehler')
    expect(j.text).toMatch(/Besser war Sf3\./)
    expect(j.text).toMatch(/Gegner/)
  })
})

describe('judgeMove – Vorzeichen, wenn Schwarz am Zug ist', () => {
  // Stellung nach 1.e4: Schwarz am Zug; cp der Linien ist Sicht SCHWARZ.
  const fenAfterE4 = (() => {
    const c = new Chess()
    c.move('e4')
    return c.fen()
  })()
  const bestBlack: EngineLine[] = [{ move: 'e7e5', cp: -20, pv: ['e7e5'] }]

  it('kleiner Verlust für Schwarz → good', () => {
    // Vorher Sicht Schwarz -20; nachher Sicht Weiß +30 → Sicht Schwarz -30 → Verlust 10.
    verifyMoves(fenAfterE4, ['g8f6'])
    const linesAfter: EngineLine[] = [{ move: 'b1c3', cp: 30, pv: ['b1c3'] }]
    const j = judgeMove(fenAfterE4, 'g8f6', bestBlack, linesAfter)
    expect(j.verdict).toBe('good')
  })

  it('großer Verlust für Schwarz → mistake (cp nachher ist Sicht Weiß!)', () => {
    // Vorher Sicht Schwarz -20; nachher Sicht Weiß +380 → Sicht Schwarz -380 → Verlust 360.
    const linesAfter: EngineLine[] = [{ move: 'e4e5', cp: 380, pv: ['e4e5'] }]
    const j = judgeMove(fenAfterE4, 'g8f6', bestBlack, linesAfter)
    expect(j.verdict).toBe('mistake')
    expect(j.title).toBe('Fehler')
    expect(j.text).toMatch(/Besser war e5\./)
  })
})

describe('judgeMove – verlorene Stellung (Gegner hat forciertes Matt)', () => {
  // Weiß: Kh1, Bauern g2 h2; Schwarz: Kg8, Dd3, Te8 – Schwarz mattet in Kürze.
  const fen = '4r1k1/8/8/8/8/3q4/6PP/7K w - - 0 1'

  it('längstes Durchhalten wird nicht als Patzer bewertet', () => {
    const before: EngineLine[] = [{ move: 'h1g1', mate: -3, pv: ['h1g1'] }]
    const after: EngineLine[] = [{ move: 'd3d1', mate: 3, pv: ['d3d1'] }]
    // g3 ist nicht der Engine-Zug, hält aber genauso lange durch.
    const j = judgeMove(fen, 'g2g3', before, after)
    expect(j.verdict).toBe('good')
    expect(j.text).toMatch(/schon verloren/)
  })

  it('deutlich schnelleres Matt ist ein Fehler, aber kein »Grober Fehler«', () => {
    const before: EngineLine[] = [{ move: 'h1g1', mate: -5, pv: ['h1g1'] }]
    const after: EngineLine[] = [{ move: 'd3f1', mate: 1, pv: ['d3f1'] }]
    const j = judgeMove(fen, 'g2g3', before, after)
    expect(j.verdict).toBe('mistake')
    expect(j.text).toMatch(/schneller/)
  })

  it('verpasstes Matt nennt den besseren Zug nur einmal', () => {
    // Weiß: Kg1, Ta1; Schwarz: Kh8 – Ta8# ist Matt in 1.
    const fen1 = '7k/8/8/8/8/8/6PP/R5K1 w - - 0 1'
    const before: EngineLine[] = [{ move: 'a1a8', mate: 1, pv: ['a1a8'] }]
    const after: EngineLine[] = [{ move: 'h8g8', cp: -900, pv: ['h8g8'] }]
    const j = judgeMove(fen1, 'a1b1', before, after)
    expect(j.text).toMatch(/Du hattest Matt in einem Zug!/)
    expect(j.text.match(/Ta8/g)?.length).toBe(1)
  })
})
