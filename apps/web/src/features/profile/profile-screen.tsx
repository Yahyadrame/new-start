'use client';

import { ACCENTS, type Me, type MePatch } from '@newstart/shared';
import { Avatar, AvatarFallback, Badge, Button, Input, Select, Switch } from '@newstart/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { ensureSession, setSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';
import { ThemeSwitcher, applyTheme, isTheme, storeTheme, type Theme } from '../../shared/theme';
import { DeleteAccountDialog } from './delete-account-dialog';
import { deleteMe, exportMe, getMe, patchMe } from './profile-api';

const t = fr.profile;
const GOALS = [5, 10, 15, 20, 30, 45, 60, 90, 120];
const DEFAULT_REMINDER = '19:00';
const DEFAULT_PAUSE_DAYS = 7;
const DAY_MS = 86_400_000;

/** La date d'un `<input type="date">` à partir d'un instant, dans le fuseau de l'appareil. */
const toDateValue = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const isPaused = (me: Me) => me.pausedUntil !== null && new Date(me.pausedUntil) > new Date();

/** Écran 16 des maquettes : chaque réglage s'enregistre dès qu'on le change. */
export function ProfileScreen() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void (async () => {
      const session = await ensureSession();
      if (!session) return router.replace('/');
      try {
        const loaded = await getMe(session.accessToken);
        // Le compte fait foi : le thème choisi sur un autre appareil s'applique ici aussi.
        const theme = loaded.theme.toLowerCase();
        if (isTheme(theme)) {
          applyTheme(theme);
          storeTheme(theme, window.localStorage);
        }
        setMe(loaded);
      } catch {
        setError(t.errors.load);
      }
    })();
  }, [router]);

  /** Affiche le changement tout de suite, l'enregistre, puis le retire si l'API refuse. */
  async function save(patch: MePatch) {
    if (!me) return;
    const before = me;
    // MePatch accepte `undefined` par clé ; ici chaque clé envoyée a une valeur.
    setMe({ ...me, ...patch } as Me);
    setError(null);
    try {
      const session = await ensureSession();
      if (!session) return router.replace('/');
      setMe(await patchMe(session.accessToken, patch));
    } catch {
      setMe(before);
      setError(t.errors.save);
    }
  }

  /** Télécharge le JSON de l'export sous un nom daté. */
  async function exportData() {
    setError(null);
    try {
      const session = await ensureSession();
      if (!session) return router.replace('/');
      const url = URL.createObjectURL(await exportMe(session.accessToken));
      const link = document.createElement('a');
      link.href = url;
      link.download = `new-start-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(t.errors.export);
    }
  }

  /** Après la suppression, la session locale n'a plus de compte derrière elle : retour à l'accueil. */
  async function deleteAccount() {
    setDeleting(true);
    setError(null);
    try {
      const session = await ensureSession();
      if (!session) return router.replace('/');
      await deleteMe(session.accessToken);
      setSession(null);
      router.replace('/');
    } catch {
      setDeleting(false);
      setConfirmingDelete(false);
      setError(t.errors.delete);
    }
  }

  const paused = me !== null && isPaused(me);
  const goals = me ? [...new Set([...GOALS, me.dailyGoalMin])].sort((a, b) => a - b) : GOALS;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-6 pt-10 pb-10">
      <h1 className="font-display text-[32px] leading-tight font-bold tracking-[-0.02em]">
        {t.title}
      </h1>

      {error && (
        <p role="alert" className="rounded-2xl bg-surface-1 px-4 py-3 text-[15px] text-danger">
          {error}
        </p>
      )}

      {me ? (
        <>
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback>{me.firstName.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start gap-1">
              <span className="text-lg font-semibold">{me.firstName}</span>
              <Badge>{t.levelBadge.replace('{level}', me.level)}</Badge>
            </div>
          </div>

          <Group title={t.appearance.title}>
            <ThemeSwitcher onChange={(theme: Theme) => save({ theme: toApi(theme) })} />
          </Group>

          <Group title={t.learning.title}>
            <Row label={t.learning.dailyGoal}>
              {(id) => (
                <Select
                  id={id}
                  className="w-auto"
                  value={me.dailyGoalMin}
                  onChange={(e) => save({ dailyGoalMin: Number(e.target.value) })}
                >
                  {goals.map((n) => (
                    <option key={n} value={n}>
                      {t.learning.dailyGoalOption.replace('{n}', String(n))}
                    </option>
                  ))}
                </Select>
              )}
            </Row>
            <Row label={t.learning.accent}>
              {(id) => (
                <Select
                  id={id}
                  className="w-auto"
                  value={me.preferredAccent}
                  onChange={(e) =>
                    save({ preferredAccent: e.target.value as Me['preferredAccent'] })
                  }
                >
                  {ACCENTS.map((accent) => (
                    <option key={accent} value={accent}>
                      {t.learning.accents[accent]}
                    </option>
                  ))}
                </Select>
              )}
            </Row>
          </Group>

          <Group title={t.reminders.title}>
            <Row label={t.reminders.reminder}>
              {(id) => (
                <Switch
                  id={id}
                  checked={me.reminderTime !== null}
                  onCheckedChange={(on) => save({ reminderTime: on ? DEFAULT_REMINDER : null })}
                />
              )}
            </Row>
            {me.reminderTime !== null && (
              <Row label={t.reminders.reminderTime}>
                {(id) => (
                  <Input
                    id={id}
                    type="time"
                    className="w-auto"
                    value={me.reminderTime ?? ''}
                    onChange={(e) => e.target.value && save({ reminderTime: e.target.value })}
                  />
                )}
              </Row>
            )}
            <Row label={t.reminders.pause} hint={t.reminders.pauseHint}>
              {(id) => (
                <Switch
                  id={id}
                  checked={paused}
                  onCheckedChange={(on) =>
                    save({
                      pausedUntil: on
                        ? new Date(Date.now() + DEFAULT_PAUSE_DAYS * DAY_MS).toISOString()
                        : null,
                    })
                  }
                />
              )}
            </Row>
            {paused && me.pausedUntil && (
              <Row label={t.reminders.pauseUntil}>
                {(id) => (
                  <Input
                    id={id}
                    type="date"
                    className="w-auto"
                    min={toDateValue(new Date().toISOString())}
                    value={toDateValue(me.pausedUntil ?? '')}
                    onChange={(e) =>
                      e.target.value &&
                      save({ pausedUntil: new Date(`${e.target.value}T23:59:59`).toISOString() })
                    }
                  />
                )}
              </Row>
            )}
          </Group>

          <Group title={t.data.title}>
            <Row label={t.data.saver} hint={t.data.saverHint}>
              {(id) => (
                <Switch
                  id={id}
                  checked={me.dataSaver}
                  onCheckedChange={(on) => save({ dataSaver: on })}
                />
              )}
            </Row>
            <Row label={t.data.export} hint={t.data.exportHint}>
              {(id) => (
                <Button id={id} variant="outline" onClick={exportData}>
                  {t.data.exportAction}
                </Button>
              )}
            </Row>
            <Row label={t.data.delete} hint={t.data.deleteHint}>
              {(id) => (
                <Button id={id} variant="danger" onClick={() => setConfirmingDelete(true)}>
                  {t.data.deleteAction}
                </Button>
              )}
            </Row>
          </Group>
          <DeleteAccountDialog
            open={confirmingDelete}
            busy={deleting}
            onConfirm={deleteAccount}
            onCancel={() => setConfirmingDelete(false)}
          />
        </>
      ) : (
        !error && <p className="text-text-muted">{t.loading}</p>
      )}
    </main>
  );
}

const toApi = (theme: Theme) => theme.toUpperCase() as Me['theme'];

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="text-sm font-semibold tracking-wide text-text-muted uppercase">{title}</h2>
      {children}
    </section>
  );
}

/** Une ligne de réglage : le libellé est relié au contrôle par `id`. */
function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 py-2">
      <div className="flex flex-col">
        <label htmlFor={id} className="text-base font-medium">
          {label}
        </label>
        {hint && <span className="text-[13px] text-text-muted">{hint}</span>}
      </div>
      {children(id)}
    </div>
  );
}
