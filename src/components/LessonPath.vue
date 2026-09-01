<script setup lang="ts">
import { ref, watch } from 'vue'
import { STAGES, LESSONS } from '../lessons/curriculum'
import { getProgress, isStageUnlocked, type LessonResult } from '../lib/lessonProgress'
import { useGame } from '../stores/game'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const game = useGame()
const progress = ref<Record<string, LessonResult>>({})

watch(
  () => props.open,
  (open) => {
    if (open) progress.value = getProgress()
  },
  { immediate: true },
)

function stars(id: string): string {
  const s = progress.value[id]?.stars ?? 0
  return '★'.repeat(s) + '☆'.repeat(Math.max(0, 3 - s))
}

function start(id: string, mode: 'demo' | 'play') {
  game.startLesson(id, mode)
  emit('close')
}
</script>

<template>
  <div v-if="open" class="overlay" @click.self="emit('close')">
    <div class="panel">
      <div class="head">
        <h2>🎓 Lernpfad</h2>
        <button class="btn subtle" aria-label="Schließen" @click="emit('close')">✕</button>
      </div>
      <p class="tagline">Deine Schach-Fahrschule: Stufe für Stufe besser werden.</p>

      <template v-for="(stage, index) in STAGES" :key="stage.id">
        <section v-if="stage.lessons.length" class="stage" :class="{ locked: !isStageUnlocked(index, progress) }">
          <h3>
            <span v-if="!isStageUnlocked(index, progress)" class="lock">🔒</span>
            {{ stage.title }}
          </h3>
          <p class="stage-sub">{{ stage.subtitle }}</p>
          <template v-if="isStageUnlocked(index, progress)">
            <div v-for="id in stage.lessons" :key="id" class="lesson-row">
              <div class="lesson-info">
                <span class="lesson-title">{{ LESSONS.get(id)?.title }}</span>
                <span class="lesson-meta">
                  {{ LESSONS.get(id)?.subtitle }} · <span class="stars">{{ stars(id) }}</span>
                </span>
              </div>
              <div class="lesson-buttons">
                <button class="btn small" @click="start(id, 'demo')">🎬</button>
                <button class="btn small primary" @click="start(id, 'play')">▶ Üben</button>
              </div>
            </div>
          </template>
          <p v-else class="locked-hint">Schließe die vorherige Stufe ab (je mindestens 1 ★).</p>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  justify-content: center;
  z-index: 50;
}
.panel {
  width: min(430px, 100vw);
  background: var(--bg);
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
.tagline {
  margin: 4px 0 12px;
  font-size: 12.5px;
  color: var(--muted);
}
.stage {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 12px;
  background: var(--panel);
}
.stage.locked {
  opacity: 0.6;
}
h3 {
  margin: 0;
  font-size: 14.5px;
}
.lock {
  margin-right: 4px;
}
.stage-sub {
  margin: 2px 0 8px;
  font-size: 12px;
  color: var(--muted);
}
.lesson-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 0;
  border-top: 1px solid var(--border);
}
.lesson-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.lesson-title {
  font-size: 13.5px;
  font-weight: 600;
}
.lesson-meta {
  font-size: 11.5px;
  color: var(--muted);
}
.stars {
  color: #e0b34d;
  letter-spacing: 1px;
}
.lesson-buttons {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.btn.small {
  padding: 7px 10px;
  font-size: 12.5px;
}
.locked-hint {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--muted);
}
</style>
