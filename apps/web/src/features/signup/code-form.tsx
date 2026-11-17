'use client';

import { Button, Input } from '@newstart/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { setSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';
import { clearPendingSignup, loadPendingSignup } from './pending-signup';
import { requestCode } from './request-code';
import { verifyCode, VerifyCodeError } from './verify-code';

const t = fr.code;
export const RESEND_DELAY_SECONDS = 30;
type Message = keyof typeof t.errors | 'resent';

export function CodeForm() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<Message | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(RESEND_DELAY_SECONDS);

  useEffect(() => {
    const pending = loadPendingSignup();
    if (pending) setEmail(pending.email);
    else router.replace('/signup');
  }, [router]);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    if (!/^\d{6}$/.test(code)) return setMessage('format');
    setBusy(true);
    setMessage(null);
    try {
      setSession(await verifyCode(email, code));
      clearPendingSignup();
      router.push('/onboarding/level');
    } catch (err) {
      const status = err instanceof VerifyCodeError ? err.status : 0;
      setMessage(status === 400 ? 'invalid' : status === 409 ? 'conflict' : 'server');
      setBusy(false);
    }
  }

  async function onResend() {
    const pending = loadPendingSignup();
    if (!pending) return;
    try {
      await requestCode(pending);
      setMessage('resent');
      setWait(RESEND_DELAY_SECONDS);
    } catch {
      setMessage('resend');
    }
  }

  if (!email) return null;
  const text = message === 'resent' ? t.resent : message && t.errors[message];
  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <p className="text-[15px] text-text-muted">{t.sentTo.replace('{email}', email)}</p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="code" className="text-[15px] font-semibold">
          {t.label}
        </label>
        <Input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          aria-invalid={message && message !== 'resent' ? true : undefined}
          aria-describedby="code-note"
          className="text-center text-[24px] tracking-[0.4em]"
        />
        <p
          id="code-note"
          role={message === 'resent' ? 'status' : 'alert'}
          className={
            message === 'resent' ? 'text-[13px] text-text-muted' : 'text-[13px] text-danger'
          }
        >
          {text}
        </p>
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? t.verifying : t.submit}
      </Button>
      <Button type="button" variant="outline" disabled={wait > 0} onClick={onResend}>
        {wait > 0 ? t.resendIn.replace('{seconds}', String(wait)) : t.resend}
      </Button>
    </form>
  );
}
