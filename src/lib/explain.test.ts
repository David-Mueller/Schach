import { describe, it, expect } from 'vitest'
import { Chess } from 'chess.js'
import type { EngineLine } from '../engine/types'
import { explainBestMove, pieceNameDe, sanToGerman } from './explain'

/** Führt einen UCI-Zug aus und wirft bei Illegalität → verifiziert die Stellung. */
function applyUci(chess: Chess, uci: string) {
  return chess.move({
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci[4] : undefined,
  })
}

/** Baut die Stellung, prüft dass alle pv-Züge legal sind, gibt den ersten Move zurück. */
function verifyPv(fen: string, pv: string[]) {
  const chess = new Chess(fen)
  const moves = pv.map((uci) => applyUci(chess, uci))
  const first = moves[0]
  if (!first) throw new Error('pv darf nicht leer sein')
  return { chess, first, moves }
}

describe('pieceNameDe', () => {
  it('liefert alle sechs deutschen Figurennamen', () => {
    expect(pieceNameDe('p')).toBe('Bauer')
    expect(pieceNameDe('n')).toBe('Springer')
    expect(pieceNameDe('b')).toBe('Läufer')
    expect(pieceNameDe('r')).toBe('Turm')
    expect(pieceNameDe('q')).toBe('Dame')
    expect(pieceNameDe('k')).toBe('König')
  })
})

describe('sanToGerman', () => {
  it('übersetzt Figurenkürzel in deutsche Notation', () => {
    expect(sanToGerman('Nf3')).toBe('Sf3')
    expect(sanToGerman('Qxe5+')).toBe('Dxe5+')
    expect(sanToGerman('Rb1')).toBe('Tb1')
    expect(sanToGerman('Bxc4')).toBe('Lxc4')
    expect(sanToGerman('Kd2')).toBe('Kd2')
    expect(sanToGerman('exd8=Q#')).toBe('exd8=D#')
    expect(sanToGerman('O-O-O')).toBe('O-O-O')
    expect(sanToGerman('e4')).toBe('e4')
  })
})

