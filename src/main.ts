import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

import 'chessground/assets/chessground.base.css'
import 'chessground/assets/chessground.brown.css'
import 'chessground/assets/chessground.cburnett.css'
import './style.css'

createApp(App).use(createPinia()).mount('#app')
