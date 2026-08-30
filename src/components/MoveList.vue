<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useGame } from '../stores/game'
import { sanToGerman } from '../lib/explain'

const game = useGame()
const listEl = ref<HTMLElement | null>(null)

const rows = computed(() => {
  const out: { nr: number; white: string; black: string }[] = []
  for (let i = 0; i < game.movesSan.length; i += 2) {
    out.push({
      nr: i / 2 + 1,
      white: sanToGerman(game.movesSan[i] ?? ''),
      black: sanToGerman(game.movesSan[i + 1] ?? ''),
    })
  }
  return out
})

watch(
  () => game.movesSan.length,
  () => nextTick(() => listEl.value?.scrollTo({ left: listEl.value.scrollWidth, behavior: 'smooth' })),
)
</script>

<template>
  <div v-if="rows.length" ref="listEl" class="movelist">
    <span v-for="row in rows" :key="row.nr" class="pair">
      <span class="nr">{{ row.nr }}.</span>
      <span class="mv">{{ row.white }}</span>
      <span v-if="row.black" class="mv">{{ row.black }}</span>
    </span>
  </div>
</template>

<style scoped>
.movelist {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  white-space: nowrap;
  padding: 6px 4px;
  font-size: 14px;
  scrollbar-width: thin;
}
.pair {
  display: inline-flex;
  gap: 4px;
}
.nr {
  color: var(--muted);
}
.mv {
  font-weight: 600;
}
.pair:last-child .mv:last-child {
  color: var(--accent);
}
</style>
