<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Chessground } from 'chessground'
import type { Api } from 'chessground/api'
import type { Config } from 'chessground/config'
import type { DrawShape } from 'chessground/draw'
import type { Key } from 'chessground/types'
import type { Square } from 'chess.js'
import { useGame } from '../stores/game'
import { useSettings } from '../stores/settings'

const game = useGame()
const settings = useSettings()
const el = ref<HTMLElement | null>(null)
let api: Api | null = null
let resizeObserver: ResizeObserver | null = null

/**
 * Hotseat ohne Brettdrehung: Sitzt der Spieler am Zug "auf der anderen Seite"
 * des Geräts (Zugfarbe ≠ Brettausrichtung), drehen sich die 3D-Figuren zu ihm.
 */
const flipped3d = computed(
  () =>
    settings.boardStyle === '3d' &&
    game.effectiveMode === 'pvp' &&
    !settings.autoFlip &&
    game.turnColor !== game.orientation,
)

/**
 * Z-Staffelung passend zur Blickrichtung: Normal überlappen vordere Reihen
 * (unten am Bildschirm) die hinteren; für den gegenüber sitzenden Spieler
 * ist es umgekehrt. Idempotent aus der Figurenposition berechnet, weil
 * chessground die z-Indizes bei jedem Render neu vergibt.
 */
function applyPieceZ() {
  if (!el.value || settings.boardStyle !== '3d') return
  const boardEl = el.value.querySelector('cg-board')
  if (!boardEl) return
  const sq = boardEl.getBoundingClientRect().height / 8
  if (sq <= 0) return
  const flip = flipped3d.value
  boardEl.querySelectorAll<HTMLElement>('piece:not(.dragging)').forEach((p) => {
    const m = /translate\(-?[\d.]+px(?:, ?(-?[\d.]+)px)?\)/.exec(p.style.transform)
    if (!m) return
    const row = Math.min(7, Math.max(0, Math.round(parseFloat(m[1] ?? '0') / sq)))
    p.style.zIndex = String(flip ? 10 - row : 3 + row)
  })
}

let zTimer: ReturnType<typeof setTimeout> | null = null
function schedulePieceZ() {
  applyPieceZ()
  if (zTimer) clearTimeout(zTimer)
  // Zweiter Durchlauf nach der Zug-Animation (200 ms), wenn die Figuren stehen.
  zTimer = setTimeout(applyPieceZ, 260)
}

function movableColor(): 'white' | 'black' | undefined {
  if (game.review) return undefined // Rückblick: Brett ist reine Anzeige
  if (game.status !== 'playing' || game.blunderPrompt || game.pendingPromotion || game.pattPrompt)
    return undefined
  if (game.effectiveMode === 'lesson') {
    const L = game.lesson
    return L && L.mode === 'play' && !L.finished ? L.playerColor : undefined
  }
  if (game.effectiveMode === 'pvp') return game.turnColor
  return game.thinking ? undefined : game.effectivePlayerColor
}

function tipShapes(): DrawShape[] {
  const tip = game.tip
  if (!tip || game.tipStage === 0) return []
  if (tip.stage === 1) return [{ orig: tip.orig as Key, brush: 'green' }]
  return [{ orig: tip.orig as Key, dest: tip.dest as Key, brush: 'green' }]
}

function buildConfig(): Config {
  return {
    fen: game.fen,
    orientation: game.orientation,
    turnColor: game.turnColor,
    lastMove: game.lastMove ? (game.lastMove as unknown as Key[]) : undefined,
    check: game.inCheck,
    coordinates: true,
    animation: { enabled: true, duration: 200 },
    highlight: { lastMove: true, check: true },
    premovable: { enabled: false },
    draggable: { showGhost: true },
    selectable: { enabled: true },
    movable: {
      free: false,
      color: movableColor(),
      dests: game.dests as unknown as Map<Key, Key[]>,
      showDests: true, // Legale Züge immer anzeigen – zentrales Lernfeature
      events: {
        after: (orig, dest) => game.userMove(orig as Square, dest as Square),
      },
    },
    drawable: { enabled: false, autoShapes: tipShapes() },
    // 3D-Figuren ragen über ihr Feld hinaus – hintere Reihen müssen hinter
    // vorderen liegen, chessground vergibt dafür z-Indizes pro Reihe.
    addPieceZIndex: settings.boardStyle === '3d',
  }
}

// Chessground cached die Brett-Position (bounding box) und interpretiert Taps
// relativ dazu. Verschiebt sich das Brett ohne Größenänderung – z. B. wenn der
// Eval-Balken darüber ein-/ausgeblendet wird oder die Seite scrollt – wäre der
// Cache veraltet und Taps landen auf dem falschen Feld. Darum wird der Cache
// unmittelbar vor jeder Berührung geleert (Capture-Phase, läuft vor den
// Chessground-Handlern); die Neuberechnung ist ein einzelnes getBoundingClientRect.
function clearBoundsCache() {
  api?.state.dom.bounds.clear()
}

onMounted(() => {
  if (!el.value) return
  api = Chessground(el.value, buildConfig())
  el.value.addEventListener('touchstart', clearBoundsCache, { capture: true, passive: true })
  el.value.addEventListener('mousedown', clearBoundsCache, { capture: true })
  resizeObserver = new ResizeObserver(() => api?.redrawAll())
  resizeObserver.observe(el.value)
  schedulePieceZ()
})

onBeforeUnmount(() => {
  if (zTimer) clearTimeout(zTimer)
  el.value?.removeEventListener('touchstart', clearBoundsCache, { capture: true })
  el.value?.removeEventListener('mousedown', clearBoundsCache, { capture: true })
  resizeObserver?.disconnect()
  api?.destroy()
  api = null
})

// dests wird bei jedem sync() neu erzeugt – der Watcher feuert daher auch,
// wenn ein illegaler Zug abgelehnt wurde, und setzt das Brett zurück.
watch(
  () => [
    game.fen,
    game.orientation,
    game.dests,
    game.tip,
    game.tipStage,
    game.thinking,
    game.status,
    game.blunderPrompt,
    game.pendingPromotion,
    game.pattPrompt,
    game.lesson,
    game.lesson?.finished,
    game.review,
    game.review?.index,
    game.postLessonAi,
    settings.mode,
    settings.playerColor,
    settings.boardStyle,
    settings.autoFlip,
    flipped3d.value,
  ],
  () => {
    api?.set(buildConfig())
    schedulePieceZ()
  },
  { flush: 'post' },
)
</script>

<template>
  <!--
    WICHTIG: Das dynamische :class liegt auf dem Wrapper, NICHT auf dem
    Chessground-Element selbst – chessground hängt eigene Klassen (cg-wrap …)
    an sein Host-Element, und Vues class-Patching würde sie beim Umschalten
    überschreiben (Folge: unsichtbare Figuren).
  -->
  <div
    class="board-frame"
    :class="{ 'board--3d': settings.boardStyle === '3d', 'board--3d-flip': flipped3d }"
  >
    <div ref="el" class="board" />
  </div>
</template>

<style scoped>
.board {
  width: 100%;
  aspect-ratio: 1 / 1;
  touch-action: none;
}
</style>
