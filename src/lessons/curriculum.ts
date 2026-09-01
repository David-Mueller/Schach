import type { Lesson, Stage } from './types'
import { stufe1Lessons } from './data/stufe1'
import { stufe2Lessons } from './data/stufe2'
import { stufe3Lessons } from './data/stufe3'
import { stufe4Lessons } from './data/stufe4'
import { stufe5Lessons } from './data/stufe5'

const allLessons: Lesson[] = [
  ...stufe1Lessons,
  ...stufe2Lessons,
  ...stufe3Lessons,
  ...stufe4Lessons,
  ...stufe5Lessons,
]

export const LESSONS = new Map<string, Lesson>(allLessons.map((l) => [l.id, l]))

/**
 * Der Lernpfad („Fahrschule“): Stufen von leicht nach schwer.
 * Eine Stufe schaltet frei, wenn alle Lektionen der vorherigen bestanden sind
 * (mindestens 1 Stern im Mitspiel-Modus).
 */
export const STAGES: Stage[] = [
  {
    id: 'stufe1',
    title: 'Stufe 1 – Grundschule',
    subtitle: 'Die goldenen Regeln jeder Partie',
    lessons: stufe1Lessons.map((l) => l.id),
  },
  {
    id: 'stufe2',
    title: 'Stufe 2 – Eröffnungs-Führerschein',
    subtitle: 'Bewährte Eröffnungen für den Start',
    lessons: stufe2Lessons.map((l) => l.id),
  },
  {
    id: 'stufe3',
    title: 'Stufe 3 – Taktik-Grundmuster',
    subtitle: 'Gabel, Fesselung & Co. erkennen',
    lessons: stufe3Lessons.map((l) => l.id),
  },
  {
    id: 'stufe4',
    title: 'Stufe 4 – Matt-Techniken',
    subtitle: 'Den Sieg sicher nach Hause bringen',
    lessons: stufe4Lessons.map((l) => l.id),
  },
  {
    id: 'stufe5',
    title: 'Stufe 5 – Gambits & Pläne',
    subtitle: 'Mutige Ideen für Fortgeschrittene',
    lessons: stufe5Lessons.map((l) => l.id),
  },
]
