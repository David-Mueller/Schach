// Bewertet den gespielten Zug anhand der Engine-Analyse vor und nach dem Zug.
// Kindgerechte deutsche Rückmeldung (Du-Form), kein LLM – nur Regeln + chess.js.

import { Chess } from 'chess.js'
import type { EngineLine } from '../engine/types'
import { lineToEval } from '../engine/types'
import {
  GENERIC_EXPLANATION,
  explainBestMove,
  pieceDeinAcc,
  sanToGerman,
  simulatePvMaterial,
  uciToMoveInput,
} from './explain'

export type MoveVerdict = 'best' | 'good' | 'okay' | 'inaccuracy' | 'mistake' | 'blunder'

export interface MoveJudgement {
  verdict: MoveVerdict
  /** Kurzes deutsches Label, z. B. "Sehr gut!", "Guter Zug", "Okay", "Ungenau", "Fehler", "Grober Fehler". */
  title: string
  /** 1–3 kurze deutsche Sätze: Begründung, ggf. besserer Zug, ggf. Drohung des Gegners. Nie leer. */
  text: string
}

/** Neutraler Fallback, wenn der Zug nicht bewertet werden kann. */
function fallback(): MoveJudgement {
  return { verdict: 'okay', title: 'Okay', text: 'Der Zug konnte nicht bewertet werden.' }
}

type Side = 'w' | 'b'

/**
 * Bewertung einer Linie aus Sicht des Ziehenden (`mover`), Matt normalisiert
 * als ±(10000 − N). `sideToMove` ist die Seite, aus deren Sicht die Linie
 * gerechnet wurde (Seite am Zug in der analysierten Stellung).
 */
function evalFor(line: EngineLine, sideToMove: Side, mover: Side): number {
  const cpWhite = lineToEval(line, sideToMove).cpWhite
  return mover === 'w' ? cpWhite : -cpWhite
}

/** "Besser war ⟨SAN deutsch⟩." plus prägnante Begründung (ohne generischen Fallback-Satz). */
function betterMoveSentence(
  fenBefore: string,
  linesBefore: EngineLine[],
  withReason = true,
): string {
  const best = linesBefore[0]
  if (!best) return ''
  let sanDe = best.move
  try {
    const chess = new Chess(fenBefore)
    sanDe = sanToGerman(chess.move(uciToMoveInput(best.move)).san)
  } catch {
    // UCI roh anzeigen
  }
  const parts = [`Besser war ${sanDe}.`]
  if (!withReason) return parts[0]!
  const reason = explainBestMove(fenBefore, linesBefore)
    .split(GENERIC_EXPLANATION)
    .join('')
    .trim()
  if (reason.length > 0) parts.push(reason)
  return parts.join(' ')
}

/**
 * Konkrete Drohung des Gegners aus dessen bester Linie nach dem Zug
 * (Matt oder Materialgewinn), sonst undefined.
 */
function concreteThreat(fenAfter: string, after: EngineLine): string | undefined {
  if (after.mate !== undefined && after.mate > 0) {
    return after.mate === 1
      ? 'Dein Gegner kann dich jetzt im nächsten Zug mattsetzen!'
      : `Dein Gegner kann dich jetzt in ${after.mate} Zügen mattsetzen.`
  }
  const { gain, biggestCapture } = simulatePvMaterial(fenAfter, after.pv)
  if (gain >= 1 && biggestCapture !== undefined) {
    return `Dein Gegner kann jetzt ${pieceDeinAcc(biggestCapture)} gewinnen.`
  }
  return undefined
}

/** Drohungs-Satz für 'mistake'/'blunder': konkret wenn möglich, sonst allgemein. */
function threatSentence(fenAfter: string, after: EngineLine, evalAfter: number): string {
  const concrete = concreteThreat(fenAfter, after)
  if (concrete !== undefined) return concrete
  if (evalAfter <= -100) return 'Dein Gegner steht danach deutlich besser.'
  return 'Damit verschenkst du einen großen Teil deines Vorteils.'
}

/**
 * Bewertet den gespielten Zug.
 * fenBefore: Stellung VOR dem Zug (Spieler am Zug).
 * playedUci: der gespielte Zug (UCI).
 * linesBefore: MultiPV-Analyse (1–3 Linien) der Stellung VOR dem Zug; linesBefore[0] = bester Zug.
 * linesAfter: Analyse (≥1 Linie, meist genau 1) der Stellung NACH dem Zug — aus Sicht des GEGNERS.
 *             Kann leer sein (Partie nach dem Zug beendet: Matt/Patt).
 */
