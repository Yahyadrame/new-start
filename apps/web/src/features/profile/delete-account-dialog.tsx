import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@newstart/ui';
import fr from '../../shared/i18n/fr.json';

const t = fr.profile.deleteDialog;

/** Confirmation avant la suppression : la fermer, c'est garder le compte. */
export function DeleteAccountDialog(props: {
  open: boolean;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={props.open} onOpenChange={(open) => !open && !props.busy && props.onCancel()}>
      <DialogContent>
        <DialogTitle className="font-display text-2xl font-bold">{t.title}</DialogTitle>
        <DialogDescription className="mt-3 text-[15px] text-text-muted">{t.body}</DialogDescription>
        <div className="mt-6 flex flex-col gap-2.5">
          <Button size="lg" variant="danger" disabled={props.busy} onClick={props.onConfirm}>
            {t.confirm}
          </Button>
          <Button size="lg" variant="outline" disabled={props.busy} onClick={props.onCancel}>
            {t.cancel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
