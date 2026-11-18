import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@newstart/ui';
import fr from '../../shared/i18n/fr.json';

const t = fr.level.voice.consent;

/** Écran dédié au consentement vocal (docs/11-securite-donnees.md) : fermer ou refuser laisse l'écrit. */
export function VoiceConsentDialog(props: {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <Dialog open={props.open} onOpenChange={(open) => !open && props.onDecline()}>
      <DialogContent>
        <DialogTitle className="font-display text-2xl font-bold">{t.title}</DialogTitle>
        <DialogDescription className="mt-3 text-[15px] text-text-muted">{t.body}</DialogDescription>
        <div className="mt-6 flex flex-col gap-2.5">
          <Button size="lg" onClick={props.onAccept}>
            {t.accept}
          </Button>
          <Button size="lg" variant="outline" onClick={props.onDecline}>
            {t.decline}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
