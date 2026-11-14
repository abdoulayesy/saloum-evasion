import { defineConfig, devices } from '@playwright/test';

const PORT = 3000;
const SEO_SPECS = /.*\.(seo|nojs)\.spec\.ts/;
// Admin Payload : testé sur ordinateur seulement (dérogation D-T6b).
const ADMIN_SPECS = /cms\.smoke\.spec\.ts/;
const baseURL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

// Appareil de référence de la constitution : Android milieu de gamme, 360 px de large.
const android360 = {
  viewport: { width: 360, height: 800 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (Linux; Android 13; SM-A145F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
};

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    locale: 'fr-SN',
    trace: 'retain-on-failure',
  },
  projects: [
    // Les profils réseau (CDP) ne fonctionnent que sous Chromium : tests 3G / 4G lente
    // sur les projets Chromium uniquement ; iphone-se (WebKit) sert au rendu.
    {
      name: 'android-360',
      use: { ...devices['Desktop Chrome'], ...android360 },
      testIgnore: [SEO_SPECS, ADMIN_SPECS],
    },
    {
      name: 'android-360-landscape',
      use: { ...devices['Desktop Chrome'], ...android360, viewport: { width: 800, height: 360 } },
      testIgnore: [SEO_SPECS, ADMIN_SPECS],
    },
    { name: 'pixel-7', use: { ...devices['Pixel 7'] }, testIgnore: [SEO_SPECS, ADMIN_SPECS] },
    {
      name: 'iphone-se',
      use: { ...devices['iPhone SE'] },
      grepInvert: /@chromium-only/,
      testIgnore: [SEO_SPECS, ADMIN_SPECS],
      // WebKit plante sous forte concurrence (constaté sous Windows avec 8 workers) :
      // parallélisme limité pour ce seul projet, sans désactiver aucun test.
      workers: 2,
    },
    {
      name: 'nojs',
      use: { ...devices['Desktop Chrome'], ...android360, javaScriptEnabled: false },
      testMatch: SEO_SPECS,
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
      testIgnore: SEO_SPECS,
    },
  ],
  webServer: {
    command: `node ./node_modules/next/dist/bin/next start -p ${PORT}`,
    url: `${baseURL}/fr`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
