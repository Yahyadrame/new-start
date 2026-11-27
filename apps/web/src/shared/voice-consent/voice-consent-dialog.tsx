import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@newstart/ui';
import { useRef } from 'react';

/** Écran dédié au consentement vocal (docs/11-securite-donnees.md) : fermer ou refuser laisse l'écrit. */
export function VoiceConsentDialog({
  texts,
  open,
  onAccept,
  onDecline,
}: Readonly<{
  /** Chaque usage explique ce qu'il fait de l'enregistrement. */
  texts: { title: string; body: string; accept: string; decline: string };
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}>) {
  const opener = useRef<HTMLElement | null>(null);
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onDecline()}>
      {/* Sans déclencheur Radix, la fermeture perdrait le focus : on le rend à qui l'avait. */}
      <DialogContent
        onOpenAutoFocus={() => {
          opener.current = document.activeElement as HTMLElement | null;
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          opener.current?.focus();
        }}
      >
        <DialogTitle className="font-display text-2xl font-bold">{texts.title}</DialogTitle>
        <DialogDescription className="mt-3 text-[15px] text-text-muted">
          {texts.body}
        </DialogDescription>
        <div className="mt-6 flex flex-col gap-2.5">
          <Button size="lg" onClick={onAccept}>
            {texts.accept}
          </Button>
          <Button size="lg" variant="outline" onClick={onDecline}>
            {texts.decline}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
