// Inhaltsvalidierung: Jede Lektion muss fehlerfrei kompilieren (legale Züge!),
// sonst schlägt der Build-Test fehl – kaputter Lerninhalt kommt nie zum Kind.

import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { LESSONS, STAGES } from './curriculum'
import { compileLesson } from './parse'

describe('Lernpfad-Inhalte', () => {
  it('alle Stufen-Lektions-IDs existieren und sind eindeutig', () => {
    const seen = new Set<string>()
    for (const stage of STAGES) {
      for (const id of stage.lessons) {
        expect(LESSONS.has(id), `Stufe ${stage.id}: unbekannte Lektion ${id}`).toBe(true)
        expect(seen.has(id), `Lektion ${id} ist mehrfach im Lernpfad`).toBe(false)
        seen.add(id)
      }
    }
    // Jede Lektion gehört zu genau einer Stufe
    expect(seen.size).toBe(LESSONS.size)
  })

  for (const [id, lesson] of LESSONS) {
    it(`Lektion "${id}" kompiliert und ist vollständig`, () => {
      const compiled = compileLesson(lesson)
      expect(compiled.steps.length, 'mindestens 4 Halbzüge').toBeGreaterThanOrEqual(4)
      expect(
        compiled.steps.filter((s) => s.comment).length,
        'mindestens 3 kommentierte Züge',
      ).toBeGreaterThanOrEqual(3)
      expect(lesson.intro.length, 'Intro vorhanden').toBeGreaterThan(20)
      expect(lesson.outro.length, 'Outro vorhanden').toBeGreaterThan(20)
      expect(lesson.title.length).toBeGreaterThan(0)
      expect(lesson.subtitle.length).toBeGreaterThan(0)

      // Nachspielbarkeit: jeder Schritt muss auf der Folgestellung legal sein
      const chess = new Chess(compiled.startFen)
      for (const step of compiled.steps) {
        expect(
          () => chess.move({ from: step.from, to: step.to, promotion: step.promotion }),
          `illegaler Schritt ${step.san} in ${id}`,
        ).not.toThrow()
      }

      // Der Spieler der Lektion muss auch wirklich Züge haben
      const playerMoves = compiled.steps.filter(
        (s) => s.color === (lesson.playerColor === 'white' ? 'w' : 'b'),
      )
      expect(playerMoves.length, 'Spielerzüge vorhanden').toBeGreaterThanOrEqual(2)
    })
  }
})
