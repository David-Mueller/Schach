// Regelbasierte, kindgerechte Erklärung, warum der beste Engine-Zug gut ist.
// Kein LLM, keine API – nur chess.js-Analyse der Engine-Ausgabe.

import { Chess } from 'chess.js'
import type { Color, Move, Square } from 'chess.js'
import type { EngineLine } from '../engine/types'

/** Materialwerte in Bauerneinheiten (König sehr hoch, damit er nie "billig" ist). */
const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100,
}

interface PieceDe {
  /** Nominativ, z. B. "Springer". */
  name: string
  /** Bestimmter Artikel: "der" oder "die". */
  article: 'der' | 'die'
  /** Akkusativ mit unbestimmtem Artikel, z. B. "einen Springer". */
  acc: string
  /** Akkusativ-Pronomen: "ihn" oder "sie". */
  pronoun: 'ihn' | 'sie'
}

const PIECES_DE: Record<'p' | 'n' | 'b' | 'r' | 'q' | 'k', PieceDe> = {
  p: { name: 'Bauer', article: 'der', acc: 'einen Bauern', pronoun: 'ihn' },
  n: { name: 'Springer', article: 'der', acc: 'einen Springer', pronoun: 'ihn' },
  b: { name: 'Läufer', article: 'der', acc: 'einen Läufer', pronoun: 'ihn' },
  r: { name: 'Turm', article: 'der', acc: 'einen Turm', pronoun: 'ihn' },
  q: { name: 'Dame', article: 'die', acc: 'eine Dame', pronoun: 'sie' },
  k: { name: 'König', article: 'der', acc: 'einen König', pronoun: 'ihn' },
}

/** Nachschlagen mit beliebigem String (z. B. aus chess.js-Moves). */
function pieceDe(type: string): PieceDe | undefined {
  return (PIECES_DE as Record<string, PieceDe | undefined>)[type.toLowerCase()]
}

/** Deutscher Figurenname zum chess.js-Typ ('p'|'n'|'b'|'r'|'q'|'k'). */
export function pieceNameDe(type: string): string {
  return pieceDe(type)?.name ?? 'Figur'
}

/** SAN nach deutscher Notation (N→S, B→L, R→T, Q→D, K→K), z. B. "Nf3"→"Sf3". */
export function sanToGerman(san: string): string {
  // Nur Großbuchstaben sind Figurenkürzel; Felder sind klein, "O-O" bleibt.
  return san.replace(/N/g, 'S').replace(/B/g, 'L').replace(/R/g, 'T').replace(/Q/g, 'D')
}

/** Generischer Fallback-Satz von explainBestMove (exportiert zur Filterung in judge.ts). */
export const GENERIC_EXPLANATION = 'Dieser Zug verbessert deine Stellung.'
const GENERIC = GENERIC_EXPLANATION
const CENTER_SQUARES: Square[] = ['d4', 'e4', 'd5', 'e5']

export interface MoveInput {
  from: string
  to: string
  promotion?: string
}

/** UCI ("e2e4", "e7e8q") → Eingabe für chess.move(). */
export function uciToMoveInput(uci: string): MoveInput {
  const input: MoveInput = { from: uci.slice(0, 2), to: uci.slice(2, 4) }
  const promotion = uci[4]
  if (promotion !== undefined) input.promotion = promotion
  return input
}

function otherColor(color: Color): Color {
  return color === 'w' ? 'b' : 'w'
}

function valueOf(type: string): number {
  return PIECE_VALUES[type] ?? 0
}

/** Kleinster Materialwert unter den Angreifern von `square` in Farbe `by`. */
function minAttackerValue(chess: Chess, square: Square, by: Color): number {
  let min = Infinity
  for (const from of chess.attackers(square, by)) {
    const piece = chess.get(from)
    if (piece) min = Math.min(min, valueOf(piece.type))
  }
  return min
}

/**
 * Steht die Figur auf `square` "ein"? (Angegriffen und ungedeckt,
 * oder von einer billigeren Figur angegriffen.)
 */
function isHanging(chess: Chess, square: Square): boolean {
  const piece = chess.get(square)
  if (!piece) return false
  const enemy = otherColor(piece.color)
  const attackers = chess.attackers(square, enemy)
  if (attackers.length === 0) return false
  const defenders = chess.attackers(square, piece.color)
  if (defenders.length === 0) return true
  return minAttackerValue(chess, square, enemy) < valueOf(piece.type)
}

/** Ergebnis einer pv-Materialsimulation aus Sicht des Ziehenden. */
export interface PvMaterial {
  /** Netto-Materialbilanz in Bauerneinheiten (positiv: Ziehender gewinnt Material). */
  gain: number
  /** Wertvollster Figurentyp ('p'|'n'|'b'|'r'|'q'), den der Ziehende schlägt, falls vorhanden. */
  biggestCapture?: string
}

