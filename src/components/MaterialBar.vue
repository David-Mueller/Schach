<script setup lang="ts">
import { computed } from 'vue'
import { useGame } from '../stores/game'

const game = useGame()

const glyphsWhite: Record<string, string> = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' }
const glyphsBlack: Record<string, string> = { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕' }

const order = ['q', 'r', 'b', 'n', 'p']
function sorted(list: string[]) {
  return [...list].sort((a, b) => order.indexOf(a) - order.indexOf(b))
}

// Weiß hat schwarze Figuren geschlagen → schwarze Glyphen, und umgekehrt.
const byWhite = computed(() => sorted(game.capturedByWhite).map((t) => glyphsWhite[t]).join(''))
const byBlack = computed(() => sorted(game.capturedByBlack).map((t) => glyphsBlack[t]).join(''))
const balance = computed(() => game.materialBalance)
</script>

<template>
  <div v-if="byWhite || byBlack" class="material">
    <span class="side">
      <span class="pieces">{{ byWhite }}</span>
      <span v-if="balance > 0" class="diff">+{{ balance }}</span>
    </span>
    <span class="side right">
      <span v-if="balance < 0" class="diff">+{{ -balance }}</span>
      <span class="pieces">{{ byBlack }}</span>
    </span>
  </div>
</template>

<style scoped>
.material {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 22px;
  padding: 2px 4px;
  font-size: 17px;
  line-height: 1;
}
.side {
  display: flex;
  align-items: center;
  gap: 6px;
}
.pieces {
  letter-spacing: 1px;
}
.diff {
  font-size: 12px;
  font-weight: 700;
  color: var(--accent);
}
</style>
