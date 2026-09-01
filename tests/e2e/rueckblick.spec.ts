import { expect, test } from '@playwright/test'
import { collectErrors, prepare, startHotseat, tapMove } from './helpers'

test.describe('Partie-Rückblick', () => {
  test('Narrenmatt durchblättern: Bewertungen, Patzer-Pfeil, Schachmatt-Lob', async ({
    page,
  }) => {
    const errors = collectErrors(page)
    await prepare(page)
    await startHotseat(page)

    // Narrenmatt spielen (Fehlerwarnung bei g4 wegklicken)
    await tapMove(page, [5, 2], [5, 3]) // f3
    await tapMove(page, [4, 7], [4, 5]) // e5
    await tapMove(page, [6, 2], [6, 4]) // g4??
    await expect(page.locator('.blunder')).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: 'Weiterspielen' }).click()
    await tapMove(page, [3, 8], [7, 4]) // Dh4#
    await expect(page.locator('.dialog .title')).toHaveText('Schachmatt – Schwarz gewinnt!', {
      timeout: 10_000,
    })

    // Rückblick aus dem Game-Over-Dialog starten
    await page.getByRole('button', { name: 'Rückblick – Züge bewerten' }).click()
    await expect(page.locator('.review-counter')).toContainText('0/4')

    // Zug 1 (f3): irgendeine Bewertung erscheint
    await page.click('[aria-label="Nächster Zug"]')
    await expect(page.locator('.review-counter')).toContainText('1/4')
    await expect(page.locator('.feedback-box')).toBeVisible({ timeout: 25_000 })

    // Zug 3 (g4): Grober Fehler + Besser-Pfeil auf dem Brett
    await page.click('[aria-label="Nächster Zug"]')
    await page.click('[aria-label="Nächster Zug"]')
    await expect(page.locator('.review-counter')).toContainText('3/4')
    await expect(page.locator('.feedback-box.verdict-blunder')).toBeVisible({ timeout: 25_000 })
    expect(await page.evaluate(() => !!document.querySelector('.board .cg-shapes g line'))).toBe(
      true,
    )

    // Zug 4 (Dh4#): Schachmatt-Lob
    await page.click('[aria-label="Nächster Zug"]')
    await expect(page.locator('.feedback-box')).toContainText('Schachmatt', { timeout: 25_000 })

    // Zurückblättern nutzt den Cache (Bewertung sofort da)
    await page.click('[aria-label="Zug zurück"]')
    await expect(page.locator('.review-counter')).toContainText('3/4')
    await expect(page.locator('.feedback-box.verdict-blunder')).toBeVisible({ timeout: 5_000 })

    // Schließen → Game-Over-Dialog ist wieder da
    await page.click('[aria-label="Rückblick schließen"]')
    await expect(page.locator('.dialog .title')).toHaveText('Schachmatt – Schwarz gewinnt!')

    expect(errors).toEqual([])
  })
})
