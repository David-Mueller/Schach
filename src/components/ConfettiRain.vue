<script setup lang="ts">
// Leichter CSS-Konfettiregen (kein Canvas, keine Abhängigkeit).
// Der Elternknoten bestimmt die Fläche (position: absolute, inset: 0).
// Endet nach einigen Sekunden von selbst – Dutzende endlos animierte Elemente
// kosten auf dem Handy sonst dauerhaft Akku.
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{ count?: number; durationMs?: number }>(), {
  count: 32,
  durationMs: 7000,
})
const active = ref(true)
let timer: ReturnType<typeof setTimeout> | null = null
onMounted(() => {
  timer = setTimeout(() => (active.value = false), props.durationMs)
})
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})

const pieces = Array.from({ length: props.count }, (_, i) => ({
  left: `${(i * 41) % 100}%`,
  delay: `${(i % 9) * 0.2}s`,
  duration: `${2.2 + (i % 5) * 0.3}s`,
  hue: (i * 47) % 360,
}))
</script>

<template>
  <div v-if="active" class="confetti" aria-hidden="true">
    <span
      v-for="(c, i) in pieces"
      :key="i"
      class="piece"
      :style="{
        left: c.left,
        animationDelay: c.delay,
        animationDuration: c.duration,
        background: `hsl(${c.hue} 80% 60%)`,
      }"
    />
  </div>
</template>

<style scoped>
.confetti {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.piece {
  position: absolute;
  top: -14px;
  width: 9px;
  height: 14px;
  border-radius: 2px;
  animation: confetti-fall 2.6s linear infinite;
}
@keyframes confetti-fall {
  0% {
    transform: translateY(-20px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(110vh) rotate(540deg);
    opacity: 0.55;
  }
}
@media (prefers-reduced-motion: reduce) {
  .piece {
    animation: none;
    display: none;
  }
}
</style>
