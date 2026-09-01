import { Chess, DEFAULT_POSITION } from 'chess.js'
import type { CompiledLesson, Lesson, LessonStep } from './types'

/**
 * Übersetzt das kommentierte PGN einer Lektion in eine Schrittliste.
 * Wirft bei illegalem PGN – der Lektions-Test kompiliert alle Lektionen,
 * damit kaputter Inhalt nie in einen Build gelangt.
 */
export function compileLesson(lesson: Lesson): CompiledLesson {
  const chess = new Chess()
  chess.loadPgn(lesson.pgn)

  // Kommentar-Zuordnung über die FEN der Stellung NACH dem jeweiligen Zug
  const commentByFen = new Map<string, string>()
  for (const { fen, comment } of chess.getComments()) {
    commentByFen.set(fen, comment)
  }

  const startFen = chess.getHeaders()['FEN'] ?? DEFAULT_POSITION
  const replay = new Chess(startFen)
  const steps: LessonStep[] = []
  for (const move of chess.history({ verbose: true })) {
    replay.move({ from: move.from, to: move.to, promotion: move.promotion })
    steps.push({
      san: move.san,
      from: move.from,
      to: move.to,
      promotion: move.promotion as LessonStep['promotion'],
      color: move.color,
      comment: commentByFen.get(replay.fen()) ?? null,
    })
  }
  if (steps.length === 0) {
    throw new Error(`Lektion ${lesson.id}: PGN enthält keine Züge`)
  }
  return { startFen, steps }
}
