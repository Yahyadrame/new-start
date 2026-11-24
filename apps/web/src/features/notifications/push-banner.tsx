'use client';

import { Button } from '@newstart/ui';
import fr from '../../shared/i18n/fr.json';
import { usePush } from '../../shared/push/use-push';

const t = fr.push;

/**
 * Propose les rappels sur ce téléphone. Il ne s'affiche que si l'appareil peut les recevoir et ne les a pas :
 * un refus (`blocked`), un navigateur sans push ou un serveur sans clé le font disparaître.
 * La demande de permission part du clic, jamais du chargement.
 */
export function PushBanner() {
  const { status, busy, failed, enable } = usePush();
  if (status !== 'off') return null;
  return (
    <section
      aria-labelledby="push-banner-title"
      className="flex flex-col gap-3 rounded-3xl border border-line bg-surface-1 p-4"
    >
      <div className="flex flex-col gap-1">
        <h2 id="push-banner-title" className="font-semibold">
          {t.bannerTitle}
        </h2>
        <p className="text-text-muted">{t.bannerBody}</p>
      </div>
      {failed && <p role="alert">{t.failed}</p>}
      <Button onClick={() => void enable()} disabled={busy} className="self-start">
        {t.bannerAction}
      </Button>
    </section>
  );
}
