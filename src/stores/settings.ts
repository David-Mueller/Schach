import { defineStore } from 'pinia'
import { watch } from 'vue'
import { SETTINGS_KEY as STORAGE_KEY } from '../lib/storageKeys'

export type Mode = 'pvp' | 'ai'
export type BoardStyle = '2d' | '3d'

export interface SettingsState {
  mode: Mode
  aiLevel: number
  /** Farbe des menschlichen Spielers gegen den Computer. */
  playerColor: 'white' | 'black'
  /** Tipps pro Partie; -1 = unendlich (Lernmodus). */
  tipBudget: number
  /** Brett dreht im Hotseat-Modus nach jedem Zug. */
  autoFlip: boolean
  showEval: boolean
  blunderWarning: boolean
  /** Warnung, bevor ein Zug den Gegner patt setzt, obwohl man klar führt. */
  pattWarning: boolean
  /** Zug-Kommentare: bewertet nach jedem eigenen Zug, wie gut er war. */
  moveFeedback: boolean
  sound: boolean
  haptics: boolean
  /** Brett-Ansicht: klassisch flach oder mit plastischen 3D-Figuren. */
  boardStyle: BoardStyle
}

const defaults: SettingsState = {
  mode: 'ai',
  aiLevel: 1,
  playerColor: 'white',
  tipBudget: 5,
  autoFlip: false,
  showEval: false,
  blunderWarning: true,
  pattWarning: true,
  moveFeedback: false,
  sound: true,
  haptics: true,
  boardStyle: '3d',
}

/** Nur bekannte Werte übernehmen – ein manipuliertes Backup darf das Brett nicht lahmlegen. */
function sanitize(raw: Partial<Record<keyof SettingsState, unknown>>): SettingsState {
  const s: SettingsState = { ...defaults }
  if (raw.mode === 'pvp' || raw.mode === 'ai') s.mode = raw.mode
  if (typeof raw.aiLevel === 'number' && Number.isInteger(raw.aiLevel) && raw.aiLevel >= 0 && raw.aiLevel <= 5)
    s.aiLevel = raw.aiLevel
  if (raw.playerColor === 'white' || raw.playerColor === 'black') s.playerColor = raw.playerColor
  if (typeof raw.tipBudget === 'number' && Number.isInteger(raw.tipBudget) && raw.tipBudget >= -1)
    s.tipBudget = raw.tipBudget
  if (raw.boardStyle === '2d' || raw.boardStyle === '3d') s.boardStyle = raw.boardStyle
  for (const key of [
    'autoFlip',
    'showEval',
    'blunderWarning',
    'pattWarning',
    'moveFeedback',
    'sound',
    'haptics',
  ] as const) {
    if (typeof raw[key] === 'boolean') s[key] = raw[key]
  }
  return s
}

function load(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return sanitize(parsed as Record<string, unknown>)
    }
  } catch {
    /* defekte/fehlende Daten ignorieren */
  }
  return { ...defaults }
}

export const useSettings = defineStore('settings', {
  state: (): SettingsState => load(),
  actions: {
    persistOnChange() {
      watch(
        () => this.$state,
        (state) => {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
          } catch {
            /* Speicher voll o. ä. – Einstellungen gelten dann nur für die Sitzung */
          }
        },
        { deep: true },
      )
    },
  },
})

export const TIP_BUDGET_OPTIONS = [
  { value: 0, label: '0 – ohne Tipps' },
  { value: 3, label: '3 Tipps' },
  { value: 5, label: '5 Tipps' },
  { value: 10, label: '10 Tipps' },
  { value: -1, label: '∞ – Lernmodus' },
]
