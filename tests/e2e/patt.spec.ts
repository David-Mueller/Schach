import { expect, test } from '@playwright/test'
import {
  GAME_KEY,
  boardSquares,
  collectErrors,
  persistedPgn,
  prepare,
  startHotseat,
  tapMove,
  waitForStatus,
} from './helpers'

/** Stellung kurz vor dem klassischen 10-Zug-Patt (Weiß am Zug, Qe6 wäre Patt). */
const PATT_PGN =
  '1. e3 a5 2. Qh5 Ra6 3. Qxa5 h5 4. h4 Rah6 5. Qxc7 f6 6. Qxd7+ Kf7 7. Qxb7 Qd3 8. Qxb8 Qh7 9. Qxc8 Kg6'

test.describe('Patt-Warnung und Zurücknehmen', () => {
  test('Patt-Gefahr-Banner: „Anders ziehen" verhindert den Zug, „Trotzdem ziehen" führt zum Patt', async ({
    page,
  }) => {
    const errors = collectErrors(page)
    await prepare(page)
    await page.evaluate(
      ([key, pgn]) => {
        localStorage.setItem(
          key,
          JSON.stringify({ pgn, tipsLeft: 5, status: 'playing', winner: null }),
        )
      },
      [GAME_KEY, PATT_PGN] as const,
    )
    await page.reload({ waitUntil: 'networkidle' })
    await waitForStatus(page, 'Du bist am Zug')
    // Eval-Berechnung (Vorteils-Check für die Patt-Heuristik) abwarten
    await page.waitForTimeout(2500)

    const sq = boardSquares(page)
    const clickSq = async (f: number, r: number) => {
      const p = await sq(f, r)
      await page.mouse.click(p.x, p.y)
    }

    // Dame c8 → e6 wäre Patt → Banner erscheint VOR dem Zug
    await clickSq(2, 8)
    await clickSq(4, 6)
    await page.waitForFunction(
      () => document.body.textContent?.includes('Patt-Gefahr') ?? false,
      null,
      { timeout: 10_000 },
    )

    // „Anders ziehen" → Partie läuft weiter, Qe6 wurde nicht ausgeführt/persistiert
    await page.getByRole('button', { name: 'Anders ziehen' }).click()
    await page.waitForTimeout(400)
    await waitForStatus(page, 'Du bist am Zug', 5_000)
    expect(await persistedPgn(page)).not.toContain('Qe6')
    expect(await page.locator('.board cg-board piece').count()).toBeGreaterThan(0)

    // Erneut c8 → e6, diesmal „Trotzdem ziehen" → Patt wird ausgeführt
    await clickSq(2, 8)
    await page.waitForTimeout(300)
    await clickSq(4, 6)
    await page.waitForFunction(
      () => document.body.textContent?.includes('Patt-Gefahr') ?? false,
      null,
      { timeout: 10_000 },
    )
    await page.getByRole('button', { name: 'Trotzdem ziehen' }).click()
    await page.waitForFunction(
      () => document.body.textContent?.includes('Patt – Unentschieden') ?? false,
      null,
      { timeout: 10_000 },
    )

    expect(errors).toEqual([])
  })

  test('Fehlerwarnung im Hotseat: „Zurücknehmen" entfernt g4 aus der persistierten PGN', async ({
    page,
  }) => {
    const errors = collectErrors(page)
    await prepare(page)
    await startHotseat(page)

    await tapMove(page, [5, 2], [5, 3]) // f3
    await tapMove(page, [4, 7], [4, 5]) // e5
    await tapMove(page, [6, 2], [6, 4]) // g4?? → Fehlerwarnung

    await page.waitForFunction(
      () => document.body.textContent?.includes('riskant') ?? false,
      null,
      { timeout: 15_000 },
    )
    // Achtung: getByText wäre mehrdeutig („Zurück" im Controls-Bereich) → Role-Selektor
    await page.getByRole('button', { name: 'Zurücknehmen' }).click()

    await page.waitForFunction(
      (key) => {
        const raw = localStorage.getItem(key)
        if (!raw) return false
        const pgn = JSON.parse(raw).pgn as string
        return pgn.includes('f3') && pgn.includes('e5') && !pgn.includes('g4')
      },
      GAME_KEY,
      { timeout: 10_000 },
    )
    await waitForStatus(page, 'Weiß ist am Zug', 5_000)

    expect(errors).toEqual([])
  })
})
