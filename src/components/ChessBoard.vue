<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
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

function movableColor(): 'white' | 'black' | undefined {
  if (game.status !== 'playing' || game.blunderPrompt || game.pendingPromotion) return undefined
  if (settings.mode === 'pvp') return game.turnColor
  return game.thinking ? undefined : settings.playerColor
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
})

onBeforeUnmount(() => {
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
    settings.mode,
    settings.playerColor,
    settings.boardStyle,
  ],
  () => api?.set(buildConfig()),
  { flush: 'post' },
)
</script>

<template>
  <div ref="el" class="board" :class="{ 'board--3d': settings.boardStyle === '3d' }" />
</template>

<style scoped>
.board {
  width: 100%;
  aspect-ratio: 1 / 1;
  touch-action: none;
}
</style>
