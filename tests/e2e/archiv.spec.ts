import { expect, test } from '@playwright/test'
import { collectErrors, prepare, startHotseat, tapMove, waitForStatus } from './helpers'

test.describe('Partie-Archiv & Versionsanzeige', () => {
  test('beendete Partie landet im Archiv und überlebt »Neue Partie«', async ({ page }) => {
    const errors = collectErrors(page)
    await prepare(page)
    await startHotseat(page)

    // Narrenmatt: f3 e5 g4 (Fehlerwarnung wegklicken) Dh4#
    await tapMove(page, [5, 2], [5, 3])
    await tapMove(page, [4, 7], [4, 5])
    await tapMove(page, [6, 2], [6, 4])
    await page.getByRole('button', { name: 'Weiterspielen' }).click()
    await page.waitForTimeout(300)
    await tapMove(page, [3, 8], [7, 4])
    await expect(page.locator('.dialog .title')).toContainText('Schachmatt', { timeout: 10_000 })

    // Archiv in den Einstellungen prüfen
    await page.getByRole('button', { name: 'Brett ansehen' }).click()
    await page.click('[aria-label="Einstellungen"]')
    const row = page.locator('.archive-row')
    await expect(row).toHaveCount(1)
    await expect(row.first()).toContainText('Schwarz gewinnt')
    await expect(row.first()).toContainText('2 Züge')

    // Versionszeile sichtbar
    await expect(page.locator('.version')).toContainText('Stand')

    // Neue Partie starten → Archiv-Eintrag bleibt erhalten
    await page.getByText('Neue Partie starten').click()
    await waitForStatus(page, 'Weiß ist am Zug', 10_000)
    await page.click('[aria-label="Einstellungen"]')
    await expect(page.locator('.archive-row')).toHaveCount(1)

    expect(errors).toEqual([])
  })

  test('angefangene Partie wird bei »Neue Partie« als abgebrochen archiviert', async ({ page }) => {
    const errors = collectErrors(page)
    await prepare(page)
    await startHotseat(page)

    // Zwei Halbzüge spielen, dann neue Partie (confirm wird autoakzeptiert)
    await tapMove(page, [4, 2], [4, 4])
    await tapMove(page, [4, 7], [4, 5])
    await page.click('[aria-label="Einstellungen"]')
    await page.getByText('Neue Partie starten').click()
    await waitForStatus(page, 'Weiß ist am Zug', 10_000)

    await page.click('[aria-label="Einstellungen"]')
    const row = page.locator('.archive-row')
    await expect(row).toHaveCount(1)
    await expect(row.first()).toContainText('abgebrochen')

    expect(errors).toEqual([])
  })
})
