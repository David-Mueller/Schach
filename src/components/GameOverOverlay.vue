<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useGame } from '../stores/game'
import { downloadPgn } from '../lib/pgnExport'
import ConfettiRain from './ConfettiRain.vue'

const game = useGame()
const hidden = ref(false)

watch(
  () => game.status,
  () => (hidden.value = false),
)

// Während einer Lektion übernimmt das Lektions-Abschlusspanel (z. B. Matt-Technik);
// im Rückblick soll das Brett frei sichtbar bleiben.
const visible = computed(
  () => game.status !== 'playing' && !hidden.value && !game.lesson && !game.review,
)

// effectiveMode/-PlayerColor statt der rohen Einstellung: Nach »Ab hier
// weiterspielen« aus einer Lektion spielt der Computer ggf. mit anderer Farbe.
const playerWon = computed(
  () =>
    game.effectiveMode === 'ai' &&
    game.winner === game.effectivePlayerColor &&
    game.status === 'checkmate',
)

const title = computed(() => {
  switch (game.status) {
    case 'checkmate':
      return game.winner === 'white' ? 'Schachmatt – Weiß gewinnt!' : 'Schachmatt – Schwarz gewinnt!'
    case 'stalemate':
      return 'Patt – Unentschieden!'
    case 'draw':
      return 'Remis – Unentschieden!'
    case 'resigned':
      return game.winner === 'white' ? 'Schwarz gibt auf – Weiß gewinnt!' : 'Weiß gibt auf – Schwarz gewinnt!'
    default:
      return ''
  }
})

const subtitle = computed(() => {
  if (playerWon.value) return 'Super gespielt! 🎉'
  if (game.status === 'checkmate' && game.effectiveMode === 'ai') return 'Kopf hoch – aus jeder Partie lernst du etwas!'
  return ''
})

</script>

<template>
  <div v-if="visible" class="overlay">
    <ConfettiRain v-if="playerWon" :count="24" />
    <div class="dialog">
      <p class="title">{{ title }}</p>
      <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
      <div class="buttons">
        <button class="btn primary" @click="game.newGame()">Neue Partie</button>
        <button v-if="game.movesSan.length > 0" class="btn" @click="game.startReview()">
          🔍 Rückblick – Züge bewerten
        </button>
        <button class="btn" @click="downloadPgn(game.exportPgn())">PGN speichern</button>
        <button class="btn subtle" @click="hidden = true">Brett ansehen</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
  border-radius: 4px;
  overflow: hidden;
}
.dialog {
  background: var(--panel);
  border-radius: 14px;
  padding: 20px 24px;
  text-align: center;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  max-width: 90%;
}
.title {
  margin: 0;
  font-size: 19px;
  font-weight: 800;
}
.subtitle {
  margin: 8px 0 0;
  color: var(--muted);
}
.buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}
</style>
