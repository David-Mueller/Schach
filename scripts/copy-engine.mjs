// Kopiert die Stockfish-WASM-Dateien aus node_modules nach public/engine,
// damit sie als klassischer Web Worker geladen werden können.
import { mkdirSync, copyFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'node_modules', 'stockfish', 'bin')
const dest = join(root, 'public', 'engine')

const files = ['stockfish-18-lite-single.js', 'stockfish-18-lite-single.wasm']
mkdirSync(dest, { recursive: true })
for (const f of files) {
  const from = join(src, f)
  if (!existsSync(from)) {
    console.error(`Engine-Datei fehlt: ${from}`)
    process.exit(1)
  }
  copyFileSync(from, join(dest, f))
}
console.log('Stockfish-Engine nach public/engine kopiert.')
