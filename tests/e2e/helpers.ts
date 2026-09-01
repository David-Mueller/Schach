import { type Page } from '@playwright/test'

/** Basis-URL des Preview-Servers (siehe playwright.config.ts, webServer-Port). */
export const BASE_URL = 'http://localhost:4173'

/** localStorage-Schlüssel des Spielstands. */
export const GAME_KEY = 'schach.game.v1'

/**
 * Sammelt JS-Fehler (pageerror + console.error) der Seite.
 * Am Testende mit `expect(errors).toEqual([])` prüfen.
 */
export function collectErrors(page: Page, { consoleErrors = true } = {}): string[] {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  if (consoleErrors) {
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`console: ${m.text()}`)
    })
  }
  return errors
}

/**
 * App laden, localStorage leeren, neu laden und auf das Brett warten.
 * Registriert außerdem einen Dialog-Autoaccept (confirm() bei "Neue Partie").
 */
export async function prepare(page: Page): Promise<void> {
  page.on('dialog', (d) => void d.accept())
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.board cg-board')
}

/** Feld-Koordinate: file 0–7 (a–h), rank 1–8. */
export type Coord = [file: number, rank: number]

/**
 * Liefert eine Funktion sq(file, rank) → Klick-Koordinaten in Seitenpixeln.
 * Holt die boundingBox des Bretts bei JEDEM Aufruf frisch, damit
 * Layout-Änderungen (z. B. geschlossene Einstellungen) berücksichtigt sind.
 */
export function boardSquares(page: Page) {
  return async (file: number, rank: number): Promise<{ x: number; y: number }> => {
    const box = await page.locator('.board cg-board').boundingBox()
    if (!box) throw new Error('Schachbrett nicht sichtbar (keine boundingBox)')
    return {
      x: box.x + ((file + 0.5) * box.width) / 8,
      y: box.y + ((8 - rank + 0.5) * box.height) / 8,
    }
  }
}

/** Zug per zwei Taps ausführen; danach kurze Animationspause. */
export async function tapMove(page: Page, from: Coord, to: Coord): Promise<void> {
  const sq = boardSquares(page)
  const a = await sq(from[0], from[1])
  await page.mouse.click(a.x, a.y)
  const b = await sq(to[0], to[1])
  await page.mouse.click(b.x, b.y)
  await page.waitForTimeout(450)
}

/** Wartet, bis die Statuszeile den Text enthält. */
export async function waitForStatus(page: Page, text: string, timeout = 30_000): Promise<void> {
  await page.waitForFunction(
    (t) => document.querySelector('.status')?.textContent?.includes(t) ?? false,
    text,
    { timeout },
  )
}

/** Wartet, bis die Zugliste mindestens n Halbzüge enthält (Engine kann dauern). */
export async function waitForHalfmoves(page: Page, n: number, timeout = 30_000): Promise<void> {
  await page.waitForFunction(
    (min) => document.querySelectorAll('.movelist .mv').length >= min,
    n,
    { timeout },
  )
}

/**
 * Über die Einstellungen in den Hotseat-Modus („Zu zweit") wechseln und
 * eine neue Partie starten. Dialog-Autoaccept muss registriert sein (prepare).
 */
export async function startHotseat(page: Page): Promise<void> {
  await page.click('[aria-label="Einstellungen"]')
  await page.waitForSelector('.seg')
  await page.click('.seg button:nth-child(2)')
  await page.getByText('Neue Partie starten').click()
  await waitForStatus(page, 'Weiß ist am Zug', 10_000)
}

/** Persistierte PGN aus dem localStorage lesen. */
export async function persistedPgn(page: Page): Promise<string> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw).pgn as string) : ''
  }, GAME_KEY)
}
