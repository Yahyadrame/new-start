import type { ConversationItem } from '@newstart/shared';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Skeleton,
} from '@newstart/ui';
import { useRef, useState } from 'react';
import { ContactAvatar } from '../../shared/avatar/contact-avatar';
import fr from '../../shared/i18n/fr.json';

const t = fr.conversation.forward;

/**
 * Choix des conversations où transférer un message ; `targets` vaut undefined tant que la liste charge.
 * Les envois partent un par un. Ce qui échoue reste coché et repart avec le même identifiant :
 * un message déjà reçu par le serveur n'est pas doublé.
 */
export function ForwardDialog({
  text,
  targets,
  onPick,
  onClose,
}: {
  text: string;
  targets: ConversationItem[] | undefined;
  onPick: (target: ConversationItem, clientId: string) => Promise<void>;
  onClose: () => void;
}) {
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());
  const [sent, setSent] = useState<ReadonlySet<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientIds = useRef(new Map<string, string>());
  const pending = (targets ?? []).filter((x) => checked.has(x.id) && !sent.has(x.id));

  const toggle = (id: string) => {
    const next = new Set(checked);
    if (!next.delete(id)) next.add(id);
    setChecked(next);
  };

  const submit = async () => {
    setSending(true);
    setError(null);
    const done = new Set(sent);
    let limited = false;
    for (const target of pending) {
      const clientId = clientIds.current.get(target.id) ?? crypto.randomUUID();
      clientIds.current.set(target.id, clientId);
      try {
        await onPick(target, clientId);
        done.add(target.id);
        setSent(new Set(done));
      } catch (e) {
        limited = (e as { code?: string }).code === 'USAGE_LIMIT';
        // Après la limite du jour, les envois suivants échoueraient aussi.
        if (limited) break;
      }
    }
    const missed = pending.filter((x) => !done.has(x.id));
    if (missed.length === 0) return onClose();
    const names = missed.map((x) => x.agent.name).join(', ');
    setError((limited ? t.limit : t.failed).replace('{names}', names));
    setSending(false);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !sending && onClose()}>
      <DialogContent>
        <DialogTitle className="font-display text-2xl font-bold">{t.title}</DialogTitle>
        <DialogDescription className="mt-2 line-clamp-2 text-[15px] text-text-muted">
          {text}
        </DialogDescription>
        {error && (
          <p role="alert" className="mt-3 text-[15px] text-danger">
            {error}
          </p>
        )}
        {targets === undefined ? (
          <Skeleton aria-busy="true" className="mt-4 h-24 w-full" />
        ) : targets.length === 0 ? (
          <p className="mt-4 text-[15px] text-text-muted">{t.empty}</p>
        ) : (
          <>
            <ul className="mt-4 flex max-h-72 flex-col gap-1 overflow-y-auto">
              {targets.map((target) => (
                <li key={target.id}>
                  <label className="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-xl px-3 hover:bg-surface-2 has-[:disabled]:cursor-default has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent-text">
                    <ContactAvatar
                      slug={target.agent.slug}
                      name={target.agent.name}
                      className="size-10"
                    />
                    <span className="min-w-0 flex-1 truncate text-base font-semibold">
                      {target.agent.name}
                    </span>
                    {sent.has(target.id) && (
                      <span className="text-sm text-text-muted">{t.sent}</span>
                    )}
                    <input
                      type="checkbox"
                      checked={checked.has(target.id)}
                      disabled={sending || sent.has(target.id)}
                      onChange={() => toggle(target.id)}
                      className="size-5 shrink-0 accent-accent focus-visible:outline-none"
                    />
                  </label>
                </li>
              ))}
            </ul>
            <Button
              className="mt-4 w-full"
              disabled={sending || pending.length === 0}
              onClick={() => void submit()}
            >
              {sending
                ? t.sending
                : pending.length === 0
                  ? t.send
                  : t.sendCount.replace('{count}', String(pending.length))}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
