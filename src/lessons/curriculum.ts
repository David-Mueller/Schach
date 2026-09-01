import type { Lesson, Stage } from './types'
import { stufe1Lessons } from './data/stufe1'
import { stufe2Lessons } from './data/stufe2'
import { stufe3Lessons } from './data/stufe3'
import { stufe4Lessons } from './data/stufe4'
import { stufe5Lessons } from './data/stufe5'
import { stufe6Lessons } from './data/stufe6'
import { stufe7Lessons } from './data/stufe7'
import { stufe8Lessons } from './data/stufe8'
import { stufe9Lessons } from './data/stufe9'
import { stufe10Lessons } from './data/stufe10'

const allLessons: Lesson[] = [
  ...stufe1Lessons,
  ...stufe2Lessons,
  ...stufe3Lessons,
  ...stufe4Lessons,
  ...stufe5Lessons,
  ...stufe6Lessons,
  ...stufe7Lessons,
  ...stufe8Lessons,
  ...stufe9Lessons,
  ...stufe10Lessons,
]

export const LESSONS = new Map<string, Lesson>(allLessons.map((l) => [l.id, l]))

/** Eine Seite des Lernpfads: Level 1 (Grundausbildung), Level 2 (Meisterklasse) … */
export interface Level {
  id: string
  title: string
  subtitle: string
  stages: Stage[]
}

function stage(id: string, title: string, subtitle: string, lessons: Lesson[]): Stage {
  return { id, title, subtitle, lessons: lessons.map((l) => l.id) }
}

/**
 * Der Lernpfad („Fahrschule“): Stufen von leicht nach schwer, in Levels
 * (Seiten) gruppiert. Innerhalb eines Levels schaltet eine Stufe frei, wenn
 * alle Lektionen der vorherigen bestanden sind (mindestens 1 Stern im
 * Mitspiel-Modus). Ein neues Level schaltet erst frei, wenn das vorherige
 * KOMPLETT fehlerfrei ist (alle Lektionen mit 3 Sternen).
 */
export const LEVELS: Level[] = [
  {
    id: 'level1',
    title: 'Level 1',
    subtitle: 'Die Grundausbildung',
    stages: [
      stage('stufe1', 'Stufe 1 – Grundschule', 'Die goldenen Regeln jeder Partie', stufe1Lessons),
      stage(
        'stufe2',
        'Stufe 2 – Eröffnungs-Führerschein',
        'Bewährte Eröffnungen für den Start',
        stufe2Lessons,
      ),
      stage('stufe3', 'Stufe 3 – Taktik-Grundmuster', 'Gabel, Fesselung & Co. erkennen', stufe3Lessons),
      stage('stufe4', 'Stufe 4 – Matt-Techniken', 'Den Sieg sicher nach Hause bringen', stufe4Lessons),
      stage('stufe5', 'Stufe 5 – Gambits & Pläne', 'Mutige Ideen für Fortgeschrittene', stufe5Lessons),
    ],
  },
  {
    id: 'level2',
    title: 'Level 2',
    subtitle: 'Die Meisterklasse',
    stages: [
      stage('stufe6', 'Stufe 6 – Spielen mit Schwarz', 'Dein Verteidigungs-Repertoire', stufe6Lessons),
      stage(
        'stufe7',
        'Stufe 7 – Taktik-Meisterklasse',
        'Spieß, Abzug und Doppelangriff',
        stufe7Lessons,
      ),
      stage('stufe8', 'Stufe 8 – Endspiel-Schule', 'Opposition und Quadratregel', stufe8Lessons),
      stage('stufe9', 'Stufe 9 – Matt-Kunst', 'Kombinationen, die Partien entscheiden', stufe9Lessons),
      stage('stufe10', 'Stufe 10 – Angriffspläne', 'So stürmst du die Königsstellung', stufe10Lessons),
    ],
  },
]

/** Alle Stufen flach (für Tests und Werkzeuge, die Levels nicht brauchen). */
export const STAGES: Stage[] = LEVELS.flatMap((l) => l.stages)
