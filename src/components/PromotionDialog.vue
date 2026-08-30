<script setup lang="ts">
import { computed } from 'vue'
import { useGame } from '../stores/game'

const game = useGame()

const isWhite = computed(() => game.turnColor === 'white')
const options = computed(() =>
  isWhite.value
    ? [
        { piece: 'q' as const, glyph: '♕', name: 'Dame' },
        { piece: 'r' as const, glyph: '♖', name: 'Turm' },
        { piece: 'b' as const, glyph: '♗', name: 'Läufer' },
        { piece: 'n' as const, glyph: '♘', name: 'Springer' },
      ]
    : [
        { piece: 'q' as const, glyph: '♛', name: 'Dame' },
        { piece: 'r' as const, glyph: '♜', name: 'Turm' },
        { piece: 'b' as const, glyph: '♝', name: 'Läufer' },
        { piece: 'n' as const, glyph: '♞', name: 'Springer' },
      ],
)
</script>

<template>
  <div v-if="game.pendingPromotion" class="overlay" @click.self="game.cancelPromotion()">
    <div class="dialog">
      <p class="title">Umwandeln in:</p>
      <div class="choices">
        <button
          v-for="opt in options"
          :key="opt.piece"
          class="choice"
          :aria-label="opt.name"
          @click="game.choosePromotion(opt.piece)"
        >
          <span class="glyph">{{ opt.glyph }}</span>
          <span class="name">{{ opt.name }}</span>
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
  align-items: center;
  justify-content: center;
  z-index: 40;
}
.dialog {
  background: var(--panel);
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
}
.title {
  margin: 0 0 12px;
  font-weight: 700;
  text-align: center;
}
.choices {
  display: flex;
  gap: 10px;
}
.choice {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: var(--panel-light);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  color: inherit;
  font: inherit;
}
.choice:active {
  background: var(--accent-dim);
}
.glyph {
  font-size: 38px;
  line-height: 1;
}
.name {
  font-size: 12px;
}
</style>
