<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { LEVELS, LESSONS } from '../lessons/curriculum'
import {
  getProgress,
  isLevelUnlocked,
  isStageUnlocked,
  levelMaxStars,
  levelStars,
  type LessonResult,
} from '../lib/lessonProgress'
import { useGame } from '../stores/game'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const game = useGame()
const progress = ref<Record<string, LessonResult>>({})
const activeLevel = ref(0)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

watch(
  () => props.open,
  (open, _prev, onCleanup) => {
    if (!open) return
    // Escape schließt das Panel; Cleanup greift auch beim Unmount.
    window.addEventListener('keydown', onKeydown)
    onCleanup(() => window.removeEventListener('keydown', onKeydown))
    progress.value = getProgress()
    // Automatisch das erste freigeschaltete Level mit offenen Sternen zeigen.
    let pick = 0
    for (let i = 0; i < LEVELS.length; i++) {
      if (!isLevelUnlocked(i, progress.value)) break
      pick = i
      if (levelStars(i, progress.value) < levelMaxStars(i)) break
    }
    activeLevel.value = pick
  },
  { immediate: true },
)

function stars(id: string): string {
  const s = Math.min(3, Math.max(0, Math.floor(progress.value[id]?.stars ?? 0)))
  return '★'.repeat(s) + '☆'.repeat(3 - s)
}

function unlocked(levelIndex: number): boolean {
  return isLevelUnlocked(levelIndex, progress.value)
}

const level = computed(() => LEVELS[activeLevel.value]!)
const starsLabel = computed(
  () => `${levelStars(activeLevel.value, progress.value)}/${levelMaxStars(activeLevel.value)}`,
)

/** Hinweistext, solange das angezeigte Level noch gesperrt ist. */
const lockedLevelHint = computed(() => {
  if (unlocked(activeLevel.value)) return null
  const prev = LEVELS[activeLevel.value - 1]
  if (!prev) return null
  const have = levelStars(activeLevel.value - 1, progress.value)
  const need = levelMaxStars(activeLevel.value - 1)
  return (
    `Sammle alle ⭐ ${need} Sterne in ${prev.title}, um ${level.value.title} ` +
    `(„${level.value.subtitle}“) freizuschalten – du hast schon ${have}. ` +
    `Spiel Lektionen fehlerfrei nach, um 3 Sterne zu holen!`
  )
})

/** Pokal für eine Stufe: alle Lektionen fehlerfrei (3 Sterne) geschafft. */
function stageTrophy(lessonIds: string[]): boolean {
  return lessonIds.length > 0 && lessonIds.every((id) => (progress.value[id]?.stars ?? 0) === 3)
}

function start(id: string, mode: 'demo' | 'play') {
  game.startLesson(id, mode)
  emit('close')
}
</script>

<template>
  <div v-if="open" class="overlay" @click.self="emit('close')">
    <div class="panel" role="dialog" aria-modal="true" aria-labelledby="lessonpath-title">
      <div class="head">
        <h2 id="lessonpath-title">🎓 Lernpfad</h2>
        <span class="total-stars" title="Gesammelte Sterne in diesem Level">⭐ {{ starsLabel }}</span>
        <button class="btn subtle" aria-label="Schließen" @click="emit('close')">✕</button>
      </div>
      <p class="tagline">Deine Schach-Fahrschule: Stufe für Stufe besser werden.</p>

      <div class="level-tabs">
        <button
          v-for="(lvl, i) in LEVELS"
          :key="lvl.id"
          class="level-tab"
          :class="{ active: activeLevel === i, 'tab-locked': !unlocked(i) }"
          :aria-pressed="activeLevel === i"
          @click="activeLevel = i"
        >
          <span class="level-name">{{ unlocked(i) ? '' : '🔒 ' }}{{ lvl.title }}</span>
          <span class="level-sub">{{ lvl.subtitle }}</span>
        </button>
      </div>

      <p v-if="lockedLevelHint" class="level-locked-hint">🔒 {{ lockedLevelHint }}</p>

      <template v-for="(stage, index) in level.stages" :key="stage.id">
        <section
          v-if="stage.lessons.length"
          class="stage"
          :class="{ locked: !isStageUnlocked(activeLevel, index, progress) }"
        >
          <h3>
            <span v-if="!isStageUnlocked(activeLevel, index, progress)" class="lock">🔒</span>
            {{ stage.title }}
            <span
              v-if="stageTrophy(stage.lessons)"
              class="trophy"
              title="Alle Lektionen fehlerfrei geschafft!"
            >
              🏆
            </span>
          </h3>
          <p class="stage-sub">{{ stage.subtitle }}</p>
          <template v-if="isStageUnlocked(activeLevel, index, progress)">
            <div v-for="id in stage.lessons" :key="id" class="lesson-row">
              <div class="lesson-info">
                <span class="lesson-title">{{ LESSONS.get(id)?.title }}</span>
                <span class="lesson-meta">
                  {{ LESSONS.get(id)?.subtitle }} · <span class="stars">{{ stars(id) }}</span>
                </span>
              </div>
              <div class="lesson-buttons">
                <button class="btn small" aria-label="Als Film ansehen" title="Als Film ansehen" @click="start(id, 'demo')">🎬</button>
                <button class="btn small primary" @click="start(id, 'play')">▶ Üben</button>
              </div>
            </div>
          </template>
          <p v-else-if="unlocked(activeLevel)" class="locked-hint">
            Schließe die vorherige Stufe ab (je mindestens 1 ★).
          </p>
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
  padding: calc(14px + env(safe-area-inset-top)) 16px calc(20px + env(safe-area-inset-bottom));
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
.total-stars {
  margin-left: auto;
  margin-right: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #e0b34d;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 3px 10px;
}
.trophy {
  margin-left: 2px;
}
.level-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}
.level-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 6px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--panel);
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.level-tab.active {
  background: var(--accent-dim);
  border-color: var(--accent);
}
.level-tab.tab-locked {
  opacity: 0.65;
}
.level-name {
  font-size: 13.5px;
  font-weight: 800;
}
.level-sub {
  font-size: 11px;
  color: var(--muted);
}
.level-locked-hint {
  margin: 0 0 12px;
  font-size: 12.5px;
  line-height: 1.5;
  background: var(--panel);
  border: 1px solid #b58726;
  border-radius: 10px;
  padding: 9px 11px;
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
