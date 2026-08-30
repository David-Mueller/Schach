<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useGame } from '../stores/game'
import { useSettings } from '../stores/settings'
import { downloadPgn } from '../lib/pgnExport'

const game = useGame()
const settings = useSettings()
const hidden = ref(false)

watch(
  () => game.status,
  () => (hidden.value = false),
)

const visible = computed(() => game.status !== 'playing' && !hidden.value)

const playerWon = computed(
  () => settings.mode === 'ai' && game.winner === settings.playerColor && game.status === 'checkmate',
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
  if (game.status === 'checkmate' && settings.mode === 'ai') return 'Kopf hoch – aus jeder Partie lernst du etwas!'
  return ''
})

const confetti = Array.from({ length: 24 }, (_, i) => ({
  left: `${(i * 41) % 100}%`,
  delay: `${(i % 8) * 0.18}s`,
  hue: (i * 47) % 360,
}))
</script>

<template>
  <div v-if="visible" class="overlay">
    <div v-if="playerWon" class="confetti" aria-hidden="true">
      <span
        v-for="(c, i) in confetti"
        :key="i"
        class="piece"
        :style="{ left: c.left, animationDelay: c.delay, background: `hsl(${c.hue} 80% 60%)` }"
      />
    </div>
    <div class="dialog">
      <p class="title">{{ title }}</p>
      <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
      <div class="buttons">
        <button class="btn primary" @click="game.newGame()">Neue Partie</button>
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
.confetti {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.piece {
  position: absolute;
  top: -12px;
  width: 9px;
  height: 14px;
  border-radius: 2px;
  animation: fall 2.6s linear infinite;
}
@keyframes fall {
  0% {
    transform: translateY(-20px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(110vh) rotate(540deg);
    opacity: 0.6;
  }
}
</style>
