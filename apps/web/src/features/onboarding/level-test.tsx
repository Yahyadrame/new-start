'use client';

import { LEVEL_QUESTIONS, LEVEL_TEST_LENGTH, type LevelResult as Result } from '@newstart/shared';
import { Avatar, AvatarFallback, Button } from '@newstart/ui';
import { SendHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { getSession, setSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';
import { LevelResult } from './level-result';
import { LevelAnswerError, sendLevelAnswer } from './send-level-answer';

const t = fr.level;
type Turn = { from: 'jade' | 'me'; text: string };
type ErrorKey = keyof typeof t.errors;

const question = (position: number): Turn => ({
  from: 'jade',
  text: LEVEL_QUESTIONS.find((q) => q.position === position)?.text ?? '',
});

/** Écran 2 des maquettes : cinq questions de Jade, réponses écrites, puis le niveau estimé. */
export function LevelTest() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [position, setPosition] = useState(1);
  const [turns, setTurns] = useState<Turn[]>([question(1)]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const session = getSession();
    if (session) setToken(session.accessToken);
    else router.replace('/signup');
  }, [router]);

  useEffect(() => {
    end.current?.scrollIntoView?.({ block: 'end' });
  }, [turns]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!token || !text || busy) return;
    setBusy(true);
    setError(null);
    try {
      const step = await sendLevelAnswer(token, { position, text });
      setDraft('');
      if (step.done) {
        const session = getSession();
        if (session) setSession({ ...session, user: { ...session.user, level: step.level } });
        setResult(step);
      } else {
        setPosition(step.next);
        setTurns((all) => [...all, { from: 'me', text }, question(step.next)]);
      }
    } catch (err) {
      const status = err instanceof LevelAnswerError ? err.status : 0;
      if (status === 401) return router.replace('/signup');
      setError(status === 503 ? 'unavailable' : status === 409 ? 'incomplete' : 'server');
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Enter' || e.shiftKey) return;
    e.preventDefault();
    e.currentTarget.form?.requestSubmit();
  }

  if (!token) return null;
  // ponytail: l'écran Discussions (NS-108) n'existe pas encore ; « Commencer » renvoie à l'accueil en attendant.
  if (result) return <LevelResult result={result} onStart={() => router.push('/')} />;

  const label = busy && position === LEVEL_TEST_LENGTH ? t.evaluating : t.sending;
  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[32px] leading-[1.1] font-bold tracking-[-0.02em]">
          {t.title}
        </h1>
        <p className="text-[15px] text-text-muted">{t.intro}</p>
      </div>
      <div role="log" aria-label={t.chatLabel} className="flex flex-1 flex-col gap-3">
        {turns.map(({ from, text }, i) => (
          <div key={i} className={from === 'me' ? 'flex justify-end' : 'flex items-end gap-2'}>
            {from === 'jade' && (
              <Avatar className="size-8">
                <AvatarFallback aria-hidden="true">J</AvatarFallback>
              </Avatar>
            )}
            <p
              className={
                from === 'me'
                  ? 'max-w-[85%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-[15px] text-on-accent'
                  : 'max-w-[85%] rounded-2xl rounded-bl-md bg-surface-1 px-4 py-2.5 text-[15px]'
              }
            >
              <span className="sr-only">{from === 'me' ? t.me : t.jade} : </span>
              {text}
            </p>
          </div>
        ))}
        <div ref={end} />
      </div>
      <form onSubmit={onSubmit} className="sticky bottom-0 flex flex-col gap-2 bg-bg pt-2 pb-1">
        <p className="text-[13px] text-text-muted">
          {t.progress
            .replace('{n}', String(position))
            .replace('{total}', String(LEVEL_TEST_LENGTH))}
        </p>
        <p role="alert" className="text-[13px] text-danger empty:hidden">
          {error && t.errors[error]}
        </p>
        <div className="flex items-end gap-2">
          <textarea
            aria-label={t.answerLabel}
            rows={1}
            maxLength={1000}
            value={draft}
            disabled={busy}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            className="max-h-40 min-h-11 w-full resize-none rounded-3xl border border-line bg-surface-1 px-4 py-2.5 text-[15px] text-text [field-sizing:content] placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text disabled:opacity-50"
          />
          <Button
            type="submit"
            size="icon"
            aria-label={busy ? label : t.send}
            disabled={busy || !draft.trim()}
          >
            <SendHorizontal aria-hidden="true" size={20} />
          </Button>
        </div>
        {busy && (
          <p role="status" className="text-[13px] text-text-muted">
            {label}
          </p>
        )}
      </form>
    </div>
  );
}
