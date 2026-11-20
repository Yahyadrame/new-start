'use client';

import type { NotebookEntryItem } from '@newstart/shared';
import { useCallback, useEffect, useState } from 'react';
import { ensureSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';
import { listNotebook } from './profile-api';

const t = fr.profile.notebook;

type State =
  { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; items: NotebookEntryItem[] };

/** Les corrections gardées par la personne : ce qu'elle a écrit, puis la version plus naturelle. */
export function NotebookSection() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const session = await ensureSession();
      if (!session) return setState({ kind: 'error' });
      setState({ kind: 'ready', items: await listNotebook(session.accessToken) });
    } catch {
      setState({ kind: 'error' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold tracking-wide text-text-muted uppercase">{t.title}</h2>
      {state.kind === 'loading' && <p className="text-text-muted">{t.loading}</p>}
      {state.kind === 'error' && (
        <div className="flex flex-col items-start gap-2">
          <p role="alert" className="text-[15px] text-danger">
            {t.error}
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="min-h-11 rounded-full border border-line px-4 text-[13px] font-semibold focus-visible:outline-2 focus-visible:outline-accent-text"
          >
            {t.retry}
          </button>
        </div>
      )}
      {state.kind === 'ready' && state.items.length === 0 && (
        <p className="text-[15px] text-text-muted">{t.empty}</p>
      )}
      {state.kind === 'ready' && state.items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {state.items.map((e) => (
            <li
              key={e.id}
              className="flex flex-col gap-1 rounded-2xl border border-line bg-surface-1 px-4 py-3"
            >
              <p className="text-[13px] text-text-muted">
                <span className="sr-only">{t.original} : </span>
                {e.original}
              </p>
              <p className="text-[15px] font-medium">
                <span className="sr-only">{t.better} : </span>
                {e.better}
              </p>
              {e.whyFr && <p className="text-[13px] text-text-muted">{e.whyFr}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
