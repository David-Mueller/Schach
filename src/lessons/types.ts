import type { Square } from 'chess.js'

/**
 * Eine Lektion des Lernpfads: eine kommentierte Zugfolge als PGN.
 * Kommentare stehen in geschweiften Klammern nach dem Zug, auf den sie sich
 * beziehen. Taktik-/Matt-Lektionen starten per [SetUp "1"] + [FEN "…"]
 * mitten in einer Stellung.
 */
export interface Lesson {
  id: string
  title: string
  /** Kurze Einordnung für die Lektionskarte, z. B. "Eröffnung für Weiß". */
  subtitle: string
  /** Aus wessen Sicht gespielt/geschaut wird. */
  playerColor: 'white' | 'black'
  /** Einleitung, die vor dem ersten Zug angezeigt wird. */
  intro: string
  /** Abschlusstext nach dem letzten Zug. */
  outro: string
  /** Kommentierte Hauptvariante (PGN, deutsch kommentiert). */
  pgn: string
}

export interface Stage {
  id: string
  title: string
  /** Kurzbeschreibung der Stufe. */
  subtitle: string
  /** Lektions-IDs in Lernreihenfolge. */
  lessons: string[]
}

/** Ein Halbzug der kompilierten Lektion. */
export interface LessonStep {
  san: string
  from: Square
  to: Square
  promotion?: 'q' | 'r' | 'b' | 'n'
  color: 'w' | 'b'
  /** Kommentar, der NACH diesem Zug gezeigt wird (falls vorhanden). */
  comment: string | null
}

export interface CompiledLesson {
  startFen: string
  steps: LessonStep[]
}
