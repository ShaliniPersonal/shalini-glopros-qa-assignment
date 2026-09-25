import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the GloPros vacancy search suite.
 * The application under test is a deployed review environment.
 */

/* `||` rather than `??` on purpose. `??` only falls through on null and
   undefined, so an empty `BASE_URL` — from `BASE_URL= npm test`, or a CI
   variable that resolves to '' — would be accepted as a value and leave
   baseURL blank. `||` treats it as absent and uses the default. */
const BASE_URL =
  process.env.BASE_URL || 'https://review-chore-qa-i-lgtytk.dev.glopros.com';

export default defineConfig({
  testDir: './tests',

  /* Tests share no state — each gets a fresh browser context — so they are
     safe to run concurrently. */
  fullyParallel: true,

  /* Fail the build if a `test.only` was committed by accident. */
  forbidOnly: !!process.env.CI,

  /* Two retries on CI, none locally.
     Locally a retry hides a real failure while you are still writing the test.
     On CI they absorb the transient failures that come with testing a shared
     remote environment — a slow response or a cold start — without which the
     build would go red for reasons unrelated to the code. A test that only
     passes on retry is reported as flaky rather than silently green. */
  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,

    /* Diagnostics kept for failures only, so a green run stays cheap.
       `on-first-retry` means a trace exists for exactly the attempt that
       mattered, which is what makes a CI failure diagnosable without
       reproducing it locally. */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    /* The search results are rendered after a network round trip on a shared
       review environment, so the defaults are raised. These are deliberate
       ceilings, not padding: every wait in the suite is an auto-retrying
       assertion, never a fixed sleep. */
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  /* 60s per test rather than the 30s default, for the same reason. */
  timeout: 60_000,

  expect: {
    timeout: 15_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
