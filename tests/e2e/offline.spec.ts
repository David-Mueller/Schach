import { expect, test } from '@playwright/test'
import {
  BASE_URL,
  collectErrors,
  prepare,
  tapMove,
  waitForHalfmoves,
  waitForStatus,
} from './helpers'

test.describe('Offline-Betrieb (PWA)', () => {
  test('App, Engine und Tipp funktionieren komplett offline', async ({ page }) => {
    // Offline erzeugen fehlgeschlagene Netz-Requests Konsolen-Fehler,
    // echte JS-Fehler (pageerror) dürfen trotzdem keine auftreten.
    const errors = collectErrors(page, { consoleErrors: false })

    // 1. Online laden: Service Worker installiert und precached alles
    await prepare(page)
    await page.waitForFunction(
      async () => {
        const reg = await navigator.serviceWorker.getRegistration()
        return reg?.active?.state === 'activated'
      },
      null,
      { timeout: 30_000 },
    )
    // Warten, bis der Precache wirklich befüllt ist (inkl. Engine-WASM)
    await page.waitForFunction(
      async () => {
        const keys = await caches.keys()
        for (const k of keys) {
          const reqs = await (await caches.open(k)).keys()
          if (reqs.some((r) => r.url.includes('.wasm'))) return true
        }
        return false
      },
      null,
      { timeout: 60_000 },
    )

    // 2. Netzwerk komplett trennen und neu laden
    await page.context().setOffline(true)
    await page.reload({ waitUntil: 'load' })
    await page.waitForSelector('.board cg-board', { timeout: 15_000 })
    await waitForStatus(page, 'Du bist am Zug')

    // 3. Offline eine Partie beginnen: e4 → Engine antwortet lokal
    await tapMove(page, [4, 2], [4, 4])
    await waitForHalfmoves(page, 2)

    // 4. Offline einen Tipp anfordern (lokale Engine-Analyse, Stufe 1)
    await page.locator('.tip-btn').click()
    await page.waitForSelector('.tip-box', { timeout: 30_000 })
    expect(await page.locator('.tip-box p').innerText()).toContain('genauer an')

    expect(errors).toEqual([])

    // Aufräumen, damit Folge-Tests im selben Worker nicht offline hängen
    await page.context().setOffline(false)
  })
})
