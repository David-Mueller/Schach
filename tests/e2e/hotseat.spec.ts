import { expect, test } from '@playwright/test'
import { collectErrors, prepare, startHotseat, tapMove } from './helpers'

test.describe('Hotseat-Modus („Zu zweit")', () => {
  test('Narrenmatt: Fehlerwarnung bei g4, Weiterspielen, Dh4# zeigt Matt-Overlay', async ({
    page,
  }) => {
    const errors = collectErrors(page)
    await prepare(page)
    await startHotseat(page)

    await tapMove(page, [5, 2], [5, 3]) // f3
    await tapMove(page, [4, 7], [4, 5]) // e5
    await tapMove(page, [6, 2], [6, 4]) // g4?? → Patzer-Warnung erwartet

    // Fehlerwarnung erscheint (Engine-Eval kann etwas dauern)
    await expect(page.locator('.blunder')).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: 'Weiterspielen' }).click()
    await expect(page.locator('.blunder')).toBeHidden()

    await tapMove(page, [3, 8], [7, 4]) // Dh4#
    await page.waitForFunction(
      () => document.body.textContent?.includes('Schachmatt') ?? false,
      null,
      { timeout: 10_000 },
    )
    await expect(page.locator('.dialog .title')).toHaveText('Schachmatt – Schwarz gewinnt!')

    expect(errors).toEqual([])
  })

  test('3D-Dreh-Ansicht: Brett dreht sich nach weißem Zug zu Schwarz und zurück', async ({
    page,
  }) => {
    const errors = collectErrors(page)
    await prepare(page)
    await startHotseat(page)

    // Vor dem ersten Zug: keine Flip-Klasse
    expect(await page.locator('.board-frame.board--3d-flip').count()).toBe(0)

    await tapMove(page, [4, 2], [4, 4]) // e4 (Weiß)
    await page.waitForFunction(
      () => !!document.querySelector('.board-frame.board--3d-flip'),
      null,
      { timeout: 5_000 },
    )

    // Dreh-Animation und z-Index-Pass abwarten, dann Stichprobe:
    // im Flip muss die (visuell) oberste Reihe die höchste z-Index-Zahl haben,
    // damit die Figuren korrekt übereinander gestapelt gezeichnet werden.
    await page.waitForTimeout(800)
    const zByRow = await page.evaluate(() => {
      const board = document.querySelector('cg-board')
      if (!board) return null
      const sqH = board.getBoundingClientRect().height / 8
      const byRow: Record<number, number> = {}
      board.querySelectorAll('piece').forEach((pc) => {
        const el = pc as HTMLElement
        const m = /translate\(-?[\d.]+px(?:, ?(-?[\d.]+)px)?\)/.exec(el.style.transform)
        if (!m) return
        const row = Math.round(parseFloat(m[1] ?? '0') / sqH)
        byRow[row] = Number(el.style.zIndex || 0)
      })
      return byRow
    })
    expect(zByRow).not.toBeNull()
    const rows = Object.keys(zByRow!)
      .map(Number)
      .sort((a, b) => a - b)
    expect(rows.length).toBeGreaterThan(1)
    const topRow = rows[0]
    const maxZ = Math.max(...Object.values(zByRow!))
    expect(zByRow![topRow]).toBe(maxZ)

    await tapMove(page, [4, 7], [4, 5]) // e5 (Schwarz)
    await page.waitForFunction(
      () => !document.querySelector('.board-frame.board--3d-flip'),
      null,
      { timeout: 5_000 },
    )

    expect(errors).toEqual([])
  })
})