/**
 * Simuliert die pv auf `fen` (max. `maxPlies` Halbzüge; bricht bei illegalem
 * pv-Zug sauber ab) und zählt geschlagene Figuren
 * (Bauer 1, Springer/Läufer 3, Turm 5, Dame 9) aus Sicht des Ziehenden.
 */
export function simulatePvMaterial(fen: string, pv: string[], maxPlies = 6): PvMaterial {
  let chess: Chess
  try {
    chess = new Chess(fen)
  } catch {
    return { gain: 0 }
  }
  const mover = chess.turn()
  let gain = 0
  let biggest: string | undefined
  for (const uci of pv.slice(0, maxPlies)) {
    const side = chess.turn()
    let mv: Move
    try {
      mv = chess.move(uciToMoveInput(uci))
    } catch {
      break
    }
    if (mv.captured) {
      if (side === mover) {
        gain += valueOf(mv.captured)
        if (biggest === undefined || valueOf(mv.captured) > valueOf(biggest)) {
          biggest = mv.captured
        }
      } else {
        gain -= valueOf(mv.captured)
      }
    }
  }
  const result: PvMaterial = { gain }
  if (biggest !== undefined) result.biggestCapture = biggest
  return result
}

/**
 * Materialbilanz aus Sicht des Ziehenden nach Simulation der pv
 * (max. `maxPlies` Halbzüge; bricht bei illegalem pv-Zug sauber ab).
 * Gezählt werden geschlagene Figuren (Bauer 1, Springer/Läufer 3, Turm 5, Dame 9).
 */
function materialGainFromPv(fen: string, pv: string[], maxPlies = 6): number {
  return simulatePvMaterial(fen, pv, maxPlies).gain
}

/** Akkusativ mit Possessiv "dein…", z. B. "deinen Turm", "deine Dame", "deinen Bauern". */
export function pieceDeinAcc(type: string): string {
  const p = pieceDe(type)
  if (!p) return 'deine Figur'
  const poss = p.article === 'die' ? 'deine' : 'deinen'
  const noun = type.toLowerCase() === 'p' ? 'Bauern' : p.name
  return `${poss} ${noun}`
}

/** Kindgerechte Benennung eines Materialgewinns. */
function gainPhrase(gain: number, move: Move): string {
  const rounded = Math.round(gain)
  if (rounded === 1) return 'einen Bauern'
  const captured = move.captured ? pieceDe(move.captured) : undefined
  if (captured && move.captured && valueOf(move.captured) === rounded) return captured.acc
  if (rounded === 3) return 'eine Leichtfigur (Springer oder Läufer)'
  if (rounded === 5) return 'einen Turm'
  if (rounded === 9) return 'eine Dame'
  return `Material (etwa ${rounded} Bauern)`
}

