<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ChessBoard from './components/ChessBoard.vue'
import EvalBar from './components/EvalBar.vue'
import MaterialBar from './components/MaterialBar.vue'
import MoveList from './components/MoveList.vue'
import PromotionDialog from './components/PromotionDialog.vue'
import GameOverOverlay from './components/GameOverOverlay.vue'
import ConfettiRain from './components/ConfettiRain.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import LessonPath from './components/LessonPath.vue'
import { useGame } from './stores/game'
import { useSettings } from './stores/settings'
import { activeProfile } from './lib/profiles'

// Profilwechsel lädt die Seite neu, daher reicht ein einmaliges Auslesen.
const profileName = activeProfile()

const game = useGame()
const settings = useSettings()
const settingsOpen = ref(false)
const lessonPathOpen = ref(false)

// Vollbild: blendet auf Android auch die Statusleiste aus.
// (Auf dem iPhone unterstützt Safari die Fullscreen-API nicht – Button entfällt dort.)
const fullscreenAvailable = typeof document.documentElement.requestFullscreen === 'function'
const isFullscreen = ref(false)

function toggleFullscreen() {
  if (document.fullscreenElement) {
    void document.exitFullscreen().catch(() => {})
  } else {
    void document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {})
  }
}

// Einmalige Meldung, sobald der Service Worker alles für Offline gecacht hat.
const offlineReady = ref(false)

onMounted(() => {
  void game.initApp()
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = document.fullscreenElement !== null
  })
  window.addEventListener('schach:offline-ready', () => {
    offlineReady.value = true
    setTimeout(() => (offlineReady.value = false), 8000)
  })
})

const verdictClass = computed(() => (game.feedback ? `verdict-${game.feedback.verdict}` : ''))

const tipCountLabel = computed(() => (game.tipsUnlimited ? '∞' : String(game.tipsLeft)))

const tipDisabled = computed(
  () =>
    game.status !== 'playing' ||
    !game.isPlayersTurn ||
    game.analyzing ||
    game.blunderPrompt ||
    (!game.tipsUnlimited && game.tipsLeft === 0) ||
    game.tipStage >= 3,
)

const statusLine = computed(() => {
  if (game.engineError) return game.engineError
  if (game.review) {
    if (game.review.busy) return '🔍 Die Engine bewertet den Zug …'
    if (game.review.index === 0) return '🔍 Rückblick – blättere mit ▶ durch die Partie.'
    return null
  }
  if (game.lesson) {
    if (game.lesson.finished) return null
    if (game.lesson.mode === 'demo') return '🎬 Lies in Ruhe – »Weiter« spielt den nächsten Zug.'
    return game.isPlayersTurn ? 'Du bist dran – spiel den Lektionszug!' : 'Der Gegner zieht …'
  }
  if (game.status !== 'playing') return null
  if (game.thinking) return 'Computer denkt …'
  if (game.inCheck) return 'Schach!'
  if (game.effectiveMode === 'pvp')
    return game.turnColor === 'white' ? 'Weiß ist am Zug' : 'Schwarz ist am Zug'
  return game.isPlayersTurn ? 'Du bist am Zug' : null
})

function confirmNewGame() {
  if (game.movesSan.length > 0 && game.status === 'playing') {
    if (!confirm('Die laufende Partie wird beendet. Neue Partie starten?')) return
  }
  game.newGame()
}
</script>