export function judgeMove(
  fenBefore: string,
  playedUci: string,
  linesBefore: EngineLine[],
  linesAfter: EngineLine[],
): MoveJudgement {
  let chessAfter: Chess
  let mover: Side
  try {
    chessAfter = new Chess(fenBefore)
    mover = chessAfter.turn()
    chessAfter.move(uciToMoveInput(playedUci))
  } catch {
    return fallback()
  }
  const opponent: Side = mover === 'w' ? 'b' : 'w'
  const fenAfter = chessAfter.fen()

  const bestBefore = linesBefore[0]
  const evalBefore = bestBefore ? evalFor(bestBefore, mover, mover) : 0

  // Sonderfall 1: Partie nach dem Zug beendet (keine Analyse-Linie mehr).
  if (linesAfter.length === 0) {
    if (chessAfter.isCheckmate()) {
      return {
        verdict: 'best',
        title: 'Schachmatt!',
        text: 'Wow – du hast deinen Gegner mattgesetzt! Die Partie ist gewonnen, großartig gespielt!',
      }
    }
    if (chessAfter.isStalemate()) {
      if (evalBefore <= -300) {
        return {
          verdict: 'good',
          title: 'Guter Zug',
          text: 'Patt – du rettest dich ins Unentschieden! Du standest schlechter, aber jetzt endet die Partie remis.',
        }
      }
      return {
        verdict: 'blunder',
        title: 'Grober Fehler',
        text: 'Patt! Dein Gegner kann nicht mehr ziehen – die Partie endet unentschieden, obwohl du besser standest.',
      }
    }
    // Anderes Partieende (z. B. Remis) – keine Bewertung möglich.
    return fallback()
  }

  // Sonderfall 2: Der beste Engine-Zug wurde gespielt.
  if (bestBefore !== undefined && playedUci === bestBefore.move) {
    return { verdict: 'best', title: 'Sehr gut!', text: explainBestMove(fenBefore, linesBefore) }
  }

  if (bestBefore === undefined) return fallback()

  const afterLine = linesAfter[0]
  if (afterLine === undefined) return fallback()
  const evalAfter = evalFor(afterLine, opponent, mover)
  const loss = evalBefore - evalAfter

  const better = betterMoveSentence(fenBefore, linesBefore)

  // Sonderfall 3: Verpasstes Matt (vorher Matt für den Zieher, nachher nicht mehr).
  const mateIn = bestBefore.mate !== undefined && bestBefore.mate > 0 ? bestBefore.mate : undefined
  const stillMates = afterLine.mate !== undefined && afterLine.mate < 0
  if (mateIn !== undefined && !stillMates) {
    const missed =
      mateIn === 1 ? 'Du hattest Matt in einem Zug!' : `Du hattest Matt in ${mateIn} Zügen!`
    const stillWinning = evalAfter >= 200
    const threat = concreteThreat(fenAfter, afterLine)
    const tail =
      threat ??
      (stillWinning
        ? 'Du stehst zwar immer noch besser, aber das Matt war zum Greifen nah.'
        : 'Jetzt ist dein Vorteil weg.')
    // Die Begründung des besseren Zugs wäre hier nur »damit setzt du Matt« – doppelt.
    const betterShort = betterMoveSentence(fenBefore, linesBefore, false)
    return {
      verdict: stillWinning ? 'mistake' : 'blunder',
      title: stillWinning ? 'Fehler' : 'Grober Fehler',
      text: `${missed} ${betterShort} ${tail}`.trim(),
    }
  }

  // Sonderfall 3b: Die Stellung war schon verloren (Gegner hat forciertes Matt).
  // Dann ist nicht jeder Zug ein »Grober Fehler« – es zählt, wie lange man durchhält.
  if (bestBefore.mate !== undefined && bestBefore.mate < 0) {
    const bestDistance = -bestBefore.mate
    const afterDistance = afterLine.mate !== undefined && afterLine.mate > 0 ? afterLine.mate : Infinity
    if (afterDistance >= bestDistance) {
      return {
        verdict: 'good',
        title: 'Guter Zug',
        text: 'Die Stellung ist leider schon verloren – aber dieser Zug hält am längsten durch.',
      }
    }
    if (afterDistance >= bestDistance - 2) {
      return {
        verdict: 'okay',
        title: 'Okay',
        text: `Die Stellung ist leider schon verloren. ${better} hätte noch etwas länger durchgehalten.`
          .replace('. hätte', ' hätte')
          .trim(),
      }
    }
    return {
      verdict: 'mistake',
      title: 'Fehler',
      text: `Die Stellung war schon verloren, aber so geht es schneller: ${concreteThreat(fenAfter, afterLine) ?? ''} ${betterMoveSentence(fenBefore, linesBefore, false)}`.trim(),
    }
  }

  // Sonderfall 4: Eingestelltes Matt (der Gegner kann jetzt mattsetzen).
  if (afterLine.mate !== undefined && afterLine.mate > 0) {
    return {
      verdict: 'blunder',
      title: 'Grober Fehler',
      text: `${better} ${concreteThreat(fenAfter, afterLine) ?? ''}`.trim(),
    }
  }

  // Normale Bewertung nach Eval-Verlust.
  if (loss <= 30) {
    return {
      verdict: 'good',
      title: 'Guter Zug',
      text: 'Ein starker Zug – fast so gut wie der beste. Weiter so!',
    }
  }
  if (loss <= 90) {
    return {
      verdict: 'okay',
      title: 'Okay',
      text: `Das geht in Ordnung. ${better}`.trim(),
    }
  }
  if (loss <= 200) {
    return {
      verdict: 'inaccuracy',
      title: 'Ungenau',
      text: `Da gab es etwas Stärkeres. ${better}`.trim(),
    }
  }
  const threat = threatSentence(fenAfter, afterLine, evalAfter)
  if (loss <= 500) {
    return { verdict: 'mistake', title: 'Fehler', text: `${better} ${threat}`.trim() }
  }
  return { verdict: 'blunder', title: 'Grober Fehler', text: `${better} ${threat}`.trim() }
}
