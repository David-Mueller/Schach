<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useGame } from '../stores/game'
import { TIP_BUDGET_OPTIONS, useSettings } from '../stores/settings'
import { LEVELS } from '../engine/engine'
import { downloadPgn } from '../lib/pgnExport'
import { listGames, type ArchivedGame } from '../lib/archive'
import {
  activeProfile,
  canCreate,
  createProfile,
  deleteProfile,
  listProfiles,
  normalizeName,
  switchProfile,
  MAX_NAME_LENGTH,
  MAX_PROFILES,
} from '../lib/profiles'
import { downloadBackup, importBackupFile } from '../lib/backup'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const settings = useSettings()
const game = useGame()

// Archiv und Profilliste bei jedem Öffnen frisch laden
const archive = ref<ArchivedGame[]>([])
const profiles = ref<string[]>([])
const active = ref('')
watch(
  () => props.open,
  (open) => {
    if (open) {
      archive.value = listGames()
      profiles.value = listProfiles()
      active.value = activeProfile()
    }
  },
  { immediate: true },
)

// ---------- Profile ----------
const newProfileName = ref('')
const canCreateNew = computed(() => canCreate(newProfileName.value))

function onCreateProfile() {
  const name = normalizeName(newProfileName.value)
  if (!canCreate(name)) return
  game.prepareProfileChange()
  createProfile(name) // legt an, wechselt und lädt die Seite neu
}

function onSwitchProfile(name: string) {
  game.prepareProfileChange()
  switchProfile(name) // lädt die Seite neu
}

function onDeleteProfile(name: string) {
  if (!confirm(`Profil „${name}“ mit allen Partien und Lernpfad-Sternen endgültig löschen?`)) return
  deleteProfile(name)
  profiles.value = listProfiles()
}

// ---------- Sicherung ----------
const backupInput = ref<HTMLInputElement | null>(null)
const importError = ref<string | null>(null)

async function onImportBackup(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // gleiche Datei später erneut wählbar
  if (!file) return
  if (!confirm('Backup einspielen? Alle Profile und Spielstände auf diesem Gerät werden ersetzt.'))
    return
  importError.value = null
  game.prepareProfileChange()
  try {
    await importBackupFile(file) // lädt die Seite neu
  } catch (e) {
    importError.value = e instanceof Error ? e.message : 'Backup konnte nicht gelesen werden.'
  }
}

const RESULT_LABEL: Record<string, string> = {
  '1-0': 'Weiß gewinnt',
  '0-1': 'Schwarz gewinnt',
  '1/2-1/2': 'Unentschieden',
  '*': 'abgebrochen',
}

function archiveDateLabel(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const buildDate = computed(() =>
  new Date(__BUILD_DATE__).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }),
)

function startNewGame() {
  if (game.movesSan.length > 0 && game.status === 'playing') {
    if (!confirm('Die laufende Partie wird beendet. Neue Partie starten?')) return
  }
  game.newGame()
  emit('close')
}
</script>