<template>
  <div class="app">
    <header class="topbar">
      <h1>♞<span class="title-text"> SchachTrainer</span></h1>
      <div class="topbar-right">
        <button
          class="profile-chip"
          :title="`Profil: ${profileName} – tippen zum Wechseln`"
          aria-label="Profil wechseln"
          @click="settingsOpen = true"
        >
          👤 {{ profileName }}
        </button>
        <span v-if="!game.lesson" class="tips-badge" title="Tipps übrig">💡 {{ tipCountLabel }}</span>
        <button class="icon-btn" aria-label="Lernpfad" @click="lessonPathOpen = true">🎓</button>
        <button
          class="style-toggle"
          :aria-label="settings.boardStyle === '3d' ? 'Zur 2D-Ansicht wechseln' : 'Zur 3D-Ansicht wechseln'"
          @click="settings.boardStyle = settings.boardStyle === '3d' ? '2d' : '3d'"
        >
          {{ settings.boardStyle === '3d' ? '3D' : '2D' }}
        </button>
        <button
          v-if="fullscreenAvailable"
          class="icon-btn fullscreen-btn"
          :class="{ active: isFullscreen }"
          :aria-label="isFullscreen ? 'Vollbild verlassen' : 'Vollbild'"
          @click="toggleFullscreen"
        >
          ⛶
        </button>
        <button class="icon-btn" aria-label="Einstellungen" @click="settingsOpen = true">⚙️</button>
      </div>
    </header>

    <EvalBar v-if="settings.showEval && !game.lesson && !game.review" />

    <main class="board-area">
      <ChessBoard />
      <GameOverOverlay />
    </main>

    <MaterialBar />

    <p v-if="statusLine" class="status" :class="{ error: game.engineError }">{{ statusLine }}</p>

    <div v-if="game.pattPrompt" class="blunder">
      <p>
        ⚠️ Achtung, Patt-Gefahr! Nach diesem Zug hätte dein Gegner keinen legalen Zug mehr –
        die Partie endet dann sofort <strong>unentschieden</strong>, obwohl du klar vorne bist.
        Lass ihm lieber einen Zug übrig und setz ihn dann matt!
      </p>
      <div class="blunder-buttons">
        <button class="btn primary" @click="game.resolvePatt(false)">Anders ziehen</button>
        <button class="btn" @click="game.resolvePatt(true)">Trotzdem ziehen</button>
      </div>
    </div>

    <div v-if="game.blunderPrompt" class="blunder">
      <p>⚠️ Das war riskant! Möchtest du den Zug zurücknehmen?</p>
      <div class="blunder-buttons">
        <button class="btn primary" @click="game.resolveBlunder(true)">Zurücknehmen</button>
        <button class="btn" @click="game.resolveBlunder(false)">Weiterspielen</button>
      </div>
    </div>

    <div v-if="game.feedback" class="feedback-box" :class="verdictClass">
      <p>
        <strong>{{ game.feedback.title }}</strong>
        {{ game.feedback.text }}
      </p>
    </div>

    <div v-if="game.tip && game.tip.text" class="tip-box">
      <p>{{ game.tip.text }}</p>
    </div>

    <div v-if="game.lessonComment" class="lesson-box">
      <p>🎓 {{ game.lessonComment }}</p>
    </div>

    <div v-if="game.lessonTask" class="lesson-task">
      <p>👉 {{ game.lessonTask }}</p>
    </div>

    <div v-if="game.lesson?.finished" class="lesson-finish">
      <p class="finish-title">
        Lektion geschafft!
        <span v-if="game.lesson.earnedStars !== null" class="finish-stars">
          {{ '★'.repeat(game.lesson.earnedStars) }}{{ '☆'.repeat(3 - game.lesson.earnedStars) }}
        </span>
      </p>
      <p class="finish-outro">{{ game.lesson.outro }}</p>
      <div class="finish-buttons">
        <button
          v-if="game.status === 'playing'"
          class="btn primary"
          @click="game.continueFromLesson()"
        >
          Ab hier weiterspielen
        </button>
        <button class="btn" @click="game.startLesson(game.lesson.id, 'play')">Nochmal üben</button>
        <button class="btn subtle" @click="game.exitLesson(); lessonPathOpen = true">
          Zum Lernpfad
        </button>
      </div>
    </div>

    <div v-if="game.lesson" class="controls">
      <button v-if="game.lessonAwaitsNext" class="btn primary next-btn" @click="game.lessonNext()">
        Weiter ▶
      </button>
      <button v-if="!game.lesson.finished" class="btn" @click="game.exitLesson()">
        ✕ Lektion beenden
      </button>
    </div>

    <div v-else-if="game.review" class="controls review-controls">
      <button
        class="btn nav-btn"
        :disabled="game.review.index === 0"
        aria-label="Zum Anfang"
        @click="game.reviewFirst()"
      >
        ⏮
      </button>
      <button
        class="btn nav-btn"
        :disabled="game.review.index === 0"
        aria-label="Zug zurück"
        @click="game.reviewPrev()"
      >
        ◀
      </button>
      <span class="review-counter">
        {{ game.review.index }}/{{ game.review.moves.length }}
        <span v-if="game.review.busy" class="spinner" aria-hidden="true" />
      </span>
      <button
        class="btn nav-btn"
        :disabled="game.review.index >= game.review.moves.length"
        aria-label="Nächster Zug"
        @click="game.reviewNext()"
      >
        ▶
      </button>
      <button
        class="btn nav-btn"
        :disabled="game.review.index >= game.review.moves.length"
        aria-label="Zum Ende"
        @click="game.reviewLast()"
      >
        ⏭
      </button>
      <button class="btn subtle" aria-label="Rückblick schließen" @click="game.exitReview()">
        ✕
      </button>
    </div>

    <div v-else class="controls">
      <button class="btn tip-btn" :disabled="tipDisabled" @click="game.requestTip()">
        <span v-if="game.analyzing" class="spinner" aria-hidden="true" />
        <template v-else>💡</template>
        Tipp
      </button>
      <button class="btn" :disabled="game.movesSan.length === 0 || game.thinking" @click="game.undo()">
        ↩︎ Zurück
      </button>
      <button class="btn" @click="game.flipBoard()">⇅ Drehen</button>
      <button
        v-if="game.status !== 'playing' && game.movesSan.length > 0"
        class="btn"
        @click="game.startReview()"
      >
        🔍 Rückblick
      </button>
      <button v-if="game.status === 'playing' && game.movesSan.length > 0" class="btn" @click="game.resign()">
        Aufgeben
      </button>
      <button v-else class="btn" @click="confirmNewGame">Neu</button>
    </div>

    <MoveList />

    <transition name="toast">
      <div v-if="offlineReady" class="offline-toast">
        ✓ Bereit für Offline-Spiel – die App funktioniert jetzt auch ohne Internet.
      </div>
    </transition>

    <div
      v-if="game.lesson?.finished && game.lesson.earnedStars === 3"
      class="confetti-screen"
    >
      <ConfettiRain :count="48" />
    </div>

    <PromotionDialog />
    <SettingsPanel :open="settingsOpen" @close="settingsOpen = false" />
    <LessonPath :open="lessonPathOpen" @close="lessonPathOpen = false" />
  </div>
