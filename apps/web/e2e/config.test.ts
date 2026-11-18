import { describe, expect, it } from 'vitest';
import { buildConfig } from './config';

const names = (env: Record<string, string | undefined>) =>
  buildConfig(env).projects?.map((p) => p.name);

describe('buildConfig', () => {
  it('lance les quatre combinaisons mobile/ordinateur et clair/sombre en CI', () => {
    expect(names({ CI: 'true' })).toEqual([
      'mobile-light',
      'mobile-dark',
      'desktop-light',
      'desktop-dark',
    ]);
  });

  it("n'en lance qu'une en local, sauf E2E_ALL", () => {
    expect(names({})).toEqual(['desktop-light']);
    expect(names({ E2E_ALL: '1' })).toHaveLength(4);
  });

  it('applique le thème et la largeur de chaque combinaison', () => {
    const p = buildConfig({ CI: 'true' }).projects ?? [];
    const dark = p.find((x) => x.name === 'mobile-dark');
    expect(dark?.use?.colorScheme).toBe('dark');
    expect(dark?.use?.viewport?.width).toBe(390);
    expect(p.find((x) => x.name === 'desktop-light')?.use?.viewport?.width).toBe(1280);
  });

  it('sert le site sur le port demandé et ne réutilise pas un serveur en CI', () => {
    const local = buildConfig({ E2E_PORT: '4000' });
    expect(local.use?.baseURL).toBe('http://localhost:4000');
    expect(local.webServer).toMatchObject({ reuseExistingServer: true });
    expect(buildConfig({ CI: 'true' }).webServer).toMatchObject({ reuseExistingServer: false });
    expect(buildConfig({ CI: 'true' }).retries).toBe(1);
  });
});
