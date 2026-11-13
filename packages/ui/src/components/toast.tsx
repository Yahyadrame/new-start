import { Toaster as Sonner, toast } from 'sonner';

export { toast };

/** À monter une fois à la racine. Les couleurs suivent les jetons, donc le thème clair ou sombre. */
export function Toaster() {
  return (
    <Sonner
      position="top-center"
      style={
        {
          '--normal-bg': 'var(--color-surface-1)',
          '--normal-text': 'var(--color-text)',
          '--normal-border': 'var(--color-line)',
        } as React.CSSProperties
      }
    />
  );
}
