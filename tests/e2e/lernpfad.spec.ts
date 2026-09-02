import { expect, test } from '@playwright/test'
import { LEVELS } from '../../src/lessons/curriculum'
import { type Coord, collectErrors, prepare, tapMove, waitForStatus } from './helpers'

test.describe('Lernpfad (Fahrschule)', () => {
  test('Lektion mitspielen: Coach-Hinweise, Sterne, Ab-hier-weiterspielen', async ({ page }) => {
    const errors = collectErrors(page)
    await prepare(page)

    // Lernpfad: Stufe 1 offen, Stufe 2 gesperrt
    await page.click('[aria-label="Lernpfad"]')
    await page.waitForSelector('.stage')
    await expect(page.locator('.stage').first()).not.toHaveClass(/locked/)
    await expect(page.locator('.stage').nth(1)).toHaveClass(/locked/)

    // Erste Lektion (Zentrum & Entwicklung) im Übungsmodus starten
    await page.locator('.lesson-row .btn.primary').first().click()
    await expect(page.locator('.lesson-box')).toContainText('goldene Regel', { timeout: 10_000 })

    // Geführtes Üben: Die Aufgabe steht sofort da, die Figur ist markiert
    await expect(page.locator('.lesson-task')).toContainText('Königsbauer')
    expect(await page.evaluate(() => !!document.querySelector('.board .cg-shapes g *'))).toBe(true)

    // Falscher Zug → sofort Pfeil + »Fast!«; zweiter Fehlversuch für die Sterne-Probe
    await tapMove(page, [0, 2], [0, 4]) // a4 statt e4
    await expect(page.locator('.lesson-task')).toContainText('Fast!')
    expect(await page.evaluate(() => !!document.querySelector('.board .cg-shapes g line'))).toBe(true)
    await tapMove(page, [0, 2], [0, 3])
    await expect(page.locator('.lesson-task')).toContainText('Fast!')

    // Lektion durchspielen (weiße Züge); Gegnerzüge laufen automatisch
    const whiteMoves: [Coord, Coord][] = [
      [[4, 2], [4, 4]], // e4
      [[6, 1], [5, 3]], // Sf3
      [[5, 1], [2, 4]], // Lc4
      [[1, 1], [2, 3]], // Sc3
      [[3, 2], [3, 3]], // d3
      [[4, 1], [6, 1]], // O-O
    ]
    for (const [from, to] of whiteMoves) {
      await page.waitForFunction(
        () => document.querySelector('.status')?.textContent?.includes('Du bist dran') ?? false,
        null,
        { timeout: 15_000 },
      )
      await tapMove(page, from, to)
    }

    // Abschluss: 2 Fehlversuche → 2 Sterne
    await expect(page.locator('.lesson-finish')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('.finish-stars')).toHaveText(/★★☆/)

    // Ab hier weiterspielen: Engine übernimmt die Gegnerseite
    await page.getByRole('button', { name: 'Ab hier weiterspielen' }).click()
    await waitForStatus(page, 'Du bist am Zug', 15_000)
    await tapMove(page, [3, 3], [3, 4]) // d4
    await page.waitForFunction(
      () => document.querySelectorAll('.movelist .mv').length >= 14,
      null,
      { timeout: 30_000 },
    )

    // Fortschritt gespeichert
    await page.click('[aria-label="Lernpfad"]')
    await expect(page.locator('.lesson-row .stars').first()).toHaveText(/★★☆/)

    expect(errors).toEqual([])
  })

  test('Fehlerfreie Lektion: 3 Sterne, Konfetti und Sternezähler', async ({ page }) => {
    const errors = collectErrors(page)
    await prepare(page)

    await page.click('[aria-label="Lernpfad"]')
    await page.locator('.lesson-row .btn.primary').first().click()
    await expect(page.locator('.lesson-task')).toBeVisible({ timeout: 10_000 })

    const whiteMoves: [Coord, Coord][] = [
      [[4, 2], [4, 4]], // e4
      [[6, 1], [5, 3]], // Sf3
      [[5, 1], [2, 4]], // Lc4
      [[1, 1], [2, 3]], // Sc3
      [[3, 2], [3, 3]], // d3
      [[4, 1], [6, 1]], // O-O
    ]
    for (const [from, to] of whiteMoves) {
      await page.waitForFunction(
        () => document.querySelector('.status')?.textContent?.includes('Du bist dran') ?? false,
        null,
        { timeout: 15_000 },
      )
      await tapMove(page, from, to)
    }

    // Fehlerfrei → 3 Sterne + Konfetti
    await expect(page.locator('.lesson-finish')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('.finish-stars')).toHaveText(/★★★/)
    await expect(page.locator('.confetti-screen')).toBeVisible()

    // Sternezähler im Lernpfad zeigt die gesammelten Sterne
    await page.getByRole('button', { name: 'Zum Lernpfad' }).click()
    await expect(page.locator('.total-stars')).toContainText('3/')

    expect(errors).toEqual([])
  })

  test('Film-Modus: »Weiter« spielt die Züge einzeln ab, kein Autoplay', async ({ page }) => {
    const errors = collectErrors(page)
    await prepare(page)

    // Erste Lektion als Film (🎬) starten
    await page.click('[aria-label="Lernpfad"]')
    await page.locator('.lesson-row .btn.small').first().click()
    await expect(page.locator('.lesson-box')).toContainText('goldene Regel', { timeout: 10_000 })

    // Kein Autoplay: Auch nach Wartezeit steht noch die Einleitung
    await page.waitForTimeout(2600)
    await expect(page.locator('.lesson-box')).toContainText('goldene Regel')

    // »Weiter« spielt genau einen Zug samt Kommentar ab
    const weiter = page.getByRole('button', { name: 'Weiter ▶' })
    await weiter.click()
    await expect(page.locator('.lesson-box')).toContainText('Königsbauer')

    // Restliche 11 Züge durchklicken → Abschluss ohne Sterne (Film zählt nicht)
    for (let i = 0; i < 11; i++) {
      await weiter.click()
      await page.waitForTimeout(120)
    }
    await expect(page.locator('.lesson-finish')).toBeVisible()
    await expect(page.locator('.finish-stars')).toHaveCount(0)

    expect(errors).toEqual([])
  })

  test('Level 2 schaltet erst mit allen 39 Sternen frei', async ({ page }) => {
    const errors = collectErrors(page)
    await prepare(page)

    const level1Ids = LEVELS[0]!.stages.flatMap((s) => s.lessons)
    const seedProgress = (stars: number[]) =>
      page.evaluate(
        (entries) => localStorage.setItem('schach.lernpfad.v1', JSON.stringify(entries)),
        Object.fromEntries(
          level1Ids.map((id, i) => [id, { stars: stars[i], completedAt: '2026-01-01T00:00:00Z' }]),
        ),
      )

    // Ohne Fortschritt: Level-2-Tab gesperrt, Antippen zeigt den Hinweis
    await page.click('[aria-label="Lernpfad"]')
    await expect(page.locator('.level-tab').nth(1)).toContainText('🔒')
    await page.locator('.level-tab').nth(1).click()
    await expect(page.locator('.level-locked-hint')).toContainText('39 Sterne')
    await expect(page.locator('.stage.locked')).toHaveCount(5)
    await expect(page.locator('.lesson-row')).toHaveCount(0)

    // 38 von 39 Sternen: bleibt gesperrt
    await seedProgress(level1Ids.map((_, i) => (i === 0 ? 2 : 3)))
    await page.click('[aria-label="Schließen"]')
    await page.click('[aria-label="Lernpfad"]')
    await page.locator('.level-tab').nth(1).click()
    await expect(page.locator('.level-locked-hint')).toContainText('schon 38')

    // Alle 39 Sterne: Level 2 offen und wird automatisch angezeigt
    await seedProgress(level1Ids.map(() => 3))
    await page.click('[aria-label="Schließen"]')
    await page.click('[aria-label="Lernpfad"]')
    await expect(page.locator('.level-tab.active')).toContainText('Level 2')
    await expect(page.locator('.total-stars')).toContainText('0/39')
    await expect(page.locator('.stage').first()).toContainText('Stufe 6')
    await expect(page.locator('.stage').first()).not.toHaveClass(/locked/)
    await expect(page.locator('.stage').nth(1)).toHaveClass(/locked/)

    // Erste Level-2-Lektion (mit Schwarz) startet und der Coach meldet sich
    await page.locator('.lesson-row .btn.primary').first().click()
    await expect(page.locator('.lesson-box')).toBeVisible({ timeout: 10_000 })
    await waitForStatus(page, 'Du bist dran', 15_000)

    expect(errors).toEqual([])
  })

  test('Lektion beenden stellt den vorherigen Spielstand wieder her', async ({ page }) => {
    const errors = collectErrors(page)
    await prepare(page)
    await waitForStatus(page, 'Du bist am Zug')

    // Normale Partie beginnen (2 Halbzüge), dann Lektion starten und abbrechen
    await tapMove(page, [4, 2], [4, 4])
    await page.waitForFunction(
      () => document.querySelectorAll('.movelist .mv').length >= 2,
      null,
      { timeout: 30_000 },
    )
    await page.click('[aria-label="Lernpfad"]')
    await page.locator('.lesson-row .btn.primary').first().click()
    await expect(page.locator('.lesson-box')).toBeVisible({ timeout: 10_000 })
    // Zugliste ist während der Lektion leer (frisches Lektionsbrett)
    await expect(page.locator('.movelist')).toHaveCount(0)

    await page.getByRole('button', { name: 'Lektion beenden' }).click()
    // Der alte Spielstand (2 Halbzüge) ist zurück
    await page.waitForFunction(
      () => document.querySelectorAll('.movelist .mv').length === 2,
      null,
      { timeout: 10_000 },
    )

    expect(errors).toEqual([])
  })
})
