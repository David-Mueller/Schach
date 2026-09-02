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
  if (commentByFen.has(replay.fen())) {
    // Ein Kommentar vor dem ersten Zug würde stillschweigend verschwinden –
    // Einleitungstext gehört in `intro`.
    throw new Error(`Lektion ${lesson.id}: Kommentar vor dem ersten Zug wird nicht angezeigt`)
  }
  const steps: LessonStep[] = []
  let used = 0
  for (const move of chess.history({ verbose: true })) {
    replay.move({ from: move.from, to: move.to, promotion: move.promotion })
    const comment = commentByFen.get(replay.fen()) ?? null
    if (comment !== null) used++
    steps.push({
      san: move.san,
      from: move.from,
      to: move.to,
      promotion: move.promotion as LessonStep['promotion'],
      color: move.color,
      comment,
    })
  }
  if (steps.length === 0) {
    throw new Error(`Lektion ${lesson.id}: PGN enthält keine Züge`)
  }
  if (used !== commentByFen.size) {
    // Kommentar in einer Nebenvariante oder zu einer Stellungswiederholung:
    // er würde nie (oder am falschen Zug) erscheinen.
    throw new Error(`Lektion ${lesson.id}: ${commentByFen.size - used} Kommentar(e) sind keinem Hauptzug zugeordnet`)
  }
  return { startFen, steps }
}
