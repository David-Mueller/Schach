// Lernpfad-Fortschritt in localStorage – gleiche Philosophie wie das
// Partie-Archiv: offline, gerätgebunden, robust gegen kaputte Daten.

import { STAGES } from '../lessons/curriculum'

export interface LessonResult {
  /** 1–3 Sterne (3 = fehlerfrei). Es zählt immer das beste Ergebnis. */
  stars: number
  completedAt: string
}

const KEY = 'schach.lernpfad.v1'

function load(): Record<string, LessonResult> {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Record<string, LessonResult>
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

/** Eine Stufe ist frei, wenn alle Lektionen der vorherigen bestanden sind. */
export function isStageUnlocked(stageIndex: number, progress = load()): boolean {
  if (stageIndex <= 0) return true
  const previous = STAGES[stageIndex - 1]
  if (!previous) return false
  return (
    isStageUnlocked(stageIndex - 1, progress) &&
    previous.lessons.every((id) => (progress[id]?.stars ?? 0) >= 1)
  )
}
