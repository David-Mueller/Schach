import { defineConfig } from '@playwright/test'

// Vor dem Testlauf bauen: pnpm build && pnpm test:e2e
// In Umgebungen mit vorinstalliertem Chromium (z. B. Claude-Code-Container)
// den Pfad per PW_CHROMIUM setzen; sonst einmalig: npx playwright install chromium
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  workers: 1, // eine Engine-Instanz pro Preview-Server genügt
  reporter: [['list']],
  use: {
    viewport: { width: 390, height: 844 }, // Smartphone-Format
    launchOptions: process.env.PW_CHROMIUM
      ? { executablePath: process.env.PW_CHROMIUM }
      : {},
  },
  webServer: {
    command: 'pnpm preview --port 4173',
    port: 4173,
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
