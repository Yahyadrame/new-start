import { expect, test, type Page } from '@playwright/test';
import { signedIn } from './mock-api';

/** L'élément qui a le focus, avec de quoi dire si un indicateur est visible. */
async function focused(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const s = getComputedStyle(el);
    const outline = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
    // Le champ de message n'a pas de cadre propre : c'est son conteneur qui s'entoure au focus.
    const ring =
      s.boxShadow !== 'none' ||
      (el.tagName === 'TEXTAREA' &&
        !!el.parentElement &&
        getComputedStyle(el.parentElement).boxShadow !== 'none');
    const name = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40);
    return { tag: el.tagName.toLowerCase(), name, visible: outline || ring };
  });
}

const SCREENS = [
  '/chats',
  '/explore',
  '/progress',
  '/games',
  '/chats/jade',
  '/series',
  '/notifications',
  '/profile',
  '/plans',
  '/terms',
  '/privacy',
] as const;

for (const path of SCREENS) {
  test(`au clavier, ${path} s'atteint avec un focus visible et sans piège`, async ({ page }) => {
    await signedIn(page);
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    // L'écran a affiché au moins un élément qu'on peut atteindre au clavier.
    await page
      .locator('a[href]:visible, button:visible, input:visible, select:visible, textarea:visible')
      .first()
      .waitFor();

    const seen: string[] = [];
    const hidden: string[] = [];
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Tab');
      const el = await focused(page);
      if (!el) {
        if (seen.length > 0) break; // le focus sort de la page : on a fait le tour
        continue;
      }
      const id = `${el.tag} « ${el.name} »`;
      if (!el.visible) hidden.push(id);
      seen.push(id);
    }
    // Au moins un élément atteint, et chacun montre où est le focus.
    expect(seen.length).toBeGreaterThan(0);
    expect(hidden).toEqual([]);
  });
}
