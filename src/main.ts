import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'

// Meldet, sobald der Service Worker alles (inkl. Engine-WASM) gecacht hat –
// ab dann läuft die App vollständig ohne Internet. Ein neues Build wird nur
// gemeldet (schach:update-ready) und erst auf schach:apply-update aktiviert,
// damit kein Reload eine laufende Lektion oder Partie unterbricht.
const updateSW = registerSW({
  immediate: true,
  onOfflineReady() {
    window.dispatchEvent(new CustomEvent('schach:offline-ready'))
  },
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent('schach:update-ready'))
  },
})
window.addEventListener('schach:apply-update', () => {
  void updateSW(true)
})

import 'chessground/assets/chessground.base.css'
import 'chessground/assets/chessground.brown.css'
import 'chessground/assets/chessground.cburnett.css'
import './style.css'

createApp(App).use(createPinia()).mount('#app')
