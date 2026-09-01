// Freischalt-Logik des Lernpfads: Stufen innerhalb eines Levels und der
// große Sprung zu Level 2 (nur mit allen Sternen von Level 1).

import { describe, expect, it } from 'vitest'
import { LEVELS } from '../lessons/curriculum'
import {
  isLevelUnlocked,
  isStageUnlocked,
  levelMaxStars,
  levelStars,
  starsForMistakes,
  type LessonResult,
} from './lessonProgress'

function progressWith(stars: (id: string) => number): Record<string, LessonResult> {
  const progress: Record<string, LessonResult> = {}
  for (const level of LEVELS) {
    for (const stage of level.stages) {
      for (const id of stage.lessons) {
        const s = stars(id)
        if (s > 0) progress[id] = { stars: s, completedAt: '2026-01-01T00:00:00Z' }
      }
    }
  }
  return progress
}

const level1Ids = new Set(LEVELS[0]!.stages.flatMap((s) => s.lessons))

describe('Lernpfad-Freischaltung', () => {
  it('Sterne aus Fehlversuchen: 0→3, 1–2→2, sonst 1', () => {
    expect(starsForMistakes(0)).toBe(3)
    expect(starsForMistakes(1)).toBe(2)
    expect(starsForMistakes(2)).toBe(2)
    expect(starsForMistakes(3)).toBe(1)
  })

  it('ohne Fortschritt: Level 1 offen, Level 2 gesperrt, nur Stufe 1 frei', () => {
    const empty = {}
    expect(isLevelUnlocked(0, empty)).toBe(true)
    expect(isLevelUnlocked(1, empty)).toBe(false)
    expect(isStageUnlocked(0, 0, empty)).toBe(true)
    expect(isStageUnlocked(0, 1, empty)).toBe(false)
    expect(isStageUnlocked(1, 0, empty)).toBe(false)
  })

  it('Stufe 2 öffnet, wenn alle Lektionen der Stufe 1 mindestens 1 Stern haben', () => {
    const stage1Ids = LEVELS[0]!.stages[0]!.lessons
    const progress = progressWith((id) => (stage1Ids.includes(id) ? 1 : 0))
    expect(isStageUnlocked(0, 1, progress)).toBe(true)
    expect(isStageUnlocked(0, 2, progress)).toBe(false)
  })

  it('38 von 39 Sternen reichen NICHT für Level 2', () => {
    let cheated = false
    const progress = progressWith((id) => {
      if (!level1Ids.has(id)) return 0
      if (!cheated) {
        cheated = true
        return 2 // eine einzige Lektion nur mit 2 Sternen
      }
      return 3
    })
    expect(levelStars(0, progress)).toBe(levelMaxStars(0) - 1)
    expect(isLevelUnlocked(1, progress)).toBe(false)
  })

  it('alle 39 Sterne schalten Level 2 frei – dort gilt wieder Stufe-für-Stufe', () => {
    const progress = progressWith((id) => (level1Ids.has(id) ? 3 : 0))
    expect(levelStars(0, progress)).toBe(levelMaxStars(0))
    expect(isLevelUnlocked(1, progress)).toBe(true)
    expect(isStageUnlocked(1, 0, progress)).toBe(true)
    expect(isStageUnlocked(1, 1, progress)).toBe(false)
  })

  it('beide Levels haben gleich viele Lektionen (und damit Sterne)', () => {
    expect(levelMaxStars(1)).toBe(levelMaxStars(0))
  })
})
