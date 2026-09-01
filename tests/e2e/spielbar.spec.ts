import { expect, test } from '@playwright/test'
import {
  BASE_URL,
  boardSquares,
  collectErrors,
  prepare,
  tapMove,
  waitForHalfmoves,
  waitForStatus,
} from './helpers'

test.describe('Grundfunktionen gegen den Computer', () => {
  test('Engine initialisiert, Zielfelder erscheinen, e4 wird gespielt und die Engine antwortet', async ({
    page,
  }) => {
    const errors = collectErrors(page)
    await prepare(page)
    await waitForStatus(page, 'Du bist am Zug')

    // Bauer e2 antippen → Zielfeld-Punkte (chessground move-dest) erscheinen
    const sq = boardSquares(page)
    const e2 = await sq(4, 2)
    await page.mouse.click(e2.x, e2.y)
    await expect(page.locator('.board square.move-dest').first()).toBeVisible()
    expect(await page.locator('.board square.move-dest').count()).toBeGreaterThanOrEqual(2)

    // e4 zu Ende tippen → Engine antwortet (mindestens 2 Halbzüge in der Liste)
    const e4 = await sq(4, 4)
    await page.mouse.click(e4.x, e4.y)
    await waitForHalfmoves(page, 2)
    const moves = await page.locator('.movelist .mv').allTextContents()
    expect(moves[0]).toContain('e4')

    expect(errors).toEqual([])
  })

  test('Tipp-Stufen 1→2→3 eskalieren und der Tipp-Zähler zählt herunter', async ({ page }) => {
    const errors = collectErrors(page)
    await prepare(page)
    await waitForStatus(page, 'Du bist am Zug')
    await tapMove(page, [4, 2], [4, 4]) // e4
    await waitForHalfmoves(page, 2)

    const tipTexts: string[] = []
    for (let i = 1; i <= 3; i++) {
      await page.locator('.tip-btn').click()
      // Badge zählt herunter: 5 → 4 → 3 → 2
      await page.waitForFunction(
        (n) => document.querySelector('.tips-badge')?.textContent?.includes(String(5 - n)) ?? false,
        i,
        { timeout: 30_000 },
      )
      tipTexts.push(await page.locator('.tip-box p').innerText())
    }

    // Stufe 1: vager Hinweis auf Figur/Feld
    expect(tipTexts[0]).toContain('genauer an')
    // Stufe 2: konkreter bester Zug
    expect(tipTexts[1]).toContain('Bester Zug')
    // Stufe 3: Erklärung, weder Stufe-1- noch Stufe-2-Format
    expect(tipTexts[2]).not.toContain('genauer an')
    expect(tipTexts[2]).not.toContain('Bester Zug')

    expect(errors).toEqual([])
  })

  test('Zurück-Button nimmt eigenen Zug samt Engine-Antwort zurück (Zugliste leer)', async ({
    page,
  }) => {
    const errors = collectErrors(page)
    await prepare(page)
    await waitForStatus(page, 'Du bist am Zug')
    await tapMove(page, [4, 2], [4, 4]) // e4
    await waitForHalfmoves(page, 2)

    await page.locator('.controls .btn:nth-child(2)').click() // ↩︎ Zurück
    await page.waitForFunction(
      () => document.querySelectorAll('.movelist .mv').length === 0,
      null,
      { timeout: 10_000 },
    )
    // Alle 32 Figuren wieder in Grundstellung
    expect(await page.locator('.board cg-board piece').count()).toBe(32)

    expect(errors).toEqual([])
  })

  test('PWA-Manifest wird ausgeliefert (200)', async ({ page }) => {
    const res = await page.request.get(`${BASE_URL}/manifest.webmanifest`)
    expect(res.status()).toBe(200)
  })
})
