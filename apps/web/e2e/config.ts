import { devices, type PlaywrightTestConfig } from '@playwright/test';

type Theme = 'light' | 'dark';

/** Mobile (390 px) et ordinateur, chacun en clair et en sombre : les quatre cas des maquettes. */
const MOBILE = { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } };
const DESKTOP = { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } };

const project = (screen: 'mobile' | 'desktop', colorScheme: Theme) => ({
  name: `${screen}-${colorScheme}`,
  use: { ...(screen === 'mobile' ? MOBILE : DESKTOP), colorScheme },
});

/**
 * En CI : les quatre combinaisons. En local : une seule (la machine est modeste),
 * sauf si E2E_ALL est posé. Toujours Chromium, c'est ce que la CI installe.
 */
export function buildConfig(
  env: Record<string, string | undefined> = process.env,
): PlaywrightTestConfig {
  const port = Number(env.E2E_PORT ?? 3100);
  const all = Boolean(env.CI) || Boolean(env.E2E_ALL);
  const projects = all
    ? [
        project('mobile', 'light'),
        project('mobile', 'dark'),
        project('desktop', 'light'),
        project('desktop', 'dark'),
      ]
    : [project('desktop', 'light')];
  return {
    testDir: './e2e',
    testMatch: '**/*.spec.ts',
    fullyParallel: true,
    forbidOnly: Boolean(env.CI),
    retries: env.CI ? 1 : 0,
    reporter: env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
    use: { baseURL: `http://localhost:${port}`, trace: 'on-first-retry' },
    projects,
    // Le site doit être construit avant (`pnpm build`) ; la CI le fait dans une étape à part.
    webServer: {
      command: `pnpm exec next start -p ${port}`,
      url: `http://localhost:${port}`,
      reuseExistingServer: !env.CI,
      timeout: 60_000,
    },
  };
}