/** Deutsche Aufzählung: ["Turm","Dame"] → "Turm und Dame". */
function listDe(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} und ${names[names.length - 1]}`
}

/**
 * Gegnerische Figuren, die die soeben gezogene Figur (auf move.to) angreift
 * und die wertvoller als sie selbst oder ungedeckt sind.
 */
function findForkTargets(post: Chess, move: Move, mover: Color, enemy: Color): string[] {
  const movedSquare = move.to as Square
  const moved = post.get(movedSquare)
  if (!moved) return []
  const movedValue = valueOf(moved.type)
  const targets: string[] = []
  for (const row of post.board()) {
    for (const cell of row) {
      if (!cell || cell.color !== enemy) continue
      const attackedByMoved = post.attackers(cell.square, mover).includes(movedSquare)
      if (!attackedByMoved) continue
      const undefended = post.attackers(cell.square, enemy).length === 0
      if (valueOf(cell.type) > movedValue || undefended) {
        targets.push(pieceNameDe(cell.type))
      }
    }
  }
  return targets
}

/** Erste zutreffende Erkennungsregel (siehe Prioritätsliste). */
function describeMainReason(
  fen: string,
  best: EngineLine,
  lines: EngineLine[],
  pre: Chess,
  post: Chess,
  move: Move,
  mover: Color,
  enemy: Color,
): string {
  const sanDe = sanToGerman(move.san)

  // 1. Matt in N
  if ((best.mate !== undefined && best.mate > 0) || move.san.endsWith('#')) {
    if (best.mate === 1 || move.san.endsWith('#')) {
      return `${sanDe} – das ist Schachmatt!`
    }
    return `${sanDe} – damit setzt du in ${best.mate} Zügen Matt!`
  }

  // 2. Rettung vor dem Matt: alle anderen Linien werden mattgesetzt.
  if (
    best.mate === undefined &&
    lines.length >= 2 &&
    lines.slice(1).every((l) => l.mate !== undefined && l.mate < 0)
  ) {
    return `Aufgepasst: Nur ${sanDe} rettet dich vor dem Matt – alle anderen Züge verlieren!`
  }

  // 3. Materialgewinn (pv-Simulation)
  const gain = materialGainFromPv(fen, best.pv)
  if (gain >= 1) {
    const captured = move.captured ? pieceDe(move.captured) : undefined
    const capturedUndefended =
      captured !== undefined && pre.attackers(move.to as Square, enemy).length === 0
    if (captured && capturedUndefended) {
      const article = captured.article === 'die' ? 'Die' : 'Der'
      return `${article} ${captured.name} auf ${move.to} ist ungedeckt – du kannst ${captured.pronoun} einfach schlagen!`
    }
    return `Damit gewinnst du ${gainPhrase(gain, move)}.`
  }

  // 4. Gabel
  const forkTargets = findForkTargets(post, move, mover, enemy)
  if (forkTargets.length >= 2) {
    const moved = post.get(move.to as Square)
    const movedName = moved ? pieceNameDe(moved.type) : 'Figur'
    return `Eine Gabel! Dein ${movedName} greift gleichzeitig ${listDe(forkTargets)} an – mindestens eine dieser Figuren gewinnst du.`
  }

  // 5. Angegriffene eigene Figur retten
  if (isHanging(pre, move.from as Square) && !isHanging(post, move.to as Square)) {
    const p = pieceDe(move.piece) ?? PIECES_DE.p
    const dein = p.article === 'die' ? 'Deine' : 'Dein'
    return `${dein} ${p.name} wurde angegriffen – dieser Zug bringt ${p.pronoun} in Sicherheit.`
  }

  // 6. Schach geben
  if (move.san.includes('+')) {
    if (best.cp !== undefined && best.cp >= 150) {
      return `${sanDe} – Schach! Du greifst den gegnerischen König an und stehst danach klar besser.`
    }
    return `${sanDe} – Schach! Damit setzt du den gegnerischen König unter Druck.`
  }

  // 7. Umwandlung
  if (move.promotion) {
    const promo = pieceDe(move.promotion) ?? PIECES_DE.q
    const extra =
      move.promotion === 'q' ? 'die stärkste Figur auf dem Brett' : 'eine viel stärkere Figur'
    return `Dein Bauer verwandelt sich in ${promo.acc} – ${extra}!`
  }

  // 8. Rochade
  if (move.san.startsWith('O-O')) {
    return 'Die Rochade bringt deinen König in Sicherheit und aktiviert den Turm.'
  }

  // 9. Entwicklung / Zentrum / generisch
  const homeRank = mover === 'w' ? '1' : '8'
  if ((move.piece === 'n' || move.piece === 'b') && move.from[1] === homeRank) {
    return `Du entwickelst deinen ${pieceNameDe(move.piece)} – so kommen deine Figuren ins Spiel.`
  }
  if (move.piece === 'p' && CENTER_SQUARES.includes(move.to as Square)) {
    return 'Mit diesem Bauernzug besetzt du das Zentrum – wer das Zentrum kontrolliert, steht meistens besser.'
  }
  if (CENTER_SQUARES.some((sq) => post.attackers(sq, mover).includes(move.to as Square))) {
    return 'Dieser Zug hilft dir, das Zentrum zu kontrollieren – ein wichtiges Ziel im Schach.'
  }
  return GENERIC
}

/**
 * Erklärt, warum lines[0].move der beste Zug ist.
 * fen: aktuelle Stellung (Seite am Zug soll ziehen).
 * lines: MultiPV-Linien, lines[0] = beste. 1–3 Linien.
 * Rückgabe: 1–3 kurze deutsche Sätze, endet mit Punkt. Nie leerer String.
 */
export function explainBestMove(fen: string, lines: EngineLine[]): string {
  const best = lines[0]
  if (!best?.move) return GENERIC

  let pre: Chess
  try {
    pre = new Chess(fen)
  } catch {
    return GENERIC
  }
  const mover = pre.turn()
  const enemy = otherColor(mover)

  const post = new Chess(fen)
  let move: Move
  try {
    move = post.move(uciToMoveInput(best.move))
  } catch {
    return GENERIC
  }

  const parts = [describeMainReason(fen, best, lines, pre, post, move, mover, enemy)]

  // 10. Deutlich beste Option
  const second = lines[1]
  if (
    second !== undefined &&
    best.cp !== undefined &&
    second.cp !== undefined &&
    best.cp - second.cp >= 150
  ) {
    parts.push('Alle anderen Züge sind deutlich schlechter.')
  }

  return parts.join(' ')
}
