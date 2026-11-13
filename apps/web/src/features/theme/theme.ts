export const THEME_KEY = 'ns-theme';
export type Theme = 'system' | 'light' | 'dark';

export function isTheme(value: unknown): value is Theme {
  return value === 'system' || value === 'light' || value === 'dark';
}

/** Applique le thème sur <html> : « système » retire l'attribut et laisse prefers-color-scheme décider. */
export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

export function readTheme(storage: Pick<Storage, 'getItem'> | undefined): Theme {
  try {
    const value = storage?.getItem(THEME_KEY);
    return isTheme(value) ? value : 'system';
  } catch {
    return 'system';
  }
}

/** Script exécuté avant l'affichage, pour éviter un flash de mauvais thème. */
export const themeInitScript = `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;
