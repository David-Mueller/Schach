<script setup lang="ts">
import { computed } from 'vue'
import { useGame } from '../stores/game'

const game = useGame()

const percentWhite = computed(() => {
  if (game.evalWhite === null) return 50
  return 50 + 50 * Math.tanh(game.evalWhite / 800)
})

const label = computed(() => {
  if (game.mateWhite !== null) return `Matt in ${Math.abs(game.mateWhite)}`
  if (game.evalWhite === null) return '–'
  const pawns = game.evalWhite / 100
  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(1)}`
})
</script>

<template>
  <div class="evalbar" role="meter" aria-label="Stellungsbewertung">
    <div class="white-part" :style="{ width: percentWhite + '%' }" />
    <span class="label">{{ label }}</span>
  </div>
</template>

<style scoped>
.evalbar {
  position: relative;
  height: 18px;
  background: #3a3a3a;
  border-radius: 4px;
  overflow: hidden;
  margin: 4px 0;
}
.white-part {
  height: 100%;
  background: #e8e6e1;
  transition: width 0.4s ease;
}
.label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #444;
  mix-blend-mode: difference;
  filter: invert(1);
}
</style>
