import { expect, test } from '@playwright/test'
import { collectErrors, prepare, tapMove, waitForHalfmoves, waitForStatus } from './helpers'

test.describe('Profile & Backup', () => {
  test('Profil anlegen, wechseln, löschen – getrennte Spielstände', async ({ page }) => {
    const errors = collectErrors(page)
    await prepare(page)
    await waitForStatus(page, 'Du bist am Zug')

    // Im Standardprofil eine Partie beginnen (2 Halbzüge)
    await tapMove(page, [4, 2], [4, 4])
    await waitForHalfmoves(page, 2)

    // Neues Profil »Daniel« anlegen → wechselt sofort, App startet frisch
    await page.click('.profile-chip')
    await page.fill('.profile-new input', 'Daniel')
    await page.getByRole('button', { name: 'Anlegen' }).click()
    await expect(page.locator('.profile-chip')).toContainText('Daniel', { timeout: 15_000 })
    await page.waitForSelector('.board cg-board')
    await expect(page.locator('.movelist .mv')).toHaveCount(0)

    // Zurück zum Standardprofil → die angefangene Partie ist wieder da
    await page.click('.profile-chip')
    await page
      .locator('.profile-row', { hasText: 'Spieler 1' })
      .getByRole('button', { name: 'Wechseln' })
      .click()
    await expect(page.locator('.profile-chip')).toContainText('Spieler 1', { timeout: 15_000 })
    await page.waitForSelector('.board cg-board')
    await expect(page.locator('.movelist .mv')).toHaveCount(2, { timeout: 15_000 })

    // »Daniel« löschen (confirm wird im Test automatisch bestätigt)
    await page.click('[aria-label="Einstellungen"]')
    await page.getByRole('button', { name: 'Profil Daniel löschen' }).click()
    await expect(page.locator('.profile-row')).toHaveCount(1)
    await expect(page.locator('.profile-row')).toContainText('Spieler 1')

    expect(errors).toEqual([])
  })

  test('Backup exportieren und wiederherstellen', async ({ page }) => {
    const errors = collectErrors(page)
    await prepare(page)
    await waitForStatus(page, 'Du bist am Zug')
    await tapMove(page, [4, 2], [4, 4])
    await waitForHalfmoves(page, 2)

    // Backup als JSON-Datei herunterladen
    await page.click('[aria-label="Einstellungen"]')
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Backup exportieren' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/^schachtrainer-backup-.+\.json$/)
    const backupPath = await download.path()

    // Gerät »leeren« – alles weg
    await page.evaluate(() => localStorage.clear())
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForSelector('.board cg-board')
    await expect(page.locator('.movelist .mv')).toHaveCount(0)

    // Backup wiederherstellen → Partie ist zurück
    await page.click('[aria-label="Einstellungen"]')
    await page.locator('input[type="file"]').setInputFiles(backupPath)
    await expect(page.locator('.movelist .mv')).toHaveCount(2, { timeout: 15_000 })

    expect(errors).toEqual([])
  })
})
