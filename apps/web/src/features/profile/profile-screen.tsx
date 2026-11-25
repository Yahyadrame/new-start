'use client';

import { ACCENTS, type Me, type MePatch } from '@newstart/shared';
import { Avatar, AvatarFallback, Button, Input, Select, Switch } from '@newstart/ui';
import {
  ArrowLeft,
  BellRing,
  BookOpen,
  ChevronRight,
  LogOut,
  GraduationCap,
  Palette,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { ensureSession, setSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';
import { ChatBackgroundPicker } from '../../shared/chat-background';
import { BottomNav, NotificationsBell } from '../../shared/navigation';
import type { PushStatus } from '../../shared/push/subscription';
import { usePush } from '../../shared/push/use-push';
import { ThemeSwitcher, applyTheme, isTheme, storeTheme, type Theme } from '../../shared/theme';
import { DeleteAccountDialog } from './delete-account-dialog';
import { SECTIONS, type Section } from './sections';
import { NotebookSection } from './notebook-section';
import { deleteMe, exportMe, getMe, logout, patchMe } from './profile-api';

const t = fr.profile;

const SECTION_ICONS = {
  learning: GraduationCap,
  notifications: BellRing,
  appearance: Palette,
  notebook: BookOpen,
  data: ShieldCheck,
} as const;
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

/**
 * Écran 16 des maquettes, façon WhatsApp : l'accueil du profil liste des rubriques, chacune ouvre sa page
 * (`section`). Chaque réglage s'enregistre dès qu'on le change.
 */
export function ProfileScreen({ section }: { section?: Section }) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const push = usePush();

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

  /** Se déconnecter : on ferme la session, puis retour à l'accueil. Pas de confirmation, on se reconnecte avec un code. */
  async function signOut() {
    await logout();
    setSession(null);
    router.replace('/');
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

  const sections: Record<Section, ReactNode> = me
    ? {
        learning: (
          <>
            <Group>
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
          </>
        ),
        notifications: (
          <>
            <Group>
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
              <Row label={fr.push.label} hint={pushHint(push.status, push.failed)}>
                {(id) => (
                  <Switch
                    id={id}
                    checked={push.status === 'on'}
                    disabled={push.busy || (push.status !== 'on' && push.status !== 'off')}
                    onCheckedChange={(on) => void (on ? push.enable() : push.disable())}
                  />
                )}
              </Row>
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
          </>
        ),
        appearance: (
          <>
            <Group title={t.appearance.title}>
              <ThemeSwitcher onChange={(theme: Theme) => save({ theme: toApi(theme) })} />
            </Group>

            <Group title={fr.chatBackground.title}>
              <div className="py-3">
                <ChatBackgroundPicker
                  value={me.chatBackground}
                  onChange={(chatBackground) => save({ chatBackground })}
                />
              </div>
            </Group>
          </>
        ),
        notebook: <NotebookSection />,
        data: (
          <>
            <Group>
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
        ),
      }
    : ({} as Record<Section, ReactNode>);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pt-12 pb-28 lg:max-w-2xl lg:pb-10">
      {section ? (
        <header className="flex items-center gap-3">
          <Link
            href="/profile"
            aria-label={t.back}
            className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface-1 focus-visible:outline-2 focus-visible:outline-accent-text"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </Link>
          <h1 className="font-display text-[24px] leading-tight font-bold tracking-[-0.02em]">
            {t.sections[section].title}
          </h1>
        </header>
      ) : (
        <header className="flex items-center justify-between">
          <h1 className="font-display text-[28px] leading-tight font-bold tracking-[-0.02em]">
            {t.title}
          </h1>
          <NotificationsBell />
        </header>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-3xl border border-line bg-surface-1 px-4 py-3 text-[15px] text-danger"
        >
          {error}
        </p>
      )}

      {me ? (
        <>
          {section ? (
            sections[section]
          ) : (
            <>
              <div className="flex items-center gap-4 px-1 py-2">
                <Avatar className="size-[72px]">
                  <AvatarFallback className="bg-accent font-display text-[28px] font-bold text-on-accent">
                    {me.firstName.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5">
                  <span className="text-lg font-semibold">{me.firstName}</span>
                  <span className="text-sm text-text-muted">
                    {t.levelBadge.replace('{level}', me.level)}
                  </span>
                </div>
              </div>

              <nav aria-label={t.title}>
                <ul className="flex flex-col">
                  {SECTIONS.map((key) => (
                    <SectionRow key={key} section={key} />
                  ))}
                </ul>
              </nav>
              <Button variant="outline" className="w-full" onClick={signOut}>
                <LogOut aria-hidden="true" className="size-5" />
                {t.signOut}
              </Button>
            </>
          )}
        </>
      ) : (
        !error && <p className="text-text-muted">{t.loading}</p>
      )}
      <BottomNav />
    </main>
  );
}

/** Une rubrique de l'accueil du profil : icône, titre, résumé et flèche, sur toute la largeur. */
function SectionRow({ section }: { section: Section }) {
  const Icon = SECTION_ICONS[section];
  const { title, hint } = t.sections[section];
  return (
    <li>
      <Link
        href={`/profile/${section}`}
        className="flex min-h-[72px] items-center gap-4 border-b border-line px-1 py-2 focus-visible:outline-2 focus-visible:outline-accent-text"
      >
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2"
        >
          <Icon className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[15px] font-semibold">{title}</span>
          <span className="truncate text-[13px] text-text-muted">{hint}</span>
        </span>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-text-muted" />
      </Link>
    </li>
  );
}

/** Le texte sous le réglage : la raison quand il est grisé, l'échec du dernier essai, sinon l'explication. */
function pushHint(status: PushStatus | null, failed: boolean) {
  if (failed) return fr.push.failed;
  if (status === 'blocked') return fr.push.blocked;
  if (status === 'unsupported') return fr.push.unsupported;
  if (status === 'unconfigured') return fr.push.unconfigured;
  return fr.push.hint;
}

const toApi = (theme: Theme) => theme.toUpperCase() as Me['theme'];

function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col">
      {title && (
        <h2 className="mb-1 text-xs font-bold tracking-[0.08em] text-text-muted uppercase">
          {title}
        </h2>
      )}
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
    <div className="flex min-h-[72px] items-center justify-between gap-4 border-b border-line px-1 py-2">
      <div className="flex flex-col">
        <label htmlFor={id} className="text-[15px] font-semibold">
          {label}
        </label>
        {hint && <span className="text-[13px] text-text-muted">{hint}</span>}
      </div>
      {children(id)}
    </div>
  );
}
