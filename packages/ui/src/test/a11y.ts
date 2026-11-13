import axe from 'axe-core';

/** Échoue si axe-core trouve une violation d'accessibilité dans le conteneur. */
export async function expectNoA11yViolations(container: HTMLElement): Promise<void> {
  const { violations } = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  }); // jsdom ne calcule pas les couleurs
  if (violations.length > 0) {
    throw new Error(violations.map((v) => `${v.id} : ${v.help}`).join('\n'));
  }
}