describe('explainBestMove', () => {
  it('erkennt Matt in 1 (Grundreihenmatt)', () => {
    const fen = '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1'
    // Verifiziere: Ta8 ist legal und tatsächlich Schachmatt.
    const { chess, first } = verifyPv(fen, ['a1a8'])
    expect(first.san).toBe('Ra8#')
    expect(chess.isCheckmate()).toBe(true)

    const lines: EngineLine[] = [{ move: 'a1a8', mate: 1, pv: ['a1a8'] }]
    const text = explainBestMove(fen, lines)
    expect(text).toMatch(/Schachmatt/)
    expect(text).toContain('Ta8')
  })

  it('erkennt Matt in 2', () => {
    const fen = 'k7/8/2K5/8/8/8/8/7R w - - 0 1'
    // Verifiziere die komplette Mattfolge: 1.Kb6 Kb8 2.Th8#
    const { chess } = verifyPv(fen, ['c6b6', 'a8b8', 'h1h8'])
    expect(chess.isCheckmate()).toBe(true)

    const lines: EngineLine[] = [{ move: 'c6b6', mate: 2, pv: ['c6b6', 'a8b8', 'h1h8'] }]
    const text = explainBestMove(fen, lines)
    expect(text).toMatch(/in 2 Zügen Matt/)
  })

  it('erkennt die Rettung vor dem Matt (alle anderen Linien verlieren)', () => {
    // Weiß: Kg1, Bf2 g2 h2; Schwarz: Ta2, Kg8. Nur Luft schaffen rettet.
    const fen = '6k1/8/8/8/8/8/r4PPP/6K1 w - - 0 1'
    verifyPv(fen, ['h2h3']) // bester Zug ist legal
    verifyPv(fen, ['g1h1', 'a2a1']) // Alternative + Mattdrohung sind legal

    const lines: EngineLine[] = [
      { move: 'h2h3', cp: -300, pv: ['h2h3'] },
      { move: 'g1h1', mate: -2, pv: ['g1h1', 'a2a1'] },
    ]
    const text = explainBestMove(fen, lines)
    expect(text).toMatch(/rettet/)
    expect(text).toMatch(/Matt/)
  })

  it('erkennt das Schlagen einer ungedeckten Hängefigur', () => {
    // Schwarzer Läufer c5 ist ungedeckt, weißer Springer d3 kann ihn schlagen.
    const fen = '4k3/8/8/2b5/8/3N4/8/4K3 w - - 0 1'
    const { first } = verifyPv(fen, ['d3c5'])
    expect(first.captured).toBe('b')
    // Verifiziere: c5 ist wirklich ungedeckt.
    expect(new Chess(fen).attackers('c5', 'b')).toHaveLength(0)

    const lines: EngineLine[] = [{ move: 'd3c5', cp: 300, pv: ['d3c5'] }]
    const text = explainBestMove(fen, lines)
    expect(text).toMatch(/Läufer/)
    expect(text).toMatch(/ungedeckt/)
    expect(text).toContain('c5')
    expect(text).toMatch(/schlagen/)
  })

  it('erkennt Materialgewinn über die pv-Simulation (Abtausch mit Gewinn)', () => {
    // Txd8+ Kxd8: Weiß gibt Turm (5), gewinnt Dame (9) → +4 Bauerneinheiten.
    const fen = '3qk3/8/8/8/8/8/8/3RK3 w - - 0 1'
    const { moves } = verifyPv(fen, ['d1d8', 'e8d8'])
    expect(moves[0]?.captured).toBe('q')
    expect(moves[1]?.captured).toBe('r')

    const lines: EngineLine[] = [{ move: 'd1d8', cp: 400, pv: ['d1d8', 'e8d8'] }]
    const text = explainBestMove(fen, lines)
    expect(text).toMatch(/gewinnst du/)
    expect(text).toMatch(/Material/)
    expect(text).toMatch(/4 Bauern/)
  })

  it('erkennt eine Springergabel gegen Dame und Turm', () => {
    // Sf4 greift gleichzeitig Dd5 und Th5 an.
    const fen = '4k3/8/8/3q3r/8/8/4N3/4K3 w - - 0 1'
    verifyPv(fen, ['e2f4'])
    // Verifiziere den Angriff auf beide Figuren nach dem Zug.
    const after = new Chess(fen)
    applyUci(after, 'e2f4')
    expect(after.attackers('d5', 'w')).toContain('f4')
    expect(after.attackers('h5', 'w')).toContain('f4')

    const lines: EngineLine[] = [{ move: 'e2f4', cp: 250, pv: ['e2f4'] }]
    const text = explainBestMove(fen, lines)
    expect(text).toMatch(/Gabel/)
    expect(text).toMatch(/Springer/)
    expect(text).toMatch(/Dame/)
    expect(text).toMatch(/Turm/)
  })

  it('erkennt das Retten einer angegriffenen Figur', () => {
    // Turm c3 ist vom Bauern b4 angegriffen und ungedeckt; Th3 rettet ihn.
    const fen = '4k3/8/8/8/1p6/2R5/8/4K3 w - - 0 1'
    verifyPv(fen, ['c3h3'])
    // Verifiziere: c3 hängt (Bauer greift an, kein Verteidiger).
    const pre = new Chess(fen)
    expect(pre.attackers('c3', 'b')).toContain('b4')
    expect(pre.attackers('c3', 'w')).toHaveLength(0)

    const lines: EngineLine[] = [{ move: 'c3h3', cp: 100, pv: ['c3h3'] }]
    const text = explainBestMove(fen, lines)
    expect(text).toMatch(/Turm/)
    expect(text).toMatch(/angegriffen/)
    expect(text).toMatch(/Sicherheit/)
  })

  it('erkennt die Rochade', () => {
    const fen = 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4'
    const { first } = verifyPv(fen, ['e1g1'])
    expect(first.san).toBe('O-O')

    const lines: EngineLine[] = [{ move: 'e1g1', cp: 30, pv: ['e1g1'] }]
    const text = explainBestMove(fen, lines)
    expect(text).toMatch(/Rochade/)
    expect(text).toMatch(/Sicherheit/)
    expect(text).toMatch(/Turm/)
  })

  it('erkennt eine Umwandlung', () => {
    const fen = '8/P6k/8/8/8/8/8/4K3 w - - 0 1'
    const { first } = verifyPv(fen, ['a7a8q'])
    expect(first.promotion).toBe('q')

    const lines: EngineLine[] = [{ move: 'a7a8q', cp: 800, pv: ['a7a8q'] }]
    const text = explainBestMove(fen, lines)
    expect(text).toMatch(/Bauer/)
    expect(text).toMatch(/verwandelt/)
    expect(text).toMatch(/Dame/)
  })

  it('erkennt einen Schachzug ohne anderen taktischen Grund', () => {
    // Th8+ – kein Materialgewinn, keine Gabel, kein Matt laut Engine.
    const fen = '5k2/8/8/8/8/8/8/K6R w - - 0 1'
    const { first } = verifyPv(fen, ['h1h8'])
    expect(first.san).toContain('+')

    const lines: EngineLine[] = [{ move: 'h1h8', cp: 200, pv: ['h1h8', 'f8f7'] }]
    const text = explainBestMove(fen, lines)
    expect(text).toMatch(/Schach/)
    expect(text).toMatch(/König/)
  })

  it('erklärt Entwicklung als Fallback (Sf3 aus der Grundstellung)', () => {
    const fen = new Chess().fen()
    verifyPv(fen, ['g1f3'])
    const lines: EngineLine[] = [{ move: 'g1f3', cp: 30, pv: ['g1f3'] }]
    const text = explainBestMove(fen, lines)
    expect(text).toMatch(/entwickelst/)
    expect(text).toMatch(/Springer/)
  })

  it('erklärt Zentrumskontrolle als Fallback (e4 aus der Grundstellung)', () => {
    const fen = new Chess().fen()
    verifyPv(fen, ['e2e4'])
    const lines: EngineLine[] = [{ move: 'e2e4', cp: 30, pv: ['e2e4'] }]
    const text = explainBestMove(fen, lines)
    expect(text).toMatch(/Zentrum/)
  })

  it('liefert eine generische Erklärung, wenn keine Regel greift', () => {
    const fen = new Chess().fen()
    verifyPv(fen, ['a2a3'])
    const lines: EngineLine[] = [{ move: 'a2a3', cp: 0, pv: ['a2a3'] }]
    const text = explainBestMove(fen, lines)
    expect(text.length).toBeGreaterThan(0)
    expect(text).toMatch(/verbessert/)
  })

  it('ergänzt den Hinweis, wenn der beste Zug deutlich besser ist (≥150 cp)', () => {
    const fen = '4k3/8/8/2b5/8/3N4/8/4K3 w - - 0 1'
    verifyPv(fen, ['d3c5'])
    verifyPv(fen, ['e1e2'])
    const lines: EngineLine[] = [
      { move: 'd3c5', cp: 300, pv: ['d3c5'] },
      { move: 'e1e2', cp: -50, pv: ['e1e2'] },
    ]
    const text = explainBestMove(fen, lines)
    expect(text).toMatch(/ungedeckt/)
    expect(text).toMatch(/deutlich schlechter/)
  })

  it('bricht die pv-Simulation bei illegalen Zügen sauber ab und antwortet nie leer', () => {
    const fen = '4k3/8/8/2b5/8/3N4/8/4K3 w - - 0 1'
    // pv enthält nach dem ersten Zug Unsinn – darf nicht werfen.
    const lines: EngineLine[] = [{ move: 'd3c5', cp: 300, pv: ['d3c5', 'zz99', 'a1a1'] }]
    const text = explainBestMove(fen, lines)
    expect(text.length).toBeGreaterThan(0)
    expect(text).toMatch(/[.!]$/)
    // Erklärungen enden immer mit Satzzeichen und sind nie leer – auch bei kaputtem Zug.
    expect(explainBestMove(fen, [{ move: 'zz99', cp: 0, pv: ['zz99'] }])).toMatch(/[.!]$/)
  })
})
