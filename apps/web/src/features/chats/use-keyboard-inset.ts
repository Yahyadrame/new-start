import { useEffect } from 'react';

/** Hauteur masquée par le clavier : la page ne rétrécit pas sur iPhone, seule la zone visible se réduit. */
export function keyboardInset(viewport: Pick<VisualViewport, 'height' | 'offsetTop'>): number {
  return Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop));
}

/** Publie la hauteur du clavier dans `--kb` pour que la barre d'écriture reste au-dessus de lui. */
export function useKeyboardInset(): void {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty('--kb', `${keyboardInset(viewport)}px`);
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      root.style.removeProperty('--kb');
    };
  }, []);
}
