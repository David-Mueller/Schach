import { defineStore } from 'pinia'
import { watch } from 'vue'

export type Mode = 'pvp' | 'ai'

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
  sound: boolean
  haptics: boolean
}

const STORAGE_KEY = 'schach.settings.v1'

const defaults: SettingsState = {
  mode: 'ai',
  aiLevel: 1,
  playerColor: 'white',
  tipBudget: 5,
  autoFlip: false,
  showEval: false,
  blunderWarning: true,
  sound: true,
  haptics: true,
}

function load(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaults, ...(JSON.parse(raw) as Partial<SettingsState>) }
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
