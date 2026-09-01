// Lernpfad-Fortschritt in localStorage – gleiche Philosophie wie das
// Partie-Archiv: offline, gerätgebunden, robust gegen kaputte Daten.

import { LEVELS } from '../lessons/curriculum'
import { LESSON_PROGRESS_KEY as KEY } from './storageKeys'

export interface LessonResult {
  /** 1–3 Sterne (3 = fehlerfrei). Es zählt immer das beste Ergebnis. */
  stars: number
  completedAt: string
}

function load(): Record<string, LessonResult> {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        // Nur plausible Einträge übernehmen (Sterne 1–3), Rest verwerfen.
        const out: Record<string, LessonResult> = {}
        for (const [id, v] of Object.entries(parsed as Record<string, unknown>)) {
          const r = v as Partial<LessonResult> | null
          if (r && typeof r.stars === 'number' && r.stars >= 1 && r.stars <= 3) {
            out[id] = { stars: Math.floor(r.stars), completedAt: String(r.completedAt ?? '') }
          }
        }
        return out
      }
    }
  } catch {
    /* defekten Fortschritt ignorieren */
  }
  return {}
}

export function getProgress(): Record<string, LessonResult> {
  return load()
}

/** Sterne aus Fehlversuchen: 0 Fehler = 3, bis 2 Fehler = 2, sonst 1. */
export function starsForMistakes(mistakes: number): number {
  if (mistakes === 0) return 3
  if (mistakes <= 2) return 2
  return 1
}

/** Ergebnis speichern; ein besseres bestehendes Ergebnis bleibt erhalten. */
export function recordResult(lessonId: string, mistakes: number): LessonResult {
  const progress = load()
  const stars = starsForMistakes(mistakes)
  const existing = progress[lessonId]
  const result: LessonResult =
    existing && existing.stars >= stars
      ? existing
      : { stars, completedAt: new Date().toISOString() }
  progress[lessonId] = result
  try {
    localStorage.setItem(KEY, JSON.stringify(progress))
  } catch {
    /* Speichern optional */
  }
  return result
}

/** Gesammelte Sterne eines Levels. */
export function levelStars(levelIndex: number, progress = load()): number {
  const level = LEVELS[levelIndex]
  if (!level) return 0
  return level.stages
    .flatMap((s) => s.lessons)
    .reduce((sum, id) => sum + (progress[id]?.stars ?? 0), 0)
}

/** Maximal mögliche Sterne eines Levels (3 pro Lektion). */
export function levelMaxStars(levelIndex: number): number {
  const level = LEVELS[levelIndex]
  if (!level) return 0
  return level.stages.flatMap((s) => s.lessons).length * 3
}

/**
 * Ein Level ist frei, wenn das vorherige KOMPLETT fehlerfrei ist –
 * also jede Lektion dort 3 Sterne hat (z. B. alle 39 in Level 1).
 */
export function isLevelUnlocked(levelIndex: number, progress = load()): boolean {
  if (levelIndex <= 0) return true
  const previous = LEVELS[levelIndex - 1]
  if (!previous) return false
  return (
    isLevelUnlocked(levelIndex - 1, progress) &&
    previous.stages
      .flatMap((s) => s.lessons)
      .every((id) => (progress[id]?.stars ?? 0) === 3)
  )
}

/**
 * Eine Stufe ist frei, wenn ihr Level frei ist und alle Lektionen der
 * vorherigen Stufe (im selben Level) bestanden sind (mindestens 1 Stern).
 */
export function isStageUnlocked(levelIndex: number, stageIndex: number, progress = load()): boolean {
  if (!isLevelUnlocked(levelIndex, progress)) return false
  if (stageIndex <= 0) return true
  const previous = LEVELS[levelIndex]?.stages[stageIndex - 1]
  if (!previous) return false
  return (
    isStageUnlocked(levelIndex, stageIndex - 1, progress) &&
    previous.lessons.every((id) => (progress[id]?.stars ?? 0) >= 1)
  )
}
