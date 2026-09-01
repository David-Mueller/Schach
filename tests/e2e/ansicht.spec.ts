import { expect, test } from '@playwright/test'
import { collectErrors, prepare } from './helpers'

test.describe('Ansicht und Einstellungen', () => {
  test('3D ist Standard; 2D-Umschaltung behält alle Figuren, Rückschalten funktioniert', async ({
    page,
  }) => {
    const errors = collectErrors(page)
    await prepare(page)

    // 3D ist die Standard-Ansicht
    await page.waitForSelector('.board-frame.board--3d .board.cg-wrap cg-board piece', {
      timeout: 15_000,
    })

    // Auf 2D umschalten
    await page.click('.style-toggle')
    await page.waitForFunction(() => !document.querySelector('.board--3d'), null, {
      timeout: 5_000,
    })
    const check2d = await page.evaluate(() => {
      const wrap = document.querySelector('.board.cg-wrap')
      const piece = document.querySelector('cg-board piece.white.pawn')
      return {
        wrapIntact: !!wrap,
        pieceCount: document.querySelectorAll('cg-board piece').length,
        bg: piece ? getComputedStyle(piece).backgroundImage : 'FEHLT',
      }
    })
    expect(check2d.wrapIntact).toBe(true)
    expect(check2d.pieceCount).toBe(32)
    expect(check2d.bg).toContain('url')

    // Zurück auf 3D
    await page.click('.style-toggle')
    await page.waitForSelector('.board-frame.board--3d', { timeout: 5_000 })
    expect(await page.locator('cg-board piece').count()).toBe(32)

    expect(errors).toEqual([])
  })

  test('Stärke-Auswahl bietet 6 Stufen, Stufe 0 zuerst', async ({ page }) => {
    const errors = collectErrors(page)
    await prepare(page)

    await page.click('[aria-label="Einstellungen"]')
    await page.waitForSelector('.seg')
    const options = await page
      .locator('select')
      .first()
      .locator('option')
      .allTextContents()
    expect(options).toHaveLength(6)
    expect(options[0]).toContain('Stufe 0')
    for (let i = 0; i < 6; i++) expect(options[i]).toContain(`Stufe ${i}`)

    expect(errors).toEqual([])
  })
})
