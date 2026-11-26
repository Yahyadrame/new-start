import type { ConversationItem } from '@newstart/shared';
import { Dialog, DialogContent, DialogDescription, DialogTitle, Skeleton } from '@newstart/ui';
import { useState } from 'react';
import { ContactAvatar } from '../../shared/avatar/contact-avatar';
import fr from '../../shared/i18n/fr.json';

const t = fr.conversation.forward;

/** Choix de la conversation où transférer un message ; `targets` vaut undefined tant que la liste charge. */
export function ForwardDialog({
  text,
  targets,
  onPick,
  onClose,
}: {
  text: string;
  targets: ConversationItem[] | undefined;
  onPick: (target: ConversationItem) => Promise<void>;
  onClose: () => void;
}) {
  const [state, setState] = useState<'idle' | 'sending' | 'failed'>('idle');
  const pick = (target: ConversationItem) => {
    setState('sending');
    onPick(target).then(onClose, () => setState('failed'));
  };
  return (
    <Dialog open onOpenChange={(open) => !open && state !== 'sending' && onClose()}>
      <DialogContent>
        <DialogTitle className="font-display text-2xl font-bold">{t.title}</DialogTitle>
        <DialogDescription className="mt-2 line-clamp-2 text-[15px] text-text-muted">
          {text}
        </DialogDescription>
        {state === 'failed' && (
          <p role="alert" className="mt-3 text-[15px] text-danger">
            {t.failed}
          </p>
        )}
        {targets === undefined ? (
          <Skeleton aria-busy="true" className="mt-4 h-24 w-full" />
        ) : targets.length === 0 ? (
          <p className="mt-4 text-[15px] text-text-muted">{t.empty}</p>
        ) : (
          <ul className="mt-4 flex max-h-72 flex-col gap-1 overflow-y-auto">
            {targets.map((target) => (
              <li key={target.id}>
                <button
                  type="button"
                  disabled={state === 'sending'}
                  onClick={() => pick(target)}
                  className="flex min-h-14 w-full items-center gap-3 rounded-xl px-3 text-left hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent-text disabled:opacity-60"
                >
                  <ContactAvatar
                    slug={target.agent.slug}
                    name={target.agent.name}
                    className="size-10"
                  />
                  <span className="truncate text-base font-semibold">{target.agent.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
