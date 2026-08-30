<script setup lang="ts">
import { useGame } from '../stores/game'
import { TIP_BUDGET_OPTIONS, useSettings } from '../stores/settings'
import { LEVELS } from '../engine/engine'
import { downloadPgn } from '../lib/pgnExport'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const settings = useSettings()
const game = useGame()

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
          <span>Bewertungsbalken anzeigen</span>
          <input v-model="settings.showEval" type="checkbox" />
        </label>
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
        <button class="btn" :disabled="game.movesSan.length === 0" @click="downloadPgn(game.exportPgn())">
          Partie als PGN exportieren
        </button>
      </div>
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
</style>