</template>

<style scoped>
.app {
  max-width: 520px;
  margin: 0 auto;
  padding: calc(6px + env(safe-area-inset-top)) 10px calc(12px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 100dvh;
}
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
h1 {
  font-size: 18px;
  margin: 0 8px 0 0;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
}
.profile-chip {
  background: var(--panel);
  color: inherit;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 4px 10px;
  font: inherit;
  font-size: 12.5px;
  font-weight: 700;
  max-width: 118px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}
/* Auf schmalen Handys weicht der Schriftzug dem Profilnamen – das ♞ bleibt. */
@media (max-width: 460px) {
  .title-text {
    display: none;
  }
}
.tips-badge {
  font-size: 14px;
  font-weight: 700;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 4px 10px;
}
.icon-btn {
  background: none;
  border: none;
  font-size: 21px;
  padding: 4px;
  cursor: pointer;
}
.fullscreen-btn {
  color: var(--muted);
  font-size: 23px;
  line-height: 1;
}
.style-toggle {
  background: var(--panel);
  color: var(--accent);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 800;
  padding: 5px 8px;
  cursor: pointer;
}
.fullscreen-btn.active {
  color: var(--accent);
}
.board-area {
  position: relative;
}
.status {
  margin: 0;
  text-align: center;
  font-size: 14px;
  color: var(--muted);
  min-height: 18px;
}
.status.error {
  color: #ff8a80;
}
.blunder {
  background: #4a3208;
  border: 1px solid #b58726;
  border-radius: 10px;
  padding: 10px 12px;
}
.blunder p {
  margin: 0 0 8px;
  font-size: 14px;
}
.blunder-buttons {
  display: flex;
  gap: 8px;
}
.tip-box {
  background: var(--panel);
  border: 1px solid var(--accent);
  border-radius: 10px;
  padding: 10px 12px;
}
.tip-box p {
  margin: 0;
  font-size: 14px;
  line-height: 1.45;
}
.lesson-box {
  background: var(--panel);
  border: 1px solid #63b3ed;
  border-radius: 10px;
  padding: 10px 12px;
}
.lesson-box p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}
.lesson-task {
  background: var(--panel);
  border: 1px solid #7fb069;
  border-radius: 10px;
  padding: 10px 12px;
}
.lesson-task p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}
.next-btn {
  flex: 1;
  font-size: 15px;
}
.lesson-finish {
  background: var(--panel);
  border: 1px solid var(--accent);
  border-radius: 12px;
  padding: 14px;
  text-align: center;
}
.finish-title {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
}
.finish-stars {
  color: #e0b34d;
  letter-spacing: 2px;
  margin-left: 6px;
}
.finish-outro {
  margin: 8px 0 12px;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--muted);
}
.finish-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.feedback-box {
  background: var(--panel);
  border-radius: 10px;
  border-left: 5px solid var(--muted);
  padding: 10px 12px;
}
.feedback-box p {
  margin: 0;
  font-size: 14px;
  line-height: 1.45;
}
.feedback-box strong {
  margin-right: 4px;
}
.verdict-best,
.verdict-good {
  border-left-color: #7fb069;
}
.verdict-best strong,
.verdict-good strong {
  color: #9dcc86;
}
.verdict-okay {
  border-left-color: #c9c26a;
}
.verdict-okay strong {
  color: #d8d28a;
}
.verdict-inaccuracy {
  border-left-color: #e0b34d;
}
.verdict-inaccuracy strong {
  color: #eac878;
}
.verdict-mistake {
  border-left-color: #e08a4d;
}
.verdict-mistake strong {
  color: #eaa878;
}
.verdict-blunder {
  border-left-color: #e05d5d;
}
.verdict-blunder strong {
  color: #ee8888;
}
.offline-toast {
  position: fixed;
  left: 50%;
  bottom: calc(18px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  background: var(--accent-dim);
  border: 1px solid var(--accent);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  max-width: 92vw;
  z-index: 60;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.4s, transform 0.4s;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}
.controls {
  display: flex;
  gap: 8px;
}
.controls .btn {
  flex: 1;
  white-space: nowrap;
}
.review-controls {
  align-items: center;
}
.review-controls .nav-btn {
  font-size: 15px;
  padding: 10px 6px;
}
.review-counter {
  flex: 0 0 auto;
  min-width: 56px;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.confetti-screen {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 45;
}
.tip-btn {
  border-color: var(--accent);
  font-weight: 700;
}
.spinner {
  display: inline-block;
  width: 13px;
  height: 13px;
  border: 2px solid var(--muted);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  vertical-align: -2px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