<template>
  <div v-if="open" class="overlay" @click.self="emit('close')">
    <div class="panel">
      <div class="head">
        <h2>Einstellungen</h2>
        <button class="btn subtle" aria-label="Schließen" @click="emit('close')">✕</button>
      </div>

      <section>
        <h3>Profil</h3>
        <div v-for="name in profiles" :key="name" class="profile-row">
          <span class="profile-name" :class="{ current: name === active }">
            {{ name === active ? '👤' : '' }} {{ name }}
          </span>
          <div class="profile-actions">
            <span v-if="name === active" class="active-tag">aktiv</span>
            <template v-else>
              <button class="btn small" @click="onSwitchProfile(name)">Wechseln</button>
              <button
                class="btn small"
                :aria-label="`Profil ${name} löschen`"
                @click="onDeleteProfile(name)"
              >
                🗑
              </button>
            </template>
          </div>
        </div>
        <div v-if="profiles.length < MAX_PROFILES" class="profile-new">
          <input
            v-model="newProfileName"
            type="text"
            :maxlength="MAX_NAME_LENGTH"
            placeholder="Neues Profil (z. B. Daniel)"
            aria-label="Name für neues Profil"
          />
          <button class="btn small" :disabled="!canCreateNew" @click="onCreateProfile">
            ＋ Anlegen
          </button>
        </div>
        <p class="hint">
          Jedes Profil hat eigene Einstellungen, Partien, Archiv und Lernpfad-Sterne.
        </p>
      </section>

      <section>
        <h3>Spielmodus</h3>
        <div class="seg">
          <button :class="{ active: settings.mode === 'ai' }" @click="settings.mode = 'ai'">
            Gegen Computer
          </button>
          <button :class="{ active: settings.mode === 'pvp' }" @click="settings.mode = 'pvp'">
            Zu zweit (ein Gerät)
          </button>
        </div>

        <template v-if="settings.mode === 'ai'">
          <label class="row">
            <span>Spielstärke</span>
            <select v-model.number="settings.aiLevel">
              <option v-for="(cfg, lvl) in LEVELS" :key="lvl" :value="Number(lvl)">
                {{ cfg.label }}
              </option>
            </select>
          </label>
          <label class="row">
            <span>Deine Farbe</span>
            <select v-model="settings.playerColor">
              <option value="white">Weiß</option>
              <option value="black">Schwarz</option>
            </select>
          </label>
        </template>

        <label v-else class="row toggle">
          <span>Brett nach jedem Zug drehen</span>
          <input v-model="settings.autoFlip" type="checkbox" />
        </label>
      </section>

      <section>
        <h3>Lernen</h3>
        <label class="row">
          <span>Tipps pro Partie</span>
          <select v-model.number="settings.tipBudget">
            <option v-for="opt in TIP_BUDGET_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </label>
        <label class="row toggle">
          <span>Warnung bei grobem Fehler</span>
          <input v-model="settings.blunderWarning" type="checkbox" />
        </label>
        <label class="row toggle">
          <span>Warnung vor Patt</span>
          <input v-model="settings.pattWarning" type="checkbox" />
        </label>
        <label class="row toggle">
          <span>Zug-Kommentare nach jedem Zug</span>
          <input v-model="settings.moveFeedback" type="checkbox" />
        </label>
        <label class="row toggle">
          <span>Bewertungsbalken anzeigen</span>
          <input v-model="settings.showEval" type="checkbox" />
        </label>
      </section>

      <section>
        <h3>Aussehen</h3>
        <div class="seg">
          <button :class="{ active: settings.boardStyle === '2d' }" @click="settings.boardStyle = '2d'">
            2D klassisch
          </button>
          <button :class="{ active: settings.boardStyle === '3d' }" @click="settings.boardStyle = '3d'">
            3D-Figuren
          </button>
        </div>
      </section>

      <section>
        <h3>Gerät</h3>
        <label class="row toggle">
          <span>Sounds</span>
          <input v-model="settings.sound" type="checkbox" />
        </label>
        <label class="row toggle">
          <span>Vibration</span>
          <input v-model="settings.haptics" type="checkbox" />
        </label>
      </section>

      <p class="hint">Spielmodus, Farbe und Tipp-Anzahl gelten ab der nächsten Partie.</p>

      <div class="actions">
        <button class="btn primary" @click="startNewGame">Neue Partie starten</button>
        <button
          class="btn"
          :disabled="game.movesSan.length === 0 || game.blunderPrompt || game.pattPrompt"
          @click="downloadPgn(game.exportPgn())"
        >
          Partie als PGN exportieren
        </button>
      </div>

      <section>
        <h3>Sicherung</h3>
        <div class="actions">
          <button class="btn" @click="downloadBackup()">Backup exportieren (alle Profile)</button>
          <button class="btn" @click="backupInput?.click()">Backup wiederherstellen …</button>
          <input
            ref="backupInput"
            type="file"
            accept="application/json,.json"
            class="file-input"
            aria-label="Backup-Datei auswählen"
            @change="onImportBackup"
          />
        </div>
        <p v-if="importError" class="hint import-error">⚠️ {{ importError }}</p>
      </section>

      <section v-if="archive.length">
        <h3>Partie-Archiv</h3>
        <div v-for="entry in archive" :key="entry.id" class="archive-row">
          <div class="archive-info">
            <span class="archive-title">{{ entry.white }} – {{ entry.black }}</span>
            <span class="archive-meta">
              {{ archiveDateLabel(entry.date) }} · {{ entry.moveCount }} Züge ·
              {{ RESULT_LABEL[entry.result] ?? entry.result }}
            </span>
          </div>
          <button class="btn small" @click="downloadPgn(entry.pgn, new Date(entry.date))">PGN</button>
        </div>
      </section>

      <p class="hint version">SchachTrainer · Stand {{ buildDate }}</p>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  justify-content: flex-end;
  z-index: 50;
}
.panel {
  width: min(360px, 92vw);
  background: var(--bg);
  border-left: 1px solid var(--border);
  padding: 14px 16px calc(20px + env(safe-area-inset-bottom));
  overflow-y: auto;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
h2 {
  margin: 0;
  font-size: 18px;
}
h3 {
  margin: 18px 0 8px;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}
.seg {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}
.seg button {
  flex: 1;
  padding: 9px 6px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--panel);
  color: inherit;
  font: inherit;
  font-size: 13px;
}
.seg button.active {
  background: var(--accent-dim);
  border-color: var(--accent);
  font-weight: 700;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 14px;
}
select {
  background: var(--panel);
  color: inherit;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 8px;
  font: inherit;
  font-size: 13px;
  max-width: 58%;
}
input[type='checkbox'] {
  width: 22px;
  height: 22px;
  accent-color: var(--accent);
}
.hint {
  font-size: 12px;
  color: var(--muted);
  margin: 14px 0 10px;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.archive-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px solid var(--border);
}
.archive-row:last-child {
  border-bottom: none;
}
.archive-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.archive-title {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.archive-meta {
  font-size: 11.5px;
  color: var(--muted);
}
.btn.small {
  padding: 6px 10px;
  font-size: 12px;
  flex-shrink: 0;
}
.version {
  margin-top: 18px;
  text-align: center;
  font-size: 11px;
}
.profile-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 0;
}
.profile-name {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.profile-name.current {
  font-weight: 700;
}
.profile-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.active-tag {
  font-size: 11.5px;
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 999px;
  padding: 2px 9px;
}
.profile-new {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
.profile-new input {
  flex: 1;
  min-width: 0;
  background: var(--panel);
  color: inherit;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 9px;
  font: inherit;
  font-size: 13px;
}
.file-input {
  display: none;
}
.import-error {
  color: #ee8888;
}
</style>
